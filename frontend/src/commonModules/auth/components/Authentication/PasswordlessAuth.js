import { isEmailValid } from "castofly-common";
import { APP_PAGES } from "castofly-common/appPages.js";
import { LOGIN_ERROR } from "castofly-common/commonConstants.js";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../../commonComponents/InputBox/InputBox.js";
import { COMMON_MESSAGES } from "../../../../frontEndConstants.js";
import { SIGNUP_ERRORS } from "../../constants.js";
import { setSession } from "../../store/uiReducer.js";
import { PASSWORDLESS_FLOW_STATE, authenticate, startEmailPasswordlessLogin } from "../cognitoUtils.js";
import { verifyEmailPasswordlessLogin } from "../cognitoUtils.js";
import { verifyEmailPasswordlessSignup } from "../cognitoUtils.js";
import OTPInput from "../OTPInput.js";
import styles from "./PasswordlessAuth.module.scss";

const PasswordlessAuth = ({ setIsPasswordLessStarted, message, setMessage }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState(PASSWORDLESS_FLOW_STATE.CODE);
  const [isBusy, setIsBusy] = useState(false);

  const isStartOverRequired = message === LOGIN_ERROR.CODE_EXPIRED;

  const handleCodeGeneration = async () => {
    if (!isEmailValid(email)) return setMessage(LOGIN_ERROR.EMAIL_NOT_VALID);

    setMessage("");
    setIsBusy(true);

    try {
      const state = await startEmailPasswordlessLogin(email);
      setState(state);
      setIsPasswordLessStarted(true);
      setMessage(`A code has been sent to ${email}. Check your inbox (and spam) and enter the code above.`);
    } catch (error) {
      if (error?.message.includes(LOGIN_ERROR.EMAIL_ALREADY_IN_USE_GOOGLE)) {
        const navigationState = {
          errorMessage: LOGIN_ERROR.EMAIL_ALREADY_IN_USE_GOOGLE,
          errorType: SIGNUP_ERRORS.EMAIL_ALREADY_IN_USE,
        };

        navigate(APP_PAGES.LOGIN, { state: navigationState });
      } else if (error?.message.includes("limit exceeded")) {
        setMessage(LOGIN_ERROR.TOO_MANY_ATTEMPTS);
      } else {
        setMessage(COMMON_MESSAGES.GENERIC_ERROR);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleCodeVerification = async () => {
    if (isStartOverRequired) {
      setMessage("");
      setIsPasswordLessStarted(false);
      setState(PASSWORDLESS_FLOW_STATE.CODE);
      navigate(APP_PAGES.LOGIN);
      return;
    }

    if (!code.trim()) return setMessage(LOGIN_ERROR.CODE_MISSING);

    setMessage("");
    setIsBusy(true);

    try {
      let verifyFunc;
      if (state === PASSWORDLESS_FLOW_STATE.LOGIN) verifyFunc = verifyEmailPasswordlessLogin;
      if (state === PASSWORDLESS_FLOW_STATE.SIGNUP) verifyFunc = verifyEmailPasswordlessSignup;

      await verifyFunc?.(email, code.trim());

      const session = await authenticate();
      dispatch(setSession(session));
      navigate(APP_PAGES.DASHBOARD);
    } catch (error) {
      if (error?.message?.includes("Invalid code")) setMessage(LOGIN_ERROR.CODE_INCORRECT);
      else if (error?.message?.includes("expired")) setMessage(LOGIN_ERROR.CODE_EXPIRED);
      else if (error?.message?.includes("many invalid credentials attempts"))
        setMessage(LOGIN_ERROR.TOO_MANY_WRONG_ATTEMPTS);
      else setMessage(COMMON_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className={styles["main-container"]}>
      {state === PASSWORDLESS_FLOW_STATE.CODE && (
        <>
          <InputBox
            value={email}
            setValue={setEmail}
            placeholder="Enter your email address"
            onFocus={() => setMessage("")}
            onEnter={handleCodeGeneration}
            isRippling={
              message === LOGIN_ERROR.EMAIL_NOT_VALID || message === LOGIN_ERROR.EMAIL_ALREADY_IN_USE_PASSWORDLESS
            }
          />
          <DecoratedButton
            icon="mail"
            buttonText={isBusy ? "Processing..." : "Send code"}
            onClick={handleCodeGeneration}
            extraContainerClasses={styles["button-container"]}
            theme={BUTTON_THEMES.COLORED}
            isBusy={isBusy}
          />
        </>
      )}

      {state !== PASSWORDLESS_FLOW_STATE.CODE && (
        <>
          <OTPInput setCode={setCode} length={state === PASSWORDLESS_FLOW_STATE.SIGNUP ? 6 : 8} />
          <DecoratedButton
            icon={isStartOverRequired ? "refresh" : "check"}
            buttonText={isBusy ? "Processing..." : isStartOverRequired ? "Start over" : "Confirm code"}
            onClick={handleCodeVerification}
            extraClasses={styles["confirm-button"]}
            theme={BUTTON_THEMES.COLORED}
            isBusy={isBusy}
          />
        </>
      )}
    </div>
  );
};

export default PasswordlessAuth;
