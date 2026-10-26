import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // 변경: Vitest와 E2E 테스트 디렉터리를 명확히 분리
  testDir: "./e2e",

  fullyParallel: true,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: "html",

  use: {
    baseURL: "http://127.0.0.1:3000",

    trace: "on-first-retry",

    screenshot: "only-on-failure",

    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  // 변경: E2E 실행 시 Next.js 개발 서버 자동 실행
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
