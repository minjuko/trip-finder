import assert from "node:assert/strict";

import { testUtils, type TestHelpers } from "better-auth/plugins";
import { getPool, closePool } from "../src/lib/db/index.js";
import { createAuth } from "../src/lib/auth/config.js";
import {
  getSessionPrincipal,
  requireSessionPrincipal,
} from "../src/lib/auth/session.js";
import { GET, POST } from "../src/app/api/auth/[...all]/route.js";

const localDatabaseName = "tripfinder_test";
const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function assertTestDatabaseTarget(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required for auth DB tests.");

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
      "Refusing auth DB tests unless DATABASE_URL targets local tripfinder_test.",
    );
  }
}

async function main(): Promise<void> {
  assertTestDatabaseTarget();
  const pool = getPool();
  const testAuth = createAuth([testUtils()]);
  const helpers = (
    (await testAuth.$context) as unknown as { test: TestHelpers }
  ).test;
  const userIds: string[] = [];

  try {
    const columnTypes = await pool.query<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>(
      `SELECT table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('user', 'session', 'account', 'verification')
         AND column_name = 'id'`,
    );
    assert.deepEqual(
      new Map(columnTypes.rows.map((row) => [row.table_name, row.data_type])),
      new Map([
        ["user", "text"],
        ["session", "text"],
        ["account", "text"],
        ["verification", "text"],
      ]),
    );

    const userA = await helpers.saveUser(
      helpers.createUser({
        email: `tf03b-a-${crypto.randomUUID()}@example.test`,
      }),
    );
    userIds.push(userA.id);
    const userB = await helpers.saveUser(
      helpers.createUser({
        email: `tf03b-b-${crypto.randomUUID()}@example.test`,
      }),
    );
    userIds.push(userB.id);

    const loginA = await helpers.login({ userId: userA.id });
    const loginB = await helpers.login({ userId: userB.id });
    const cookieHeader = (login: typeof loginA) =>
      login.headers.get("cookie") ??
      login.cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
    const headersA = new Headers({
      cookie: cookieHeader(loginA),
      "x-user-id": userB.id,
    });
    const headersB = new Headers({ cookie: cookieHeader(loginB) });

    assert.deepEqual(await getSessionPrincipal(new Headers()), null);
    assert.deepEqual(
      await getSessionPrincipal(
        new Headers({ cookie: "better-auth.session_token=forged" }),
      ),
      null,
    );
    assert.equal((await getSessionPrincipal(headersA))?.userId, userA.id);
    assert.equal((await getSessionPrincipal(headersB))?.userId, userB.id);
    assert.notEqual(
      (await getSessionPrincipal(headersA))?.userId,
      (await getSessionPrincipal(headersB))?.userId,
    );

    const expiredToken = loginA.session.token;
    await pool.query(
      `UPDATE "session" SET "expiresAt" = now() - interval '1 minute' WHERE "token" = $1`,
      [expiredToken],
    );
    const rejectedExpired = await requireSessionPrincipal(headersA);
    assert.ok(rejectedExpired instanceof Response);
    assert.equal(rejectedExpired.status, 401);
    assert.equal(
      rejectedExpired.headers.get("Cache-Control"),
      "private, no-store",
    );

    const noOrigin = await POST(
      new Request("http://127.0.0.1:3000/api/auth/sign-in/social", {
        method: "POST",
      }),
    );
    const foreignOrigin = await POST(
      new Request("http://127.0.0.1:3000/api/auth/sign-in/social", {
        method: "POST",
        headers: { origin: "https://attacker.example" },
      }),
    );
    assert.equal(noOrigin.status, 403);
    assert.equal(foreignOrigin.status, 403);
    assert.equal(
      foreignOrigin.headers.get("Cache-Control"),
      "private, no-store",
    );

    const unauthenticatedSessionResponse = await GET(
      new Request("http://127.0.0.1:3000/api/auth/get-session"),
    );
    assert.equal(unauthenticatedSessionResponse.status, 200);
    assert.equal(
      unauthenticatedSessionResponse.headers.get("Cache-Control"),
      "private, no-store",
    );
    assert.equal(await unauthenticatedSessionResponse.text(), "null");

    console.log("Better Auth PostgreSQL integration checks passed:");
    console.log("- canonical user/session/account/verification schema");
    console.log("- text user IDs and persisted session cookies");
    console.log("- missing, forged, and expired sessions rejected");
    console.log("- two users remain isolated; client user ID is ignored");
    console.log(
      "- missing/foreign Origin rejected; auth responses are no-store",
    );
  } finally {
    try {
      for (const userId of userIds) await helpers.deleteUser(userId);
    } finally {
      await closePool();
    }
  }
}

main().catch((error: unknown) => {
  console.error("Better Auth PostgreSQL integration checks failed.");
  console.error(error instanceof Error ? error.message : "Unknown failure");
  process.exitCode = 1;
});
