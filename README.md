# TMDB UI Automation – Playwright (TypeScript)

End-to-end UI automation suite for **The Movie Database (TMDB)** using **Playwright + TypeScript**.

- Target site: https://www.themoviedb.org
- Style: Page Object Model (POM)
- Reports: Playwright HTML report locally + sharded blob reports merged in CI

---

## What’s in this repo

### Tech stack

- Playwright Test Runner (`@playwright/test`)
- TypeScript
- ESLint + Prettier quality gates

### Structure

```
pages/
  globalSearchPage.ts
  navigationPage.ts
  popularMoviesPage.ts
  searchResultsPage.ts

tests/
  cross-browser-compatibility/
    cross-browser.spec.ts
  navigation/
    pagination.spec.ts
    i18n-language-switch.spec.ts
  popular-movies/
    popular-movies-filters.spec.ts
  search/
    global-search.spec.ts
    search-results-state.spec.ts


utils/
  constant-timeout/
  fileImports/
  login-utils/

.github/workflows/playwright.yml
playwright.config.ts
tsconfig.json
eslint.config.js
.prettierrc.json
```

---

## Architecture

### Page Object Model (POM)

All selectors and UI interactions are encapsulated inside page objects under `pages/`.
Tests call intent-driven methods (e.g., `search()`, `switchCategory()`, `sortMoviesBy()`) rather than raw selectors.

### Authenticated context (cookie reuse)

The suite uses an authenticated browser context to avoid logging in before every test.

High level flow:

1. Login once and store cookies.
2. Reuse cookies on later runs.
3. If cookies become invalid, clear and login again.

Implementation lives in `utils/login-utils/authenticatedContext.ts`.

---

## Test suites & coverage

### Search

File: `tests/search/global-search.spec.ts`

- Redirect to results page
- Exact title search (global & homepage search)
- Partial/case-insensitive search
- Special characters
- No results state

File: `tests/search/search-results-state.spec.ts`

- Query persistence across categories (movie/tv/person/company/keyword/collection/network/award)
- Result card → details integrity
- Back navigation preserves results state

### Popular movies

File: `tests/popular-movies/popular-movies-filters.spec.ts`

- Default list + infinite scroll
- Sorting (popularity, release date)
- OTT platform filtering
- Show-me filtering
- Release date range
- Genre filtering
- Language filter
- Sliders (User score, Minimum user votes, Runtime)
- Keyword filter
- Combined filters intersection

### Navigation

File: `tests/navigation/pagination.spec.ts` || `tests/navigation/i18n-language-switch.spec.ts`

- Pagination next/previous
- Language switch (i18n)

### Cross Browser Compatibility

File: `tests/cross-browser-compatibility/cross-browser.spec.ts`

- Redirect to results page on firefox browser
- Redirect to results page on msedge browser

---

## Tagging strategy (how tags are implemented)

Tags are appended to the **test title** (e.g., `"... @smoke @search"`).
This allows filtering via Playwright `--grep`.

### Available tags

#### Suite tags

- `@search` — search flows
- `@popular` — popular movies area
- `@filters` — filter/sort/slider assertions
- `@navigation` — navigation flows
- `@pagination` — pagination checks
- `@i18n` — language switch checks
- `@firefox` — running test on firefox browser
- `@msedge` — running tests on msedge browser

#### Severity / intent tags

- `@smoke` — fast sanity checks
- `@critical` — business-critical flows
- `@high` / `@medium` — priority/coverage level
- `@regression` — deeper regression checks
- `@sorting` — sorting-specific checks

---

## How to run

### Install

```sh
npm install
```

### Run the full suite

```sh
npx playwright test
```

### Run by tag

```sh
npx playwright test --grep @smoke
npx playwright test --grep @critical
npx playwright test --grep @search
npx playwright test --grep "@popular.*@filters"
```

### Useful npm scripts

```sh
npm run test
npm run test:ui
npm run test:headed
npm run test:debug
npm run show-report
npm run test:smoke
npm run test:critical
npm run test:regression
npm run test:search
npm run test:filters
npm run test:firefox
npm run test:msedge
```

### Quality gates

```sh
npm run typecheck
npm run lint
npm run format
```

---

## Reporting & debug artifacts

Local runs:

- HTML report: `playwright-report/`
- Test artifacts: `test-results/`

Playwright config (`playwright.config.ts`) is set to:

- trace: `on-first-retry`
- screenshot: `only-on-failure`
- video: `retain-on-failure`

---

## CI workflow (sharding + merged HTML report)

GitHub Actions workflow: `.github/workflows/playwright.yml`

### What it does

1. Runs on pull requests, scheduled daily, and manual dispatch.
2. Installs dependencies via `npm ci`.
3. Installs Playwright Chromium, Firefox, Edge Browsers.
4. Runs `typecheck` + `lint`.
5. Runs tests **sharded** via a matrix.
6. Uploads each shard’s `blob-report` artifact.
7. Merges all shard blob reports into one final HTML report and uploads it.

### Sharding model

The workflow uses a matrix with one shard per spec group (search, navigation, popular movies). This keeps CI stable and makes failures easier to isolate.

### Viewing CI reports

Open the workflow run in GitHub Actions and download the **`final-html-report`** artifact.

### CI note: headless vs headed runs

On GitHub Actions runners, the TMDB site may intermittently block requests from **headless Chromium** (for example, returning a CloudFront 403). If you need a more realistic browser mode on Ubuntu CI, run tests in **headed** mode using a virtual display:

```sh
xvfb-run -a npx playwright test --headed
```

This doesn’t guarantee bypassing IP-based/CDN restrictions, but it can reduce headless-specific blocking and helps reproduce UI behavior closer to local runs.

---

## Notes & assumptions

- Default base URL is set in `playwright.config.ts`.
- Tests are designed to be deterministic and avoid purely cosmetic assertions.

### Known failures (upstream app bug)

There are currently **two expected failing cases** in this suite due to a **bug in the TMDB application itself** (not the automation code). Until the upstream issue is fixed, CI/local runs may occasionally show these 2 failures even when the framework and tests are working as intended.
