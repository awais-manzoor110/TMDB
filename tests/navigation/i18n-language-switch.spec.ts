import { test, Page, NavigationPage, getAuthenticatedContext } from "../../utils/fileImports/import";

test.describe("Pagination and Language Switch", () => {
  let page: Page, navigationPage: NavigationPage;

  test.beforeEach("Login", async () => {
    ({ page } = await getAuthenticatedContext());

    navigationPage = new NavigationPage(page);
  });
  test.afterEach("CleanUp", async () => {
    await page.close();
  });
  test("TC-PAG-02: Language switch affects UI elements @high @navigation @i18n", async () => {
    await navigationPage.switchLanguage("German (de-DE)");
    await navigationPage.expectPageLoaded("Willkommen. Entdecke Millionen von Filmen, Serien und Personen.");
    await navigationPage.switchLanguage("Englisch (en-US)");
    await navigationPage.expectPageLoaded("Welcome. Millions of movies, TV shows and people to discover. Explore now.");
  });
});
