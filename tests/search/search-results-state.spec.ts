import {
  test,
  Page,
  GlobalSearchPage,
  SearchResultsPage,
  getAuthenticatedContext,
} from "../../utils/fileImports/import";

test.describe("Search Results – Navigation & State", () => {
  let page: Page, searchResultsPage: SearchResultsPage, globalSearchPage: GlobalSearchPage;

  test.beforeEach("Login", async () => {
    ({ page } = await getAuthenticatedContext());
    globalSearchPage = new GlobalSearchPage(page);
    searchResultsPage = new SearchResultsPage(page);

    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchTitleContains("Inception");
  });
  test.afterEach("CleanUp", async () => {
    await page.close();
  });
  test("TC-SRCH-05 – Search persistence across categories @high @search @regression", async () => {
    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchTitleContains("Inception");
    await searchResultsPage.switchCategory("movie");
    await searchResultsPage.expectCategorySwitchHaveResults("movie", "inception");
    await searchResultsPage.switchCategory("tv");
    await searchResultsPage.expectCategorySwitchHaveResults("tv", "inception");
    await searchResultsPage.switchCategory("person");
    await searchResultsPage.expectCategorySwitchHaveResults("person", "inception");
    await searchResultsPage.switchCategory("company");
    await searchResultsPage.expectCategorySwitchHaveResults("company", "inception");
    await searchResultsPage.switchCategory("keyword");
    await searchResultsPage.expectCategorySwitchHaveResults("keyword", "inception");
    await searchResultsPage.switchCategory("collection");
    await searchResultsPage.expectCategorySwitchHaveResults("collection", "inception");
    await searchResultsPage.switchCategory("network");
    await searchResultsPage.expectCategorySwitchHaveResults("network", "inception");
    await searchResultsPage.switchCategory("award");
    await searchResultsPage.expectCategorySwitchHaveResults("award", "inception");
  });
  test("TC-SRCH-06: – Result card → details page integrity @critical @search @regression", async () => {
    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchTitleContains("Inception");
    await searchResultsPage.clickMovie("Inception");
    await searchResultsPage.expectMovieDetailsIntegrity();
  });
  test("TC-SRCH-07: – Result card → details page integrity -- Failure Case @medium @search @regression", async () => {
    await globalSearchPage.search("global search", "Sisu");
    await searchResultsPage.expectSearchTitleContains("Sisu");
    await searchResultsPage.clickMovie("Sisu");
    await searchResultsPage.expectMovieDetailsIntegrity();
  });
  test("TC-SRCH-08 – Back navigation preserves results state @high @search @regression", async () => {
    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchTitleContains("Inception");
    await searchResultsPage.clickMovie("Inception");
    await searchResultsPage.page.goBack();
    await searchResultsPage.expectSearchTitleContains("Inception");
    await searchResultsPage.expectSearchPageLoaded();
  });
});
