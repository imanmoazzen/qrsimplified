import { FEATURE_FLAGS } from "castofly-common/featureFlags.js";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DecoratedButton from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Divider from "../../../../../../commonComponents/Divider/Divider.js";
import InputBox from "../../../../../../commonComponents/InputBox/InputBox.js";
import { EditorUIContext } from "../../../../../../contexts/EditorUIProvider.js";
import { AUTHENTICATION_PAGES } from "../../../../../../frontEndConstants.js";
import { LOGIN_STATUS } from "../../../../constants.js";
import styles from "./Common.module.scss";
import GoogleIdentityProvider from "./GoogleIdentityProvider.js";
import OneTimePassword from "./OneTimePassword.js";

const Login = ({ module, redirectToken = null }) => {
  const navigate = useNavigate();
  const [isNewPasswordRequired, setIsNewPasswordRequired] = useState(false);
  const [user, setUser] = useState(null);

  const submitLogin = async (username, password) => {
    const response = await module.logIn(username, password);
    switch (response.status) {
      case LOGIN_STATUS.SUCCESS: {
        navigate(response.navigateTo);
        break;
      }
      case LOGIN_STATUS.NEW_PASSWORD_REQUIRED: {
        setIsNewPasswordRequired(true);
        setUser(response.user);
        break;
      }
      default: {
        console.error(`Invalid response status detected: ${response.status}.`);
        break;
      }
    }
  };

  const submitCompletePasswordChallenge = (password) => {
    module
      .handleNewPassword(user, password, {})
      .then(async () => {
        await submitLogin(user.username, password);
      })
      .catch((err) => console.error(err));
  };

  if (isNewPasswordRequired) return <OneTimePassword onSubmit={submitCompletePasswordChallenge} />;
  return <LoginForm onSubmit={submitLogin} redirectToken={redirectToken} />;
};

const LoginForm = ({ onSubmit, redirectToken = null }) => {
  const navigate = useNavigate();
  const context = useContext(EditorUIContext);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setCanSubmit(username);
  }, [username]);

  useContext(() => {
    context.setErrorMessage(null);
  }, [username, password]);

  const handleSubmit = async (e) => {
    if (!canSubmit) return false;
    e.preventDefault();
    context.setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit(username, password);
    } catch (err) {
      context.setErrorMessage("Username or Password is incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignup = () => {
    const url = redirectToken
      ? `${AUTHENTICATION_PAGES.SIGNUP}?redirect=${redirectToken}`
      : AUTHENTICATION_PAGES.SIGNUP;
    navigate(url);
  };

  return (
    <>
      <GoogleIdentityProvider />

      {FEATURE_FLAGS.NORAML_LOGIN_ACTIVE && (
        <>
          <Divider text="or" />

          <InputBox
            label="Email"
            value={username}
            setValue={setUsername}
            isReadOnly={isSubmitting}
            type="email"
            autoComplete="email"
            extraClasses={styles["input-box"]}
          />

          <InputBox
            label="Password"
            value={password}
            setValue={setPassword}
            type="password"
            isReadOnly={isSubmitting}
            autoComplete="on"
            onEnter={handleSubmit}
            extraClasses={styles["input-box"]}
          />

          <DecoratedButton
            buttonText="Forgot password?"
            onClick={() => navigate(AUTHENTICATION_PAGES.FORGOT_PASSWORD)}
            isDisabled={isSubmitting}
            extraClasses={styles["link-styled-button"]}
          />

          <DecoratedButton
            isDisabled={!canSubmit || isSubmitting}
            buttonText="Login"
            onClick={handleSubmit}
            isBusy={isSubmitting}
            extraClasses={styles["button"]}
          />

          <Divider text="" />

          <p className={styles["account"]}>
            Don&apos;t have an account?
            <DecoratedButton
              buttonText="Sign Up"
              onClick={onSignup}
              isDisabled={isSubmitting}
              extraClasses={styles["link-styled-button"]}
            />
          </p>
        </>
      )}
    </>
  );
};

export default Login;
