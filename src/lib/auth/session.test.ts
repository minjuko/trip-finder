import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("./index.js", () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));

import { getSessionPrincipal, requireSessionPrincipal } from "./session.js";

describe("server session principal", () => {
  beforeEach(() => mocks.getSession.mockReset());

  it("rejects missing or expired server sessions", async () => {
    mocks.getSession.mockResolvedValueOnce(null);
    expect(await getSessionPrincipal(new Headers())).toBeNull();

    mocks.getSession.mockResolvedValueOnce({
      user: { id: "user-1" },
      session: { expiresAt: new Date(Date.now() - 1_000) },
    });
    expect(await getSessionPrincipal(new Headers())).toBeNull();

    mocks.getSession.mockResolvedValueOnce({
      user: { id: "user-1" },
      session: { expiresAt: new Date(Number.NaN) },
    });
    expect(await getSessionPrincipal(new Headers())).toBeNull();
  });

  it("returns only the verified user ID and responds privately when absent", async () => {
    mocks.getSession.mockResolvedValueOnce({
      user: { id: "verified-user" },
      session: { expiresAt: new Date(Date.now() + 60_000) },
    });
    expect(await getSessionPrincipal(new Headers())).toEqual({
      userId: "verified-user",
    });

    mocks.getSession.mockResolvedValueOnce(null);
    const rejected = await requireSessionPrincipal(new Headers());
    expect(rejected).toBeInstanceOf(Response);
    expect(rejected).toMatchObject({ status: 401 });
    expect((rejected as Response).headers.get("Cache-Control")).toBe(
      "private, no-store",
    );
  });
});
