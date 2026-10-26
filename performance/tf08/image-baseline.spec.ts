import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const localOrigin = "http://127.0.0.1:3000";
const externalRequests: string[] = [];
const locallyBlockedImages: string[] = [];
const imageResponses: Array<{
  url: string;
  status: number;
  contentType: string;
  contentLength: string | null;
  bodyBytes: number;
}> = [];

test("production image fixture baseline: five runs per page", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const results: Record<string, unknown>[] = [];

  const scenarios = [
    { routePath: "/", imageMode: "enabled" },
    { routePath: "/explore", imageMode: "enabled" },
    { routePath: "/explore", imageMode: "blocked-control" },
  ];
  for (const { routePath, imageMode } of scenarios) {
    for (let run = 1; run <= 5; run += 1) {
      const context = await browser.newContext({
        viewport: { width: 412, height: 823 },
        deviceScaleFactor: 1.75,
      });
      const cdp = await context.newCDPSession(await context.newPage());
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

      const page = context.pages()[0];
      const runImageResponses: typeof imageResponses = [];
      const bodyReads: Promise<void>[] = [];

      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== localOrigin) {
          externalRequests.push(url.href);
          await route.abort();
          return;
        }
        if (
          imageMode === "blocked-control" &&
          url.pathname === "/_next/image"
        ) {
          locallyBlockedImages.push(url.href);
          await route.abort();
          return;
        }
        await route.continue();
      });

      page.on("response", (response) => {
        if (!new URL(response.url()).pathname.startsWith("/_next/image"))
          return;
        bodyReads.push(
          (async () => {
            const headers = await response.allHeaders();
            const body = await response.body();
            const record = {
              url: response.url(),
              status: response.status(),
              contentType: headers["content-type"] ?? "",
              contentLength: headers["content-length"] ?? null,
              bodyBytes: body.byteLength,
            };
            runImageResponses.push(record);
            imageResponses.push(record);
          })(),
        );
      });

      await page.addInitScript(() => {
        const state: {
          lcp: null | {
            startTime: number;
            tagName: string;
            id: string;
            className: string;
            src: string;
            currentSrc: string;
            naturalWidth: number;
            naturalHeight: number;
          };
          cls: number;
          longTasks: Array<{ startTime: number; duration: number }>;
        } = { lcp: null, cls: 0, longTasks: [] };
        Object.defineProperty(window, "__tf08Perf", { value: state });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<
            PerformanceEntry & { element?: Element }
          >) {
            const element = entry.element as HTMLImageElement | null;
            state.lcp = {
              startTime: entry.startTime,
              tagName: element?.tagName ?? "unknown",
              id: element?.id ?? "",
              className:
                typeof element?.className === "string" ? element.className : "",
              src: element?.getAttribute("src") ?? "",
              currentSrc: element?.currentSrc ?? "",
              naturalWidth: element?.naturalWidth ?? 0,
              naturalHeight: element?.naturalHeight ?? 0,
            };
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as Array<
            PerformanceEntry & { value: number; hadRecentInput: boolean }
          >) {
            if (!entry.hadRecentInput) state.cls += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          state.longTasks.push(
            ...list.getEntries().map((entry) => ({
              startTime: entry.startTime,
              duration: entry.duration,
            })),
          );
        }).observe({ type: "longtask", buffered: true });
      });

      const navigation = await page.goto(`${localOrigin}${routePath}`, {
        waitUntil: "load",
      });
      expect(navigation?.status()).toBe(200);
      await page.evaluate(async () => {
        await Promise.all(
          [...document.images]
            .filter((image) => image.loading === "eager")
            .map((image) => image.decode().catch(() => undefined)),
        );
      });
      await page.waitForTimeout(1000);
      await Promise.all(bodyReads);

      const metrics = await page.evaluate(() => {
        const navigationEntry = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        const paint = (name: string) =>
          performance
            .getEntriesByName(name)
            .find((entry) => entry.entryType === "paint")?.startTime ?? null;
        const state = (
          window as typeof window & {
            __tf08Perf: {
              lcp: unknown;
              cls: number;
              longTasks: Array<{ startTime: number; duration: number }>;
            };
          }
        ).__tf08Perf;
        const images = [...document.images].map((image) => ({
          src: image.getAttribute("src") ?? "",
          currentSrc: image.currentSrc,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          complete: image.complete,
        }));
        const resources = performance
          .getEntriesByType("resource")
          .filter((entry) => new URL(entry.name).pathname === "/_next/image")
          .map((entry) => ({
            name: entry.name,
            startTime: entry.startTime,
            responseEnd: (entry as PerformanceResourceTiming).responseEnd,
            transferSize: (entry as PerformanceResourceTiming).transferSize,
            encodedBodySize: (entry as PerformanceResourceTiming)
              .encodedBodySize,
            decodedBodySize: (entry as PerformanceResourceTiming)
              .decodedBodySize,
            duration: entry.duration,
          }));
        return {
          fcp: paint("first-contentful-paint"),
          lcp: state.lcp,
          cls: state.cls,
          ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
          longTasks: state.longTasks,
          images,
          resources,
        };
      });

      results.push({
        route: routePath,
        imageMode,
        run,
        ...metrics,
        imageResponses: runImageResponses,
      });
      await context.close();
    }
  }

  const outputDir = path.join(process.cwd(), "test-results");
  await mkdir(outputDir, { recursive: true });
  await writeFile(
    path.join(outputDir, "tf08-performance.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        browser: browser.version(),
        conditions: {
          viewport: "412x823",
          dpr: 1.75,
          rttMs: 150,
          downloadKbps: 1638.4,
          uploadKbps: 675,
          cpuSlowdown: 4,
          browserCache: "disabled per run",
        },
        results,
        externalRequests,
        locallyBlockedImages,
        imageResponses,
      },
      null,
      2,
    ),
  );
  console.log(
    `TF08_METRICS ${JSON.stringify(
      results.map((result) => ({
        route: result.route,
        imageMode: result.imageMode,
        run: result.run,
        fcp: result.fcp,
        lcp: result.lcp,
        cls: result.cls,
        ttfb: result.ttfb,
        longTasks: result.longTasks,
        images: result.images,
        resources: result.resources,
        imageResponses: result.imageResponses,
      })),
    )}`,
  );
  console.log(
    `TF08_EXTERNAL_BLOCKED ${JSON.stringify(
      externalRequests.reduce<Record<string, number>>((counts, url) => {
        const host = new URL(url).host;
        counts[host] = (counts[host] ?? 0) + 1;
        return counts;
      }, {}),
    )}`,
  );
  console.log(
    `TF08_IMAGE_BLOCKED_CONTROL_COUNT ${locallyBlockedImages.length}`,
  );
  expect(externalRequests.every((url) => !url.startsWith(localOrigin))).toBe(
    true,
  );
  const exploreImageRuns = results.filter(
    (result) => result.route === "/explore" && result.imageMode === "enabled",
  );
  expect(exploreImageRuns).toHaveLength(5);
  expect(
    exploreImageRuns.every(
      (result) =>
        (result.lcp as { tagName?: string } | null)?.tagName === "IMG",
    ),
  ).toBe(true);
  expect(locallyBlockedImages.length).toBeGreaterThanOrEqual(5);
  expect(imageResponses).toHaveLength(5);
  expect(
    imageResponses.every(
      (response) =>
        response.status === 200 &&
        /image\/(avif|webp|jpeg|png)/.test(response.contentType),
    ),
  ).toBe(true);
});
