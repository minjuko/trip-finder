import { expect, test } from "./fixtures";

test.describe("Bookmark journey", () => {
  test.beforeEach(async ({ context }) => {
    // 변경: 테스트 간 localStorage를 분리하되 같은 탭의 새로고침은 유지
    await context.addInitScript(() => {
      const initializedKey = "trip-finder:e2e-storage-initialized";

      if (window.localStorage.getItem(initializedKey) === "true") {
        return;
      }

      window.localStorage.clear();
      window.localStorage.setItem(initializedKey, "true");
    });
  });

  test("상세 페이지에서 여행지를 저장하고 다시 제거한다", async ({ page }) => {
    // 변경: 실제 검증 완료된 TourAPI contentId 사용
    await page.goto("/places/127480");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "가거도",
      }),
    ).toBeVisible();

    const bookmarkButton = page.getByRole("button", {
      name: /저장/,
    });

    await expect(bookmarkButton).toHaveAttribute("aria-pressed", "false");

    await bookmarkButton.click();

    await expect(bookmarkButton).toHaveAttribute("aria-pressed", "true");

    // 변경: 페이지 이동 후에도 localStorage Bookmark가 유지되는지 검증
    await page
      .getByRole("link", {
        name: "관심 여행지",
      })
      .click();

    await expect(page).toHaveURL(/\/bookmarks$/);

    await expect(
      page.getByRole("heading", {
        name: "가거도",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "가거도 상세 정보 보기",
      }),
    ).toHaveAttribute("href", "/places/127480");

    await page
      .getByRole("button", {
        name: "가거도 저장 취소",
      })
      .click();

    await expect(page.getByText("관심 여행지가 없습니다.")).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "가거도",
      }),
    ).toHaveCount(0);
  });

  test("북마크 변경이 열린 두 탭 사이에서 동기화되고 새로고침 후에도 유지된다", async ({
    context,
    page,
  }) => {
    const pageA = page;
    const pageB = await context.newPage();

    await pageB.route("**/*", async (route) => {
      const url = new URL(route.request().url());

      if (url.origin !== "http://127.0.0.1:3000") {
        await route.abort();
        return;
      }

      if (url.pathname === "/_next/image") {
        await route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />',
        });
        return;
      }

      await route.continue();
    });

    await Promise.all([pageA.goto("/places/127480"), pageB.goto("/bookmarks")]);

    const bookmarkButtonA = pageA.getByRole("button", {
      name: /가거도 저장/,
    });

    await expect(bookmarkButtonA).toHaveAttribute("aria-pressed", "false");
    await expect(pageB.getByText("관심 여행지가 없습니다.")).toBeVisible();

    await bookmarkButtonA.click();

    await expect(bookmarkButtonA).toHaveAttribute("aria-pressed", "true");
    await expect(
      pageB.getByRole("heading", {
        name: "가거도",
      }),
    ).toBeVisible();

    await pageA.reload();

    await expect(bookmarkButtonA).toHaveAttribute("aria-pressed", "true");

    await pageB
      .getByRole("button", {
        name: "가거도 저장 취소",
      })
      .click();

    await expect(pageB.getByText("관심 여행지가 없습니다.")).toBeVisible();
    await expect(bookmarkButtonA).toHaveAttribute("aria-pressed", "false");

    await pageA.reload();

    await expect(bookmarkButtonA).toHaveAttribute("aria-pressed", "false");
  });
});
