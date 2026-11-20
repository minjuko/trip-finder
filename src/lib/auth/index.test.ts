import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createAuth: vi.fn(() => ({ auth: true })) }));

vi.mock("server-only", () => ({}));
vi.mock("./config.js", () => ({ createAuth: mocks.createAuth }));

describe("getAuth", () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.createAuth.mockClear();
  });

  it("creates the server auth instance only on first use", async () => {
    const { getAuth } = await import("./index.js");

    expect(mocks.createAuth).not.toHaveBeenCalled();
    const first = getAuth();
    const second = getAuth();

    expect(first).toBe(second);
    expect(mocks.createAuth).toHaveBeenCalledTimes(1);
  });
});
