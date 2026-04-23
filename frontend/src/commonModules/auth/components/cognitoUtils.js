import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { getJWTPayload } from "castofly-common";
import { APP_PAGES } from "castofly-common/appPages.js";

import { history } from "../../../commonUtil/history.js";
import { server } from "../../../index.js";
import config from "../config.js";

const clientId = config.cognito.clientId;

const TOKEN_URL = `${config.cognito.userPoolBaseUri}/oauth2/token`;
const ACCESS_TOKEN_KEY = `access-token-${clientId}`;
const REFRESH_TOKEN_KEY = `refresh-token-${clientId}`;
const ID_TOKEN_KEY = `id-token-${clientId}`;
const ANONYMOUS_ACCESS_TOKEN_KEY = `anon-token-${clientId}`;
const COGNITO_CHALLENGE_SESSION_KEY = `cognito-challenge-session-${clientId}`;

const TOKEN_TYPES = {
  COGNITO: "COGNITO",
  ANONYMOUS: "ANONYMOUS",
  BOTH: "BOTH",
  NONE: "NONE",
};

export const PASSWORDLESS_FLOW_STATE = {
  CODE: "code",
  LOGIN: "login",
  SIGNUP: "signup",
};

const cognitoIdpClient = new CognitoIdentityProviderClient({
  region: config.cognito.region,
});

function persistCognitoTokens({ access_token, id_token, refresh_token }) {
  if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  if (id_token) localStorage.setItem(ID_TOKEN_KEY, id_token);
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
}

export function removeAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(COGNITO_CHALLENGE_SESSION_KEY);
}

