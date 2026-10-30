// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const env = require('./config/env');

/**
 * Playwright Test Configuration for CampusDean automation suite.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: Boolean(env.isCI),
  
  /* Retry on CI only */
  retries: env.isCI ? 2 : 0,
  
  /* Opt out of parallel tests on CI if desired */
  workers: env.isCI ? 1 : undefined,
  
  /* Global test execution timeout */
  timeout: 30 * 1000,

  /* Assertion timeout */
  expect: {
    timeout: 10 * 1000,
  },

  /* Reporter to use. Generates an HTML report without blocking */
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL loaded from environment configuration */
    baseURL: env.baseUrl,

    /* Headless mode toggled via HEADLESS env variable */
    headless: env.headless,

    /* Capture screenshot when a test fails */
    screenshot: 'only-on-failure',

    /* Retain video recording on failure */
    video: 'retain-on-failure',

    /* Record trace on failure for post-mortem debugging */
    trace: 'retain-on-failure',

    /* Action and navigation timeouts */
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,

    /* Viewport configuration */
    viewport: { width: 1280, height: 720 },

    /* Allow self-signed or staging SSL certificates if needed */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers - Chromium by default */
  projects: [
    // Logs in once and saves the session for the student-master project
    { name: 'setup', testMatch: /auth\.setup\.js/ },

    // Existing login + smoke suites (unchanged behaviour)
    {
      name: 'chromium',
      testIgnore: [/student-master\.spec\.js/, /auth\.setup\.js/],
      use: { ...devices['Desktop Chrome'] },
    },

    // Student Master -> Add Student (needs a logged-in session)
    {
      name: 'student-master',
      testMatch: /student-master\.spec\.js/,
      dependencies: ['setup'],
      timeout: 90 * 1000, // forms + saves are slower than login checks
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces */
  outputDir: 'test-results',
});
