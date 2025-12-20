import { getJWTPayload } from "castofly-common";
import { AUTHENTICATION_PAGES } from "castofly-common/appPages.js";

import { history } from "../../../commonUtil/history.js";
import config from "../config.js";

const TOKEN_URL = `${config.cognito.userPoolBaseUri}/oauth2/token`;

const ACCESS_TOKEN_KEY = config.accessTokenKey;
const REFRESH_TOKEN_KEY = config.refreshTokenKey;
const ID_TOKEN_KEY = config.idTokenKey;
const ANONYMOUS_ACCESS_TOKEN_KEY = config.anonymousAccessTokenKey;

const TOKEN_TYPES = {
  COGNITO: "COGNITO",
  ANONYMOUS: "ANONYMOUS",
  BOTH: "BOTH",
  NONE: "NONE",
};

// Call this when the app is loaded.
// Returns a promise which will give a user session object if authentication is sucessful.
// First, it checks localStorage to see what auth tokens are saved locally:
// If any Cognito tokens are found:
//  Loads the user's tokens from localStorage,
//  refreshes using the refresh token if needed, redirects the user to the sign-in page if the tokens do not exist or are not valid.
// If no Cognito tokens are found, but an anonymous user token is found:
//  Loads the anonymous user token from localStorage, returns a session object constructed from it.
// If no tokens of any kind are found, requests and stores an anonymous user token from APIv2.
export async function authenticate(setSessionCallback) {
  try {
    switch (getTypeOfTokensAvailable()) {
      case TOKEN_TYPES.BOTH: {
        await migrateAnonymousToken();
        // falls through to next case
      }
      case TOKEN_TYPES.COGNITO: {
        try {
          return await getSession(setSessionCallback);
        } catch {
          await attemptTokenRefresh();
          return await getSession(setSessionCallback);
        }
      }
      case TOKEN_TYPES.ANONYMOUS: {
        return getAnonymousSessionInfo();
      }
      case TOKEN_TYPES.NONE: {
        await getAnonymousToken();
        return getAnonymousSessionInfo();
      }
    }
  } catch (err) {
    // Got some kind of unhandled error; clear the tokens and try again from scratch.
    console.error("Token error:", err);
    removeAuthTokens();
    await redirectToLoginPage();
  }
}

function getTypeOfTokensAvailable() {
  const idToken = localStorage.getItem(ID_TOKEN_KEY);
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const anonymousToken = localStorage.getItem(ANONYMOUS_ACCESS_TOKEN_KEY);
  const allCognitoTokens = idToken && accessToken && refreshToken; // only consider the cognito tokens if all three are present
  if (allCognitoTokens && anonymousToken) return TOKEN_TYPES.BOTH;
  if (allCognitoTokens) return TOKEN_TYPES.COGNITO;
  if (anonymousToken) return TOKEN_TYPES.ANONYMOUS;
  return TOKEN_TYPES.NONE;
}

function getAnonymousSessionInfo() {
  const accessToken = localStorage.getItem(ANONYMOUS_ACCESS_TOKEN_KEY);
  if (!accessToken) throw new Error("Token missing");
  const accessTokenPayload = getJWTPayload(accessToken);
  if (!accessTokenPayload) throw new Error("Token payload missing or corrupt.");

  return {
    user: {
      user_id: accessTokenPayload["sub"],
      display_name: "Guest User",
      username: "anonymous_user",
      email: undefined,
      picture: undefined,
    },
    isAuthenticated: true,
    isAnonymous: true,
  };
}

