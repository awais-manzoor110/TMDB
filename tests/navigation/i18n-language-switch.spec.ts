import { test } from "../../utils/fileImports/import";

test.describe("Language Switch", () => {
  test("TC-PAG-02: Language switch affects UI elements @high @navigation @i18n", async ({ navigationPage }) => {
    await navigationPage.switchLanguage("German (de-DE)");
    await navigationPage.expectPageLoaded("Willkommen. Entdecke Millionen von Filmen, Serien und Personen.");
    await navigationPage.switchLanguage("Englisch (en-US)");
    await navigationPage.expectPageLoaded("Welcome. Millions of movies, TV shows and people to discover. Explore now.");
  });
});
