import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const expectNoSeriousAxeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).analyze();
  const seriousViolations = results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );

  expect(seriousViolations).toEqual([]);
};

test.describe("Accessibility", () => {
  test("home has no serious or critical automated accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("explore has no serious or critical automated accessibility violations", async ({
    page,
  }) => {
    await page.goto("/explore?region=11");
    await expect(
      page.getByRole("heading", { name: "여행지 탐색" }),
    ).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("detail has no serious or critical automated accessibility violations", async ({
    page,
  }) => {
    await page.goto("/places/127480");
    await expect(
      page.getByRole("heading", { level: 1, name: "가거도" }),
    ).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("empty bookmarks has no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/bookmarks");
    await expect(page.getByText("관심 여행지가 없습니다.")).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("map markers have unique accessible names and support keyboard activation", async ({
    page,
  }) => {
    await page.goto("/explore?view=map");
    const markers = page.locator(".leaflet-marker-icon");
    await expect(markers).toHaveCount(12);

    const markerTitles = await markers.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("title")),
    );
    expect(markerTitles).toEqual(
      Array.from(
        { length: 12 },
        (_, index) => `Tour Fixture ${String(index + 1).padStart(2, "0")}`,
      ),
    );

    for (const title of [
      "Tour Fixture 01",
      "Tour Fixture 02",
      "Tour Fixture 03",
    ]) {
      await expect(
        page.getByRole("button", { name: title, exact: true }),
      ).toBeVisible();
    }
    await expectNoSeriousAxeViolations(page);

    const marker = page.getByRole("button", {
      name: "Tour Fixture 01",
      exact: true,
    });
    await marker.focus();
    await expect(marker).toBeFocused();
    await marker.press("Enter");

    await expect(
      page.getByText("Tour Fixture 01", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('a[href="/places/127480"]', { hasText: "상세정보 보기" }),
    ).toBeVisible();
  });

  test("open image dialog has no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/places/127480");
    const imageTrigger = page.getByRole("button", {
      name: "가거도 대표 이미지 크게 보기",
    });
    await imageTrigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("expanded mobile filters have no serious or critical axe violations", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/explore?region=11&imageOnly=1");
    const filterPanel = page.locator("details").first();
    await page.locator("summary").press("Enter");
    await expect(filterPanel).toHaveAttribute("open", "");
    await expectNoSeriousAxeViolations(page);
  });

  test("saved bookmarks have no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/places/127480");
    await page.locator("button[aria-pressed='false']").click();
    await page.goto("/bookmarks");
    await expect(page.getByRole("heading", { name: "가거도" })).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("no search results have no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/explore?keyword=__no_results__");
    await expect(
      page.getByText("조건에 맞는 여행지가 없습니다."),
    ).toBeVisible();
    await expectNoSeriousAxeViolations(page);
  });

  test("key layouts do not overflow at supported viewport widths", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const viewports = [320, 375, 412, 768, 1280, 1440];
    const paths = [
      "/",
      "/explore",
      "/explore?region=11&imageOnly=1",
      "/explore?view=map",
      "/places/127480",
      "/bookmarks",
    ];

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `${path} overflows at ${width}px`,
        ).toBe(true);
      }
    }
  });

  test("touch targets meet a 44px hit area on a 320px detail and filter view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/explore?region=11&imageOnly=1");

    const imageFilter = page.getByRole("checkbox", {
      name: "대표 이미지가 있는 결과만",
    });
    const imageFilterLabel = page.locator("label").filter({ has: imageFilter });
    await expect(imageFilterLabel).toHaveJSProperty("offsetHeight", 44);

    const removeFilter = page.getByRole("link", {
      name: "대표 이미지 있음 조건 제거",
    });
    await expect(removeFilter).toHaveJSProperty("offsetHeight", 44);
    await expect(
      page.getByRole("link", { name: "전체 초기화" }),
    ).toHaveJSProperty("offsetHeight", 44);

    await page.goto("/places/127480");
    await expect(page.locator('a[href="/explore"]').first()).toHaveJSProperty(
      "offsetHeight",
      44,
    );
  });
});
