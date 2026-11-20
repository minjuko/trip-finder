import { afterEach, describe, expect, it, vi } from "vitest";

import {
  messageForApiError,
  TravelListApiError,
  travelListsApi,
} from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("travelListsApi client", () => {
  it("sends same-origin credentials, no-store, and cursor pagination", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ items: [], nextCursor: null }));
    vi.stubGlobal("fetch", fetchMock);

    await travelListsApi.lists("next/page");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/travel-lists?limit=50&cursor=next%2Fpage",
      expect.objectContaining({
        credentials: "same-origin",
        cache: "no-store",
      }),
    );
  });

  it("does not automatically retry list creation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: { code: "INTERNAL_ERROR", message: "failed" } },
          { status: 500 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(travelListsApi.create("Japan")).rejects.toMatchObject({
      status: 500,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ name: "Japan" }),
    });
  });

  it("uses the exact If-Match contract for item removal", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await travelListsApi.deleteItem("list/1", "123", 7);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/travel-lists/list%2F1/items/123",
      expect.objectContaining({
        method: "DELETE",
        headers: { "If-Match": '"list-v7"' },
      }),
    );
  });

  it("gives a safe auth-disabled message without exposing response internals", () => {
    expect(
      messageForApiError(
        new TravelListApiError(503, "AUTH_DISABLED", "secret detail"),
      ),
    ).toContain("비활성 상태");
    expect(
      messageForApiError(
        new TravelListApiError(503, "AUTH_DISABLED", "secret detail"),
      ),
    ).not.toContain("secret detail");
    expect(
      messageForApiError(
        new TravelListApiError(401, "AUTHENTICATION_REQUIRED", "x"),
      ),
    ).toContain("Google 로그인");
  });

  it.each([
    [403, "ORIGIN_FORBIDDEN", "출처"],
    [404, "NOT_FOUND", "찾을 수 없습니다"],
    [409, "VERSION_CONFLICT", "최신 내용을 다시 불러왔습니다"],
    [412, "PRECONDITION_FAILED", "최신 내용을 다시 불러왔습니다"],
    [503, "CONTENT_SOURCE_UNAVAILABLE", "잠시 확인할 수 없습니다"],
    [504, "CONTENT_SOURCE_TIMEOUT", "시간이 오래 걸렸습니다"],
  ])("maps %i %s to a safe user message", (status, code, expected) => {
    expect(
      messageForApiError(
        new TravelListApiError(status, code, "internal detail"),
      ),
    ).toContain(expected);
  });
});
