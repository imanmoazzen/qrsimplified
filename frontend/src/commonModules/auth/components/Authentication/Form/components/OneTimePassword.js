import { useContext, useEffect, useState } from "react";

import DecoratedButton from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../../../../commonComponents/InputBox/InputBox.js";
import { EditorUIContext } from "../../../../../../contexts/EditorUIProvider.js";
import usePasswordPolicyValidator from "../../../../../../hooks/usePasswordPolicyValidator.js";
import styles from "./Common.module.scss";
import PasswordPolicyFeedback from "./PasswordPolicyFeedback/PasswordPolicyFeedback.js";

const OneTimePassword = ({ onSubmit }) => {
  const context = useContext(EditorUIContext);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const { isPasswordValid, policyStatus } = usePasswordPolicyValidator(newPassword);
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);

  useEffect(() => {
    setCanSubmit(isPasswordValid && passwordsMatch);
  }, [isPasswordValid, passwordsMatch]);

  useEffect(() => {
    const isNotEmpty = newPassword !== "" && confirmNewPassword !== "";
    setPasswordsMatch(newPassword === confirmNewPassword && isNotEmpty);
  }, [newPassword, confirmNewPassword]);

  const handleSubmit = async (e) => {
    if (!canSubmit) return false;
    e.preventDefault();
    context.setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit(newPassword);
    } catch (err) {
      context.setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <p className={styles["instructions"]}>
        You&apos;re using a temporary password. Please set a new one to continue.
      </p>

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
        onClick={handleSubmit}
        buttonText="Set New Password"
        isDisabled={!canSubmit || isSubmitting}
        isBusy={isSubmitting}
        extraClasses={styles["button"]}
      />
    </>
  );
};

export default OneTimePassword;
