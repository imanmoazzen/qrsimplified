import styles from "./SignUpTrack.module.css";

const SignUpTrack = ({ confirmSignUp }) => {
  return (
    <ul className={styles["sign-up-track"]}>
      <li
        className={`
          ${styles["sign-up-track__step"]}
          ${styles["sign-up-track__step--sign-up"]}
          ${confirmSignUp ? styles["sign-up-track__step--complete"] : ""}
        `}
        aria-label="Account Setup"
      >
        <span className={`material-symbols-outlined ${styles["sign-up-track__step-icon"]}`}>
          {confirmSignUp ? "done" : "lab_profile"}
        </span>
        <span className={styles["sign-up-track__text"]}>Profile</span>
      </li>
      <li
        className={`
          ${styles["sign-up-track__progress"]}
          ${confirmSignUp ? styles["sign-up-track__progress--confirm-sign-up"] : ""}
        `}
        aria-hidden="true"
      ></li>
      <li
        className={`
          ${styles["sign-up-track__step"]}
          ${confirmSignUp ? styles["sign-up-track__step--confirm-sign-up"] : ""}
        `}
        aria-label="Confirm Sign Up"
      >
        <span
          className={`
            ${"material-symbols-outlined"}
            ${styles["sign-up-track__step-icon"]}
          `}
        >
          {confirmSignUp ? "lock_open" : ""}
        </span>
        <span className={styles["sign-up-track__text"]}>Confirm</span>
      </li>
    </ul>
  );
};

export default SignUpTrack;
