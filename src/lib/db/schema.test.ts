import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  account,
  session,
  travelListItems,
  travelLists,
  user,
  verification,
} from "./schema.js";

describe("Better Auth PostgreSQL schema", () => {
  it("uses the four canonical core tables and string IDs", () => {
    const tables = [user, session, account, verification].map((table) =>
      getTableConfig(table),
    );

    expect(tables.map(({ name }) => name)).toEqual([
      "user",
      "session",
      "account",
      "verification",
    ]);
    for (const table of tables) {
      expect(table.columns.find(({ name }) => name === "id")?.dataType).toBe(
        "string",
      );
    }
    expect(tables.map(({ name }) => name)).not.toContain("app_users");
  });

  it("adds only owner-scoped list metadata with a restrictive user FK", () => {
    const table = getTableConfig(travelLists);

    expect(table.name).toBe("travel_lists");
    expect(table.columns.map(({ name }) => name)).toEqual([
      "id",
      "owner_id",
      "name",
      "version",
      "created_at",
      "updated_at",
    ]);
    expect(table.columns.find(({ name }) => name === "id")?.dataType).toBe(
      "string",
    );
    expect(table.foreignKeys).toHaveLength(1);
    expect(table.foreignKeys[0].onDelete).toBe("no action");
    expect(table.indexes.map(({ config }) => config.name)).toContain(
      "travel_lists_owner_updated_id_idx",
    );
  });

  it("adds TourAPI snapshots with cascading parent FK and uniqueness", () => {
    const table = getTableConfig(travelListItems);

    expect(table.name).toBe("travel_list_items");
    expect(table.columns.map(({ name }) => name)).toEqual([
      "id",
      "travel_list_id",
      "content_id",
      "content_type_id",
      "position",
      "title",
      "address",
      "thumbnail_url",
      "created_at",
    ]);
    expect(table.foreignKeys).toHaveLength(1);
    expect(table.foreignKeys[0].onDelete).toBe("cascade");
    expect(table.uniqueConstraints.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "travel_list_items_list_content_unique",
        "travel_list_items_list_position_unique",
      ]),
    );
    expect(table.indexes.map(({ config }) => config.name)).toContain(
      "travel_list_items_list_position_id_idx",
    );
  });
});
