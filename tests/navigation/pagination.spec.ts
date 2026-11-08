import { test } from "../../utils/fixtures/base.fixtures";

test.describe("Pagination", () => {
  test("TC-PAG-01:01 Pagination is working correctly @smoke @high @navigation @pagination", async ({
    globalSearchPage,
    searchResultsPage,
    navigationPage,
  }) => {
    await globalSearchPage.search("global search", "Superman");
    await searchResultsPage.expectSearchPageLoaded();
    await navigationPage.navigateToPage("Next");
    await navigationPage.expectPageChanged(2);
    await navigationPage.navigateToPage("Previous");
    await navigationPage.expectPageChanged(1);
  });
});
