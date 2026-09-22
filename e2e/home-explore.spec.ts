import {
  expect,
  test,
} from "@playwright/test";

test.describe("Home → Explore", () => {
  test("키워드로 관광 콘텐츠를 탐색한다", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /국내 여행지를/,
      }),
    ).toBeVisible();

    const search = page.getByRole(
      "searchbox",
      {
        name: "여행지 검색",
      },
    );

    await search.fill("해수욕장");

    await page
      .getByRole("button", {
        name: "검색",
      })
      .click();

    // 변경: Home 입력이 URL Search Params 상태로 연결되는지 검증
    await expect(page).toHaveURL(
      /\/explore\?keyword=%ED%95%B4%EC%88%98%EC%9A%95%EC%9E%A5/,
    );

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "여행지 탐색",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "검색 결과",
      }),
    ).toBeVisible();

    // 변경: 실제 TourAPI 결과가 카드까지 렌더링되는지 확인
    const detailLinks = page.locator(
      'a[href^="/places/"]',
    );

    await expect(
      detailLinks.first(),
    ).toBeVisible();

    expect(
      await detailLinks.count(),
    ).toBeGreaterThan(0);
  });

  test("지역 진입점이 Explore 필터 상태로 연결된다", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .getByRole("link", {
        name: "서울특별시",
      })
      .click();

    await expect(page).toHaveURL(
      /\/explore\?region=11$/,
    );

    await expect(
      page.locator("#explore-region"),
    ).toHaveValue("11");

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "검색 결과",
      }),
    ).toBeVisible();
  });

  test("검색 결과 보기 방식과 정렬 상태를 URL로 유지한다", async ({
    page,
  }) => {
    await page.goto("/explore?region=11&view=list&sort=title");

    await expect(
      page.getByRole("button", { name: "목록형으로 보기" }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByText("가나다순", { exact: true })).toBeVisible();

    await page
      .getByRole("button", { name: "지도로 보기" })
      .click();

    await expect(page).toHaveURL(
      /\/explore\?region=11&view=map&sort=title/,
    );
    await expect(
      page.getByRole("region", { name: "검색 결과 지도" }),
    ).toBeVisible();
  });
});
