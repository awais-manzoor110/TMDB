import { test } from "../../utils/fileImports/import";

test.describe("Awards – Filters", () => {
  test.beforeEach("Go to Popular Awards", async ({ navigationPage }) => {
    await navigationPage.goToPopularAwards();
    await navigationPage.expectPageLoaded("Popular Awards");
  });

  test("TC-AWD-01: Latest Ceremony from-date filter only lists awards on or after today @high @awards @filters", async ({
    awardsPage,
  }) => {
    await awardsPage.expectAwardsListed();
    await awardsPage.expectCeremonyFilterVisible();
    await awardsPage.setLatestCeremonyFromDate("Today");
    await awardsPage.expectCeremonyDatesOnOrAfterFromDate();
  });
});
