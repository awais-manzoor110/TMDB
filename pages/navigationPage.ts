import { expect, TIMEOUT_MS, Page } from "../utils/fileImports/import";

export class NavigationPage {
  constructor(readonly page: Page) {
    this.page = page;
  }

  async navigateToHomePage() {
    await this.page.locator('[aria-label="Home"]').click();
  }
  async expectPageLoaded(text: string) {
    await expect(this.page.locator('[class="title"]')).toHaveText(text, { timeout: TIMEOUT_MS });
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
  }
  async goToMovies() {
    await this.page.getByLabel("Movies").click();
  }

  async goToPopularMovies() {
    await this.goToMovies();
    await this.page.getByLabel("Movies").locator("..").getByLabel("Popular").click();
  }

  async switchLanguage(language: string) {
    await this.page.locator("li[class='translate'] div").click();
    await this.page.locator('[aria-labelledby="default_language_popup_label"]').first().click();
    await this.page.getByRole("searchbox", { name: "Filter" }).pressSequentially(language, { delay: 100 });
    await this.page.locator("li").filter({ hasText: language }).first().click();
    await this.page.locator("a.no_click.button.rounded.upcase").click();
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUT_MS });
  }

  async navigateToPage(button: "Next" | "Previous") {
    await this.page.click(`[aria-label="${button}"]`);
  }

  async expectPageChanged(pageNumber: number) {
    await expect(this.page).toHaveURL(new RegExp(`page=${pageNumber}`, "i"));
  }

  async languageChanged(expectedLanguageText: string) {
    await expect(this.page.getByLabel(expectedLanguageText, { exact: true })).toBeVisible({
      timeout: TIMEOUT_MS,
    });
  }
}
