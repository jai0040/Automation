const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env located at project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

/**
 * Validates required environment variables and returns sanitized configuration.
 */
function loadAndValidateEnv() {
  const missing = [];

  const BASE_URL = process.env.BASE_URL;
  if (!BASE_URL) {
    missing.push('BASE_URL');
  }

  if (missing.length > 0) {
    throw new Error(
      `\n[CONFIG ERROR] Missing required environment variable(s): ${missing.join(', ')}.\n` +
      `Please ensure they are defined in your .env file or environment.\n` +
      `Refer to .env.example for guidance.\n`
    );
  }

  const LOGIN_PATH = process.env.LOGIN_PATH || '/Login/Index';
  const TEST_USERNAME = process.env.TEST_USERNAME || '';
  const TEST_PASSWORD = process.env.TEST_PASSWORD || '';
  const STUDENT_COURSE = process.env.STUDENT_COURSE || 'Sem - 1';
  const STUDENT_DIVISION = process.env.STUDENT_DIVISION || 'A';
  const VIEWONLY_USERNAME = process.env.VIEWONLY_USERNAME || '';
  const VIEWONLY_PASSWORD = process.env.VIEWONLY_PASSWORD || '';
  const TEST_INVALID_USERNAME = process.env.TEST_INVALID_USERNAME || 'invalid_qa_user_99999';
  const TEST_INVALID_PASSWORD = process.env.TEST_INVALID_PASSWORD || 'InvalidPassword#123';
  
  // Headless mode: explicitly defaults to false if 'false', true if 'true' or in CI
  const isCI = Boolean(process.env.CI);
  let headless = false;
  if (process.env.HEADLESS !== undefined) {
    headless = process.env.HEADLESS.toLowerCase() === 'true';
  } else if (isCI) {
    headless = true;
  }

  // Construct full login URL
  const loginUrl = new URL(LOGIN_PATH, BASE_URL).toString();

  // Check if real credentials are provided or still placeholder
  const isCredentialPlaceholder =
    !TEST_USERNAME ||
    !TEST_PASSWORD ||
    TEST_USERNAME.trim() === 'your_test_username' ||
    TEST_PASSWORD.trim() === 'your_test_password';

  return Object.freeze({
    baseUrl: BASE_URL.replace(/\/+$/, ''),
    loginPath: LOGIN_PATH.startsWith('/') ? LOGIN_PATH : `/${LOGIN_PATH}`,
    loginUrl,
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
    studentCourse: STUDENT_COURSE,
    studentDivision: STUDENT_DIVISION,
    viewOnlyUsername: VIEWONLY_USERNAME,
    viewOnlyPassword: VIEWONLY_PASSWORD,
    invalidUsername: TEST_INVALID_USERNAME,
    invalidPassword: TEST_INVALID_PASSWORD,
    headless,
    isCI,
    isCredentialConfigured: !isCredentialPlaceholder,
    // Safe string representation that masks passwords
    toString() {
      return JSON.stringify({
        baseUrl: this.baseUrl,
        loginPath: this.loginPath,
        loginUrl: this.loginUrl,
        username: this.username ? `${this.username.slice(0, 3)}***` : '<empty>',
        password: this.password ? '******' : '<empty>',
        invalidUsername: this.invalidUsername,
        invalidPassword: '******',
        headless: this.headless,
        isCI: this.isCI,
        isCredentialConfigured: this.isCredentialConfigured
      }, null, 2);
    }
  });
}

const env = loadAndValidateEnv();

module.exports = env;
