/**
 * Test data repository for CampusDean automation suite.
 * Contains static datasets, validation messages, and test inputs.
 */
module.exports = {
  // Static UI text expectations
  uiText: {
    heading: 'Login',
    subtitle: 'Enter your details below.',
    usernameLabel: 'User Name',
    passwordLabel: 'Password',
    loginButtonText: 'Log In',
    rememberMeText: 'Remember Me',
    forgotPasswordText: 'Forgot Password?',
    expectedDashboardPath: '/Dashboard/Index',
  },

  // Client-side and server-side validation error messages matching actual page behavior
  validationMessages: {
    // Note: Live ASP.NET validation renders in lowercase "enter user name" and "enter password"
    emptyUsername: /enter user name/i,
    emptyPassword: /enter password/i,
    usernameTooShort: /between/i,
    passwordTooShort: /between/i,
    invalidUserAlert: /invalid/i,
  },

  // Test credentials and boundary inputs
  invalidCredentials: {
    nonExistentUser: {
      username: 'invalid_qa_user_99999',
      password: 'InvalidPassword#123'
    },
    shortUsername: {
      username: 'ab',
      password: 'ValidPassword123'
    },
    shortPassword: {
      username: 'valid_user_name',
      password: '123'
    },
    specialChars: {
      username: "<script>alert('xss')</script>",
      password: "admin' OR '1'='1"
    }
  },

  // Supported languages in the login page dropdown
  languages: [
    { id: '1', label: 'En', class: 'en-us' },
    { id: '2', label: 'हिंदी', class: 'hi-IN' },
    { id: '3', label: 'ગુજ', class: 'gu-IN' },
    { id: '4', label: 'मराठी', class: 'mr-IN' }
  ]
};
