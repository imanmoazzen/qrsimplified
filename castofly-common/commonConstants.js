export const EMAIL_TYPES = {
  EMAIL_VERIFICATION: "email_verification",
  USER_FEEDBACK: "user_feedback",
};

export const USER_FEEDBACK_LISTENERS = ["imanmoaz@gmail.com"];

export const EMAIL_INVITEE_QUERY_STRING_KEY = "invitee";
export const VERIFICATION_CODE = "code";

export const API_RESPONSE_TYPES = {
  ACCESS_DENIED: "ACCESS_DENIED",
  ERROR: "ERROR",
  SUCCESS: "SUCCESS",
  NOT_FOUND: "NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
};

export const HTTP_STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  TEMPORARY_REDIRECT: 302,
  CLIENT_ERROR: 400,
  UNAUTHORIZED: 401,
  SERVER_ERROR: 500,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
};

// used to mark a permission table entry grantee as being
// of a different type (e.g. pending permission, group permission)
export const ID_PREFIXES = {
  PENDING: "#PENDING#",
  ANONYMOUS: "#ANONYMOUS#",
};

export const AUTH_SUBDOMAINS = {
  APP: "APP",
};

export const REFERRAL_PERCENTAGE = 25;

export const LOGIN_ERROR = {
  EMAIL_NOT_VALID: "Please enter a valid email address.",
  EMAIL_ALREADY_IN_USE_PASSWORDLESS: "An account with this email already exists. Please continue with your email.",
  EMAIL_ALREADY_IN_USE_GOOGLE: "An account with this email exists. Please continue with Google.",
  CODE_MISSING: "The code is missing.",
  CODE_EXPIRED: "The code has expired.",
  CODE_INCORRECT: "The code is incorrect.",
  TOO_MANY_ATTEMPTS: "Too many attempts. Please wait a little and try again.",
  TOO_MANY_WRONG_ATTEMPTS: "Too many incorrect attempts. Please try again later.",
};
