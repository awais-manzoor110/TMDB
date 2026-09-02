import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { GlobalSearchPage } from "../../pages/globalSearchPage";
import { SearchResultsPage } from "../../pages/searchResultsPage";
import { NavigationPage } from "../../pages/navigationPage";
import { PopularMoviesPage } from "../../pages/popularMoviesPage";
import { AwardsPage } from "../../pages/awardsPage";
import { getAuthenticatedContext } from "../login-utils/authenticatedContext";

type TmdbFixtures = {
  /** Authenticated browser page (cookie-reused chromium context). Closed automatically after the test. */
  authedPage: Page;
  globalSearchPage: GlobalSearchPage;
  searchResultsPage: SearchResultsPage;
  navigationPage: NavigationPage;
  popularMoviesPage: PopularMoviesPage;
  awardsPage: AwardsPage;
};

export const test = base.extend<TmdbFixtures>({
  // eslint-disable-next-line no-empty-pattern
  authedPage: async ({}, use) => {
    const { page } = await getAuthenticatedContext();
    await use(page);
    await page.close();
  },

  globalSearchPage: async ({ authedPage }, use) => {
    await use(new GlobalSearchPage(authedPage));
  },

  searchResultsPage: async ({ authedPage }, use) => {
    await use(new SearchResultsPage(authedPage));
  },

  navigationPage: async ({ authedPage }, use) => {
    await use(new NavigationPage(authedPage));
  },

  popularMoviesPage: async ({ authedPage }, use) => {
    await use(new PopularMoviesPage(authedPage));
  },

  awardsPage: async ({ authedPage }, use) => {
    await use(new AwardsPage(authedPage));
  },
});

export { expect } from "@playwright/test";
