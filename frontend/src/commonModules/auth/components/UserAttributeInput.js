import { useId } from "react";

import styles from "./UserAttributeInput.module.css";

const UserAttributeInput = ({ label, placeholder = "", value, setValue = () => {}, disabled }) => {
  const labelId = useId();
  return (
    <div className={styles["user-info"]}>
      <span className={styles["user-info__label"]} id={labelId}>
        {label}
      </span>
      <input
        aria-labelledby={labelId}
        className={styles["user-info__input"]}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
};

export default UserAttributeInput;
