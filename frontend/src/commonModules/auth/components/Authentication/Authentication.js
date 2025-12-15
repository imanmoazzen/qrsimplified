import { ILLUSTRATIONS } from "../../../../commonComponents/Illustrations/Illustrations.js";
import styles from "./Authentication.module.scss";
import GoogleIdentityProvider from "./Form/components/GoogleIdentityProvider.js";
import SignupBanner from "./SignupBanner/SignupBanner.js";

const Authentication = () => {
  return (
    <div className={styles["main-container"]}>
      <div className={styles["banner-container"]}>
        <SignupBanner />
      </div>

      <div className={styles["login-container"]}>
        <img src={ILLUSTRATIONS.CAMPAIGN} alt="marketing campaigns" />
        <GoogleIdentityProvider />
      </div>
    </div>
  );
};

export default Authentication;
