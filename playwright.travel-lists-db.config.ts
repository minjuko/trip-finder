import { defineConfig, devices } from "@playwright/test";

const storageState = process.env.TF03G_USER_A_STORAGE_STATE;
if (!storageState) {
  throw new Error("Use the CI-only browser integration runner.");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "travel-lists-real-db.spec.ts",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3000",
    storageState,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TOUR_API_E2E_FIXTURES: "true",
      TOUR_API_SERVICE_KEY: "fixture-only-not-a-real-key",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
