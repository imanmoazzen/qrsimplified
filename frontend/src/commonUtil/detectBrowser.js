import { detect } from "detect-browser";

export function detectBrowser() {
  const browserName = (detect() && detect().name) || "CANNOT_DETECT";
  const browserVersion = (detect() && detect().version) || "CANNOT_DETECT";
  const browserOS = (detect() && detect().os) || "CANNOT_DETECT";
  return {
    name: browserName,
    version: browserVersion,
    os: browserOS,
  };
}
