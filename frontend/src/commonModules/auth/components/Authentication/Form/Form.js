import { useContext } from "react";
import { useSearchParams } from "react-router-dom";

import Divider from "../../../../../commonComponents/Divider/Divider.js";
import { EditorUIContext } from "../../../../../contexts/EditorUIProvider.js";
import { AUTHENTICATION_PAGES } from "../../../../../frontEndConstants.js";
import AnonymousOnlyGuard from "../../AnonymousOnlyGuard.js";
import BackToPreviousPage from "./components/BackToPreviousButton.js";
import ConfirmSignUp from "./components/ConfirmSignUp.js";
import ForgotPassword from "./components/ForgotPassword.js";
import GoogleIdentityProvider from "./components/GoogleIdentityProvider.js";
import Login from "./components/Login.js";
import ResetPassword from "./components/ResetPassword.js";
import SignUp from "./components/SignUp.js";
import SignUpTrack from "./components/SignUpTrack/SignUpTrack.js";
import styles from "./Form.module.scss";

const formOptions = {
  [AUTHENTICATION_PAGES.CONFIRM_SIGNUP]: {
    component: ConfirmSignUp,
    heading: "Confirm Sign Up",
    guard: AnonymousOnlyGuard,
    isBackButtonEnabled: false,
  },
  [AUTHENTICATION_PAGES.FORGOT_PASSWORD]: {
    component: ForgotPassword,
    heading: "Forgot Password",
    guard: AnonymousOnlyGuard,
    isBackButtonEnabled: true,
  },
  [AUTHENTICATION_PAGES.LOGIN]: {
    component: Login,
    heading: "Login",
    guard: AnonymousOnlyGuard,
    isBackButtonEnabled: false,
  },
  [AUTHENTICATION_PAGES.RESET_PASSWORD]: {
    component: ResetPassword,
    heading: "Reset Password",
    guard: AnonymousOnlyGuard,
    isBackButtonEnabled: false,
  },
  [AUTHENTICATION_PAGES.SIGNUP]: {
    component: SignUp,
    heading: "Sign Up",
    guard: AnonymousOnlyGuard,
    isBackButtonEnabled: false,
  },
};

const REDIRECT_KEY = "redirect";

const Form = ({ module, path }) => {
  const context = useContext(EditorUIContext);
  const [queryString] = useSearchParams();
  const redirectToken = queryString.get(REDIRECT_KEY);
  const isResetPasswordForm = /^\/reset-password*/.test(path);
  const FormByPath = isResetPasswordForm
    ? formOptions[AUTHENTICATION_PAGES.RESET_PASSWORD].component
    : formOptions[path]?.component;
  const formHeading = formOptions[path]?.heading;

  const AccessGuard = formOptions[path].guard;
  const isBackButtonEnabled = formOptions[path].isBackButtonEnabled;

  const canAuthenticateViaGoogle = path === AUTHENTICATION_PAGES.SIGNUP;
  const isConfirmSignUpPath = path === AUTHENTICATION_PAGES.CONFIRM_SIGNUP;
  const isSignUpPath = path === AUTHENTICATION_PAGES.SIGNUP;
  const isSignUpFlow = isSignUpPath || isConfirmSignUpPath;

  return (
    <section className={styles["form"]}>
      {isBackButtonEnabled && <BackToPreviousPage />}
      <h1 className={styles["title"]}>{formHeading}</h1>
      {canAuthenticateViaGoogle && (
        <>
          <GoogleIdentityProvider />
          <Divider text="or" />
        </>
      )}
      {isSignUpFlow && <SignUpTrack confirmSignUp={isConfirmSignUpPath} />}
      <AccessGuard module={module}>
        <div className={styles["inputs-container"]}>
          <FormByPath module={module} redirectToken={redirectToken} />
        </div>
      </AccessGuard>
      {context.errorMessage && <p className={styles["error"]}>{context.errorMessage}</p>}
    </section>
  );
};

export default Form;
