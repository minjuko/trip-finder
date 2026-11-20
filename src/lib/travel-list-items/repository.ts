import "server-only";

import { getPool, withTransaction } from "@/lib/db";
import { TravelListError } from "@/lib/travel-lists/errors";
import {
  encodeTravelListItemsCursor,
  parseTravelListItemsCursor,
} from "@/lib/travel-lists/validation";

export interface TravelListItemRecord {
  id: string;
  content_id: string;
  content_type_id: string;
  position: number;
  title: string;
  address: string | null;
  thumbnail_url: string | null;
  created_at: Date;
}

export interface TravelListItemSnapshot {
  title: string;
  address: string | null;
  thumbnailUrl: string | null;
}

function publicItem(row: TravelListItemRecord) {
  return {
    id: row.id,
    contentId: row.content_id,
    contentTypeId: row.content_type_id,
    title: row.title,
    address: row.address,
    thumbnailUrl: row.thumbnail_url,
    position: row.position,
    createdAt: row.created_at,
  };
}

export async function getTravelListItemContext(
  ownerId: string,
  listId: string,
  contentId: string,
) {
  const result = await getPool().query<
    TravelListItemRecord & { list_version: number; item_id: string | null }
  >(
    `SELECT l.version AS list_version,
            i.id AS item_id, i.content_id, i.content_type_id, i.position,
            i.title, i.address, i.thumbnail_url, i.created_at
     FROM travel_lists l
     LEFT JOIN travel_list_items i
       ON i.travel_list_id = l.id AND i.content_id = $3
     WHERE l.id = $1::uuid AND l.owner_id = $2`,
    [listId, ownerId, contentId],
  );
  const row = result.rows[0];
  if (!row) return null;

  return {
    listVersion: row.list_version,
    item: row.item_id ? publicItem({ ...row, id: row.item_id }) : null,
  };
}

export async function listTravelListItems(
  ownerId: string,
  listId: string,
  limit: number,
  cursor?: string,
) {
  const decoded = cursor ? parseTravelListItemsCursor(cursor) : undefined;
  return withTransaction(async ({ client }) => {
    await client.query(
      "SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
    );
    const listResult = await client.query<{ version: number }>(
      `SELECT version FROM travel_lists WHERE id = $1::uuid AND owner_id = $2`,
      [listId, ownerId],
    );
    const list = listResult.rows[0];
    if (!list) {
      throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
    }
    if (decoded && decoded.version !== list.version) {
      throw new TravelListError(
        409,
        "CURSOR_STALE",
        "Travel list changed while paging.",
      );
    }

    const params: unknown[] = [listId];
    let cursorClause = "";
    if (decoded) {
      params.push(decoded.position, decoded.id);
      cursorClause = "AND (position, id) > ($2::integer, $3::uuid)";
    }
    params.push(limit + 1);
    const limitIndex = params.length;
    const [itemsResult, countResult] = await Promise.all([
      client.query<TravelListItemRecord>(
        `SELECT id, content_id, content_type_id, position, title, address,
                thumbnail_url, created_at
         FROM travel_list_items
         WHERE travel_list_id = $1::uuid ${cursorClause}
         ORDER BY position ASC, id ASC
         LIMIT $${limitIndex}`,
        params,
      ),
      client.query<{ count: number }>(
        `SELECT count(*)::integer AS count
         FROM travel_list_items WHERE travel_list_id = $1::uuid`,
        [listId],
      ),
    ]);
    const hasMore = itemsResult.rows.length > limit;
    const rows = hasMore ? itemsResult.rows.slice(0, limit) : itemsResult.rows;
    const last = rows.at(-1);

    return {
      items: rows.map(publicItem),
      nextCursor:
        hasMore && last
          ? encodeTravelListItemsCursor({
              version: list.version,
              position: last.position,
              id: last.id,
            })
          : null,
      listVersion: list.version,
      itemCount: countResult.rows[0].count,
    };
  });
}

