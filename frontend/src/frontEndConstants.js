export const APP_CONSTANTS = {
  EXCLUDED_EMAIL_PATTERNS_FOR_GA_TRACKING: ["@qrsimplified.com"],
};

export const DOCUMENT_HEAD_META = {
  TITLE: "QR Simplified",
  CHARSET: "utf-8",
  DESCRIPTION: "Branded QR codes that never expire — with powerful tracking.",
  VIEWPORT: "width=device-width, initial-scale=1",
};

export const AUTHENTICATION_PAGES = {
  CONFIRM_SIGNUP: "/confirm-sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  LOGIN: "/login",
  RESET_PASSWORD: "/reset-password",
  RESET_PASSWORD_BY_USERNAME: "/reset-password/:username",
  SIGNUP: "/signup",
};

export const ERROR_PAGES = {
  ACCESS_DENIED: "/error/403",
  NOT_FOUND: "/error/404",
  UNKNOWN: "/error/500",
};

export const APP_PAGES = {
  CART: "/cart",
  PROFILE: "/profile",
  FAQ: "/faq",
  DASHBOARD: "/",
  UPGRADE: "/upgrade",
  FEEDBACK: "/feedback",
};

export const JSON_CONTENT_TYPE = "application/json";

export const PRIMARY_COLOR = "#564de6";
export const BLUE_COLOR = "#00fff2";
export const PRIMARY_COLOR_TRANSPARENT = "#635bff3F";

export const COMMON_MESSAGES = {
  GENERIC_ERROR: "Something went wrong. Please contact us at info@qrsimplified.com for assistance.",
  EMAIL_NOT_VALID: "Email address is not valid.",
  EMAIL_NOT_VERIFIED: "Your email address is not verified.",
};
