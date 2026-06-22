import { test } from "../../utils/fileImports/import";

test.describe("Popular Movies – Filters", () => {
  test.beforeEach("Go to Popular Movies", async ({ navigationPage }) => {
    await navigationPage.goToPopularMovies();
    await navigationPage.expectPageLoaded("Popular Movies");
  });

  test("TC-POP-01: Default Popular Movies load correctly @smoke @critical @popular @filters", async ({
    popularMoviesPage,
  }) => {
    await popularMoviesPage.expectPopularMovieCardContains("poster", "rating", "content");
    await popularMoviesPage.expectInfiniteScroll(3);
  });
  test("TC-POP-02: Sort order by Popularity Ascending actually affects data @high @popular @filters @sorting", async ({
    popularMoviesPage,
  }) => {
    await popularMoviesPage.sortMoviesBy("Popularity Ascending");
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-03: Sort order by Release Date actually affects data @high @popular @filters @sorting", async ({
    popularMoviesPage,
  }) => {
    await popularMoviesPage.sortMoviesBy("Release Date Descending");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.sortMoviesBy("Release Date Ascending");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectReleaseDatesOrderChanged();
  });
  test("TC-POP-04: OTT Platform filtering @high @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.applyOttPlatformFilter("Netflix");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.applyOttPlatformFilter("Netflix");
    await popularMoviesPage.applyOttPlatformFilter("Zee5");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.applyOttPlatformFilter("Zee5");
    await popularMoviesPage.applyOttPlatformFilter("JustWatchTV");
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-05: Show me filtering @medium @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.setShowMeFilter("Not Seen");
    await popularMoviesPage.setShowMeFilter("Seen");
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-06: Release date range filtering @high @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.releaseDateRangeFilter("1/1/2025", "1/1/2025");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectReleaseDatesWithinRange("1/1/2025", "1/1/2025");
  });
  test("TC-POP-07: Release date range filtering -- Failure Case @medium @popular @filters", async ({
    popularMoviesPage,
  }) => {
    await popularMoviesPage.releaseDateRangeFilter("6/23/2025", "7/23/2025");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectReleaseDatesWithinRange("6/23/2025", "7/23/2025");
  });
  test("TC-POP-08: Multiple genre filter @critical @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.setGenreFilter(["Action", "Adventure"]);
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectMoviesWithGenres(["Action", "Adventure"]);
  });
  test("TC-POP-09: Language filter @high @popular @filters @i18n", async ({ popularMoviesPage }) => {
    await popularMoviesPage.setLanguageFilter("French");
    await popularMoviesPage.expectMoviesOrderChanged();

    await popularMoviesPage.expectMoviesWithLanguages("French");
  });
  test("TC-POP-10: User score slider enforcement @high @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.moveSliderFor("User Score", 7, 8);
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectRatingsWithinRange(70, 80);
  });
  test("TC-POP-11: Minimum user votes filter @high @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.moveSliderFor("Minimum User Votes", 8);
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-12: Runtime filter @high @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.moveSliderFor("Runtime", 10, 10);
    await popularMoviesPage.expectMoviesOrderChanged();
  });
  test("TC-POP-13: keyword filter  @high @popular @filters", async ({ popularMoviesPage }) => {
    await popularMoviesPage.setKeywordFilter("Inception");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectMoviesWithKeyword("Inception");
  });
  test("TC-POP-14: Combined filters produce correct intersection @critical @popular @filters @regression", async ({
    popularMoviesPage,
  }) => {
    await popularMoviesPage.setGenreFilter(["Drama"]);
    await popularMoviesPage.moveSliderFor("User Score", 7, 8);
    await popularMoviesPage.moveSliderFor("Minimum User Votes", 8);
    await popularMoviesPage.setKeywordFilter("Angry");
    await popularMoviesPage.expectMoviesOrderChanged();
    await popularMoviesPage.expectRatingsWithinRange(70, 80);
    await popularMoviesPage.expectCombinedFilters(["Drama"], "Angry");
  });
});
