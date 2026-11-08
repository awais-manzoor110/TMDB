import { expect, Page } from "@playwright/test";
import { clickSearchAndWait, TIMEOUT_MS } from "../utils/helpers";

export class PopularMoviesPage {
  beforeSortMovieNames: string[] = [];
  afterSortMovieNames: string[] = [];
  beforeSortReleaseDates: string[] = [];
  afterSortReleaseDates: string[] = [];
  selectedLanguage = "";
  constructor(readonly page: Page) {}

  async clickSearchButton() {
    await clickSearchAndWait(
      this.page,
      this.page.locator(".apply.small").getByRole("link", { name: "Search" }),
      "/discover/movie",
    );
  }

  get movieCards() {
    return this.page.locator("#media_results [data-object-id]:has(h2)");
  }

  async openFirstMovie() {
    await this.movieCards.first().locator("a").first().click();
  }

  async expectPopularMovieCardContains() {
    const card = this.movieCards.first();
    for (const part of [".poster", "h2", ".release_date"]) {
      await expect(card.locator(part)).toBeVisible({ timeout: TIMEOUT_MS });
    }
  }

  async expectInfiniteScroll(times: number = 3) {
    await this.page.mouse.wheel(0, 10000);
    await this.page.getByRole("link", { name: "Load More" }).click();

    let callCount = 0;
    this.page.on("response", (response) => {
      if (response.url().includes("/discover/movie/items") && response.status() === 200) {
        callCount++;
      }
    });
    for (let i = 0; i < times; i++) {
      await this.page.mouse.wheel(0, 10000);
      await this.page.waitForResponse((resp) => resp.url().includes("/discover/movie/items") && resp.status() === 200);
    }
    expect(callCount).toEqual(times);
  }

  async getMovieNames() {
    return (await this.movieCards.locator("h2").allTextContents()).slice(0, 5).map((name) => name.trim());
  }

  async getReleaseDates() {
    return (await this.movieCards.locator(".release_date").allTextContents()).slice(0, 5).map((date) => date.trim());
  }

  async sortMoviesBy(filterName: string) {
    this.beforeSortMovieNames = await this.getMovieNames();
    this.beforeSortReleaseDates = await this.getReleaseDates();

    const sortMainMenu = this.page.getByRole("heading", { name: "Sort", exact: true });
    const sortCombo = this.page.locator(".filter_panel").filter({ has: sortMainMenu }).locator('[role="combobox"]');

    // Only click sortMainMenu if combobox is not visible
    if (!(await sortCombo.isVisible())) {
      await sortMainMenu.click();
      await expect(sortCombo).toBeVisible();
    }
    await sortCombo.click();
    await this.page.locator("li.k-list-item:visible").filter({ hasText: filterName }).click();
    await this.clickSearchButton();
    this.afterSortReleaseDates = await this.getReleaseDates();
  }

  async expectMoviesOrderChanged() {
    await expect(async () => {
      this.afterSortMovieNames = await this.getMovieNames();
      expect(this.beforeSortMovieNames).not.toEqual(this.afterSortMovieNames);
    }).toPass({ timeout: TIMEOUT_MS });
  }

  async expectReleaseDatesOrderChanged() {
    const parseDate = (dateStr: string) => new Date(dateStr);
    const descDates = this.beforeSortReleaseDates.map(parseDate);
    const ascDates = this.afterSortReleaseDates.map(parseDate);

    const minLength = Math.min(descDates.length, ascDates.length);
    for (let i = 0; i < minLength; i++) {
      expect(descDates[i].getTime()).toBeGreaterThanOrEqual(ascDates[i].getTime());
    }
  }

  async applyOttPlatformFilter(filterName: string) {
    this.beforeSortMovieNames = await this.getMovieNames();
    const menu = this.page.getByRole("heading", { name: "Where To Watch" });
    const service = this.page.locator("#my_services");

    // Only click menu if service is not visible
    if (!(await service.isVisible())) {
      await menu.click();
      await expect(service).toBeVisible();
    }
    await this.page.locator(`[alt="${filterName}"]`).click();
    await this.clickSearchButton();
  }

  async setShowMeFilter(filterName: string) {
    this.beforeSortMovieNames = await this.getMovieNames();
    if (filterName === "Not Seen") {
      await this.page.locator("#show_me_not_seen").click();
    } else if (filterName === "Seen") {
      await this.page.locator("#show_me_seen").click();
    }
    await this.clickSearchButton();
  }

  async releaseDateRangeFilter(fromDate: string, toDate: string) {
    this.beforeSortMovieNames = await this.getMovieNames();
    const fromInput = this.page.locator("#release_date_gte");
    const toInput = this.page.locator("#release_date_lte");
    await fromInput.fill(fromDate);
    await fromInput.locator("..").locator('[aria-label="select"]').dblclick();
    await toInput.fill(toDate);
    await toInput.locator("..").locator('[aria-label="select"]').dblclick();
    await this.clickSearchButton();
    this.afterSortReleaseDates = await this.getReleaseDates();
  }

  async expectReleaseDatesWithinRange(fromDate: string, toDate: string) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const releaseDates = this.afterSortReleaseDates;

