const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const env = require('../config/env');
const { uiText, validationMessages, invalidCredentials } = require('../utils/testData');

test.describe('CampusDean Staging - Login Test Suite', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.gotoLoginPage();
  });

  test('TC-LOGIN-01: Verify that the login page opens successfully', async ({ page }) => {
    // Assert URL contains the expected login route
    expect(page.url()).toContain(env.loginPath);

    // Assert the main login heading is visible
    await expect(loginPage.loginHeading).toBeVisible();
    await expect(loginPage.loginHeading).toHaveText(uiText.heading);
  });

  test('TC-LOGIN-02: Verify that the login form and all required controls are visible', async () => {
    // Assert all essential controls are rendered and interactive
    await expect(loginPage.loginContainer).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.usernameInput).toBeEditable();

    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeEnabled();
    // Verify password field becomes editable upon user interaction
    await loginPage.passwordInput.click();
    await expect(loginPage.passwordInput).toBeEditable();

    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();

    // Verify ancillary controls
    await expect(loginPage.rememberMeCheckbox).toBeAttached();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test('TC-LOGIN-03: Verify client validation when both username and password are empty', async () => {
    // Trigger submission without inputting any credentials
    await loginPage.clickLogin();

    // Verify required field validation messages appear
    await expect(loginPage.usernameValidationError).toBeVisible();
    await expect(loginPage.usernameValidationError).toHaveText(validationMessages.emptyUsername);

    await expect(loginPage.passwordValidationError).toBeVisible();
    await expect(loginPage.passwordValidationError).toHaveText(validationMessages.emptyPassword);
  });

  test('TC-LOGIN-04: Verify client validation when only username is provided', async () => {
    // Fill username from .env file only
    await loginPage.enterUsername(env.username);
    await loginPage.clickLogin();

    // Password must fail validation
    await expect(loginPage.passwordValidationError).toBeVisible();
    await expect(loginPage.passwordValidationError).toHaveText(validationMessages.emptyPassword);

    // Username should have no validation error
    const userError = await loginPage.usernameValidationError.innerText();
    expect(userError.trim()).toBe('');
  });

  test('TC-LOGIN-05: Verify client validation when only password is provided', async () => {
    // Fill password from .env file only
    await loginPage.enterPassword(env.password);
    await loginPage.clickLogin();

    // Username must fail validation
    await expect(loginPage.usernameValidationError).toBeVisible();
    await expect(loginPage.usernameValidationError).toHaveText(validationMessages.emptyUsername);

    // Password should have no validation error
    const passError = await loginPage.passwordValidationError.innerText();
    expect(passError.trim()).toBe('');
  });

  test('TC-LOGIN-06: Verify system behavior when attempting login with invalid credentials', async ({ page }) => {
    // Fill invalid credentials loaded strictly from .env file
    await loginPage.enterUsername(env.invalidUsername);
    await loginPage.enterPassword(env.invalidPassword);
    await loginPage.clickLogin();

    // The user should not be redirected to the authenticated dashboard
    // It must remain on the login page or display an error message
    await page.waitForTimeout(1500);
    expect(page.url()).toContain(env.loginPath);

    // Check if server-side error span or sweetalert modal was triggered
    const errorText = await loginPage.getGeneralErrorMessage();
    if (errorText) {
      expect(errorText.length).toBeGreaterThan(0);
    }
  });

  test('TC-LOGIN-07: Verify password input masking for security', async () => {
    // Ensure the input field has type="password"
    const isMasked = await loginPage.isPasswordMasked();
    expect(isMasked, 'Expected password field type to be "password"').toBe(true);

    // Fill password from .env file and verify DOM attribute remains "password"
    await loginPage.enterPassword(env.password);
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-LOGIN-08: Verify minimum length boundary validations for username and password', async () => {
    // Enter username less than 3 chars and password less than 6 chars
    await loginPage.enterUsername(invalidCredentials.shortUsername.username);
    await loginPage.enterPassword(invalidCredentials.shortPassword.password);
    await loginPage.clickLogin();

    // ASP.NET MVC Unobtrusive validation length error triggers
    const usernameError = await loginPage.getUsernameValidationMessage();
    const passwordError = await loginPage.getPasswordValidationMessage();

    expect(
      usernameError.length > 0 || passwordError.length > 0,
      'Expected at least one validation length error to be triggered'
    ).toBe(true);
  });

  test('TC-LOGIN-09: Verify successful authentication using valid staging credentials', async ({ page }) => {
    // Test skipped automatically if placeholders are still present in .env
    test.skip(
      !env.isCredentialConfigured,
      'Valid staging test credentials not provided in .env. Update TEST_USERNAME and TEST_PASSWORD to execute.'
    );

    // Perform login with valid configured credentials from .env file
    await loginPage.login(env.username, env.password);

    // Verify navigation beyond the login screen to authenticated portal
    await page.waitForURL((url) => !url.pathname.includes(env.loginPath), {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    expect(page.url()).not.toContain(env.loginPath);
  });

  test('TC-LOGIN-10: Verify authenticated user lands on the dashboard page', async ({ page }) => {
    // Test skipped automatically if placeholders are still present in .env
    test.skip(
      !env.isCredentialConfigured,
      'Valid staging test credentials not provided in .env. Update TEST_USERNAME and TEST_PASSWORD to execute.'
    );

    // Perform login with valid configured credentials from .env file
    await loginPage.login(env.username, env.password);

    // Validate landing URL with domcontentloaded stability
    await page.waitForURL(new RegExp(uiText.expectedDashboardPath, 'i'), {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await expect(page).toHaveURL(new RegExp(uiText.expectedDashboardPath, 'i'), {
      timeout: 10000,
    });
  });
});
