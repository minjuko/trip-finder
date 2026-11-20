import "server-only";

import { randomUUID } from "node:crypto";

import { getPool, withTransaction } from "@/lib/db";
import { TravelListError } from "./errors";
import { encodeCursor, parseCursor } from "./validation";

export interface TravelListRecord {
  id: string;
  name: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

function publicList(row: TravelListRecord) {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTravelLists(
  ownerId: string,
  limit: number,
  cursor?: string,
) {
  const params: unknown[] = [ownerId];
  let cursorClause = "";
  if (cursor) {
    const decoded = parseCursor(cursor);
    params.push(decoded.updatedAt, decoded.id);
    cursorClause = `AND (updated_at, id) < ($2::timestamptz, $3::uuid)`;
  }
  params.push(limit + 1);
  const limitIndex = params.length;
  const result = await getPool().query<TravelListRecord>(
    `SELECT id, name, version, created_at, updated_at
     FROM travel_lists
     WHERE owner_id = $1 ${cursorClause}
     ORDER BY updated_at DESC, id DESC
     LIMIT $${limitIndex}`,
    params,
  );

  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
  return {
    items: rows.map(publicList),
    nextCursor:
      hasMore && rows.length > 0
        ? encodeCursor({
            updatedAt: rows[rows.length - 1].updated_at,
            id: rows[rows.length - 1].id,
          })
        : null,
  };
}

export async function createTravelList(ownerId: string, name: string) {
  const id = randomUUID();
  const result = await getPool().query<TravelListRecord>(
    `INSERT INTO travel_lists (id, owner_id, name)
     VALUES ($1::uuid, $2, $3)
     RETURNING id, name, version, created_at, updated_at`,
    [id, ownerId, name],
  );
  return publicList(result.rows[0]);
}

export async function getTravelList(ownerId: string, id: string) {
  const result = await getPool().query<TravelListRecord>(
    `SELECT id, name, version, created_at, updated_at
     FROM travel_lists WHERE id = $1::uuid AND owner_id = $2`,
    [id, ownerId],
  );
  return result.rows[0] ? publicList(result.rows[0]) : null;
}

export async function renameTravelList(
  ownerId: string,
  id: string,
  name: string,
  expectedVersion: number,
) {
  return withTransaction(async ({ client }) => {
    const selected = await client.query<TravelListRecord>(
      `SELECT id, name, version, created_at, updated_at
       FROM travel_lists WHERE id = $1::uuid AND owner_id = $2
       FOR UPDATE`,
      [id, ownerId],
    );
    const current = selected.rows[0];
    if (!current) {
      throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
    }

    if (current.name === name) return publicList(current);
    if (current.version !== expectedVersion) {
      throw new TravelListError(
        409,
        "VERSION_CONFLICT",
        "Travel list was changed by another request.",
      );
    }

    const updated = await client.query<TravelListRecord>(
      `UPDATE travel_lists
       SET name = $3, version = version + 1, updated_at = now()
       WHERE id = $1::uuid AND owner_id = $2
       RETURNING id, name, version, created_at, updated_at`,
      [id, ownerId, name],
    );
    return publicList(updated.rows[0]);
  });
}

export async function deleteTravelList(ownerId: string, id: string) {
  const result = await getPool().query(
    `DELETE FROM travel_lists WHERE id = $1::uuid AND owner_id = $2`,
    [id, ownerId],
  );
  return result.rowCount === 1;
}
