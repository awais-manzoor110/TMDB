import { Page } from "@playwright/test";

export class GlobalSearchPage {
  constructor(readonly page: Page) {}
  async search(type: "home page search" | "global search" = "global search", text: string) {
    switch (type) {
      case "home page search": {
        const searchInput = this.page.locator("#inner_search_v4");
        await searchInput.clear();
        await searchInput.fill(text);
        await this.page.locator('[value="Search"]').click();
        break;
      }
      case "global search": {
        await this.page.locator('[class="search"]').first().click();
        const globalSearchInput = this.page.locator("#search_v4");
        await globalSearchInput.clear();
        await globalSearchInput.fill(text);
        await this.page.keyboard.press("Enter");
        break;
      }
    }
  }
}
