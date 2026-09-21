import {
  expect,
  test,
} from "@playwright/test";

test.describe("Bookmark journey", () => {
  test.beforeEach(async ({
    context,
  }) => {
    // 변경: 테스트 간 localStorage 상태 격리
    await context.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test("상세 페이지에서 여행지를 저장하고 다시 제거한다", async ({
    page,
  }) => {
    // 변경: 실제 검증 완료된 TourAPI contentId 사용
    await page.goto("/places/127480");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "가거도",
      }),
    ).toBeVisible();

    const bookmarkButton =
      page.getByRole("button", {
        name: /저장/,
      });

    await expect(
      bookmarkButton,
    ).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await bookmarkButton.click();

    await expect(
      bookmarkButton,
    ).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    // 변경: 페이지 이동 후에도 localStorage Bookmark가 유지되는지 검증
    await page
      .getByRole("link", {
        name: "저장한 여행지",
      })
      .click();

    await expect(page).toHaveURL(
      /\/bookmarks$/,
    );

    await expect(
      page.getByRole("heading", {
        name: "가거도",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", {
        name: "가거도 상세정보 보기",
      }),
    ).toHaveAttribute(
      "href",
      "/places/127480",
    );

    await page
      .getByRole("button", {
        name: "가거도 저장 취소",
      })
      .click();

    await expect(
      page.getByText(
        "저장한 여행지가 없습니다.",
      ),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        name: "가거도",
      }),
    ).toHaveCount(0);
  });
});