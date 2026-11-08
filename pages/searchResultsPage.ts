import { expect, Page, TIMEOUT_MS } from "../utils/fileImports/import";

export type SearchCategory = "movie" | "tv" | "person" | "company" | "keyword" | "collection" | "network" | "award";

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

  get resultCards() {
    return this.page.locator("div.search_results:not(.hide) [data-object-id]");
  }

  async expectSearchPageLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`/search`, "i"));
    await expect(this.page.locator("#search_menu_items")).toBeVisible({ timeout: TIMEOUT_MS });
  }

  async switchCategory(category: SearchCategory) {
    await this.page.locator(`#${category}`).click();
    await expect(this.page).toHaveURL(new RegExp(`/search/${category}`, "i"));
  }

  async expectCategorySwitchHaveResults(category: SearchCategory, query: string) {
    await expect(this.page).toHaveURL(new RegExp(`/search/${category}\\?query=${query}`, "i"));
  }

  async expectSearchResultCardContains() {
    const card = this.resultCards.first();
    for (const part of [".poster", "h2", ".release_date", "p"]) {
      await expect(card.locator(part).first()).toBeVisible({ timeout: TIMEOUT_MS });
    }
  }
  async extractSearchPageMovieDetails() {
    const card = this.resultCards.first();
    this.resultPageMovieName = (await card.locator("h2 > span").first().innerText()).trim();

    const releaseDateRaw = await card.locator(".release_date").innerText();
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
    await expect(this.resultCards.first().locator("h2")).toContainText(text, { timeout: TIMEOUT_MS });
    await this.extractSearchPageMovieDetails();
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
