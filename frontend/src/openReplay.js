import Tracker from "@openreplay/tracker";

import appSettings from "./appSettings.js";
import { APP_CONSTANTS } from "./frontEndConstants.js";

let isOpenReplayInitialized = false;

export const initOpenReplayForApp = (user) => {
  const { display_name, email } = user;
  const isRequired = isTrackingRequired(email);

  if (isOpenReplayInitialized || !isRequired) return;

  try {
    const tracker = createTracker("open_replay_main_app.key");
    tracker.start();
    tracker.setUserID(email);
    tracker.setMetadata("DisplayName", display_name);
    isOpenReplayInitialized = true;
  } catch (err) {
    console.error("Attempted to initialize OpenReplay, but something went wrong.", err);
  }
};

const isTrackingRequired = (email) => {
  const isEnabled = appSettings.get("open_replay_main_app.enabled");
  if (isEnabled) {
    if (appSettings.isProduction()) return !isDeveloper(email);
    return true;
  }
  return false;
};

const isDeveloper = (email) => {
  return !email
    ? false
    : APP_CONSTANTS.EXCLUDED_EMAIL_PATTERNS_FOR_GA_TRACKING.some((address) => email.includes(address));
};

const createTracker = (key) => {
  if (appSettings.isDevelopment()) {
    return new Tracker({ projectKey: appSettings.get(key), __DISABLE_SECURE_MODE: true });
  }
  return new Tracker({ projectKey: appSettings.get(key) });
};
