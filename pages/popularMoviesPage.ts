import { expect, Page, TIMEOUT_MS } from "../utils/fileImports/import";

export class PopularMoviesPage {
  beforeSortMovieNames: Array<string> | null;
  afterSortMovieNames: Array<string> | null;
  beforeSortReleaseDates: Array<string> | null;
  afterSortReleaseDates: Array<string> | null;
  lastError: unknown;
  selectedLanguage: string | null;
  constructor(readonly page: Page) {
    this.page = page;
    this.beforeSortMovieNames = [];
    this.afterSortMovieNames = [];
    this.beforeSortReleaseDates = [];
    this.afterSortReleaseDates = [];
    this.selectedLanguage = "";
    this.lastError = null;
  }

  async clickSearchButton() {
    try {
      await expect(async () => {
        try {
          this.page.getByRole("link", { name: "Search" }).nth(1).click();
          await this.page.waitForResponse((resp) => resp.url().includes("/discover/movie") && resp.status() === 200, {
            timeout: 5000,
          });
        } catch (err) {
          this.lastError = err;
          throw err;
        }
      }).toPass({ timeout: TIMEOUT_MS });
    } catch (_) {
      console.error(
        "Failure after timeout:",
        typeof this.lastError === "object" && this.lastError && "message" in this.lastError
          ? (this.lastError as { message?: string }).message
          : String(this.lastError),
      );
      throw this.lastError;
    }
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
  }

  async expectPopularMovieCardContains(poster: string, rating: string, content: string) {
    const locators = [this.page.locator(`.${poster}`), this.page.locator(`.percent`), this.page.locator(`.${content}`)];
    for (const locator of locators) {
      await locator.first().waitFor({ state: "visible", timeout: TIMEOUT_MS });
      const count = await locator.count();
      if (count === 0) {
        throw new Error(`No elements found for locator: ${locator}`);
      }
      await expect(locator.nth(0)).toBeVisible({ timeout: TIMEOUT_MS });
    }
  }

  async expectInfiniteScroll(times: number = 3) {
    await this.page.mouse.wheel(0, 10000);
    await this.page.getByRole("link", { name: "Load More" }).click();

    let callCount = 0;
    await this.page.route("**/discover/movie/items", (route) => route.continue());
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
    const movieNames: string[] = [];
    const movieNameLocators = this.page.locator(".content>h2>a");
    const count = await movieNameLocators.count();
    const loopCount = count > 5 ? 5 : count;
    for (let i = 0; i < loopCount; i++) {
      const name = await movieNameLocators.nth(i).textContent();
      if (name) movieNames.push(name.trim());
    }
    return movieNames;
  }

  async getReleaseDates() {
    const releaseDates: string[] = [];
    const releaseDateLocators = this.page.locator(".content>p");
    const count = await releaseDateLocators.count();
    const loopCount = count > 5 ? 5 : count;
    for (let i = 0; i < loopCount; i++) {
      const date = await releaseDateLocators.nth(i).textContent();
      if (date) releaseDates.push(date.trim());
    }
    return releaseDates;
  }

  async sortMoviesBy(filterName: string) {
    this.beforeSortMovieNames = await this.getMovieNames();
    this.beforeSortReleaseDates = await this.getReleaseDates();

    const sortMainMenu = this.page.getByRole("heading", { name: "Sort" });
    const sortCombo = sortMainMenu.locator("..").locator('[role="combobox"]');

    // Only click sortMainMenu if combobox is not visible
    if (!(await sortCombo.isVisible())) {
      await sortMainMenu.click();
      await expect(sortCombo).toBeVisible();
    }
    await sortCombo.click();
    await this.page.locator("li").filter({ hasText: filterName }).click();
    await this.clickSearchButton();
    this.afterSortReleaseDates = await this.getReleaseDates();
  }

  async expectMoviesOrderChanged() {
    try {
      await expect(async () => {
        try {
          this.afterSortMovieNames = await this.getMovieNames();
          expect(this.beforeSortMovieNames).not.toEqual(this.afterSortMovieNames);
        } catch (err) {
          this.lastError = err;
          throw err;
        }
      }).toPass({ timeout: TIMEOUT_MS });
    } catch (_) {
      console.error(
        "Failure after timeout:",
        typeof this.lastError === "object" && this.lastError && "message" in this.lastError
          ? (this.lastError as { message?: string }).message
          : String(this.lastError),
      );
      throw this.lastError;
    }
  }

  async expectReleaseDatesOrderChanged() {
    const parseDate = (dateStr: string) => new Date(dateStr);
    const descDates = (this.beforeSortReleaseDates || []).map(parseDate);
    const ascDates = (this.afterSortReleaseDates || []).map(parseDate);

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
    const releaseDates = this.afterSortReleaseDates ?? [];

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

  async expectMoviesWithGenres(genres: string[]) {
    const selectedGenres = [];
    await this.page.locator(".card.style_1").first().click();
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
    const genresLocators = this.page.locator(".genres>a");
    const count = await genresLocators.count();
    for (let i = 0; i < count; i++) {
      const genre = await genresLocators.nth(i).textContent();
      if (genre) selectedGenres.push(genre.trim());
    }
    for (const genre of genres) {
      expect(
        selectedGenres,
        `Expected genre "${genre}" not found. Actual genres: ${selectedGenres.join(", ")}`,
      ).toContain(genre);
    }
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
    await this.page.locator(".card.style_1").first().click();
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
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
    const ratings: number[] = [];
    const ratingLocators = this.page.locator(".icon");
    const count = await ratingLocators.count();
    const loopCount = count > 5 ? 5 : count;

    for (let i = 0; i < loopCount; i++) {
      const classAttr = await ratingLocators.nth(i).getAttribute("class");

      if (!classAttr) continue;

      const match = classAttr.match(/icon-r(\d+)/);

      if (!match) {
        throw new Error(`Rating class not found in: "${classAttr}"`);
      }

      const rating = Number(match[1]);
      ratings.push(rating);
    }

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
    const movieKeywords = [];
    await this.page.locator(".card.style_1").first().click();
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
    const keywordsLocators = this.page.locator(".keywords a");
    const count = await keywordsLocators.count();
    for (let i = 0; i < count; i++) {
      const keyword = await keywordsLocators.nth(i).textContent();
      movieKeywords.push(keyword);
    }
    expect(movieKeywords).toContain(keywords.toLowerCase());
  }

  async expectCombinedFilters(genres: string[], keywords: string) {
    const movieKeywords = [];
    const selectedGenres = [];
    let count;
    await this.page.locator(".card.style_1").first().click();
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
    const keywordsLocators = this.page.locator(".keywords a");
    count = await keywordsLocators.count();
    for (let i = 0; i < count; i++) {
      const keyword = await keywordsLocators.nth(i).textContent();
      movieKeywords.push(keyword);
    }
    expect(movieKeywords).toContain(keywords.toLowerCase());

    const genresLocators = this.page.locator(".genres>a");
    count = await genresLocators.count();
    for (let i = 0; i < count; i++) {
      const genre = await genresLocators.nth(i).textContent();
      if (genre) selectedGenres.push(genre.trim());
    }
    for (const genre of genres) {
      expect(
        selectedGenres,
        `Expected genre "${genre}" not found. Actual genres: ${selectedGenres.join(", ")}`,
      ).toContain(genre);
    }
  }
}
