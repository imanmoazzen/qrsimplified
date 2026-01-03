import CloseButton from "../CloseButton/CloseButton.js";
import styles from "./Overlay.module.scss";

const Overlay = ({ isActive, isCloseButtonRequired, onClick, extraClasses, isResponsive }) => {
  return (
    <div
      className={`${styles["overlay"]} ${isActive ? styles["active"] : ""} ${
        isResponsive ? styles["responsive"] : ""
      } ${extraClasses}`}
      onClick={() => onClick?.()}
    >
      {isActive && isCloseButtonRequired && <CloseButton onClick={() => onClick?.()} extraClasses={styles["close"]} />}
    </div>
  );
};

export default Overlay;
