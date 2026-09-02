import { expect, Page, TIMEOUT_MS } from "../utils/fileImports/import";

export class AwardsPage {
  appliedFromDate: string | null;
  listedCeremonyDates: Array<string> | null;
  lastError: unknown;
  constructor(readonly page: Page) {
    this.page = page;
    this.appliedFromDate = null;
    this.listedCeremonyDates = [];
    this.lastError = null;
  }

  /** Award cards rendered in the results grid — keyed by the award's own id, never by position. */
  private awardCards() {
    return this.page.locator("#media-list").locator('[class*="comp:award-card"]');
  }

  private searchButton() {
    return this.page.locator(".apply.small").getByRole("link", { name: "Search" });
  }

  /** Today in the ISO form the Latest Ceremony datepicker parses. */
  private todayAsIsoDate() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${month}-${day}`;
  }

  /** Calendar-day number, so an ISO filter date and a rendered "March 15, 2026" compare cleanly. */
  private toCalendarDay(date: string) {
    const isoParts = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoParts) {
      return Date.UTC(Number(isoParts[1]), Number(isoParts[2]) - 1, Number(isoParts[3]));
    }
    const parsed = new Date(date.replace(/\s+/g, " ").trim());
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Unparsable ceremony date: "${date}"`);
    }
    return Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  async clickSearchButton() {
    const searchButton = this.searchButton();
    try {
      await expect(async () => {
        try {
          await expect(searchButton).toBeVisible({ timeout: 5000 });
          await Promise.all([
            this.page.waitForResponse((resp) => resp.url().includes("/discover/award") && resp.status() === 200, {
              timeout: 10_000,
            }),
            searchButton.click(),
          ]);
        } catch (err) {
          this.lastError = err;
          throw err;
        }
      }).toPass({ timeout: TIMEOUT_MS });
    } catch {
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

  async expectAwardsListed() {
    await this.awardCards().first().waitFor({ state: "visible", timeout: TIMEOUT_MS });
    expect(
      await this.awardCards().count(),
      "Expected the awards results grid to render at least one award",
    ).toBeGreaterThan(0);
  }

  async expectCeremonyFilterVisible() {
    await expect(this.page.getByRole("heading", { name: "Filters" })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(this.page.getByRole("heading", { name: "Latest Ceremony" })).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(this.page.locator("#release_date_gte")).toBeVisible({ timeout: TIMEOUT_MS });
    await expect(this.page.locator("#release_date_lte")).toBeVisible({ timeout: TIMEOUT_MS });
  }

  /** Sets the Latest Ceremony "from" date and searches. Pass "Today" or an ISO (yyyy-mm-dd) date. */
  async setLatestCeremonyFromDate(fromDate: "Today" | string) {
    const isoFromDate = fromDate === "Today" ? this.todayAsIsoDate() : fromDate;
    const fromInput = this.page.locator("#release_date_gte");

    await fromInput.click();
    await fromInput.fill(isoFromDate);
    // Enter commits the datepicker value, which is what enables the Search button.
    await fromInput.press("Enter");
    await expect(this.page.locator(".apply.small")).toHaveClass(/enabled/, { timeout: TIMEOUT_MS });

    this.appliedFromDate = isoFromDate;
    await this.clickSearchButton();
    this.listedCeremonyDates = await this.getListedCeremonyDates();
  }

  async getListedCeremonyDates() {
    const ceremonyDates: string[] = [];
    const cards = this.awardCards();
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const name = (await card.locator("h2 span").textContent())?.trim();
      const date = (await card.locator("span.release_date").textContent())?.trim();
      if (date) ceremonyDates.push(`${name} | ${date}`);
    }
    return ceremonyDates;
  }

  async expectCeremonyDatesOnOrAfterFromDate() {
    const fromDate = this.appliedFromDate;
    expect(fromDate, "No Latest Ceremony from-date has been applied yet").not.toBeNull();

    const listed = this.listedCeremonyDates ?? [];
    expect(listed.length, "Expected at least one award to remain after filtering").toBeGreaterThan(0);

    const from = this.toCalendarDay(fromDate!);
    for (const entry of listed) {
      const [name, date] = entry.split(" | ");
      expect(
        this.toCalendarDay(date),
        `"${name}" has ceremony date ${date}, which is before the applied from date ${fromDate}
      All listed awards: ${listed.join(", ")}`,
      ).toBeGreaterThanOrEqual(from);
    }
  }
}
