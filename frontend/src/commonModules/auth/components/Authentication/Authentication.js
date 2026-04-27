import { APP_PAGES } from "castofly-common/appPages.js";
import { LOGIN_ERROR } from "castofly-common/commonConstants.js";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ILLUSTRATIONS } from "../../../../commonComponents/Illustrations/Illustrations.js";
import styles from "./Authentication.module.scss";
import GoogleIdentityProvider from "./GoogleIdentityProvider.js";
import PasswordlessAuth from "./PasswordlessAuth.js";
import SignupBanner from "./SignupBanner/SignupBanner.js";

const Authentication = () => {
  const [isPasswordLessStarted, setIsPasswordLessStarted] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { pathname, state } = location;

  const isLogin = pathname.includes(APP_PAGES.LOGIN);
  const header = isLogin ? "Log in to your account" : "Create a new account";

  useEffect(() => {
    if (state?.errorMessage?.includes(LOGIN_ERROR.EMAIL_ALREADY_IN_USE_PASSWORDLESS)) {
      setMessage(LOGIN_ERROR.EMAIL_ALREADY_IN_USE_PASSWORDLESS);
      navigate(pathname, { replace: true, state: null });
    } else if (state?.errorMessage?.includes(LOGIN_ERROR.EMAIL_ALREADY_IN_USE_GOOGLE)) {
      setMessage(LOGIN_ERROR.EMAIL_ALREADY_IN_USE_GOOGLE);
      navigate(pathname, { replace: true, state: null });
    }
  }, [state?.errorMessage]);

  return (
    <div className={styles["main-container"]}>
      <div className={styles["banner-container"]}>
        <SignupBanner />
      </div>

      <div className={styles["login-container"]}>
        <img src={ILLUSTRATIONS.CAMPAIGN} alt="marketing campaigns" />
        <h3>{header}</h3>
        <PasswordlessAuth
          setIsPasswordLessStarted={setIsPasswordLessStarted}
          message={message}
          setMessage={setMessage}
        />

        {!isPasswordLessStarted && (
          <div className={styles["divider"]}>
            <span className={styles["text"]}>OR</span>
            <span className={styles["line"]}></span>
          </div>
        )}

        {!isPasswordLessStarted && (
          <GoogleIdentityProvider isRippling={message === LOGIN_ERROR.EMAIL_ALREADY_IN_USE_GOOGLE} />
        )}

        <span className={`${styles["message"]} ${!message ? styles["hidden"] : ""}`}>{message}</span>
      </div>
    </div>
  );
};

export default Authentication;
