import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import { useLocation, useNavigate } from "react-router-dom";

import DecoratedButton from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../../../../commonComponents/InputBox/InputBox.js";
import { EditorUIContext } from "../../../../../../contexts/EditorUIProvider.js";
import usePasswordPolicyValidator from "../../../../../../hooks/usePasswordPolicyValidator.js";
import { LOGIN_STATUS } from "../../../../constants.js";
import styles from "./Common.module.scss";
import PasswordPolicyFeedback from "./PasswordPolicyFeedback/PasswordPolicyFeedback.js";

const ResetPassword = ({ module }) => {
  const { username } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const context = useContext(EditorUIContext);

  const user = state?.username || username;
  const email = state?.email;

  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const { policyStatus } = usePasswordPolicyValidator(newPassword);
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);

  useEffect(() => {
    setCanSubmit(code && passwordsMatch);
  }, [code, passwordsMatch]);

  useEffect(() => {
    const isNotEmpty = newPassword !== "" && confirmNewPassword !== "";
    setPasswordsMatch(newPassword === confirmNewPassword && isNotEmpty);
  }, [newPassword, confirmNewPassword]);

  const handleSubmit = async () => {
    if (!canSubmit) return false;

    context.setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await module.resetPassword(user, code, newPassword);
      if (response.status === LOGIN_STATUS.SUCCESS) {
        navigate(response.navigateTo);
      } else {
        throw new Error("Something went wrong.");
      }
    } catch (err) {
      switch (err.message) {
        case "Username and Pool information are required.":
          context.setErrorMessage("Could not reset password for the account, please contact support or try again.");
          break;
        case "Invalid verification code provided, please try again.":
          context.setErrorMessage("Invalid verification code provided.");
          break;
        default:
          context.setErrorMessage(err.message);
          break;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {email && (
        <p className={styles["instructions"]}>
          We have sent a password reset code by email to <strong>{email}</strong>.
        </p>
      )}

      <InputBox
        label="Reset Code"
        value={code}
        setValue={setCode}
        isReadOnly={isSubmitting}
        extraClasses={styles["input-box"]}
      />

      <InputBox
        label="New Password"
        value={newPassword}
        setValue={setNewPassword}
        isReadOnly={isSubmitting}
        type="password"
        onFocus={() => setIsPolicyVisible(true)}
        extraClasses={styles["input-box"]}
      />

      <InputBox
        label="Confirm Password"
        value={confirmNewPassword}
        setValue={setConfirmNewPassword}
        isReadOnly={isSubmitting}
        type="password"
        onFocus={() => setIsPolicyVisible(true)}
        onEnter={handleSubmit}
        extraClasses={styles["input-box"]}
      />

      <PasswordPolicyFeedback
        policyStatus={policyStatus}
        passwords={[newPassword, confirmNewPassword]}
        isVisible={isPolicyVisible}
      />

      <DecoratedButton
        buttonText="Reset Password"
        onClick={handleSubmit}
        extraClasses={styles["button"]}
        isDisabled={!canSubmit || isSubmitting}
        isBusy={isSubmitting}
      />
    </>
  );
};

export default ResetPassword;
