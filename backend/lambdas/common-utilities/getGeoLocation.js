export const getGeoLocation = async (event) => {
  const headers = event.headers || {};

  const xff =
    headers["x-forwarded-for"] ||
    headers["X-Forwarded-For"] ||
    headers["X-FORWARDED-FOR"] ||
    headers["x_forwarded_for"];

  const userIp =
    (xff && xff.split(",")[0].trim()) ||
    event.requestContext?.http?.sourceIp || // HTTP API v2
    event.requestContext?.identity?.sourceIp || // REST API
    undefined;

  if (!userIp) return {};

  try {
    const url = `https://ipinfo.io/${userIp}/json`;
    const res = await fetch(url);
    return await res.json();
  } catch {
    return {};
  }
};
