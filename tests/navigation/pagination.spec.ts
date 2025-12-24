import {
  test,
  Page,
  NavigationPage,
  GlobalSearchPage,
  SearchResultsPage,
  getAuthenticatedContext,
} from "../../utils/fileImports/import";

test.describe("Pagination and Language Switch", () => {
  let page: Page,
    navigationPage: NavigationPage,
    globalSearchPage: GlobalSearchPage,
    searchResultsPage: SearchResultsPage;

  test.beforeEach("Login", async () => {
    ({ page } = await getAuthenticatedContext());

    navigationPage = new NavigationPage(page);
    globalSearchPage = new GlobalSearchPage(page);
    searchResultsPage = new SearchResultsPage(page);
  });
  test.afterEach("CleanUp", async () => {
    await page.close();
  });

  test("TC-PAG-01:01 Pagination is working correctly @smoke @high @navigation @pagination", async () => {
    await globalSearchPage.search("global search", "Superman");
    await searchResultsPage.expectSearchPageLoaded();
    await navigationPage.navigateToPage("Next");
    await navigationPage.expectPageChanged(2);
    await navigationPage.navigateToPage("Previous");
    await navigationPage.expectPageChanged(1);
  });
});
