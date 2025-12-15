import { AuthenticationDetails, CognitoUser, CognitoUserPool } from "amazon-cognito-identity-js";

import appSettings from "../../../appSettings.js";
import { history } from "../../../commonUtil/history.js";
import { APP_PAGES, AUTHENTICATION_PAGES } from "../../../frontEndConstants.js";
import { AbstractModule } from "../../project-root/index.js";
import { authenticate, getAccessToken, removeAuthTokens } from "../components/cognitoUtils.js";
import config from "../config.js";
import { LOGIN_STATUS } from "../constants.js";
import uiReducer, { setSession, setSessionLoadComplete, uiInitialState } from "../store/uiReducer.js";

const ACCESS_TOKEN_KEY = config.accessTokenKey;
const ID_TOKEN_KEY = config.idTokenKey;
const REFRESH_TOKEN_KEY = config.refreshTokenKey;
const FORGOT_PASSWORD_URL = `${appSettings.get("api.user_auth_endpoint")}/forgot-password`;

export default class AuthModule extends AbstractModule {
  userPool;

  constructor({ parentModule, name }) {
    super({ parentModule, name });
    this.userPool = new CognitoUserPool({
      UserPoolId: config.cognito.userPool,
      ClientId: config.cognito.clientId,
    });
  }

  connectCustomStoreSubscribers = (store) => {
    this.dispatch = store.dispatch;
  };

  uiInitialState = uiInitialState;
  uiReducer = uiReducer;

  getAccessToken = () => getAccessToken();

  sessionSelector = (state) => state.ui[this.name].session ?? {};
  userSelector = (state) => state.ui[this.name].session?.user ?? {};
  userIdSelector = (state) => state.ui[this.name].session?.user?.user_id;
  userEmailSelector = (state) => state.ui[this.name].session?.user?.email;
  displayNameSelector = (state) => state.ui[this.name].session?.user?.display_name;
  isAnonymousSelector = (state) => Boolean(state.ui[this.name]?.session?.isAnonymous);

  isSessionLoadCompleteSelector = (state) => state.ui[this.name].isSessionLoadComplete;
  signupModalVisibleSelector = (state) => state.ui[this.name].pleaseSignupModalVisible;

  // 2024-06-20: modified this to use the email as username
  signUp(email, password) {
    return new Promise((resolve, reject) => {
      this.userPool.signUp(email, password, [{ Name: "email", Value: email }], null, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result.user);
      });
    });
  }

  confirmSignUp(email, code, password) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.logIn(email, password)
          .then((response) => resolve(response))
          .catch((err) => reject(err));
      });
    });
  }

  redirectToLogin(postLoginPath = null, isSignup) {
    let extra = "";
    //base64 encode the post login path
    if (postLoginPath) extra = `?redirect=${window.btoa(postLoginPath)}`;
    history.navigate(`${isSignup ? AUTHENTICATION_PAGES.SIGNUP : AUTHENTICATION_PAGES.LOGIN}${extra}`);
  }

  logIn(email, password) {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: this.userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const {
            accessToken: { jwtToken: access_token },
            idToken: { jwtToken: id_token },
            refreshToken: { token: refresh_token },
          } = result;

          localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
          localStorage.setItem(ID_TOKEN_KEY, id_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);

          const url = new URL(window.location.href);
          const redirectData = url.searchParams.get("redirect");
          let navigateTo;

          if (redirectData) {
            let postLoginRedirect = window.atob(redirectData);
            if (postLoginRedirect[0] !== "/") postLoginRedirect = "/" + postLoginRedirect;
            navigateTo = postLoginRedirect;
          } else {
            navigateTo = APP_PAGES.DASHBOARD;
          }

          authenticate().then((session) => {
            if (session) this.dispatch(setSession(session));
            this.dispatch(setSessionLoadComplete());
            resolve({ result, status: LOGIN_STATUS.SUCCESS, navigateTo });
          });
        },
        newPasswordRequired: () => {
          resolve({ user: cognitoUser, status: LOGIN_STATUS.NEW_PASSWORD_REQUIRED });
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  handleNewPassword(cognitoUser, newPassword, sessionUserAttributes) {
    return new Promise((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(newPassword, sessionUserAttributes, {
        onSuccess: (result) => resolve(result),
        onFailure: (err) => reject(err),
      });
    });
  }

  forgotPassword(email) {
    return new Promise((resolve, reject) => {
      fetch(FORGOT_PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        cache: "no-cache",
        body: JSON.stringify({ usernameOrEmail: email }),
      })
        .then((response) => {
          response.json().then((json) => {
            if (response.ok) {
              resolve(json);
            } else {
              reject(json.message);
            }
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  resetPassword(username, confirmationCode, newPassword) {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool,
      });

      cognitoUser.confirmPassword(confirmationCode, newPassword, {
        onSuccess: () => {
          this.logIn(username, newPassword)
            .then((response) => resolve(response))
            .catch((err) => reject(err));
        },
        onFailure: (err) => {
          reject(err);
        },
      });
    });
  }

  signOut() {
    removeAuthTokens();
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    const LOGOUT_BASE_URL = `${config.cognito.userPoolBaseUri}/logout?`;
    const CLIENT_ID = `client_id=${config.cognito.clientId}`;
    const LOGOUT_URI = `&logout_uri=${config.cognito.callbackUri}/login`;
    window.location.href = LOGOUT_BASE_URL + CLIENT_ID + LOGOUT_URI;
  }
}
