const { test: setup, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');
const env = require('../config/env');
const { uiText } = require('../utils/testData');

const AUTH_FILE = 'playwright/.auth/admin.json';

setup('authenticate once and save the session', async ({ page }) => {
  setup.skip(!env.isCredentialConfigured, 'Set TEST_USERNAME and TEST_PASSWORD in .env');

  const loginPage = new LoginPage(page);
  await loginPage.gotoLoginPage();
  await loginPage.login(env.username, env.password);
  await page.waitForURL(new RegExp(uiText.expectedDashboardPath, 'i'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await expect(page).toHaveURL(new RegExp(uiText.expectedDashboardPath, 'i'));

  await page.context().storageState({ path: AUTH_FILE });
});