export async function addTravelListItem(
  ownerId: string,
  listId: string,
  contentId: string,
  contentTypeId: string,
  expectedVersion: number,
  canonicalContentTypeId: string,
  snapshot: TravelListItemSnapshot,
) {
  return withTransaction(async ({ client }) => {
    const listResult = await client.query<{ version: number }>(
      `SELECT version FROM travel_lists
       WHERE id = $1::uuid AND owner_id = $2
       FOR UPDATE`,
      [listId, ownerId],
    );
    const list = listResult.rows[0];
    if (!list) {
      throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
    }

    const existingResult = await client.query<TravelListItemRecord>(
      `SELECT id, content_id, content_type_id, position, title, address,
              thumbnail_url, created_at
       FROM travel_list_items
       WHERE travel_list_id = $1::uuid AND content_id = $2`,
      [listId, contentId],
    );
    const existing = existingResult.rows[0];
    if (existing) {
      if (existing.content_type_id !== contentTypeId) {
        throw new TravelListError(
          409,
          "CONTENT_ID_CONFLICT",
          "Content ID is already saved with another type.",
        );
      }
      return {
        item: publicItem(existing),
        listVersion: list.version,
        status: 200 as const,
      };
    }

    if (canonicalContentTypeId !== contentTypeId) {
      throw new TravelListError(
        422,
        "INVALID_CONTENT_TYPE",
        "Content type does not match TourAPI.",
      );
    }
    if (list.version !== expectedVersion) {
      throw new TravelListError(
        409,
        "VERSION_CONFLICT",
        "Travel list was changed by another request.",
      );
    }

    const positionResult = await client.query<{ position: number }>(
      `SELECT (COALESCE(MAX(position), -1) + 1)::integer AS position
       FROM travel_list_items WHERE travel_list_id = $1::uuid`,
      [listId],
    );
    const inserted = await client.query<TravelListItemRecord>(
      `INSERT INTO travel_list_items
         (travel_list_id, content_id, content_type_id, position,
          title, address, thumbnail_url)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
       RETURNING id, content_id, content_type_id, position, title, address,
                 thumbnail_url, created_at`,
      [
        listId,
        contentId,
        contentTypeId,
        positionResult.rows[0].position,
        snapshot.title,
        snapshot.address,
        snapshot.thumbnailUrl,
      ],
    );
    const updated = await client.query<{ version: number }>(
      `UPDATE travel_lists SET version = version + 1, updated_at = now()
       WHERE id = $1::uuid AND owner_id = $2 RETURNING version`,
      [listId, ownerId],
    );
    return {
      item: publicItem(inserted.rows[0]),
      listVersion: updated.rows[0].version,
      status: 201 as const,
    };
  });
}

export async function deleteTravelListItem(
  ownerId: string,
  listId: string,
  contentId: string,
  expectedVersion: number,
) {
  return withTransaction(async ({ client }) => {
    const listResult = await client.query<{ version: number }>(
      `SELECT version FROM travel_lists
       WHERE id = $1::uuid AND owner_id = $2
       FOR UPDATE`,
      [listId, ownerId],
    );
    const list = listResult.rows[0];
    if (!list) {
      throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
    }

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM travel_list_items
       WHERE travel_list_id = $1::uuid AND content_id = $2`,
      [listId, contentId],
    );
    if (!existing.rows[0]) {
      return { listVersion: list.version };
    }
    if (list.version !== expectedVersion) {
      throw new TravelListError(
        412,
        "PRECONDITION_FAILED",
        "Travel list version does not match If-Match.",
      );
    }

    await client.query(
      `DELETE FROM travel_list_items
       WHERE travel_list_id = $1::uuid AND content_id = $2`,
      [listId, contentId],
    );
    const updated = await client.query<{ version: number }>(
      `UPDATE travel_lists SET version = version + 1, updated_at = now()
       WHERE id = $1::uuid AND owner_id = $2 RETURNING version`,
      [listId, ownerId],
    );
    return { listVersion: updated.rows[0].version };
  });
}
