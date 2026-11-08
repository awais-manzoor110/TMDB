import { test } from "../../utils/fixtures/base.fixtures";
import { GlobalSearchPage } from "../../pages/globalSearchPage";
import { SearchResultsPage } from "../../pages/searchResultsPage";
import { getAuthenticatedContext } from "../../utils/login-utils/authenticatedContext";

test.describe("Cross Browser Compatibility", () => {
  for (const [id, browserType, label] of [
    ["TC-RES-01", "firefox", "firefox"],
    ["TC-RES-02", "msedge", "edge"],
  ] as const) {
    test(`${id}: Search redirected to a dedicated results screen on ${label} @${browserType}`, async () => {
      const { page } = await getAuthenticatedContext({ browserType });
      await new GlobalSearchPage(page).search("global search", "Inception");
      await new SearchResultsPage(page).expectSearchPageLoaded();
      await page.close();
    });
  }
});
