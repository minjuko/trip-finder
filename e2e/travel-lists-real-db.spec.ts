import { expect, test } from "@playwright/test";

const userBStorageState = process.env.TF03G_USER_B_STORAGE_STATE;
if (!userBStorageState) {
  throw new Error("Use the CI-only browser integration runner.");
}

test.use({ viewport: { width: 390, height: 844 } });

test("real session, API, and PostgreSQL travel-list journey", async ({
  browser,
  page,
}) => {
  await page.goto("/travel-lists");
  await expect(page.locator("#new-list-name")).toBeVisible();

  await page.locator("#new-list-name").fill("TF-03g browser trip");
  await page.locator('form button[type="submit"]').click();
  const listLink = page.getByRole("link", { name: "TF-03g browser trip" });
  await expect(listLink).toBeVisible();
  const listUrl = await listLink.getAttribute("href");
  expect(listUrl).toMatch(/^\/travel-lists\/[0-9a-f-]{36}$/i);

  const listCard = page.locator("li").filter({ has: listLink });
  await listCard.getByRole("button").first().click();
  await page.locator("#edit-list-name").fill("TF-03g renamed trip");
  await page.locator('[role="dialog"] form button').last().click();
  const renamedListLink = page.getByRole("link", {
    name: "TF-03g renamed trip",
  });
  await expect(renamedListLink).toBeVisible();

  await page.goto("/places/127480");
  const bookmarkButton = page.locator("button[aria-pressed]").first();
  await bookmarkButton.click();
  await expect(bookmarkButton).toHaveAttribute("aria-pressed", "true");

  await page
    .getByRole("button")
    .filter({ hasText: /여행 목록에 추가/ })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .locator("#travel-list-choice")
    .selectOption({ label: "TF-03g renamed trip" });
  await page.getByRole("dialog").getByRole("button").last().click();
  await expect(page.getByRole("status").last()).toContainText(
    "TF-03g renamed trip",
  );

  await page.goto(listUrl!);
  await expect(page.getByText(/저장된 장소 1개/)).toBeVisible();
  const savedPlaceLink = page.locator('a[href="/places/127480"]').last();
  await expect(savedPlaceLink).toBeVisible();

  const contextB = await browser.newContext({
    storageState: userBStorageState,
  });
  try {
    const response = await contextB.request.get(
      `http://127.0.0.1:3000/api/travel-lists/${listUrl!.split("/").at(-1)}`,
    );
    expect(response.status()).toBe(404);

    const pageB = await contextB.newPage();
    await pageB.goto(listUrl!);
    await expect(
      pageB.getByText(
        "목록을 찾을 수 없습니다. 목록 화면에서 다시 확인해 주세요.",
      ),
    ).toBeVisible();
    await expect(pageB.getByText("TF-03g renamed trip")).toHaveCount(0);
  } finally {
    await contextB.close();
  }

  await page.goto("/places/127480");
  await expect(page.locator("button[aria-pressed]").first()).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/bookmarks");
  await expect(page.locator('a[href="/places/127480"]')).toBeVisible();

  await page.goto(listUrl!);
  const removeButton = page.getByRole("button").filter({ hasText: /^제거$/ });
  await removeButton.click();
  const removeDialog = page.getByRole("alertdialog");
  await expect(removeDialog).toBeVisible();
  await removeDialog.getByRole("button").first().click();
  await expect(removeButton).toBeFocused();
  await removeButton.click();
  await page.getByRole("alertdialog").getByRole("button").last().click();
  await expect(page.getByText(/저장된 장소 0개/)).toBeVisible();

  await page.goto("/travel-lists");
  const deleteButton = page.getByRole("button").filter({ hasText: /^삭제$/ });
  await deleteButton.click();
  const deleteDialog = page.getByRole("dialog");
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button").first().click();
  await expect(deleteButton).toBeFocused();
  await deleteButton.click();
  await page.getByRole("dialog").getByRole("button").last().click();
  await expect(
    page.getByRole("link", { name: "TF-03g renamed trip" }),
  ).toHaveCount(0);

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
