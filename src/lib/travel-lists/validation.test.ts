import { describe, expect, it } from "vitest";

import { TravelListError } from "./errors.js";
import {
  createTravelListSchema,
  addTravelListItemSchema,
  contentIdSchema,
  encodeCursor,
  listIdSchema,
  parseCursor,
  parseInput,
  parseJsonBody,
  parsePageQuery,
  parseListVersionMatch,
  parseTravelListItemsCursor,
  encodeTravelListItemsCursor,
  updateTravelListSchema,
} from "./validation.js";

describe("travel-list request validation", () => {
  it("trims valid names and rejects blank, oversized, and extra fields", () => {
    expect(parseInput(createTravelListSchema, { name: "  Japan  " })).toEqual({
      name: "Japan",
    });
    expect(() => parseInput(createTravelListSchema, { name: "  " })).toThrow(
      TravelListError,
    );
    expect(() =>
      parseInput(createTravelListSchema, { name: "x".repeat(81) }),
    ).toThrow(TravelListError);
    expect(() =>
      parseInput(updateTravelListSchema, {
        name: "Japan",
        expectedVersion: 1,
        ownerId: "untrusted",
      }),
    ).toThrow(TravelListError);
    expect(listIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });

  it("validates paging fields and rejects unknown or duplicate query keys", () => {
    expect(parsePageQuery(new URLSearchParams())).toEqual({ limit: 20 });
    expect(parsePageQuery(new URLSearchParams("limit=7&cursor=abc"))).toEqual({
      limit: 7,
      cursor: "abc",
    });
    expect(() => parsePageQuery(new URLSearchParams("limit=0"))).toThrow(
      TravelListError,
    );
    expect(() => parsePageQuery(new URLSearchParams("ownerId=user-a"))).toThrow(
      TravelListError,
    );
    expect(() =>
      parsePageQuery(new URLSearchParams("limit=1&limit=2")),
    ).toThrow(TravelListError);
  });

  it("round-trips opaque keyset cursors and rejects malformed cursors and JSON", async () => {
    const cursor = encodeCursor({
      updatedAt: "2026-11-20T00:00:00.123456Z",
      id: "d7ca2e31-0b61-4c1e-bc89-7a335aee6893",
    });
    expect(parseCursor(cursor)).toEqual({
      updatedAt: "2026-11-20T00:00:00.123456Z",
      id: "d7ca2e31-0b61-4c1e-bc89-7a335aee6893",
    });
    expect(() => parseCursor("%%%")).toThrow(TravelListError);
    expect(() =>
      parseCursor(Buffer.from("{}", "utf8").toString("base64url")),
    ).toThrow(TravelListError);

    const malformed = new Request("http://localhost", {
      method: "POST",
      body: "{",
    });
    await expect(parseJsonBody(malformed)).rejects.toMatchObject({
      status: 400,
      code: "INVALID_JSON",
    });
    expect(
      await parseJsonBody(
        new Request("http://localhost", { method: "POST", body: "{}" }),
      ),
    ).toEqual({});
  });

  it("validates item IDs, strict add bodies, ETags, and versioned cursors", () => {
    expect(contentIdSchema.safeParse("127480").success).toBe(true);
    expect(contentIdSchema.safeParse("127/480").success).toBe(false);
    expect(
      addTravelListItemSchema.safeParse({
        contentTypeId: "12",
        expectedVersion: 1,
        ownerId: "untrusted",
      }).success,
    ).toBe(false);
    expect(parseListVersionMatch('"list-v7"')).toBe(7);
    expect(() => parseListVersionMatch(null)).toThrow(TravelListError);

    const cursor = encodeTravelListItemsCursor({
      version: 7,
      position: 2,
      id: "d7ca2e31-0b61-4c1e-bc89-7a335aee6893",
    });
    expect(parseTravelListItemsCursor(cursor)).toEqual({
      version: 7,
      position: 2,
      id: "d7ca2e31-0b61-4c1e-bc89-7a335aee6893",
    });
  });
});
