import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { history } from "../../../commonUtil/history.js";
import { STATE_KEYS, getStateParts } from "../../../commonUtil/stateParameters.js";
import { APP_PAGES, AUTHENTICATION_PAGES } from "../../../frontEndConstants.js";
import {
  COGNITO_AUTH_CODE_KEY,
  COGNITO_ERRORS,
  COGNITO_ERROR_KEYS,
  COGNITO_PRESIGNUP_FAILURE_RE,
  SIGNUP_ERRORS,
} from "../constants.js";
import { setSession, setSessionLoadComplete } from "../store/uiReducer.js";
import { authenticate, handleCallbackURL } from "./cognitoUtils.js";
import RequestSignupModal from "./RequestSignupModal.js";

function AuthWrapper({ module, children }) {
  // This provides a global way to navigate outside of a functional component.
  history.navigate = useNavigate();
  history.location = useLocation();

  const searchParams = new URLSearchParams(window.location.search);
  const session = useSelector(module.sessionSelector);
  const isAnonymous = useSelector(module.isAnonymousSelector);

  const { isAuthenticated } = session ?? {};
  const dispatch = useDispatch();

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
          stateKey === STATE_KEYS.AUTH
            ? `${AUTHENTICATION_PAGES.SIGNUP}?redirect=${window.btoa(stateValue)}`
            : AUTHENTICATION_PAGES.SIGNUP;
        history.navigate(url, { state: navigationState });
      }
    }
  }, [isAuthenticated]);

  const setSessionCallback = (session) => dispatch(setSession(session));

  useEffect(() => {
    if (!isAuthenticated) {
      const code = searchParams.get(COGNITO_AUTH_CODE_KEY);
      const isNonAuthRedirect =
        (searchParams.has("state") && getStateParts(searchParams.get("state"))[0] !== STATE_KEYS.AUTH) ||
        window.location.pathname !== "/";
      if (code && !isNonAuthRedirect) {
        handleCallbackURL(window.location.href)
          .then(() => {
            const url = new URL(window.location.href);
            const pastState = url.searchParams.get("state");
            let redirectTo = APP_PAGES.DASHBOARD;
            if (pastState) {
              const [key, value] = getStateParts(pastState);
              if (key === STATE_KEYS.AUTH) redirectTo = value;
            }
            history.navigate(redirectTo);
            return authenticate(setSessionCallback);
          })
          .then((session) => {
            dispatch(setSession(session));
            dispatch(setSessionLoadComplete());
          });
      } else {
        authenticate(setSessionCallback).then((session) => {
          dispatch(setSession(session));
          dispatch(setSessionLoadComplete());
        });
      }
    }
  }, [isAuthenticated]);

  if (isAuthenticated && isAnonymous) {
    return (
      <>
        <RequestSignupModal module={module} />
        {children}
      </>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  } else {
    return null;
  }
}

export default AuthWrapper;
