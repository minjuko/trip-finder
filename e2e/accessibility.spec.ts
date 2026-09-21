import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
} from "@playwright/test";

test.describe("Accessibility", () => {
  test("홈 페이지에 자동 탐지 가능한 심각한 접근성 위반이 없다", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /국내 여행지를/,
      }),
    ).toBeVisible();

    const results =
      await new AxeBuilder({
        page,
      }).analyze();

    // 변경: 포트폴리오 품질 게이트로 serious/critical 위반 차단
    const seriousViolations =
      results.violations.filter(
        (violation) =>
          violation.impact ===
            "serious" ||
          violation.impact ===
            "critical",
      );

    expect(
      seriousViolations,
    ).toEqual([]);
  });

  test("여행지 탐색 페이지에 자동 탐지 가능한 심각한 접근성 위반이 없다", async ({
    page,
  }) => {
    await page.goto(
      "/explore?region=11",
    );

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "여행지 탐색",
      }),
    ).toBeVisible();

    const results =
      await new AxeBuilder({
        page,
      }).analyze();

    // 변경: 동적 필터와 검색 결과까지 포함한 실제 렌더링 결과 검사
    const seriousViolations =
      results.violations.filter(
        (violation) =>
          violation.impact ===
            "serious" ||
          violation.impact ===
            "critical",
      );

    expect(
      seriousViolations,
    ).toEqual([]);
  });

  test("상세 페이지에 자동 탐지 가능한 심각한 접근성 위반이 없다", async ({
    page,
  }) => {
    await page.goto(
      "/places/127480",
    );

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "가거도",
      }),
    ).toBeVisible();

    const results =
      await new AxeBuilder({
        page,
      }).analyze();

    // 변경: 상세 이미지, 링크, Bookmark interaction 영역 포함 검사
    const seriousViolations =
      results.violations.filter(
        (violation) =>
          violation.impact ===
            "serious" ||
          violation.impact ===
            "critical",
      );

    expect(
      seriousViolations,
    ).toEqual([]);
  });

  test("저장한 여행지 페이지에 자동 탐지 가능한 심각한 접근성 위반이 없다", async ({
    page,
  }) => {
    await page.goto("/bookmarks");

    await expect(
      page.getByText(
        "저장한 여행지가 없습니다.",
      ),
    ).toBeVisible();

    const results =
      await new AxeBuilder({
        page,
      }).analyze();

    // 변경: Bookmark empty state 접근성 검사
    const seriousViolations =
      results.violations.filter(
        (violation) =>
          violation.impact ===
            "serious" ||
          violation.impact ===
            "critical",
      );

    expect(
      seriousViolations,
    ).toEqual([]);
  });
});