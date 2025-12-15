import styles from "./Label.module.scss";

export const ICON_ANIMATION_TYPE = {
  ROTATE: "ROTATE",
  SCALE: "SCALE",
};

const Label = ({ text, icon, extraClasses, iconAnimationType = ICON_ANIMATION_TYPE.SCALE }) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`}>
      {icon && (
        <span
          className={`material-symbols-outlined ${
            iconAnimationType === ICON_ANIMATION_TYPE.ROTATE ? styles["rotating"] : ""
          }`}
        >
          {icon}
        </span>
      )}
      <label className={styles["label"]}>
        {text} <span className={styles["wipe-box"]}></span>
      </label>
    </div>
  );
};

export default Label;
