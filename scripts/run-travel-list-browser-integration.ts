import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { testUtils, type TestHelpers } from "better-auth/plugins";
import { createAuth } from "../src/lib/auth/config.js";
import { closePool } from "../src/lib/db/index.js";

const allowedHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function assertCiDatabaseTarget(): void {
  if (process.env.CI !== "true") {
    throw new Error("Browser database integration is restricted to CI.");
  }

  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required.");

  const url = new URL(raw);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !allowedHosts.has(url.hostname) ||
    databaseName !== "tripfinder_test"
  ) {
    throw new Error(
      "Refusing to run outside the disposable local CI database.",
    );
  }
}

async function main(): Promise<void> {
  assertCiDatabaseTarget();

  const auth = createAuth([testUtils()]);
  const helpers = ((await auth.$context) as unknown as { test: TestHelpers })
    .test;
  const userIds: string[] = [];
  const stateDirectory = await mkdtemp(join(tmpdir(), "tf03g-browser-"));
  let testExitCode = 1;

  try {
    const users = await Promise.all(
      ["a", "b"].map(async (label) => {
        const user = await helpers.saveUser(
          helpers.createUser({
            email: `tf03g-${label}-${crypto.randomUUID()}@example.test`,
          }),
        );
        userIds.push(user.id);
        return user;
      }),
    );

    const storagePaths = await Promise.all(
      users.map(async (user, index) => {
        const login = await helpers.login({ userId: user.id });
        const path = join(stateDirectory, `user-${index}.json`);
        await writeFile(
          path,
          JSON.stringify({
            cookies: login.cookies.map((cookie) => ({
              ...cookie,
              expires: cookie.expires ?? -1,
            })),
            origins: [],
          }),
          { mode: 0o600 },
        );
        return path;
      }),
    );

    const result = spawnSync(
      process.execPath,
      [
        "node_modules/@playwright/test/cli.js",
        "test",
        "--config=playwright.travel-lists-db.config.ts",
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          TF03G_USER_A_STORAGE_STATE: storagePaths[0],
          TF03G_USER_B_STORAGE_STATE: storagePaths[1],
        },
      },
    );
    testExitCode = result.status ?? 1;
  } finally {
    try {
      for (const userId of userIds) await helpers.deleteUser(userId);
    } finally {
      await closePool();
      await rm(stateDirectory, { recursive: true, force: true });
    }
  }

  assert.equal(testExitCode, 0, "Travel-list browser integration failed.");
}

main().catch((error: unknown) => {
  console.error("Travel-list browser integration failed.");
  console.error(error instanceof Error ? error.message : "Unknown failure");
  process.exitCode = 1;
});
