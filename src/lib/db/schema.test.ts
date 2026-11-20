import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { account, session, user, verification } from "./schema.js";

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
});
