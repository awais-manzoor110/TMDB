import { defineConfig } from "@playwright/test";
import type { ReporterDescription } from "@playwright/test";

export default defineConfig({
  timeout: process.env.CI ? 120_000 : 60_000,

  testDir: "./tests",

  outputDir: "test-results",

  /* "fullyParallel: false" means only run different test FILES in parallel */
  fullyParallel: false,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  maxFailures: process.env.CI ? 3 : 0,

  retries: process.env.CI ? 1 : 1,

  workers: process.env.CI ? 1 : 1,

  reporter: [
    ["list"], // CLI list reporter
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ...(process.env.CI ? ([["blob"]] as ReporterDescription[]) : []),
  ],

  use: {
    baseURL: "https://www.themoviedb.org",
    viewport: { width: 1536, height: 816 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
