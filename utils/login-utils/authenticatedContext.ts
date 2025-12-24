import {
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
} from "../fileImports/import.ts";
const LOGIN_URL = process.env.PLAYWRIGHT_BASE_URL || config.use?.baseURL || "";
import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function loginStep(page: Page) {
  try {
    await expect(async () => {
      await page.goto(`${LOGIN_URL}/login`);
      await page.fill("#username", requireEnv("TMDB_USERNAME"));
      await page.fill("#password", requireEnv("TMDB_PASSWORD"));
      await page.locator("#login_button").click();

      await page.waitForLoadState("networkidle");
      await expect(page.locator("span.avatar.green")).toBeVisible();
      await NavigationPage.prototype.navigateToHomePage.call({ page });
    }).toPass({ timeout: TIMEOUT_MS });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error during login step:", error.message);
      throw error;
    }
  }
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
  browserType?: "chromium" | "firefox" | "webkit" | "msedge" | "chrome";
  launchOptions?: Record<string, any>;
  timezoneId?: string;
  viewport?: { width: number; height: number };
};

export async function getAuthenticatedContext(browserOptions: BrowserOptions = {}, refreshCookies = false) {
  const {
    browserType = "chromium",
    launchOptions = {},
    timezoneId,
    viewport = { width: 1536, height: 816 },
  } = browserOptions;

  let browser;

  switch (browserType) {
    case "webkit":
      browser = await webkit.launch(launchOptions);
      break;
    case "firefox":
      browser = await firefox.launch(launchOptions);
      break;
    case "msedge":
      browser = await chromium.launch({ ...launchOptions, channel: "msedge" });
      break;
    case "chrome":
      browser = await chromium.launch({ ...launchOptions, channel: "chrome" });
      break;
    default:
      browser = await chromium.launch(launchOptions);
  }

  // 🕒 Apply timezone if specified, otherwise use system default
  let context = await browser.newContext({
    viewport: viewport ?? config.use?.viewport,
  });
  let page = await context.newPage();

  if (timezoneId) {
    await context.close();
    context = await browser.newContext({
      viewport: viewport ?? config.use?.viewport,
      timezoneId,
    });
    page = await context.newPage();
    console.log(`🕒 Using timezone: ${timezoneId}`);
  }

  const shouldUseCookies = ["chromium"].includes(browserType);

  if (shouldUseCookies) {
    const cookies = await loadCookies();

    if (cookies.length > 0 && !refreshCookies) {
      await context.addCookies(cookies);
      const valid = await isSessionValid(page);

      if (!valid) {
        await saveCookies([]);
        await loginStep(page);
        const newCookies = await context.cookies();
        await saveCookies(newCookies);
        console.log("Cookies invalid, clearing and logging in again...");
      }
    } else {
      if (refreshCookies && cookies.length > 0) {
        console.log("Forcing cookie refresh...");
        await saveCookies([]);
      }

      await loginStep(page);
      const newCookies = await context.cookies();
      await saveCookies(newCookies);
      console.log("Logged in and saved new cookies.");
    }
  } else {
    console.log(`Skipping cookie reuse for browser: ${browserType}`);
    await loginStep(page);
  }

  return { browser, context, page };
}
