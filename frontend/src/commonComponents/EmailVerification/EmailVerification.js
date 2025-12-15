import { API_RESPONSE_TYPES } from "castofly-common";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setSession } from "../../commonModules/auth/store/uiReducer.js";
import { COMMON_MESSAGES } from "../../frontEndConstants.js";
import { auth, server } from "../../index.js";
import DecoratedButton, { BUTTON_THEMES } from "../DecoratedButton/DecoratedButton.js";
import InputBox from "../InputBox/InputBox.js";
import styles from "./EmailVerification.module.scss";

const STATES = {
  INIT: "INIT",
  BUSY: "BUSY",
  VERIFICATION_EMAIL_SENT: "VERIFICATION_EMAIL_SENT",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  ERROR: "ERROR",
};

const EmailVerification = ({ message, setMessage }) => {
  const dispatch = useDispatch();
  const session = useSelector(auth.sessionSelector);
  const [state, setState] = useState(STATES.INIT);
  const [buttonText, setButtonText] = useState("Verify");

  useEffect(() => {
    setState(session?.user?.email_verified ? STATES.EMAIL_VERIFIED : STATES.INIT);
  }, [session]);

  useEffect(() => {
    switch (state) {
      case STATES.BUSY:
        setMessage?.("");
        setButtonText("Verifying...");
        break;

      case STATES.VERIFICATION_EMAIL_SENT:
        setMessage?.(
          "We sent you an email. Open it, tap the link to verify, then come back here and press the Done button."
        );
        setButtonText("Done");
        break;

      case STATES.EMAIL_VERIFIED:
        setMessage?.("");
        setButtonText("Verified");
        break;

      case STATES.ERROR:
        setMessage(COMMON_MESSAGES.GENERIC_ERROR);
        setButtonText("Verify");
        break;

      default:
        setButtonText("Verify");
    }
  }, [state]);

  const verifyEmail = async () => {
    setState(STATES.BUSY);

    try {
      const res = await server.requestFromApiv2("/user/message/verifyEmail", {
        method: "POST",
        mode: "cors",
      });

      if (res?.data?.message !== API_RESPONSE_TYPES.SUCCESS) throw new Error();

      if (!res.data.isVerified) {
        setState(STATES.VERIFICATION_EMAIL_SENT);
        return;
      }

      dispatch(setSession({ ...session, user: { ...session.user, email_verified: true } }));
    } catch (err) {
      setState(STATES.ERROR);
    }
  };

  return (
    <div className={styles["main-container"]}>
      <InputBox label="Your Email (not editable)" value={session?.user?.email} isDisabled={true} isReadOnly={true} />
      <DecoratedButton
        icon="verified_user"
        buttonText={buttonText}
        onClick={verifyEmail}
        extraContainerClasses={state === STATES.EMAIL_VERIFIED && styles["verified"]}
        isBusy={state === STATES.BUSY}
        isRippling={message === COMMON_MESSAGES.EMAIL_NOT_VERIFIED}
        theme={state === STATES.EMAIL_VERIFIED && BUTTON_THEMES.TRANSPARENT}
      />
    </div>
  );
};

export default EmailVerification;
