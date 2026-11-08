import { chromium, expect, firefox, Page } from "@playwright/test";
import dotenv from "dotenv";
import config from "../../playwright.config";
import { NavigationPage } from "../../pages/navigationPage";
import { TIMEOUT_MS } from "../helpers";
import { loadCookies, saveCookies } from "./cookieStorage";

dotenv.config();
const LOGIN_URL = process.env.PLAYWRIGHT_BASE_URL || config.use?.baseURL || "";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function loginStep(page: Page) {
  await expect(async () => {
    await page.goto(`${LOGIN_URL}/login`);
    const loginForm = page.locator("main").first();
    await loginForm.locator("#auth_username").fill(requireEnv("TMDB_USERNAME"));
    await loginForm.locator("#auth_password").fill(requireEnv("TMDB_PASSWORD"));
    await loginForm.locator("#auth_login_button").click();

    await page.waitForLoadState("networkidle");
    await expect(page.locator("span.avatar.green")).toBeVisible();
    await new NavigationPage(page).navigateToHomePage();
  }).toPass({ timeout: TIMEOUT_MS });
}

async function isSessionValid(page: Page): Promise<boolean> {
  try {
    const response = await page.goto(`${LOGIN_URL}`, {
      waitUntil: "networkidle",
    });
    const url = page.url();
    const isUserProfileVisible = await page.isVisible("span.avatar.green");
    return !url.includes("/login") && response?.status() === 200 && isUserProfileVisible;
  } catch {
    return false;
  }
}

type BrowserOptions = {
  browserType?: "chromium" | "firefox" | "msedge";
  viewport?: { width: number; height: number };
};

export async function getAuthenticatedContext({
  browserType = "chromium",
  viewport = { width: 1536, height: 816 },
}: BrowserOptions = {}) {
  const browser =
    browserType === "firefox"
      ? await firefox.launch()
      : browserType === "msedge"
        ? await chromium.launch({ channel: "msedge" })
        : await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  // ponytail: cookie reuse is chromium-only; other browsers log in fresh every run
  if (browserType !== "chromium") {
    await loginStep(page);
    return { browser, context, page };
  }

  const cookies = await loadCookies();
  if (cookies.length > 0) {
    await context.addCookies(cookies);
    if (await isSessionValid(page)) return { browser, context, page };
    console.log("Cookies invalid, clearing and logging in again...");
  }
  await saveCookies([]);
  await loginStep(page);
  await saveCookies(await context.cookies());
  return { browser, context, page };
}
