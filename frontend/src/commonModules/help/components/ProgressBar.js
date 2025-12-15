import styles from "./ProgressBar.module.scss";

const ProgressBar = ({ stepNumber, numberOfSteps }) => {
  if (!stepNumber || !numberOfSteps) return null;

  return (
    <div className={styles["main-container"]}>
      <label>{`Step ${stepNumber}/${numberOfSteps}`}</label>
      <div className={styles["rail"]}>
        <span
          className={styles["active"]}
          style={{ width: Math.round((stepNumber * 100) / numberOfSteps) + "%" }}
        ></span>
      </div>
    </div>
  );
};
export default ProgressBar;
