import { CognitoUserPool } from "amazon-cognito-identity-js";
import { APP_PAGES } from "castofly-common/appPages.js";

import { history } from "../../../commonUtil/history.js";
import { AbstractModule } from "../../project-root/index.js";
import { getAccessToken, removeAuthTokens } from "../components/cognitoUtils.js";
import config from "../config.js";
import uiReducer, { uiInitialState } from "../store/uiReducer.js";

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

  redirectToLogin(postLoginPath = null, isSignup) {
    let extra = "";
    //base64 encode the post login path
    if (postLoginPath) extra = `?redirect=${window.btoa(postLoginPath)}`;
    history.navigate(`${isSignup ? APP_PAGES.SIGNUP : APP_PAGES.LOGIN}${extra}`);
  }

  signOut() {
    removeAuthTokens();
    const cognitoUser = this.userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }

    const LOGOUT_BASE_URL = `${config.cognito.userPoolBaseUri}/logout?`;
    const CLIENT_ID = `client_id=${config.cognito.clientId}`;
    const LOGOUT_URI = `&logout_uri=${config.cognito.callbackUri}${APP_PAGES.LOGIN}`;
    window.location.href = LOGOUT_BASE_URL + CLIENT_ID + LOGOUT_URI;
  }
}
