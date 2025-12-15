import styles from "./SimpleSwitch.module.scss";

const SimpleSwitch = ({
  leftIcon,
  leftLabel,
  rightIcon,
  rightLabel,
  isKnobOnLeft,
  onFlip,
  extraClasses,
  isDisabled,
}) => {
  return (
    <div
      className={`${styles["main-container"]} ${extraClasses} ${isKnobOnLeft ? "" : styles["right"]} ${
        isDisabled && styles["disabled"]
      }`}
    >
      {leftLabel && <span className={styles["left-label"]}>{leftLabel}</span>}
      <div onClick={onFlip} className={styles["rail-and-knob-container"]}>
        <div className={styles["rail"]}></div>
        <div className={styles["knob"]}>
          {(leftIcon || rightIcon) && (
            <span className={`${styles["icon"]} material-symbols-outlined`}>{isKnobOnLeft ? leftIcon : rightIcon}</span>
          )}
        </div>
      </div>
      {rightLabel && <span className={styles["right-label"]}>{rightLabel}</span>}
    </div>
  );
};

export default SimpleSwitch;
