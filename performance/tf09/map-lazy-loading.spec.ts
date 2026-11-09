import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const origin = process.env.TF09_BASE_URL ?? "http://127.0.0.1:3000";
const variant = process.env.TF09_VARIANT ?? "unspecified";

test("map loading performance: five cold browser runs per view", async ({
  browser,
}) => {
  test.setTimeout(300_000);
  const manifest = JSON.parse(
    await readFile(
      path.resolve(
        ".next/server/app/explore/page/react-loadable-manifest.json",
      ),
      "utf8",
    ),
  ) as Record<string, { files?: string[] }>;
  const mapChunkPaths = [
    ...new Set(
      Object.values(manifest)
        .flatMap((entry) => entry.files ?? [])
        .filter((file) => file.endsWith(".js"))
        .map((file) => `/_next/${file.replaceAll("\\", "/")}`),
    ),
  ];
  const results: Record<string, unknown>[] = [];

  for (const view of ["grid", "map"] as const) {
    for (let run = 1; run <= 5; run += 1) {
      const context = await browser.newContext({
        viewport: { width: 412, height: 823 },
        deviceScaleFactor: 1.75,
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: (1_638.4 * 1024) / 8,
        uploadThroughput: (675 * 1024) / 8,
        connectionType: "cellular3g",
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

      await page.route("**/*", async (route) => {
        if (new URL(route.request().url()).origin !== origin) {
          await route.abort();
          return;
        }
        await route.continue();
      });
      await page.addInitScript(() => {
        const state: {
          lcp: null | {
            startTime: number;
            tagName: string;
            id: string;
            className: string;
          };
        } = { lcp: null };
        Object.defineProperty(window, "__tf09", { value: state });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<
            PerformanceEntry & { element?: Element }
          >) {
            const element = entry.element;
            state.lcp = {
              startTime: entry.startTime,
              tagName: element?.tagName ?? "unknown",
              id: element?.id ?? "",
              className:
                typeof element?.className === "string" ? element.className : "",
            };
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });

      const path = view === "map" ? "/explore?view=map" : "/explore";
      const startedAt = Date.now();
      const response = await page.goto(`${origin}${path}`, {
        waitUntil: "load",
      });
      expect(response?.status()).toBe(200);
      const navigationMs = Date.now() - startedAt;
      let mapReadyMs: number | null = null;
      let interactionMs: number | null = null;

      if (view === "map") {
        await page.getByRole("region", { name: "검색 결과 지도" }).waitFor();
        await page.locator(".leaflet-marker-icon").first().waitFor();
        mapReadyMs = Date.now() - startedAt;
        const firstMarker = page.locator(".leaflet-marker-icon").first();
        await firstMarker.focus();
        await firstMarker.press("Enter");
        await expect(page.getByText("상세정보 보기")).toBeVisible();
        interactionMs = Date.now() - startedAt;
      }
      await page.waitForTimeout(4_000);

      const metrics = await page.evaluate((knownMapChunkPaths) => {
        const navigation = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType(
          "resource",
        ) as PerformanceResourceTiming[];
        return {
          lcp: (
            window as typeof window & {
              __tf09: {
                lcp: {
                  startTime: number;
                  tagName: string;
                  id: string;
                  className: string;
                } | null;
              };
            }
          ).__tf09.lcp,
          lcpMs:
            (
              window as typeof window & {
                __tf09: { lcp: { startTime: number } | null };
              }
            ).__tf09.lcp?.startTime ?? null,
          fcpMs:
            performance
              .getEntriesByName("first-contentful-paint")
              .find((entry) => entry.entryType === "paint")?.startTime ?? null,
          ttfbMs: navigation.responseStart - navigation.requestStart,
          javaScriptResourcesWithinCollectionWindow: resources
            .filter(
              (entry) =>
                new URL(entry.name).pathname.includes("/_next/static/") &&
                new URL(entry.name).pathname.endsWith(".js"),
            )
            .map((entry) => ({
              url: new URL(entry.name).pathname,
              startTime: entry.startTime,
              responseEnd: entry.responseEnd,
              transferSize: entry.transferSize,
              encodedBodySize: entry.encodedBodySize,
            })),
          javaScriptTransferWithinCollectionWindowBytes: resources
            .filter(
              (entry) =>
                new URL(entry.name).pathname.includes("/_next/static/") &&
                new URL(entry.name).pathname.endsWith(".js"),
            )
            .reduce((sum, entry) => sum + entry.transferSize, 0),
          javaScriptTransferByLcpBytes: resources
            .filter(
              (entry) =>
                new URL(entry.name).pathname.includes("/_next/static/") &&
                new URL(entry.name).pathname.endsWith(".js") &&
                entry.responseEnd <=
                  ((
                    window as typeof window & {
                      __tf09: { lcp: { startTime: number } | null };
                    }
                  ).__tf09.lcp?.startTime ?? Number.POSITIVE_INFINITY),
            )
            .reduce((sum, entry) => sum + entry.transferSize, 0),
          mapChunks: resources
            .filter((entry) =>
              knownMapChunkPaths.includes(new URL(entry.name).pathname),
            )
            .map((entry) => ({
              url: new URL(entry.name).pathname,
              startTime: entry.startTime,
              responseEnd: entry.responseEnd,
              transferSize: entry.transferSize,
              encodedBodySize: entry.encodedBodySize,
            })),
        };
      }, mapChunkPaths);
      results.push({
        variant,
        view,
        run,
        navigationMs,
        mapReadyMs,
        interactionMs,
        ...metrics,
      });
      await context.close();
    }
  }

  const outputPath = path.resolve(
    process.env.TF09_OUTPUT ?? `test-results/tf09-${variant}.json`,
  );
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        variant,
        browser: browser.version(),
        viewport: { width: 412, height: 823, deviceScaleFactor: 1.75 },
        conditions: {
          cache: "disabled per run",
          network: "150ms RTT, 1,638.4Kbps down, 675Kbps up",
          cpu: "4x slowdown",
          externalRequests: "aborted",
          stableResourceWindowAfterLoad: "4 seconds",
        },
        results,
      },
      null,
      2,
    ),
  );
});
