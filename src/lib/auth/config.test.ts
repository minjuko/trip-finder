import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((options: unknown) => options),
  drizzleAdapter: vi.fn(() => ({ adapter: "drizzle" })),
  getDb: vi.fn(() => ({ database: "pool" })),
}));

vi.mock("better-auth", () => ({ betterAuth: mocks.betterAuth }));
vi.mock("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: mocks.drizzleAdapter,
}));
vi.mock("../db/index.js", () => ({ getDb: mocks.getDb }));

import { createAuth, isTrustedRequestOrigin } from "./config.js";

describe("Better Auth server configuration", () => {
  beforeEach(() => {
    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "ci-only-secret-not-for-deployment-0123456789abcdef",
    );
    vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");
    vi.stubEnv(
      "BETTER_AUTH_TRUSTED_ORIGINS",
      "http://localhost:3000,https://preview.example.test",
    );
    vi.stubEnv("NODE_ENV", "test");
    mocks.betterAuth.mockClear();
    mocks.drizzleAdapter.mockClear();
    mocks.getDb.mockClear();
  });

  it("reuses the PostgreSQL Drizzle adapter without enabling sign-in providers", () => {
    createAuth();

    expect(mocks.drizzleAdapter).toHaveBeenCalledWith(
      { database: "pool" },
      expect.objectContaining({ provider: "pg" }),
    );
    const options = mocks.betterAuth.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(options).toMatchObject({
      baseURL: "http://127.0.0.1:3000",
      trustedOrigins: [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "https://preview.example.test",
      ],
      advanced: {
        useSecureCookies: false,
        defaultCookieAttributes: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        },
      },
      telemetry: { enabled: false },
    });
    expect(options).not.toHaveProperty("socialProviders");
    expect(options).not.toHaveProperty("emailAndPassword");
  });

  it("fails closed for missing or invalid auth secrets and URLs", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short");
    expect(() => createAuth()).toThrow("BETTER_AUTH_SECRET");

    vi.stubEnv(
      "BETTER_AUTH_SECRET",
      "ci-only-secret-not-for-deployment-0123456789abcdef",
    );
    vi.stubEnv("BETTER_AUTH_URL", "");
    expect(() => createAuth()).toThrow("BETTER_AUTH_URL");

    vi.stubEnv("BETTER_AUTH_URL", "file:///tmp/auth");
    expect(() => createAuth()).toThrow("exact HTTP(S) origin");

    vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => createAuth()).toThrow("HTTPS in production");
    vi.stubEnv("NODE_ENV", "test");

    vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000/api/auth");
    expect(() => createAuth()).toThrow("exact HTTP(S) origin");

    vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");
    vi.stubEnv("BETTER_AUTH_TRUSTED_ORIGINS", "https://example.test/path");
    expect(() => createAuth()).toThrow("exact HTTP(S) origins");
  });

  it("accepts only exact trusted origins for state-changing requests", () => {
    expect(isTrustedRequestOrigin("http://localhost:3000")).toBe(true);
    expect(isTrustedRequestOrigin("https://preview.example.test")).toBe(true);
    expect(isTrustedRequestOrigin("https://attacker.example")).toBe(false);
    expect(isTrustedRequestOrigin("http://localhost:3000/path")).toBe(false);
    expect(isTrustedRequestOrigin(null)).toBe(false);
  });

  it("enables secure session cookies for HTTPS production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BETTER_AUTH_URL", "https://trip-finder.example");
    vi.stubEnv("BETTER_AUTH_TRUSTED_ORIGINS", "");

    createAuth();

    expect(mocks.betterAuth.mock.calls[0][0]).toMatchObject({
      advanced: { useSecureCookies: true },
    });
  });
});
