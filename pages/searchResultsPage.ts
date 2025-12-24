import { expect, Page, TIMEOUT_MS } from "../utils/fileImports/import";

export type SearchCategory =
  | "movie"
  | "tv"
  | "person"
  | "company"
  | "keyword"
  | "collection"
  | "network"
  | "award";

export class SearchResultsPage {
  resultPageMovieName: string | null;
  resultPageMovieReleaseDate: string | null;
  detailPageMovieName: string | null;
  detailPageMovieReleaseDate: string | null;

  constructor(readonly page: Page) {
    this.page = page;
    this.resultPageMovieName = null;
    this.resultPageMovieReleaseDate = null;
    this.detailPageMovieName = null;
    this.detailPageMovieReleaseDate = null;
  }

  async clickMovie(movieName: string) {
    await this.page.getByRole("link", { name: movieName }).first().click();
    const movieSlug = movieName.toLowerCase().replace(/\s+/g, "-");
    await expect(this.page).toHaveURL(new RegExp(`/movie/\\d+-${movieSlug}`, "i"));
    await this.extractDetailPageMovieDetails();
  }

  async expectSearchPageLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`/search`, "i"));
    await expect(this.page.locator(".settings_panel")).toBeVisible({ timeout: TIMEOUT_MS });
  }

  async switchCategory(category: SearchCategory) {
    await this.page.locator(`#${category}`).click();
    await expect(this.page).toHaveURL(new RegExp(`/search/${category}`, "i"));
  }

  async expectCategorySwitchHaveResults(category: SearchCategory, query: string) {
    await expect(this.page).toHaveURL(new RegExp(`/search/${category}\\?query=${query}`, "i"));
  }

  async expectSearchResultCardContains(poster: string, title: string, releaseDate: string, overview: string) {
    const locators = [
      this.page.locator(`[class="${poster}"]`),
      this.page.locator(`[class="${title}"]`),
      this.page.locator(`[class="${releaseDate}"]`),
      this.page.locator(`[class="${overview}"]`),
    ];
    for (const locator of locators) {
      await locator.first().waitFor({ state: "visible", timeout: TIMEOUT_MS });
      const count = await locator.count();
      if (count === 0) {
        throw new Error(`No elements found for locator: ${locator}`);
      }
      for (let i = 0; i < count - 1; i++) {
        await expect(locator.nth(i)).toBeVisible({ timeout: TIMEOUT_MS });
      }
    }
  }
  async extractSearchPageMovieDetails() {
    const titleRaw = await this.page.locator(`[class="title"]`).first().innerText();
    // Get only the movie name
    this.resultPageMovieName = titleRaw.split("\n")[0].trim();

    const releaseDateRaw = await this.page.locator(`[class="release_date"]`).first().innerText();
    const months: { [key: string]: string } = {
      January: "01",
      February: "02",
      March: "03",
      April: "04",
      May: "05",
      June: "06",
      July: "07",
      August: "08",
      September: "09",
      October: "10",
      November: "11",
      December: "12",
    };
    const dateMatch = releaseDateRaw.match(/^(\w+) (\d{1,2}), (\d{4})$/);
    if (dateMatch) {
      const month = months[dateMatch[1]];
      const day = dateMatch[2].padStart(2, "0");
      const year = dateMatch[3];
      this.resultPageMovieReleaseDate = `${month}/${day}/${year}`;
    } else {
      this.resultPageMovieReleaseDate = releaseDateRaw;
    }
  }

  async extractDetailPageMovieDetails() {
    const fullTitle = await this.page.locator(".title>h2").first().innerText();
    // Remove year  in parentheses, e.g., (2010)
    const match = fullTitle.match(/^(.*?)\s*\(/);

    this.detailPageMovieName = match ? match[1] : fullTitle.split(" ")[0];

    const releaseDetailRaw = await this.page.locator('[class="release"]').first().innerText();
    // Remove country code in parentheses, e.g., (PK)
    this.detailPageMovieReleaseDate = releaseDetailRaw.replace(/\s*\([A-Z]{2}\)$/, "");
  }
  async expectSearchTitleContains(text: string) {
    await this.extractSearchPageMovieDetails();
    await expect(this.page.locator(`[class="title"]`).first()).toContainText(text, { timeout: TIMEOUT_MS });
  }

  async expectNoResultsState() {
    await expect(this.page.getByText("There are no movies that matched your query.")).toBeVisible({
      timeout: TIMEOUT_MS,
    });
  }

  async expectMovieDetailsIntegrity() {
    expect(this.resultPageMovieName).toBe(this.detailPageMovieName);
    expect(this.resultPageMovieReleaseDate).toBe(this.detailPageMovieReleaseDate);
  }
}
