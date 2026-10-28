# CampusDean Playwright Automation Framework

A scalable, robust end-to-end (E2E) QA automation testing framework built using **Playwright Test**, **Node.js**, and **JavaScript** for the **CampusDean Staging Portal** ([https://staging.campusdean.com/Login/Index](https://staging.campusdean.com/Login/Index)).

---

## 1. Project Overview & Architecture

This framework is built using the **Page Object Model (POM)** design pattern, ensuring high maintainability, clear separation of concerns, and clean test authoring.

### Key Architecture Highlights
- **Framework**: `@playwright/test` runner with native auto-waiting and retry capabilities.
- **Language**: JavaScript (ES6+ / CommonJS), strictly avoiding unnecessary transpilation.
- **Environment Management**: Centralized `config/env.js` backed by `dotenv` with validation and credential masking.
- **Resilient Locators**: Form-level elements and attributes identified directly by inspecting the live staging ASP.NET MVC architecture.
- **Failure Artifacts**: Automatic capture of screenshots, videos, and full Playwright traces upon test failures.
- **Reporting**: Non-blocking HTML reports generated after execution with full step logs.

---

## 2. Directory Structure

```text
campusdean-playwright/
├── .env                  # Local environment variables (git-ignored, contains secrets)
├── .env.example          # Environment variable template with placeholders
├── .gitignore            # Excludes node_modules, reports, artifacts, and secrets
├── package.json          # Project metadata, dependencies, and npm scripts
├── playwright.config.js  # Playwright runner configuration (Chromium, timeouts, reporters)
├── README.md             # Complete engineering and operational documentation
├── config/
│   └── env.js            # Central environment parser and validator
├── pages/
│   └── LoginPage.js      # Page Object Model for the CampusDean Login interface
├── tests/
│   ├── login.spec.js     # 10 comprehensive, independent login test cases
│   └── smoke.spec.js     # Health check and reachability smoke tests
└── utils/
    └── testData.js       # Static test fixtures, UI text, and validation matchers
```

---

## 3. Prerequisites

Before installing the framework, ensure your environment meets the following requirements:
- **Node.js**: `v18.x`, `v20.x`, or `v22.x+` (verified on Node.js `v26.5.0`).
- **npm**: `v9.x` or later.
- **OS**: Windows, macOS, or Linux.

Check your current installed versions:
```bash
node -v
npm -v
```

---

## 4. Installation & Setup

Follow these exact terminal commands to set up the project locally:

### Step 1: Navigate to Project Directory
```bash
cd campusdean-playwright
```

### Step 2: Install Dependencies
```bash
npm install
```
*(On Windows systems where script execution policies are restricted, use `npm.cmd install`)*

### Step 3: Install Playwright Browser Binaries (Chromium)
```bash
npx playwright install chromium
```
*(On Windows PowerShell, use `npx.cmd playwright install chromium`)*

---

## 5. Environment Configuration

The framework uses environment variables to isolate environment-specific URLs and credentials from the test code.

### 1. The `.env` File
Create or modify `.env` in the root directory:
```env
# Base URL of the CampusDean staging environment
BASE_URL=https://staging.campusdean.com

# Login route relative to BASE_URL
LOGIN_PATH=/Login/Index

# Valid staging credentials for testing
TEST_USERNAME=your_test_username
TEST_PASSWORD=your_test_password

# Browser execution mode: true for headless, false for headed
HEADLESS=false
```

### 2. Validation & Security
- `config/env.js` ensures that `BASE_URL` is configured before tests start. Missing variables throw a detailed configuration error.
- `.env` is explicitly included in `.gitignore` to prevent leaking credentials to source control.
- `env.toString()` automatically masks sensitive fields (`password` as `******`, `username` partially masked), ensuring secrets never appear in logs or CI output.

---

## 6. Page Object Model & Page Inspection Insights

During inspection of the live staging website (`https://staging.campusdean.com/Login/Index`), several critical ASP.NET MVC behaviors were identified and built into `LoginPage.js`:

| Element | HTML Attribute / Selector | POM Handling |
| :--- | :--- | :--- |
| **Username Input** | `<input id="UserName" name="UserName">` | Targeted via `locator('#UserName')`. |
| **Password Input** | `<input id="Passwords" name="Passwords" readonly="readonly">` | The page attaches `readonly="readonly"` to prevent browser autofill and relies on an `onfocus` handler. `LoginPage.enterPassword()` focuses/clicks the field and removes `readonly` prior to filling text. |
| **Login Button** | `<button id="btnLogin" type="submit">Log In</button>` | Targeted via `getByRole('button', { name: 'Log In' })`. |
| **Validation Spans** | `[data-valmsg-for="UserName"]`, `[data-valmsg-for="Passwords"]` | ASP.NET Unobtrusive validation spans dynamically populated on submit. |
| **Remember Me** | `<input id="RememberMe" type="checkbox">` | Targeted via `locator('#RememberMe')`. |
| **Forgot Password** | `<a class="forgot-pass">Forgot Password?</a>` | Targeted via `getByRole('link', { name: 'Forgot Password?' })`. |

---

## 7. Test Execution Commands

The framework provides comprehensive `npm` scripts defined in `package.json`:

| Command | Action |
| :--- | :--- |
| `npm test` | Runs the entire test suite in headless mode. |
| `npm run test:headed` | Runs all tests with the browser window visible. |
| `npm run test:ui` | Opens the interactive Playwright UI mode for time-travel debugging. |
| `npm run test:debug` | Runs tests in step-by-step debug mode via Playwright Inspector. |
| `npm run test:login` | Executes only the login test suite (`tests/login.spec.js`). |
| `npm run test:smoke` | Executes only the smoke test suite (`tests/smoke.spec.js`). |
| `npm run report` | Opens the generated HTML test report in your default browser. |

> **Windows PowerShell Tip**: If your PowerShell execution policy blocks `.ps1` scripts, run using `npm.cmd run <script>` or prefix with `npx.cmd playwright test`.

---

## 8. Test Coverage Matrix

### Smoke Test Suite (`tests/smoke.spec.js`)
- **TC-SMOKE-01**: Verifies staging website is reachable and returns HTTP status `200`.
- **TC-SMOKE-02**: Verifies login page renders essential layout and core branding elements (`Login` heading, subtitle, main form container).
- **TC-SMOKE-03**: Verifies interactive login controls (username, password, login button, remember me, forgot password) are rendered and enabled.
- **TC-SMOKE-04**: Verifies that no severe console errors occur during initial page load.

### Login Test Suite (`tests/login.spec.js`)
- **TC-LOGIN-01**: Verifies login page opens successfully at `/Login/Index`.
- **TC-LOGIN-02**: Verifies login form and all required input controls are visible and editable.
- **TC-LOGIN-03**: Verifies client validation when both username and password are submitted empty (`enter user name`, `enter password`).
- **TC-LOGIN-04**: Verifies client validation when only username is provided (password error triggered).
- **TC-LOGIN-05**: Verifies client validation when only password is provided (username error triggered).
- **TC-LOGIN-06**: Verifies system behavior and error handling when attempting login with invalid credentials.
- **TC-LOGIN-07**: Verifies password input masking for security (`type="password"` maintained).
- **TC-LOGIN-08**: Verifies minimum length boundary validations for username and password fields.
- **TC-LOGIN-09**: Verifies successful authentication using valid staging credentials *(automatically skips with guidance if credentials in `.env` are placeholders)*.
- **TC-LOGIN-10**: Verifies that an authenticated user lands on the dashboard page (`/Dashboard/Index`).

---

## 9. Viewing Reports & Debugging Test Failures

### 1. HTML Test Report
After every test run, Playwright automatically generates an HTML report in `playwright-report/index.html`.
To view it:
```bash
npm run report
```

### 2. Failure Artifacts
When a test fails, Playwright captures:
- **Screenshots**: Saved to `test-results/<test-name>/test-failed-1.png`.
- **Videos**: Recorded webm files saved to `test-results/<test-name>/video.webm`.
- **Traces**: Full execution traces saved to `test-results/<test-name>/trace.zip`.

### 3. Trace Viewer
To inspect a trace recording:
```bash
npx playwright show-trace test-results/<test-folder>/trace.zip
```
The trace viewer lets you step through actions, view DOM snapshots, inspect network requests, and review console logs.

---

## 10. Updating Locators When UI Changes

All page element locators are centralized in `pages/LoginPage.js`. If the CampusDean staging site updates element IDs or labels:
1. Open `pages/LoginPage.js`.
2. Update the locator definition in the `constructor(page)`:
   ```javascript
   // Example: If ID changes from #UserName to #user-input
   this.usernameInput = page.locator('#user-input');
   ```
3. No test specifications in `tests/` will need modification, preserving test isolation.

---

## 11. Running in CI/CD Environments

The framework detects CI environments via the `CI` environment variable (`process.env.CI`). In CI:
- Headless mode is automatically enforced.
- Retries are set to 2.
- Parallel worker counts are optimized.
- `forbidOnly` prevents accidental `test.only` commits.

### Example GitHub Actions Workflow (`.github/workflows/e2e.yml`)
```yaml
name: Playwright E2E Tests

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    timeout-minutes: 30
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'

    - name: Install dependencies
      working-directory: campusdean-playwright
      run: npm ci

    - name: Install Playwright Browsers
      working-directory: campusdean-playwright
      run: npx playwright install --with-deps chromium

    - name: Run Playwright tests
      working-directory: campusdean-playwright
      env:
        BASE_URL: ${{ secrets.BASE_URL }}
        LOGIN_PATH: /Login/Index
        TEST_USERNAME: ${{ secrets.TEST_USERNAME }}
        TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        HEADLESS: true
      run: npm test

    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: campusdean-playwright/playwright-report/
        retention-days: 14
```
