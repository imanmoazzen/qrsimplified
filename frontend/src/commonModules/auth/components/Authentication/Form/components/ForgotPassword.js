import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DecoratedButton from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../../../../commonComponents/InputBox/InputBox.js";
import { EditorUIContext } from "../../../../../../contexts/EditorUIProvider.js";
import styles from "./Common.module.scss";

const ForgotPassword = ({ module }) => {
  const navigate = useNavigate();
  const context = useContext(EditorUIContext);
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    context.setErrorMessage(null);
    setCanSubmit(email);
  }, [email]);

  const handleSubmit = async (e) => {
    if (!canSubmit) return false;
    e.preventDefault();
    context.setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { resolvedUsername, forwardAddress } = await module.forgotPassword(email);
      navigate("/reset-password", { state: { username: resolvedUsername, email: forwardAddress } });
    } catch (err) {
      context.setErrorMessage("Could not reset password for the account, please contact support or try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <p className={styles["instructions"]}>
        Please enter your email, and we&apos;ll send you reset instructions for your password.
      </p>
      <InputBox
        label="Email"
        value={email}
        setValue={setEmail}
        isReadOnly={isSubmitting}
        type="email"
        autoComplete="email"
        onEnter={handleSubmit}
        extraClasses={styles["input-box"]}
      />
      <DecoratedButton
        buttonText="Submit"
        extraClasses={styles["button"]}
        onClick={handleSubmit}
        isDisabled={!canSubmit || isSubmitting}
        isBusy={isSubmitting}
      />
    </>
  );
};

export default ForgotPassword;
