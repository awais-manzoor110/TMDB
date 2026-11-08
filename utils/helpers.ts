import { expect, Locator, Page } from "@playwright/test";

export const TIMEOUT_MS = 25_000;

/** Clicks a discover-page Search button, retrying until `endpoint` answers 200, then waits for the page to settle. */
export async function clickSearchAndWait(page: Page, button: Locator, endpoint: string) {
  await expect(async () => {
    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes(endpoint) && resp.status() === 200, { timeout: 10_000 }),
      button.click({ timeout: 5000 }),
    ]);
  }).toPass({ timeout: TIMEOUT_MS });
  await page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
}
