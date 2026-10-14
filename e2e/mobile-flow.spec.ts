import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

test.describe("Responsive layout", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} viewport does not overflow horizontally`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    });
  }
});

test.describe("Mobile keyboard and bookmark journey", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => window.localStorage.clear());
  });

  test("preserves search state through detail navigation and supports the image dialog keyboard flow", async ({
    page,
  }) => {
    await page.goto("/");

    const search = page.getByRole("searchbox", { name: "여행지 검색" });
    await search.fill("해수욕장");
    await search.press("Enter");

    await expect(page).toHaveURL(/\/explore\?keyword=/);
    await expect(page.getByRole("heading", { name: "검색 결과" })).toBeVisible({
      timeout: 15_000,
    });

    const firstDetailLink = page.locator('a[href^="/places/"]').first();
    const detailHref = await firstDetailLink.getAttribute("href");
    expect(detailHref).toBeTruthy();
    await firstDetailLink.getByRole("heading").click();
    await expect(page).toHaveURL(new RegExp(`${detailHref}$`));

    const bookmarkButton = page.locator("button[aria-pressed]").first();
    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveAttribute("aria-pressed", "true");
    await bookmarkButton.click();
    await expect(bookmarkButton).toHaveAttribute("aria-pressed", "false");

    const imageTrigger = page.getByRole("button", {
      name: /대표 이미지 크게 보기$/,
    });
    await imageTrigger.focus();
    await imageTrigger.press("Enter");

    const closeButton = page.getByRole("button", { name: "이미지 닫기" });
    await expect(closeButton).toBeFocused();
    await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    await closeButton.press("Escape");
    await expect(imageTrigger).toBeFocused();

    await page.goBack();
    await expect(page).toHaveURL(/\/explore\?keyword=/);
    await expect(
      page.getByRole("searchbox", { name: "여행지 검색" }),
    ).toHaveValue("해수욕장");
  });
});
