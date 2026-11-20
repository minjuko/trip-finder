import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  withTransaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  getPool: () => ({ query: mocks.query }),
  withTransaction: mocks.withTransaction,
}));

import { TravelListError } from "./errors.js";
import {
  createTravelList,
  deleteTravelList,
  getTravelList,
  listTravelLists,
  renameTravelList,
} from "./repository.js";

const row = {
  id: "d7ca2e31-0b61-4c1e-bc89-7a335aee6893",
  name: "Japan",
  version: 1,
  created_at: new Date("2026-11-20T00:00:00.000Z"),
  updated_at: new Date("2026-11-20T00:00:00.000Z"),
  cursor_updated_at: "2026-11-20T00:00:00.123456Z",
};

describe("travel-list SQL repository", () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.withTransaction
      .mockReset()
      .mockImplementation((work) => work({ client: { query: mocks.query } }));
  });

  it("uses owner-scoped keyset queries and encodes the next page", async () => {
    mocks.query.mockResolvedValueOnce({
      rows: [row, { ...row, id: "d7ca2e31-0b61-4c1e-bc89-7a335aee6894" }],
    });
    const page = await listTravelLists("user-a", 1);
    expect(mocks.query.mock.calls[0][0]).toContain("WHERE owner_id = $1");
    expect(mocks.query.mock.calls[0][0]).toContain("updated_at DESC, id DESC");
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeTruthy();
    expect(mocks.query.mock.calls[0][0]).toContain("cursor_updated_at");

    mocks.query.mockResolvedValueOnce({ rows: [row] });
    const finalPage = await listTravelLists("user-a", 10, page.nextCursor!);
    expect(mocks.query.mock.calls[1][0]).toContain("(updated_at, id) <");
    expect(mocks.query.mock.calls[1][1][1]).toBe(row.cursor_updated_at);
    expect(finalPage.nextCursor).toBeNull();
  });

  it("creates, reads, and safely hides missing owner-scoped rows", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [row] });
    expect(await createTravelList("user-a", "Japan")).toMatchObject({
      name: "Japan",
      version: 1,
    });
    expect(mocks.query.mock.calls[0][0]).toContain("INSERT INTO travel_lists");

    mocks.query.mockResolvedValueOnce({ rows: [row] });
    expect(await getTravelList("user-a", row.id)).toMatchObject({ id: row.id });
    expect(mocks.query.mock.calls[1][0]).toContain(
      "id = $1::uuid AND owner_id = $2",
    );
    mocks.query.mockResolvedValueOnce({ rows: [] });
    expect(await getTravelList("user-b", row.id)).toBeNull();
  });

  it("locks the owner row and handles missing, no-op, stale, and changed updates", async () => {
    mocks.query.mockResolvedValueOnce({ rows: [] });
    await expect(
      renameTravelList("user-a", row.id, "New", 1),
    ).rejects.toMatchObject({ status: 404 });

    mocks.query.mockResolvedValueOnce({ rows: [row] });
    const noOp = await renameTravelList("user-a", row.id, "Japan", 999);
    expect(noOp.version).toBe(1);
    expect(mocks.query.mock.calls[1][0]).toContain("FOR UPDATE");
    expect(mocks.query).toHaveBeenCalledTimes(2);

    mocks.query.mockResolvedValueOnce({ rows: [row] });
    await expect(
      renameTravelList("user-a", row.id, "New", 9),
    ).rejects.toBeInstanceOf(TravelListError);
    expect(mocks.query).toHaveBeenCalledTimes(3);

    mocks.query.mockResolvedValueOnce({ rows: [row] });
    mocks.query.mockResolvedValueOnce({
      rows: [{ ...row, name: "New", version: 2 }],
    });
    const updated = await renameTravelList("user-a", row.id, "New", 1);
    expect(updated).toMatchObject({ name: "New", version: 2 });
    expect(mocks.query.mock.calls[4][0]).toContain("version = version + 1");
    expect(mocks.query.mock.calls[4][0]).toContain("owner_id = $2");
  });

  it("returns whether an owner-scoped delete removed exactly one row", async () => {
    mocks.query.mockResolvedValueOnce({ rowCount: 1 });
    expect(await deleteTravelList("user-a", row.id)).toBe(true);
    expect(mocks.query.mock.calls[0][0]).toContain(
      "id = $1::uuid AND owner_id = $2",
    );
    mocks.query.mockResolvedValueOnce({ rowCount: 0 });
    expect(await deleteTravelList("user-b", row.id)).toBe(false);
  });
});
