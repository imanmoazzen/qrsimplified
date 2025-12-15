import DecoratedButtonWithTimeout from "../../../../../../commonComponents/DecoratedButton/DecoratedButtonWithTimeout.js";
import styles from "./ActionableMessage.module.scss";

const ActionableMessage = ({ icon, header, message, onClick, defaultText, extraClasses }) => {
  return (
    <div className={`${styles["main-container"]} ${extraClasses}`}>
      <div className={styles["sub-container"]}>
        <div className={styles["title-container"]}>
          <span className="material-symbols-outlined">{icon}</span>
          <h3>{header}</h3>
        </div>
        <span className={styles["message"]}>{message}</span>
      </div>

      <DecoratedButtonWithTimeout defaultText={defaultText} onClick={onClick} extraClasses={styles["button"]} />
    </div>
  );
};

export default ActionableMessage;
