export const STATE_KEYS = {
  AUTH: "auth",
  INTERCOM: "intercom",
  NOTION: "notion",
  ZENDESK: "zendesk",
  CONFLUENCE: "confluence",
  JIRA: "jira",
  GOOGLE_SLIDES: "google_slides",
  SLACK: "slack",
  VIMEO: "vimeo",
  ASANA: "asana",
};

const stateDelimeter = ":";

export function getStateParts(state) {
  if (!state) return [null, null];
  const parts = window.atob(decodeURIComponent(state)).split(stateDelimeter);
  const [key, value] = parts;
  return [key, value];
}

export function makeState(key, value) {
  return window.btoa(key + stateDelimeter + value);
}
