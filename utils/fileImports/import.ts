import type { Page } from "@playwright/test";
import config from "../../playwright.config.ts";
import { TIMEOUT_MS } from "../constant-timeout/constants";
import { NavigationPage } from "../../pages/navigationPage";
import { GlobalSearchPage } from "../../pages/globalSearchPage.ts";
import { SearchResultsPage } from "../../pages/searchResultsPage";
import { PopularMoviesPage } from "../../pages/popularMoviesPage";
import { test, expect, chromium, firefox, webkit } from "@playwright/test";
import { getAuthenticatedContext } from "../login-utils/authenticatedContext";
import { loadCookies, saveCookies } from "../../utils/login-utils/cookieStorage.js";

export {
  test,
  Page,
  expect,
  config,
  webkit,
  firefox,
  chromium,
  TIMEOUT_MS,
  loadCookies,
  saveCookies,
  NavigationPage,
  GlobalSearchPage,
  SearchResultsPage,
  PopularMoviesPage,
  getAuthenticatedContext,
};
