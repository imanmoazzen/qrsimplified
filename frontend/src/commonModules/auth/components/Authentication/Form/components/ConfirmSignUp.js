import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import DecoratedButton from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../../../../commonComponents/InputBox/InputBox.js";
import { EditorUIContext } from "../../../../../../contexts/EditorUIProvider.js";
import { LOGIN_STATUS } from "../../../../constants.js";
import styles from "./Common.module.scss";

const ConfirmSignUp = ({ module }) => {
  const context = useContext(EditorUIContext);
  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email;
  const [canSubmit, setCanSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");

  useEffect(() => {
    context.setErrorMessage(null);
    setCanSubmit(confirmationCode && email);
  }, [confirmationCode, email]);

  const handleSubmit = async (e) => {
    if (!canSubmit) return false;
    e.preventDefault();
    context.setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await module.confirmSignUp(email, confirmationCode, state.password);
      if (response.status == LOGIN_STATUS.SUCCESS) navigate(response.navigateTo);
    } catch (err) {
      switch (err.message) {
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
          We have sent a code by email to <strong>{email}</strong>.
        </p>
      )}

      <InputBox
        label="Confirmation Code"
        value={confirmationCode}
        setValue={setConfirmationCode}
        isReadOnly={isSubmitting}
        onEnter={handleSubmit}
        extraClasses={styles["input-box"]}
      />

      <DecoratedButton
        buttonText="Confirm"
        isBusy={isSubmitting}
        onClick={handleSubmit}
        isDisabled={!canSubmit || isSubmitting}
        extraClasses={styles["button"]}
      />
    </>
  );
};

export default ConfirmSignUp;
