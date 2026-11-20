import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  configured: vi.fn(() => true),
  trustedOrigin: vi.fn(() => true),
  principal: vi.fn(async () => ({ userId: "user-a" }) as unknown),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/config", () => ({
  isAuthConfigured: mocks.configured,
  isTrustedRequestOrigin: mocks.trustedOrigin,
}));
vi.mock("@/lib/auth/session", () => ({
  requireSessionPrincipal: mocks.principal,
}));

import { TravelListError } from "./errors.js";
import { runTravelListRequest } from "./route.js";

describe("travel-list request boundary", () => {
  beforeEach(() => {
    mocks.configured.mockReset().mockReturnValue(true);
    mocks.trustedOrigin.mockReset().mockReturnValue(true);
    mocks.principal.mockReset().mockResolvedValue({ userId: "user-a" });
  });

  it("fails closed when auth is disabled and checks Origin for mutations", async () => {
    mocks.configured.mockReturnValue(false);
    const action = vi.fn(async () => Response.json({ ok: true }));
    const disabled = await runTravelListRequest(
      new Request("http://localhost"),
      false,
      action,
    );
    expect(disabled.status).toBe(503);
    expect(disabled.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await disabled.json()).toMatchObject({
      error: { code: "AUTH_DISABLED" },
    });
    expect(action).not.toHaveBeenCalled();

    mocks.configured.mockReturnValue(true);
    mocks.trustedOrigin.mockReturnValue(false);
    const rejected = await runTravelListRequest(
      new Request("http://localhost", { method: "POST" }),
      true,
      action,
    );
    expect(rejected.status).toBe(403);
    expect(rejected.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.principal).not.toHaveBeenCalled();
  });

  it("normalizes authentication and action errors without exposing internals", async () => {
    mocks.principal.mockResolvedValue(
      new Response(null, { status: 401 }) as unknown,
    );
    const noSession = await runTravelListRequest(
      new Request("http://localhost"),
      false,
      async () => Response.json({ ok: true }),
    );
    expect(noSession.status).toBe(401);
    expect(await noSession.json()).toMatchObject({
      error: { code: "AUTHENTICATION_REQUIRED" },
    });

    mocks.principal.mockResolvedValue({ userId: "session-user" });
    const action = vi.fn(async (ownerId: string) =>
      Response.json({ ownerId }, { status: 201 }),
    );
    const success = await runTravelListRequest(
      new Request("http://localhost"),
      false,
      action,
    );
    expect(success.status).toBe(201);
    expect(success.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await success.json()).toEqual({ ownerId: "session-user" });

    const notFound = await runTravelListRequest(
      new Request("http://localhost"),
      false,
      async () => {
        throw new TravelListError(404, "NOT_FOUND", "Travel list not found.");
      },
    );
    expect(notFound.status).toBe(404);

    const internal = await runTravelListRequest(
      new Request("http://localhost"),
      false,
      async () => {
        throw new Error("private database URL");
      },
    );
    expect(internal.status).toBe(500);
    expect(await internal.text()).not.toContain("private database URL");
  });
});
