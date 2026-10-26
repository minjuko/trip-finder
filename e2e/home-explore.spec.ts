import { expect, test } from "./fixtures";

test.describe("Home → Explore", () => {
  test("키워드로 관광 콘텐츠를 탐색한다", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /다음 여행지를/,
      }),
    ).toBeVisible();

    const search = page.getByRole("searchbox", {
      name: "여행지 검색",
    });

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
      // URL is committed with the loading UI before the Server Component's
      // TourAPI request finishes. Match the API client's 10-second budget
      // without increasing timeouts for the rest of the suite.
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "검색 결과",
      }),
    ).toBeVisible();

    // 변경: 실제 TourAPI 결과가 카드까지 렌더링되는지 확인
    const detailLinks = page.locator('a[href^="/places/"]');

    await expect(detailLinks.first()).toBeVisible();

    expect(await detailLinks.count()).toBeGreaterThan(0);
  });

  test("지역 진입점이 Explore 필터 상태로 연결된다", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("link", {
        name: "서울특별시",
      })
      .click();

    await expect(page).toHaveURL(/\/explore\?region=11$/);

    await expect(page.locator("#explore-region")).toHaveValue("11");

    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "검색 결과",
      }),
    ).toBeVisible();
  });

  test("검색 결과 보기 방식과 정렬 상태를 URL로 유지한다", async ({ page }) => {
    await page.goto("/explore?region=11&view=list&sort=title");

    await expect(
      page.getByRole("button", { name: "목록형으로 보기" }),
    ).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByLabel("정렬 기준")).toHaveValue("title");

    await page.getByRole("button", { name: "지도로 보기" }).click();

    await expect(page).toHaveURL(/\/explore\?region=11&view=map&sort=title/);
    await expect(
      page.getByRole("region", { name: "검색 결과 지도" }),
    ).toBeVisible();
  });

  test("정렬 URL 복원, 이미지 필터, 페이지 경계와 뒤로 가기를 유지한다", async ({
    page,
  }) => {
    await page.goto(
      "/explore?region=12&district=870&category1=NA&category2=NA02&category3=NA020500&keyword=Tour&view=list&sort=created&page=2",
    );

    await expect(page.getByLabel("정렬 기준")).toHaveValue("created");
    await expect(page.getByText("2페이지", { exact: true })).toBeVisible();

    await page.getByLabel("정렬 기준").selectOption("modified");
    await expect(page).toHaveURL(/sort=modified/);
    await expect(page).not.toHaveURL(/page=/);
    await expect(page).toHaveURL(/region=12/);
    await expect(page).toHaveURL(/district=870/);
    await expect(page).toHaveURL(/category1=NA/);
    await expect(page).toHaveURL(/keyword=Tour/);
    await expect(page).toHaveURL(/view=list/);
    await expect(page.getByText("1페이지", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("정렬 기준")).toHaveValue("modified");
    await expect(page.getByText("1페이지", { exact: true })).toBeVisible();

    await page
      .getByRole("checkbox", { name: "대표 이미지가 있는 결과만" })
      .check();

    await expect(page).toHaveURL(/imageOnly=1/);
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByText("1페이지", { exact: true })).toBeVisible();
    const firstPagePlaceHrefs = await page
      .locator('a[href^="/places/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(firstPagePlaceHrefs).toHaveLength(12);
    await expect(page.getByRole("link", { name: "다음" })).toHaveAttribute(
      "href",
      /imageOnly=1.*page=2/,
    );

    await page.getByRole("link", { name: "다음" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("2페이지", { exact: true })).toBeVisible();
    const secondPagePlaceHrefs = await page
      .locator('a[href^="/places/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(secondPagePlaceHrefs).toHaveLength(7);
    expect(
      firstPagePlaceHrefs.filter((href) => secondPagePlaceHrefs.includes(href)),
    ).toHaveLength(0);

    await page.goBack();
    await expect(page).not.toHaveURL(/page=/);
    await expect(page.getByText("1페이지", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("checkbox", { name: "대표 이미지가 있는 결과만" }),
    ).toBeChecked();

    await page.goBack();
    await expect(page).toHaveURL(/sort=modified/);
    await expect(page).not.toHaveURL(/page=/);
    await expect(
      page.getByRole("checkbox", { name: "대표 이미지가 있는 결과만" }),
    ).not.toBeChecked();

    await page.goBack();
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(/sort=created/);
    await expect(page.getByLabel("정렬 기준")).toHaveValue("created");
  });
});