    releaseDates.forEach((date, index) => {
      const releaseDate = new Date(date);

      expect(
        releaseDate.getTime(),
        `Movie at index ${index + 1}rd has release date ${releaseDate.toLocaleDateString()}
      Expected range: ${from.toLocaleDateString()} → ${to.toLocaleDateString()}`,
      ).toBeGreaterThanOrEqual(from.getTime());

      expect(
        releaseDate.getTime(),
        `Movie at ${index + 1}rd card has release date ${releaseDate.toLocaleDateString()}
      Expected range: ${from.toLocaleDateString()} → ${to.toLocaleDateString()}`,
      ).toBeLessThanOrEqual(to.getTime());
    });
  }

  async setGenreFilter(genres: string[]) {
    this.beforeSortMovieNames = await this.getMovieNames();
    const genreMenu = this.page.locator("#with_genres");
    await genreMenu.click();
    for (const genre of genres) {
      await genreMenu.getByRole("link", { name: genre }).click();
    }
    await this.clickSearchButton();
  }

  async openFirstMovieDetails() {
    await this.openFirstMovie();
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
  }

  async expectDetailsGenres(genres: string[]) {
    const selectedGenres = (await this.page.locator(".genres>a").allTextContents()).map((g) => g.trim());
    for (const genre of genres) {
      expect(
        selectedGenres,
        `Expected genre "${genre}" not found. Actual genres: ${selectedGenres.join(", ")}`,
      ).toContain(genre);
    }
  }

  async expectDetailsKeyword(keyword: string) {
    const movieKeywords = (await this.page.locator(".keywords a").allTextContents()).map((k) => k.trim());
    expect(movieKeywords).toContain(keyword.toLowerCase());
  }

  async expectMoviesWithGenres(genres: string[]) {
    await this.openFirstMovieDetails();
    await this.expectDetailsGenres(genres);
  }

  async setLanguageFilter(language: string) {
    this.beforeSortMovieNames = await this.getMovieNames();
    const languageMenu = this.page.locator("span").filter({ hasText: "None Selected" }).first();
    await languageMenu.click();
    const selectedLanguage = this.page.locator("#language_listbox").locator(`text=${language}`);
    this.selectedLanguage = (await selectedLanguage.textContent())!.replace(/\s*\(.*\)/, "").trim();
    await selectedLanguage.click();

    await this.clickSearchButton();
  }

  async expectMoviesWithLanguages(language: string) {
    await this.openFirstMovieDetails();
    const originalLanguage = (await this.page.locator("p", { hasText: "Original Language" }).textContent())!
      .replace(/^Original Language/, "")
      .trim();
    expect(originalLanguage, `Expected language "${language}" not found on movie details page.`).toContain(
      this.selectedLanguage,
    );
  }
  async moveSliderFor(
    sliderType: "User Score" | "Minimum User Votes" | "Runtime",
    minValue: number,
    maxValue: number = 2,
  ) {
    const sliderSection = this.page.getByText(sliderType, { exact: true }).locator("..");
    const sliders = sliderSection.getByRole("slider");
    const minSlider = sliders.first();
    const maxSlider = sliders.nth(1);

    await minSlider.focus();
    await maxSlider.focus();

    for (let i = 0; i < minValue; i++) {
      await minSlider.press("ArrowRight");
    }

    if (sliderType === "Minimum User Votes") {
      const stepValue = 50;
      const userVoteValue = minValue * stepValue;
      await expect(minSlider).toHaveAttribute("aria-valuenow", String(userVoteValue));
    } else if (sliderType === "Runtime") {
      const stepValue = 15;
      const runtimeMaxValue = 400;

      const minRunTimeValue = minValue * stepValue;

      const maxRunTimeValue = runtimeMaxValue - maxValue * stepValue;

      for (let i = 0; i < maxValue; i++) {
        await maxSlider.press("ArrowLeft");
      }

      await expect(minSlider).toHaveAttribute("aria-valuenow", String(minRunTimeValue));
      await expect(maxSlider).toHaveAttribute("aria-valuenow", String(maxRunTimeValue));
    } else {
      for (let i = (await maxSlider.getAttribute("aria-valuemax")) as any; i > maxValue; i--) {
        await maxSlider.press("ArrowLeft");
      }

      await expect(minSlider).toHaveAttribute("aria-valuenow", String(minValue));
      await expect(maxSlider).toHaveAttribute("aria-valuenow", String(maxValue));
    }
    await this.clickSearchButton();
  }

  async expectRatingsWithinRange(minRating: number, maxRating: number) {
    const links = await this.movieCards
      .locator("a:has(h2)")
      .evaluateAll((anchors) => anchors.slice(0, 5).map((a) => (a as HTMLAnchorElement).href));
    const detailPage = await this.page.context().newPage();
    const ratings: number[] = [];
    try {
      for (const link of links) {
        await detailPage.goto(link);
        ratings.push(Number(await detailPage.locator(".user_score_chart").getAttribute("data-percent")));
      }
    } finally {
      await detailPage.close();
    }
    expect(ratings.length, "No movie cards to read ratings from").toBeGreaterThan(0);

    for (const rating of ratings) {
      expect(
        rating,
        `Rating ${rating} is outside range ${minRating}–${maxRating}. All ratings: ${ratings.join(", ")}`,
      ).toBeGreaterThanOrEqual(minRating);

      expect(
        rating,
        `Rating ${rating} is outside range ${minRating}–${maxRating}. All ratings: ${ratings.join(", ")}`,
      ).toBeLessThanOrEqual(maxRating);
    }
  }

  async setKeywordFilter(keywords: string) {
    this.beforeSortMovieNames = await this.getMovieNames();
    const keywordInput = this.page.locator("h3").filter({ hasText: "Keywords" }).locator("..").locator("input");
    await keywordInput.pressSequentially(keywords, { delay: 100 });
    await this.page.locator("#with_keywords_listbox").getByText(keywords.toLowerCase(), { exact: true }).click();
    await this.clickSearchButton();
  }

  async expectMoviesWithKeyword(keywords: string) {
    await this.openFirstMovieDetails();
    await this.expectDetailsKeyword(keywords);
  }

  async expectCombinedFilters(genres: string[], keywords: string) {
    await this.openFirstMovieDetails();
    await this.expectDetailsKeyword(keywords);
    await this.expectDetailsGenres(genres);
  }
}
