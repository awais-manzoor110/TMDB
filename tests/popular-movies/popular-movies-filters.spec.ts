import { test, Page, NavigationPage, PopularMoviesPage, getAuthenticatedContext } from "../../utils/fileImports/import";

test.describe("Popular Movies – Filters", () => {
  let page: Page, navigationPage: NavigationPage, popularMoviesPage: PopularMoviesPage;

  test.beforeEach("Login", async () => {
    ({ page } = await getAuthenticatedContext());

    navigationPage = new NavigationPage(page);
    popularMoviesPage = new PopularMoviesPage(page);

    await navigationPage.goToPopularMovies();
    await navigationPage.expectPageLoaded("Popular Movies");
  });
  test.afterEach("CleanUp", async () => {
    await page.close();
  });

  test("TC-POP-01: Default Popular Movies load correctly @smoke @critical @popular @filters", async () => {
    await popularMoviesPage.expectPopularMovieCardContains("poster", "rating", "content");
    await popularMoviesPage.expectInfiniteScroll(3);
  });
  test("TC-POP-02: Sort order by Popularity Ascending actually affects data @high @popular @filters @sorting", async () => {
    await popularMoviesPage.sortMoviesBy("Popularity Ascending");
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-03: Sort order by Release Date actually affects data @high @popular @filters @sorting", async () => {
    await popularMoviesPage.sortMoviesBy("Release Date Descending");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.sortMoviesBy("Release Date Ascending");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectReleaseDatesOrderChanged();
  });
  test("TC-POP-04: OTT Platform filtering @high @popular @filters", async () => {
    await popularMoviesPage.applyOttPlatformFilter("Netflix");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.applyOttPlatformFilter("Netflix");
    await popularMoviesPage.applyOttPlatformFilter("Zee5");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.applyOttPlatformFilter("Zee5");
    await popularMoviesPage.applyOttPlatformFilter("JustWatchTV");
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-05: Show me filtering @medium @popular @filters", async () => {
    await popularMoviesPage.setShowMeFilter("Not Seen");
    await popularMoviesPage.setShowMeFilter("Seen");
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-06: Release date range filtering @high @popular @filters", async () => {
    await popularMoviesPage.releaseDateRangeFilter("1/1/2025", "1/1/2025");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectReleaseDatesWithinRange("1/1/2025", "1/1/2025");
  });
  test("TC-POP-07: Release date range filtering -- Failure Case @medium @popular @filters", async () => {
    await popularMoviesPage.releaseDateRangeFilter("6/23/2025", "7/23/2025");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectReleaseDatesWithinRange("6/23/2025", "7/23/2025");
  });
  test("TC-POP-08: Multiple genre filter @critical @popular @filters", async () => {
    await popularMoviesPage.setGenreFilter(["Action", "Adventure"]);
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectMoviesWithGenres(["Action", "Adventure"]);
  });
  test("TC-POP-09: Language filter @high @popular @filters @i18n", async () => {
    await popularMoviesPage.setLanguageFilter("French");
    await popularMoviesPage.expectMoviesOrderChanged();

    await popularMoviesPage.expectMoviesWithLanguages("French");
  });
  test("TC-POP-10: User score slider enforcement @high @popular @filters", async () => {
    await popularMoviesPage.moveSliderFor("User Score", 7, 8);
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectRatingsWithinRange(70, 80);
  });
  test("TC-POP-11: Minimum user votes filter @high @popular @filters", async () => {
    await popularMoviesPage.moveSliderFor("Minimum User Votes", 8);
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-12: Runtime filter @high @popular @filters", async () => {
    await popularMoviesPage.moveSliderFor("Runtime", 10, 10);
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-13: keyword filter  @high @popular @filters", async () => {
    await popularMoviesPage.setKeywordFilter("Inception");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectMoviesWithKeyword("Inception");
  });
  test("TC-POP-14: Combined filters produce correct intersection @critical @popular @filters @regression", async () => {
    await popularMoviesPage.setGenreFilter(["Drama"]);
    await popularMoviesPage.moveSliderFor("User Score", 7, 8);
    await popularMoviesPage.moveSliderFor("Minimum User Votes", 8);
    await popularMoviesPage.setKeywordFilter("Angry");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectRatingsWithinRange(70, 80);
    await popularMoviesPage.expectCombinedFilters(["Drama"], "Angry");
  });
});