async function getAnonymousToken() {
  const response = await fetch(config.apiv2AnonymousTokenEndpoint, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to connect to APIv2 anonymous token endpoint");
  const { token } = await response.json();
  localStorage.setItem(ANONYMOUS_ACCESS_TOKEN_KEY, token);
  return { accessToken: token };
}

async function migrateAnonymousToken() {
  const anonymousToken = localStorage.getItem(ANONYMOUS_ACCESS_TOKEN_KEY);
  await fetch(config.apiv2MigrateEndpoint, {
    method: "POST",
    body: JSON.stringify({
      anonymousToken,
    }),
    headers: {
      Authorization: await getAccessToken(),
    },
  });

  localStorage.removeItem(ANONYMOUS_ACCESS_TOKEN_KEY);
}

async function getSession(setSessionCallback) {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!tokenValid(accessToken)) throw new Error("Token expired or otherwise invalid.");

  const session = await getSessionFromServer(accessToken);
  setSessionCallback?.(session);
  return session;
}

async function getSessionFromServer(accessToken) {
  const response = await fetch(config.apiv2UserInfoEndpoint, {
    method: "GET",
    headers: {
      Authorization: accessToken,
    },
  });

  const result = await response.json();
  delete result["message"];
  delete result["info"];

  return result;
}

// NOTE: This function only works on access and id tokens.
// Refresh tokens do not have a readable payload.
function tokenValid(token) {
  if (!token) return false;
  const payload = getJWTPayload(token);
  if (!payload) return false;

  let payloadClientID = payload.client_id ? payload.client_id : payload.aud;
  const currentTimestamp = Date.now() / 1000;

  return (!payload.exp || payload.exp > currentTimestamp) && payloadClientID === config.cognito.clientId;
}

async function attemptTokenRefresh() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    try {
      return await getNewTokensWithRefreshToken(refreshToken);
    } catch {
      // the refresh token failed to get us new tokens, so let's clear all the
      // auth tokens and start clean
      removeAuthTokens();
      await redirectToLoginPage();
    }
  } else {
    await redirectToLoginPage();
  }
}

async function getNewTokensWithRefreshToken(refreshToken) {
  const body = "grant_type=refresh_token&client_id=" + config.cognito.clientId + "&refresh_token=" + refreshToken;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("Bad refresh token");
  const { access_token, id_token } = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(ID_TOKEN_KEY, id_token);
  return { accessToken: access_token, idToken: id_token };
}

async function redirectToLoginPage() {
  // Below check: Temporary workaround for the fact that it is not possible to visit the login
  // page while *completely* unauthenticated. The user needs to at least be authenticated
  // as an anonymous user.
  if (getTypeOfTokensAvailable() === TOKEN_TYPES.NONE) {
    try {
      await getAnonymousToken();
    } catch (err) {
      console.error("Anonymous token fetch failed! Err: ", err);
    }
  }
  history.navigate(AUTHENTICATION_PAGES.LOGIN);
}

// Retrieve the users access token (so you can make an API call with it)
// Don't store the token elsewhere; this function also checks that the token is still valid and handles refreshing it.
//
// NOTE: If the access token AND the refresh token are invalid this will redirect the user to the sign-in page.
// At that point any unsaved progress will be lost
export async function getAccessToken() {
  switch (getTypeOfTokensAvailable()) {
    case TOKEN_TYPES.BOTH:
    case TOKEN_TYPES.COGNITO: {
      const currentAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (tokenValid(currentAccessToken)) return currentAccessToken;
      const { accessToken } = await attemptTokenRefresh();
      return accessToken;
    }
    case TOKEN_TYPES.ANONYMOUS: {
      return localStorage.getItem(ANONYMOUS_ACCESS_TOKEN_KEY);
    }
    case TOKEN_TYPES.NONE: {
      const { accessToken } = await getAnonymousToken();
      return accessToken;
    }
  }
}

// Call this when the user has been redirected back to our app from Google sign-in
export async function handleCallbackURL(href) {
  const url = new URL(href);
  const authorizationCode = url.searchParams.get("code");

  const body =
    "grant_type=authorization_code&client_id=" +
    config.cognito.clientId +
    "&code=" +
    authorizationCode +
    "&redirect_uri=" +
    config.cognito.callbackUri;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) throw response.status;
  const { access_token, id_token, refresh_token } = await response.json();
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(ID_TOKEN_KEY, id_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
}

export function removeAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
