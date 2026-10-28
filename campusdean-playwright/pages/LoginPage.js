const env = require('../config/env');

/**
 * Page Object Model representing the CampusDean Login Page.
 * Encapsulates page elements, accessible locators, and user interactions.
 */
class LoginPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    // Login Form Container & Titles
    this.loginForm = page.locator('#formid');
    this.loginContainer = page.locator('.form-main-div');
    this.loginHeading = page.getByRole('heading', { name: 'Login', level: 1 });
    this.loginSubtitle = page.getByText('Enter your details below.');

    // Credentials Input Fields
    // HTML uses id="UserName" and id="Passwords" (plural) with matching labels
    this.usernameInput = page.locator('#UserName');
    this.passwordInput = page.locator('#Passwords');

    // Action Controls
    this.loginButton = page.getByRole('button', { name: 'Log In' });
    this.rememberMeCheckbox = page.locator('#RememberMe');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password?' });
    this.languageDropdown = page.locator('#drpLan');

    // Validation & Error Message Elements
    // ASP.NET Unobtrusive validation containers
    this.usernameValidationError = page.locator('[data-valmsg-for="UserName"]');
    this.passwordValidationError = page.locator('[data-valmsg-for="Passwords"]');
    this.invalidUserServerMessage = page.locator('#InvalidUserName');
    this.sweetAlertModal = page.locator('.sweet-alert');
    this.sweetAlertText = page.locator('.sweet-alert p');
    this.sweetAlertConfirmButton = page.locator('.sweet-alert button.confirm');
  }

  /**
   * Navigates to the CampusDean staging login page.
   * @returns {Promise<import('@playwright/test').Response | null>}
   */
  async gotoLoginPage() {
    return await this.page.goto(env.loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
  }

  /**
   * Enters the username into the User Name input field.
   * Clears any existing value before typing.
   * @param {string} username
   */
  async enterUsername(username) {
    await this.usernameInput.waitFor({ state: 'visible' });
    await this.usernameInput.fill(username);
  }

  /**
   * Enters the password into the Password input field.
   * Note: The CampusDean login page renders the password field with an initial
   * readonly="readonly" attribute to prevent browser autofill, which is removed
   * on focus/click. We click and ensure the readonly attribute is cleared before typing.
   * @param {string} password
   */
  async enterPassword(password) {
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.passwordInput.click();
    await this.passwordInput.evaluate((el) => el.removeAttribute('readonly'));
    await this.passwordInput.fill(password);
  }

  /**
   * Clicks the 'Log In' submission button.
   * Uses noWaitAfter: true to decouple click execution from the destination page's
   * full load event, preventing timeouts caused by heavy background dashboard widgets.
   */
  async clickLogin() {
    await this.loginButton.waitFor({ state: 'visible' });
    await this.loginButton.click({ noWaitAfter: true });
  }

  /**
   * Executes a complete login flow with given credentials.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLogin();
  }

  /**
   * Clears both username and password input fields.
   */
  async clearCredentials() {
    await this.usernameInput.fill('');
    await this.passwordInput.click();
    await this.passwordInput.evaluate((el) => el.removeAttribute('readonly'));
    await this.passwordInput.fill('');
  }

  /**
   * Verifies if the essential login controls are visible on the page.
   * @returns {Promise<boolean>}
   */
  async areLoginControlsVisible() {
    const isHeadingVisible = await this.loginHeading.isVisible();
    const isUsernameVisible = await this.usernameInput.isVisible();
    const isPasswordVisible = await this.passwordInput.isVisible();
    const isButtonVisible = await this.loginButton.isVisible();
    return isHeadingVisible && isUsernameVisible && isPasswordVisible && isButtonVisible;
  }

  /**
   * Retrieves the validation error message text displayed under the User Name field.
   * @returns {Promise<string>}
   */
  async getUsernameValidationMessage() {
    await this.usernameValidationError.waitFor({ state: 'attached' });
    return (await this.usernameValidationError.innerText()).trim();
  }

  /**
   * Retrieves the validation error message text displayed under the Password field.
   * @returns {Promise<string>}
   */
  async getPasswordValidationMessage() {
    await this.passwordValidationError.waitFor({ state: 'attached' });
    return (await this.passwordValidationError.innerText()).trim();
  }

  /**
   * Retrieves any server-side error message or popup alert text displayed on failed login.
   * @returns {Promise<string>}
   */
  async getGeneralErrorMessage() {
    // Check if sweetalert popup is present
    if (await this.sweetAlertModal.isVisible()) {
      return (await this.sweetAlertText.innerText()).trim();
    }
    // Check if invalid user span contains text
    if (await this.invalidUserServerMessage.isVisible()) {
      const msg = (await this.invalidUserServerMessage.innerText()).trim();
      if (msg) return msg;
    }
    return '';
  }

  /**
   * Checks whether the password input field has type="password" to ensure masking.
   * @returns {Promise<boolean>}
   */
  async isPasswordMasked() {
    const type = await this.passwordInput.getAttribute('type');
    return type === 'password';
  }

  /**
   * Toggles the Remember Me checkbox.
   */
  async toggleRememberMe() {
    await this.rememberMeCheckbox.click();
  }

  /**
   * Checks if the Remember Me checkbox is checked.
   * @returns {Promise<boolean>}
   */
  async isRememberMeChecked() {
    return await this.rememberMeCheckbox.isChecked();
  }
}

module.exports = LoginPage;
