import { expect, test as base } from "@playwright/test";

const LOCAL_ORIGIN = "http://127.0.0.1:3000";
const IMAGE_PLACEHOLDER =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />';

export const test = base.extend({
  page: async ({ page }, providePage) => {
    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());

      if (url.origin !== LOCAL_ORIGIN) {
        await route.abort();
        return;
      }

      if (url.pathname === "/_next/image") {
        await route.fulfill({
          status: 200,
          contentType: "image/svg+xml",
          body: IMAGE_PLACEHOLDER,
        });
        return;
      }

      await route.continue();
    });

    await providePage(page);
  },
});

export { expect };
