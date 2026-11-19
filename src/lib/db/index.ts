import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PoolClient } from "pg";
import { Pool } from "pg";

type DatabaseGlobal = typeof globalThis & {
  __tripFinderPostgresPool?: Pool;
};

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required to access PostgreSQL.");
  }

  return value;
}

/** Creates the Pool only when a database operation is requested. */
export function getPool(): Pool {
  const sharedGlobal = globalThis as DatabaseGlobal;
  if (!sharedGlobal.__tripFinderPostgresPool) {
    sharedGlobal.__tripFinderPostgresPool = new Pool({
      connectionString: databaseUrl(),
      max: 5,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 5_000,
      application_name: "trip-finder",
    });
  }

  return sharedGlobal.__tripFinderPostgresPool;
}

export function getDb(): NodePgDatabase<Record<string, never>> {
  return drizzle(getPool());
}

export interface TransactionContext {
  client: PoolClient;
  db: NodePgDatabase<Record<string, never>>;
}

/**
 * Runs work on one checked-out PostgreSQL connection. Both raw client queries
 * and Drizzle queries in the callback participate in the same transaction.
 */
export async function withTransaction<T>(
  work: (context: TransactionContext) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  const transactionDb = drizzle(client);
  let transactionStarted = false;
  let destroyClient = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const result = await work({ client, db: transactionDb });
    await client.query("COMMIT");
    transactionStarted = false;
    return result;
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch {
        destroyClient = true;
      }
    }
    throw error;
  } finally {
    client.release(destroyClient);
  }
}

/** Intended for short-lived scripts and integration tests. */
export async function closePool(): Promise<void> {
  const sharedGlobal = globalThis as DatabaseGlobal;
  const pool = sharedGlobal.__tripFinderPostgresPool;
  if (pool) {
    delete sharedGlobal.__tripFinderPostgresPool;
    await pool.end();
  }
}
