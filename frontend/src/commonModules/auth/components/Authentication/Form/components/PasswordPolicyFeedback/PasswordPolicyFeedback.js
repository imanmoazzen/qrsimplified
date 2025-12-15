import { useMemo } from "react";

import styles from "./PasswordPolicyFeedback.module.css";

const PasswordPolicyFeedback = ({ policyStatus, passwords, isVisible }) => {
  const hasMultiplePasswords = passwords?.length > 1;

  const hasMatchingPasswords = useMemo(() => {
    const passwordsMatch = hasMultiplePasswords
      ? Object.values(passwords).every((password, i, passwords) => password === passwords[0] && password !== "")
      : false;
    return passwordsMatch;
  }, [passwords]);

  if (!isVisible) return;

  return (
    <div className={styles["wrapper"]}>
      <ul className={styles["policy-list"]}>
        {Object.values(policyStatus).map((policy, i) => {
          return (
            <li key={i} className={styles["policy"]}>
              <span
                className={`
                  material-symbols-outlined
                  ${styles["policy-icon"]}
                  ${policy.valid ? styles["policy-icon--valid"] : ""}
                `}
              >
                {policy.valid ? "check_circle" : "cancel"}
              </span>
              {policy.message}
            </li>
          );
        })}
        {hasMultiplePasswords && (
          <li className={styles["policy"]}>
            <span
              className={`
                  material-symbols-outlined
                  ${styles["policy-icon"]}
                  ${hasMatchingPasswords ? styles["policy-icon--valid"] : ""}
                `}
            >
              {hasMatchingPasswords ? "check_circle" : "cancel"}
            </span>
            Passwords match
          </li>
        )}
      </ul>
    </div>
  );
};

export default PasswordPolicyFeedback;
