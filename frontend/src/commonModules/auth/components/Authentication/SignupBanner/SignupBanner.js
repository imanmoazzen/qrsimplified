import BANNER from "./banner.png";
import QR from "./qr-simplified.png";
import styles from "./SignupBanner.module.scss";

const SignupBanner = () => {
  return (
    <section className={styles["main-container"]}>
      <div className={styles["logo-container"]}>
        <img src={QR} alt="logo" />
        <span className={styles["moving-bar"]}></span>
      </div>
      <p className={styles["type-line"]}>Branded QR codes.&nbsp;&nbsp;No expiry.&nbsp;&nbsp;Deep analytics.</p>

      <div className={styles["usecases"]}>
        <img src={BANNER} alt="use cases" />
        <span>Every asset branded. Every scan tracked.</span>
      </div>
    </section>
  );
};

export default SignupBanner;
