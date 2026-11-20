import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isAuthConfigured: vi.fn(() => true),
  isTrustedRequestOrigin: vi.fn(() => true),
  getAuth: vi.fn(() => ({ auth: true })),
  toNextJsHandler: vi.fn(() => ({
    GET: vi.fn(async () => new Response("auth response", { status: 200 })),
    POST: vi.fn(async () => new Response("auth response", { status: 201 })),
  })),
}));

vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: mocks.toNextJsHandler,
}));
vi.mock("@/lib/auth/config", () => ({
  isAuthConfigured: mocks.isAuthConfigured,
  isTrustedRequestOrigin: mocks.isTrustedRequestOrigin,
}));
vi.mock("@/lib/auth", () => ({ getAuth: mocks.getAuth }));

describe("auth route configuration boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.isAuthConfigured.mockReset().mockReturnValue(true);
    mocks.isTrustedRequestOrigin.mockReset().mockReturnValue(true);
    mocks.getAuth.mockReset().mockReturnValue({ auth: true });
    mocks.toNextJsHandler.mockReset().mockReturnValue({
      GET: vi.fn(async () => new Response("auth response", { status: 200 })),
      POST: vi.fn(async () => new Response("auth response", { status: 201 })),
    });
  });

  it("returns a generic private 503 before auth or Origin handling when disabled", async () => {
    mocks.isAuthConfigured.mockReturnValue(false);
    const { GET, POST } = await import("./route.js");

    const getResponse = await GET(
      new Request("https://app.example/api/auth/session"),
    );
    const postResponse = await POST(
      new Request("https://app.example/api/auth/sign-in", { method: "POST" }),
    );

    for (const response of [getResponse, postResponse]) {
      expect(response.status).toBe(503);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await response.json()).toEqual({
        message: "Authentication is not configured.",
      });
    }
    expect(mocks.getAuth).not.toHaveBeenCalled();
    expect(mocks.toNextJsHandler).not.toHaveBeenCalled();
    expect(mocks.isTrustedRequestOrigin).not.toHaveBeenCalled();
  });

  it("preserves Better Auth responses when configured", async () => {
    const { GET, POST } = await import("./route.js");

    const getResponse = await GET(
      new Request("https://app.example/api/auth/session"),
    );
    const postResponse = await POST(
      new Request("https://app.example/api/auth/sign-in", {
        method: "POST",
        headers: { origin: "https://app.example" },
      }),
    );

    expect(getResponse.status).toBe(200);
    expect(postResponse.status).toBe(201);
    expect(getResponse.headers.get("Cache-Control")).toBe("private, no-store");
    expect(postResponse.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.getAuth).toHaveBeenCalledTimes(2);
  });

  it("does not recast runtime or database errors as disabled responses", async () => {
    mocks.toNextJsHandler.mockReturnValue({
      GET: vi.fn(async () => {
        throw new Error("database unavailable");
      }),
      POST: vi.fn(async () => new Response(null, { status: 200 })),
    });
    const { GET } = await import("./route.js");

    await expect(
      GET(new Request("https://app.example/api/auth/session")),
    ).rejects.toThrow("database unavailable");
  });
});
