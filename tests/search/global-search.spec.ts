import { test } from "../../utils/fileImports/import";

test.describe("Global Search – Main Page", () => {
  test("TC-SRCH-01: Search redirected to a dedicated results screen @smoke @critical @search", async ({
    globalSearchPage,
    searchResultsPage,
  }) => {
    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchPageLoaded();
  });
  test("TC-SRCH-02: Search returns correct results for exact title from the global search @critical @search", async ({
    globalSearchPage,
    searchResultsPage,
  }) => {
    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchResultCardContains("poster", "title", "release_date", "overview");
    await searchResultsPage.expectSearchTitleContains("Inception");
  });
  test("TC-SRCH-03: Search returns correct results for exact title from the home page search @high @search", async ({
    globalSearchPage,
    searchResultsPage,
  }) => {
    await globalSearchPage.search("home page search", "Inception");
    await searchResultsPage.expectSearchResultCardContains("poster", "title", "release_date", "overview");
    await searchResultsPage.expectSearchTitleContains("Inception");
  });

  test("TC-SRCH-04: Partial and case-insensitive search @high @search", async ({
    globalSearchPage,
    searchResultsPage,
  }) => {
    await globalSearchPage.search("global search", "incep");
    await searchResultsPage.expectSearchTitleContains("Inception");
  });

  test("TC-SRCH-05: Search with special characters @medium @search", async ({
    globalSearchPage,
    searchResultsPage,
  }) => {
    await globalSearchPage.search("global search", "Inception!!!");
    await searchResultsPage.expectSearchTitleContains("Inception");
  });

  test("TC-SRCH-06: No-result query handling @high @search", async ({ globalSearchPage, searchResultsPage }) => {
    await globalSearchPage.search("global search", "zzzz_non_existing_movie");
    await searchResultsPage.expectNoResultsState();
  });
});
