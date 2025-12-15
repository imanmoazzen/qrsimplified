import { FEEDBACK_DETAILS, FEEDBACK_TYPE } from "./data.js";
import styles from "./FeedbackType.module.scss";

const FeedbackType = ({ type, setType }) => {
  return (
    <div className={styles["main-container"]}>
      <div className={styles["options"]}>
        {Object.keys(FEEDBACK_TYPE).map((option, index) => {
          const isActive = type === option;
          return (
            <div
              onClick={() => setType(option)}
              className={`${styles["item"]} ${isActive && styles["active"]}`}
              key={index}
            >
              <span className="material-symbols-outlined">{FEEDBACK_DETAILS[option].icon}</span>
              {FEEDBACK_DETAILS[option].label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FeedbackType;