export async function authenticate() {
  try {
    switch (getTypeOfTokensAvailable()) {
      case TOKEN_TYPES.BOTH: {
        await migrateAnonymousToken();
        // falls through to next case
      }
      case TOKEN_TYPES.COGNITO: {
        return await getSession();
      }
      case TOKEN_TYPES.ANONYMOUS: {
        return getAnonymousSession();
      }
      case TOKEN_TYPES.NONE: {
        await getAnonymousToken();
        return getAnonymousSession();
      }
    }
  } catch (err) {
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

async function getAnonymousToken() {
  const response = await fetch(config.apiv2AnonymousTokenEndpoint, {
    method: "POST",
  });

  if (!response.ok) throw new Error("Failed to connect to APIv2 anonymous token endpoint");
  const { token } = await response.json();

  localStorage.setItem(ANONYMOUS_ACCESS_TOKEN_KEY, token);

  return token;
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

function getAnonymousSession() {
  const accessToken = localStorage.getItem(ANONYMOUS_ACCESS_TOKEN_KEY);
  if (!accessToken) throw new Error("Token missing");

  const payload = getJWTPayload(accessToken);
  if (!payload) throw new Error("Token payload missing or corrupt.");

  const user = { user_id: payload.sub, display_name: "Guest" };

  return { isAnonymous: true, isAuthenticated: true, user };
}

async function getSession() {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!isTokenValid(accessToken)) await attemptTokenRefresh();

  const idToken = localStorage.getItem(ID_TOKEN_KEY);
  const payload = getJWTPayload(idToken);

  const { sub, email, given_name, picture } = payload;
  const display_name = given_name || (email?.split("@")[0] ?? "");

  const response = await server.requestFromApiv2("/user/info", {
    method: "GET",
    mode: "cors",
  });

  return { isAnonymous: false, isAuthenticated: true, user: response?.data?.user ?? {} };
}

// NOTE: This function only works on access and id tokens.
// Refresh tokens do not have a readable payload.
function isTokenValid(token) {
  const payload = token && getJWTPayload(token);
  if (!payload) return false;

  const now = Date.now() / 1000;
  const clientId = payload.client_id ?? payload.aud;

  return (!payload.exp || payload.exp > now) && clientId === config.cognito.clientId;
}

async function attemptTokenRefresh() {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error("Refresh token missing");

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

    return access_token;
  } catch {
    // the refresh token failed to get us new tokens, so let's clear all the
    // auth tokens and start clean
    await redirectToLoginPage();
  }
}

async function redirectToLoginPage() {
  // Below check: Temporary workaround for the fact that it is not possible to visit the login
  // page while *completely* unauthenticated. The user needs to at least be authenticated
  // as an anonymous user.

  try {
    removeAuthTokens();
    await getAnonymousToken();
    history.navigate(APP_PAGES.LOGIN);
  } catch (err) {
    console.error("cannot redirect to the login page!", err);
  }
}

// Retrieve the users access token (so you can make an API call with it)
// Don't store the token elsewhere; this function also checks that the token is still valid and handles refreshing it.
// NOTE: If the access token AND the refresh token are invalid this will redirect the user to the sign-in page.
// At that point any unsaved progress will be lost
export async function getAccessToken() {
  switch (getTypeOfTokensAvailable()) {
    case TOKEN_TYPES.BOTH:
    case TOKEN_TYPES.COGNITO: {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (isTokenValid(accessToken)) return accessToken;
      return await attemptTokenRefresh();
    }
    case TOKEN_TYPES.ANONYMOUS: {
      return localStorage.getItem(ANONYMOUS_ACCESS_TOKEN_KEY);
    }
    case TOKEN_TYPES.NONE: {
      return await getAnonymousToken();
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

  persistCognitoTokens({ access_token, id_token, refresh_token });
}

export async function startEmailPasswordlessLogin(email) {
  const username = email.trim().toLowerCase();

  try {
    const command = new InitiateAuthCommand({
      ClientId: config.cognito.clientId,
      AuthFlow: "USER_AUTH",
      AuthParameters: {
        USERNAME: username,
        PREFERRED_CHALLENGE: "EMAIL_OTP",
      },
    });

    const response = await cognitoIdpClient.send(command);
    if (!response.Session) throw new Error("Missing Cognito challenge session");

    localStorage.setItem(COGNITO_CHALLENGE_SESSION_KEY, response.Session);

    return PASSWORDLESS_FLOW_STATE.LOGIN;
  } catch (err) {
    if (err?.name === "UserNotFoundException") {
      return await startEmailPasswordlessSignup(username);
    } else if (err?.name === "UserNotConfirmedException") {
      await resendPasswordlessSignupCode(username);
      return PASSWORDLESS_FLOW_STATE.SIGNUP;
    }

    throw err;
  }
}

export async function startEmailPasswordlessSignup(email) {
  const username = email.trim().toLowerCase();

  const command = new SignUpCommand({
    ClientId: config.cognito.clientId,
    Username: username,
    Password: undefined, // COMMENT: passwordless sign-up
    UserAttributes: [{ Name: "email", Value: username }],
  });

  await cognitoIdpClient.send(command);

  return PASSWORDLESS_FLOW_STATE.SIGNUP;
}

export async function resendPasswordlessSignupCode(email) {
  const username = email.trim().toLowerCase();

  const response = await cognitoIdpClient.send(
    new ResendConfirmationCodeCommand({
      ClientId: config.cognito.clientId,
      Username: username,
    })
  );

  return response;
}

export async function verifyEmailPasswordlessLogin(email, otpCode) {
  const username = email.trim().toLowerCase();
  const session = localStorage.getItem(COGNITO_CHALLENGE_SESSION_KEY);

  if (!session) throw new Error("Missing Cognito challenge session");

  const command = new RespondToAuthChallengeCommand({
    ClientId: config.cognito.clientId,
    ChallengeName: "EMAIL_OTP",
    Session: session,
    ChallengeResponses: {
      USERNAME: username,
      EMAIL_OTP_CODE: otpCode.trim(),
    },
  });

  const response = await cognitoIdpClient.send(command);
  const result = response.AuthenticationResult;

  if (!result?.AccessToken || !result?.IdToken) throw new Error("Passwordless login did not return tokens");

  persistCognitoTokens({
    access_token: result.AccessToken,
    id_token: result.IdToken,
    refresh_token: result.RefreshToken,
  });

  localStorage.removeItem(COGNITO_CHALLENGE_SESSION_KEY);
}

export async function verifyEmailPasswordlessSignup(email, otpCode) {
  const username = email.trim().toLowerCase();

  const confirmResponse = await cognitoIdpClient.send(
    new ConfirmSignUpCommand({
      ClientId: config.cognito.clientId,
      Username: username,
      ConfirmationCode: otpCode.trim(),
    })
  );

  const authResponse = await cognitoIdpClient.send(
    new InitiateAuthCommand({
      ClientId: config.cognito.clientId,
      AuthFlow: "USER_AUTH",
      Session: confirmResponse.Session, // direct sign-in after confirm
      AuthParameters: {
        USERNAME: username,
        PREFERRED_CHALLENGE: "EMAIL_OTP",
      },
    })
  );

  const result = authResponse.AuthenticationResult;

  if (!result?.AccessToken || !result?.IdToken) {
    throw new Error("Passwordless signup confirmation did not return tokens");
  }

  persistCognitoTokens({
    access_token: result.AccessToken,
    id_token: result.IdToken,
    refresh_token: result.RefreshToken,
  });

  localStorage.removeItem(COGNITO_CHALLENGE_SESSION_KEY);
}
