import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  transactionQuery: vi.fn(),
  withTransaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  getPool: () => ({ query: mocks.query }),
  withTransaction: mocks.withTransaction,
}));

import { encodeTravelListItemsCursor } from "@/lib/travel-lists/validation";
import {
  addTravelListItem,
  deleteTravelListItem,
  getTravelListItemContext,
  listTravelListItems,
} from "./repository";

const listId = "d7ca2e31-0b61-4c1e-bc89-7a335aee6893";
const row = {
  id: listId,
  content_id: "127480",
  content_type_id: "12",
  position: 0,
  title: "가거도",
  address: "전남 신안군",
  thumbnail_url: "https://example.test/image.jpg",
  created_at: new Date("2026-11-20T00:00:00.000Z"),
};

describe("travel-list item SQL repository", () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.transactionQuery.mockReset();
    mocks.withTransaction
      .mockReset()
      .mockImplementation((work) =>
        work({ client: { query: mocks.transactionQuery }, db: {} }),
      );
  });

  it("reads an owner-scoped item context with and without an item", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    await expect(
      getTravelListItemContext("owner-a", listId, "127480"),
    ).resolves.toBeNull();

    mocks.query.mockResolvedValueOnce({
      rows: [{ ...row, list_version: 3, item_id: null }],
    });
    await expect(
      getTravelListItemContext("owner-a", listId, "127480"),
    ).resolves.toEqual({ listVersion: 3, item: null });

    mocks.query.mockResolvedValueOnce({
      rows: [{ ...row, list_version: 3, item_id: row.id }],
    });
    await expect(
      getTravelListItemContext("owner-a", listId, "127480"),
    ).resolves.toEqual({
      listVersion: 3,
      item: {
        id: row.id,
        contentId: "127480",
        contentTypeId: "12",
        title: "가거도",
        address: "전남 신안군",
        thumbnailUrl: "https://example.test/image.jpg",
        position: 0,
        createdAt: row.created_at,
      },
    });
    expect(mocks.query.mock.calls[0][0]).toContain("l.owner_id = $2");
  });

  it("uses one repeatable-read snapshot for list version, item page, and count", async () => {
    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ version: 4 }] })
      .mockResolvedValueOnce({ rows: [row, { ...row, id: "other" }] })
      .mockResolvedValueOnce({ rows: [{ count: 2 }] });

    const page = await listTravelListItems("owner-a", listId, 1);
    expect(page.items).toHaveLength(1);
    expect(page.itemCount).toBe(2);
    expect(page.listVersion).toBe(4);
    expect(page.nextCursor).toBeTruthy();
    expect(mocks.transactionQuery.mock.calls[0][0]).toContain(
      "REPEATABLE READ READ ONLY",
    );
    expect(mocks.transactionQuery.mock.calls[2][0]).toContain(
      "ORDER BY position ASC, id ASC",
    );
  });

  it("rejects missing lists and stale versioned cursors", async () => {
    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(
      listTravelListItems("owner-a", listId, 20),
    ).rejects.toMatchObject({
      status: 404,
    });

    const cursor = encodeTravelListItemsCursor({
      version: 3,
      position: 1,
      id: listId,
    });
    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ version: 4 }] });
    await expect(
      listTravelListItems("owner-a", listId, 1, cursor),
    ).rejects.toMatchObject({ status: 409, code: "CURSOR_STALE" });
  });

  it("uses position/id keyset predicates and returns the final page", async () => {
    const cursor = encodeTravelListItemsCursor({
      version: 4,
      position: 0,
      id: listId,
    });
    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ version: 4 }] })
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] });
    const page = await listTravelListItems("owner-a", listId, 1, cursor);
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
    expect(mocks.transactionQuery.mock.calls[2][0]).toContain(
      "(position, id) > ($2::integer, $3::uuid)",
    );
    expect(mocks.transactionQuery.mock.calls[2][1]).toEqual([
      listId,
      0,
      listId,
      2,
    ]);
  });

  it("serializes duplicate, conflicting, stale, type-invalid, and new additions", async () => {
    const snapshot = {
      title: "가거도",
      address: "전남 신안군",
      thumbnailUrl: null,
    };
    mocks.transactionQuery.mockResolvedValueOnce({ rows: [] });
    await expect(
      addTravelListItem("owner-a", listId, "127480", "12", 1, "12", snapshot),
    ).rejects.toMatchObject({ status: 404 });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [row] });
    await expect(
      addTravelListItem("owner-a", listId, "127480", "12", 1, "12", snapshot),
    ).resolves.toMatchObject({ status: 200, listVersion: 5 });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [row] });
    await expect(
      addTravelListItem("owner-a", listId, "127480", "13", 5, "12", snapshot),
    ).rejects.toMatchObject({ status: 409, code: "CONTENT_ID_CONFLICT" });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(
      addTravelListItem("owner-a", listId, "127481", "13", 5, "12", snapshot),
    ).rejects.toMatchObject({ status: 422, code: "INVALID_CONTENT_TYPE" });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(
      addTravelListItem("owner-a", listId, "127481", "12", 4, "12", snapshot),
    ).rejects.toMatchObject({ status: 409, code: "VERSION_CONFLICT" });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ position: 1 }] })
      .mockResolvedValueOnce({
        rows: [{ ...row, id: "new-item", position: 1 }],
      })
      .mockResolvedValueOnce({ rows: [{ version: 6 }] });
    await expect(
      addTravelListItem("owner-a", listId, "127481", "12", 5, "12", snapshot),
    ).resolves.toMatchObject({
      status: 201,
      listVersion: 6,
      item: { position: 1 },
    });
    expect(mocks.transactionQuery.mock.calls.at(-1)?.[0]).toContain(
      "version = version + 1",
    );
  });

  it("deletes under the parent lock and preserves missing/stale no-op semantics", async () => {
    mocks.transactionQuery.mockResolvedValueOnce({ rows: [] });
    await expect(
      deleteTravelListItem("owner-a", listId, "127480", 1),
    ).rejects.toMatchObject({ status: 404 });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(
      deleteTravelListItem("owner-a", listId, "127480", 1),
    ).resolves.toEqual({ listVersion: 5 });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: row.id }] });
    await expect(
      deleteTravelListItem("owner-a", listId, "127480", 1),
    ).rejects.toMatchObject({ status: 412, code: "PRECONDITION_FAILED" });

    mocks.transactionQuery
      .mockResolvedValueOnce({ rows: [{ version: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: row.id }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ version: 6 }] });
    await expect(
      deleteTravelListItem("owner-a", listId, "127480", 5),
    ).resolves.toEqual({ listVersion: 6 });
    expect(mocks.transactionQuery.mock.calls.at(-2)?.[0]).toContain(
      "DELETE FROM travel_list_items",
    );
  });
});
