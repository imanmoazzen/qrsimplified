import { APP_PAGES } from "castofly-common/appPages.js";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { history } from "../../../commonUtil/history.js";
import { removeInitialLoadingIndicator } from "../../../commonUtil/initialLoadingIndicator.js";
import { STATE_KEYS, getStateParts } from "../../../commonUtil/stateParameters.js";
import {
  COGNITO_AUTH_CODE_KEY,
  COGNITO_ERRORS,
  COGNITO_ERROR_KEYS,
  COGNITO_PRESIGNUP_FAILURE_RE,
  SIGNUP_ERRORS,
} from "../constants.js";
import { setSession } from "../store/uiReducer.js";
import { authenticate, handleCallbackURL } from "./cognitoUtils.js";

function AuthWrapper({ module, children }) {
  history.navigate = useNavigate();
  const dispatch = useDispatch();
  const searchParams = new URLSearchParams(window.location.search);
  const session = useSelector(module.sessionSelector);

  const { isAnonymous, isAuthenticated } = session ?? {};

  useEffect(() => {
    if (isAuthenticated) removeInitialLoadingIndicator();
    if (!isAnonymous && isAuthenticated) history.navigate(APP_PAGES.DASHBOARD);
  }, [isAnonymous, isAuthenticated]);

  // This useEffect is wholly concerned with detecting errors in the query string
  // when signing up
  // If an error is found, we redirect to the signup page with the appropriate
  // error message and error type
  // If there is a state parameter in the query string, we preserve it as a part
  // of the redirect
  useEffect(() => {
    if (!isAuthenticated) {
      const error = searchParams.get(COGNITO_ERROR_KEYS.ERROR);
      if (error && error === COGNITO_ERRORS.INVALID_REQUEST) {
        const errorMessage = searchParams.get(COGNITO_ERROR_KEYS.ERROR_DESCRIPTION);
        const matches = errorMessage.match(COGNITO_PRESIGNUP_FAILURE_RE);
        let navigationState;

        if (matches?.length > 1) {
          navigationState = { errorMessage: matches[1], errorType: SIGNUP_ERRORS.EMAIL_ALREADY_IN_USE };
        } else {
          navigationState = { errorMessage, errorType: SIGNUP_ERRORS.UNKNOWN_ERROR };
        }

        const [stateKey, stateValue] = getStateParts(searchParams.get("state"));

        const url =
          stateKey === STATE_KEYS.AUTH ? `${APP_PAGES.LOGIN}?redirect=${window.btoa(stateValue)}` : APP_PAGES.LOGIN;

        history.navigate(url, { state: navigationState });
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      const code = searchParams.get(COGNITO_AUTH_CODE_KEY);
      const isNonAuth = searchParams.has("state") && getStateParts(searchParams.get("state"))[0] !== STATE_KEYS.AUTH;
      const isNonRoot = window.location.pathname !== "/";
      const isValidRedirect = !(isNonAuth || isNonRoot);

      if (code && isValidRedirect) {
        handleCallbackURL(window.location.href).then(() => {
          const url = new URL(window.location.href);
          const pastState = url.searchParams.get("state");
          let redirectTo = APP_PAGES.DASHBOARD;
          if (pastState) {
            const [key, value] = getStateParts(pastState);
            if (key === STATE_KEYS.AUTH) redirectTo = value;
          }

          history.navigate(redirectTo);
          authenticate().then((session) => dispatch(setSession(session)));
        });
      } else {
        authenticate().then((session) => dispatch(setSession(session)));
      }
    }
  }, [isAuthenticated]);

  return isAuthenticated ? children : null;
}

export default AuthWrapper;
