import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./performance/tf08",
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    ...devices["Desktop Chrome"],
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    trace: "off",
  },
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      TOUR_API_E2E_FIXTURES: "true",
      TOUR_API_PERF_FIXTURES: "true",
      TOUR_API_SERVICE_KEY: "fixture-only-not-a-real-key",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
