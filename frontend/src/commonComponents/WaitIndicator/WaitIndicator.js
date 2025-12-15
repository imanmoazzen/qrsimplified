import { PRIMARY_COLOR } from "../../frontEndConstants.js";
import styles from "./WaitIndicator.module.scss";

const WaitIndicator = ({
  color = PRIMARY_COLOR,
  fontSize = "64px",
  text,
  flexDirection = "column",
  gap = "1rem",
  extraClasses,
}) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`} style={{ flexDirection, gap }}>
      {text && <label>{text}</label>}
      <span className={`material-symbols-outlined ${styles["spin-container"]}`} style={{ color, fontSize }}>
        progress_activity
      </span>
    </div>
  );
};

export default WaitIndicator;
