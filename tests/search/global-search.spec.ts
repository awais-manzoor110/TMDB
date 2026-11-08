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
    await searchResultsPage.expectSearchResultCardContains();
    await searchResultsPage.expectSearchTitleContains("Inception");
  });
  test.fixme(
    "TC-SRCH-03: Search returns correct results for exact title from the home page search @high @search",
    {
      annotation: {
        type: "bug",
        description:
          "TMDB app issue: the home page hero search box (#inner_search_v4) is gone after the redesign; only the header search remains. Re-enable once TMDB restores it.",
      },
    },
    async ({ globalSearchPage, searchResultsPage }) => {
      await globalSearchPage.search("home page search", "Inception");
      await searchResultsPage.expectSearchResultCardContains();
      await searchResultsPage.expectSearchTitleContains("Inception");
    },
  );

  test.fixme(
    "TC-SRCH-04: Partial and case-insensitive search @high @search",
    {
      annotation: {
        type: "bug",
        description:
          'TMDB app bug: partial query "incep" ranks "Incel" first and Inception is not the top result. Re-enable once TMDB fixes partial-match ranking.',
      },
    },
    async ({ globalSearchPage, searchResultsPage }) => {
      await globalSearchPage.search("global search", "incep");
      await searchResultsPage.expectSearchTitleContains("Inception");
    },
  );

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
