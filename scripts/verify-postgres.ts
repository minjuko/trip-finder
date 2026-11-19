import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { sql } from "drizzle-orm";
import {
  closePool,
  getDb,
  getPool,
  withTransaction,
} from "../src/lib/db/index.js";

const localDatabaseName = "tripfinder_test";
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function assertTestDatabaseTarget(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "Set DATABASE_URL to the local disposable tripfinder_test database.",
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !allowedHosts.has(url.hostname) ||
    databaseName !== localDatabaseName
  ) {
    throw new Error(
      `Refusing DB tests unless the host is local and database is ${localDatabaseName}.`,
    );
  }
}

async function waitUntilBlocked(pid: number, schema: string): Promise<void> {
  const deadline = Date.now() + 5_000;
  const activityQuery = `
    SELECT wait_event_type
    FROM pg_stat_activity
    WHERE pid = $1 AND datname = $2
  `;

  while (Date.now() < deadline) {
    const result = await getPool().query(activityQuery, [
      pid,
      localDatabaseName,
    ]);
    if (result.rows[0]?.wait_event_type === "Lock") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error(
    `Second connection did not wait on the expected row lock (${schema}).`,
  );
}

async function expectSqlState(
  operation: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  await assert.rejects(operation, (error: unknown) => {
    assert.equal((error as { code?: string }).code, expectedCode);
    return true;
  });
}

async function main(): Promise<void> {
  assertTestDatabaseTarget();
  const pool = getPool();
  const schema = `tf03c_${randomUUID().replaceAll("-", "")}`;
  const quotedSchema = quoteIdentifier(schema);
  const parent = `${quotedSchema}.lock_parent`;
  const item = `${quotedSchema}.lock_item`;

  try {
    const version = await pool.query<{ server_version_num: string }>(
      "SHOW server_version_num",
    );
    assert.ok(Number(version.rows[0].server_version_num) >= 180000);
    assert.ok(Number(version.rows[0].server_version_num) < 190000);

    const drizzleResult = await getDb().execute(sql`SELECT 1 AS value`);
    assert.equal(Number(drizzleResult.rows[0]?.value), 1);

    await pool.query(`CREATE SCHEMA ${quotedSchema}`);
    await pool.query(`
      CREATE TABLE ${parent} (
        id integer PRIMARY KEY,
        version integer NOT NULL DEFAULT 0 CHECK (version >= 0)
      )
    `);
    await pool.query(`
      CREATE TABLE ${item} (
        id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        parent_id integer NOT NULL REFERENCES ${parent}(id) ON DELETE CASCADE,
        content_id text NOT NULL,
        position integer NOT NULL CHECK (position >= 0),
        CONSTRAINT lock_item_parent_content_unique UNIQUE (parent_id, content_id)
      )
    `);
    await pool.query(`INSERT INTO ${parent} (id) VALUES (1)`);

    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO ${item} (parent_id, content_id, position) VALUES (999, 'missing', 0)`,
        ),
      "23503",
    );
    await pool.query(
      `INSERT INTO ${item} (parent_id, content_id, position) VALUES (1, 'same', 0)`,
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO ${item} (parent_id, content_id, position) VALUES (1, 'same', 1)`,
        ),
      "23505",
    );
    await expectSqlState(
      () =>
        pool.query(
          `INSERT INTO ${item} (parent_id, content_id, position) VALUES (1, 'negative', -1)`,
        ),
      "23514",
    );
    await pool.query(`DELETE FROM ${item}`);

    const rollbackSentinel = new Error("test rollback");
    await assert.rejects(
      withTransaction(async ({ client, db }) => {
        const rawPid = await client.query<{ pid: number }>(
          "SELECT pg_backend_pid() AS pid",
        );
        const drizzlePid = await db.execute(
          sql`SELECT pg_backend_pid() AS pid`,
        );
        assert.equal(
          Number(drizzlePid.rows[0]?.pid),
          Number(rawPid.rows[0].pid),
        );
        await client.query(
          `INSERT INTO ${item} (parent_id, content_id, position) VALUES (1, 'rolled-back', 0)`,
        );
        await db.execute(
          sql.raw(`UPDATE ${parent} SET version = version + 1 WHERE id = 1`),
        );
        throw rollbackSentinel;
      }),
      (error) => error === rollbackSentinel,
    );
    const afterRollback = await pool.query<{ items: string; version: number }>(`
      SELECT
        (SELECT count(*)::text FROM ${item}) AS items,
        version
      FROM ${parent}
      WHERE id = 1
    `);
    assert.equal(afterRollback.rows[0].items, "0");
    assert.equal(afterRollback.rows[0].version, 0);
    assert.ok(
      pool.idleCount >= 1,
      "transaction client was not returned to the pool",
    );

    await assertLockWaitReleased({ parent, schema, release: "commit" });
    await assertLockWaitReleased({ parent, schema, release: "rollback" });

    console.log("PostgreSQL 18.1 integration checks passed:");
    console.log("- Drizzle query and one-client transaction helper");
    console.log("- FOREIGN KEY, UNIQUE, CHECK constraints");
    console.log("- Transaction rollback and pooled connection release");
    console.log(
      "- Two-session SELECT FOR UPDATE serialization on COMMIT and ROLLBACK",
    );
  } finally {
    await pool.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
    await closePool();
  }
}

async function assertLockWaitReleased(options: {
  parent: string;
  schema: string;
  release: "commit" | "rollback";
}): Promise<void> {
  const first = await getPool().connect();
  const second = await getPool().connect();
  let firstOpen = false;
  let secondOpen = false;
  try {
    await first.query("BEGIN");
    firstOpen = true;
    await first.query(
      `SELECT id FROM ${options.parent} WHERE id = 1 FOR UPDATE`,
    );

    const secondPidResult = await second.query<{ pid: number }>(
      "SELECT pg_backend_pid() AS pid",
    );
    await second.query("BEGIN");
    secondOpen = true;
    const waiter = second.query(
      `SELECT id FROM ${options.parent} WHERE id = 1 FOR UPDATE`,
    );
    await waitUntilBlocked(Number(secondPidResult.rows[0].pid), options.schema);

    await first.query(options.release === "commit" ? "COMMIT" : "ROLLBACK");
    firstOpen = false;
    const locked = await waiter;
    assert.equal(locked.rows.length, 1);
    await second.query("COMMIT");
    secondOpen = false;
  } finally {
    if (firstOpen) {
      await first.query("ROLLBACK").catch(() => undefined);
    }
    if (secondOpen) {
      await second.query("ROLLBACK").catch(() => undefined);
    }
    first.release();
    second.release();
  }
}

main().catch((error: unknown) => {
  console.error("PostgreSQL integration checks failed.");
  console.error(error instanceof Error ? error.message : "Unknown failure");
  process.exitCode = 1;
});
