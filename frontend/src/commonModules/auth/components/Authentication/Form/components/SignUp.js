import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import DecoratedButton from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Divider from "../../../../../../commonComponents/Divider/Divider.js";
import InputBox from "../../../../../../commonComponents/InputBox/InputBox.js";
import { EditorUIContext } from "../../../../../../contexts/EditorUIProvider.js";
import { AUTHENTICATION_PAGES } from "../../../../../../frontEndConstants.js";
import usePasswordPolicyValidator from "../../../../../../hooks/usePasswordPolicyValidator.js";
import { COGNITO_PRESIGNUP_FAILURE_RE } from "../../../../constants.js";
import styles from "./Common.module.scss";
import PasswordPolicyFeedback from "./PasswordPolicyFeedback/PasswordPolicyFeedback.js";

const SignUp = ({ module, redirectToken = null }) => {
  // These 3 variables handle the case where the user has attempted
  // to signup using Google, but the email address has already been used.
  // Because there is a redirect here, these values are inserted into the
  // state of the page.
  const location = useLocation();
  const errorMessage = location.state?.errorMessage;
  const errorType = location.state?.errorType;

  const navigate = useNavigate();
  const context = useContext(EditorUIContext);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const { policyStatus } = usePasswordPolicyValidator(createPassword);
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);

  useEffect(() => {
    const isNotEmpty = createPassword !== "" && confirmPassword !== "";
    setPasswordsMatch(createPassword === confirmPassword && isNotEmpty);
  }, [createPassword, confirmPassword]);

  useEffect(() => {
    context.setErrorMessage(null);
    setCanSubmit(email && passwordsMatch);
  }, [email, passwordsMatch]);

  useEffect(() => {
    if (errorMessage && errorType) context.setErrorMessage(errorMessage);
  }, []);

  const handleSubmit = async () => {
    if (!canSubmit) return false;
    context.setErrorMessage(null);
    setIsSubmitting(true);
    setIsPolicyVisible(false);

    try {
      await module.signUp(email, createPassword);
      const confirmSignupUrl = redirectToken
        ? `${AUTHENTICATION_PAGES.CONFIRM_SIGNUP}?redirect=${redirectToken}`
        : AUTHENTICATION_PAGES.CONFIRM_SIGNUP;

      navigate(confirmSignupUrl, {
        state: { password: createPassword, email: email },
      });
    } catch (err) {
      const invalidEmail = /Invalid email address format/.test(err.message);
      const invalidUsername = /Value at 'username' failed to satisfy constraint/.test(err.message);
      const usernameExists = /User already exists/.test(err.message);
      const emailInUse = COGNITO_PRESIGNUP_FAILURE_RE.test(err.message);

      switch (true) {
        case invalidEmail: {
          context.setErrorMessage(err.message);
          break;
        }
        case invalidUsername: {
          context.setErrorMessage("Invalid username format");
          break;
        }
        case usernameExists: {
          context.setErrorMessage("Username exists");
          break;
        }
        case emailInUse: {
          const matches = err.message.match(COGNITO_PRESIGNUP_FAILURE_RE);
          if (matches.length > 1) {
            context.setErrorMessage(matches[1]);
          } else {
            context.setErrorMessage("Something went wrong");
          }
          break;
        }
        default: {
          context.setErrorMessage(err.message);
          break;
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLogin = () => {
    const url = redirectToken ? `${AUTHENTICATION_PAGES.LOGIN}?redirect=${redirectToken}` : AUTHENTICATION_PAGES.LOGIN;
    navigate(url);
  };

  return (
    <>
      <InputBox
        label="Email"
        isReadOnly={isSubmitting}
        value={email}
        setValue={setEmail}
        type="email"
        autoComplete="email"
        extraClasses={styles["input-box"]}
      />

      <InputBox
        label="Create Password"
        isReadOnly={isSubmitting}
        value={createPassword}
        setValue={setCreatePassword}
        type="password"
        onFocus={() => setIsPolicyVisible(true)}
        extraClasses={styles["input-box"]}
      />

      <InputBox
        label="Confirm Password"
        isReadOnly={isSubmitting}
        value={confirmPassword}
        setValue={setConfirmPassword}
        type="password"
        onFocus={() => setIsPolicyVisible(true)}
        onEnter={handleSubmit}
        extraClasses={styles["input-box"]}
      />

      <PasswordPolicyFeedback
        policyStatus={policyStatus}
        passwords={[createPassword, confirmPassword]}
        isVisible={isPolicyVisible}
      />

      <DecoratedButton
        buttonText="Sign Up"
        isBusy={isSubmitting}
        isDisabled={!canSubmit || isSubmitting}
        onClick={handleSubmit}
        extraClasses={styles["button"]}
      />

      <Divider text="" />
      <p className={styles["account"]}>
        Already have an account?
        <br />
        <DecoratedButton buttonText="Login" onClick={onLogin} extraClasses={styles["link-styled-button"]} />
      </p>
    </>
  );
};

export default SignUp;
