export const LOGIN_STATUS = {
  SUCCESS: "SUCCESS",
  NEW_PASSWORD_REQUIRED: "NEW_PASSWORD_REQUIRED",
};

export const COGNITO_ERRORS = {
  INVALID_REQUEST: "invalid_request",
};

export const COGNITO_ERROR_KEYS = {
  ERROR: "error",
  ERROR_DESCRIPTION: "error_description",
};

export const SIGNUP_ERRORS = {
  EMAIL_ALREADY_IN_USE: "EMAIL_ALREADY_IN_USE",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

export const COGNITO_PRESIGNUP_FAILURE_RE = /PreSignUp failed with error The email: (.*)/;

export const COGNITO_AUTH_CODE_KEY = "code";
