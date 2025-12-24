import { test, GlobalSearchPage, SearchResultsPage, getAuthenticatedContext } from "../../utils/fileImports/import";

test.describe("Global Search – Main Page", () => {
  let searchResultsPage: SearchResultsPage, globalSearchPage: GlobalSearchPage;

  test("TC-RES-01: Search redirected to a dedicated results screen on firefox @firefox", async () => {
    const { page: firefoxPage } = await getAuthenticatedContext({ browserType: "firefox" });
    globalSearchPage = new GlobalSearchPage(firefoxPage);
    searchResultsPage = new SearchResultsPage(firefoxPage);
    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchPageLoaded();
    await firefoxPage.close();
  });
  test("TC-RES-02: Search redirected to a dedicated results screen on edge @msedge", async () => {
    const { page: msEdgePage } = await getAuthenticatedContext({ browserType: "msedge" });
    globalSearchPage = new GlobalSearchPage(msEdgePage);
    searchResultsPage = new SearchResultsPage(msEdgePage);
    await globalSearchPage.search("global search", "Inception");
    await searchResultsPage.expectSearchPageLoaded();
    await msEdgePage.close();
  });
});
