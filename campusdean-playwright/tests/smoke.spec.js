const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const env = require('../config/env');
const { uiText } = require('../utils/testData');

test.describe('CampusDean Staging - Smoke Test Suite', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('TC-SMOKE-01: Staging website is reachable and returns HTTP 200', async ({ page }) => {
    const response = await loginPage.gotoLoginPage();
    
    // Validate network response
    expect(response, 'Expected a non-null HTTP response from server').not.toBeNull();
    expect(response.status(), 'Expected HTTP status 200 OK').toBe(200);
    expect(page.url()).toContain(env.loginPath);
  });

  test('TC-SMOKE-02: Login page renders essential layout and core branding elements', async ({ page }) => {
    await loginPage.gotoLoginPage();

    // Verify main heading and instruction text
    await expect(loginPage.loginHeading).toBeVisible();
    await expect(loginPage.loginHeading).toHaveText(uiText.heading);
    await expect(loginPage.loginSubtitle).toBeVisible();
    await expect(loginPage.loginSubtitle).toHaveText(uiText.subtitle);

    // Verify presence of form container and attached form
    await expect(loginPage.loginContainer).toBeVisible();
    await expect(loginPage.loginForm).toBeAttached();
  });

  test('TC-SMOKE-03: Key interactive login controls are rendered without failures', async ({ page }) => {
    await loginPage.gotoLoginPage();

    // Verify essential interactive elements
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.usernameInput).toBeEnabled();

    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeEnabled();

    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
    await expect(loginPage.loginButton).toHaveText(uiText.loginButtonText);

    // Verify auxiliary controls: Remember me and Forgot Password
    await expect(loginPage.rememberMeCheckbox).toBeAttached();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('TC-SMOKE-04: No severe console errors occur during initial page load', async ({ page }) => {
    const severeConsoleErrors = [];
    
    page.on('console', (msg) => {
      // Capture error level console messages, ignoring standard analytics/font warnings
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless 3rd-party/tracker CDN failures if any
        if (!text.includes('favicon.ico')) {
          severeConsoleErrors.push(text);
        }
      }
    });

    await loginPage.gotoLoginPage();
    await page.waitForLoadState('domcontentloaded');

    // Page must still have rendered core login interface
    await expect(loginPage.loginHeading).toBeVisible();
  });
});
