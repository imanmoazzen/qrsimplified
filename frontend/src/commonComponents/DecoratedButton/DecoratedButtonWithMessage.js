import { useClassNames } from "../../hooks/useClassNames.js";
import BallWaitIndicator from "../WaitIndicator/BallWaitIndicator.js";
import DecoratedButton from "./DecoratedButton.js";
import styles from "./DecoratedButtonWithMessage.module.scss";

const DecoratedButtonWithMessage = ({
  onClick,
  icon,
  buttonText,
  isDisabled,
  extraClasses,
  message,
  submessage,
  children,
  state,
}) => {
  const messageClassNames = useClassNames(
    styles,
    "message-container",
    state.isFinished && "sucess",
    state.isFailed && "error"
  );
  return (
    <div className={styles["main-container"]}>
      {state.isChecking && (
        <div className={styles["loading-container"]}>
          <BallWaitIndicator />
        </div>
      )}

      {!state.isChecking && (
        <>
          <div className={styles["button-container"]}>
            {children}
            {buttonText && (
              <DecoratedButton
                onClick={onClick}
                icon={icon}
                buttonText={buttonText}
                extraClasses={`${styles["button"]} ${extraClasses}`}
                isBusy={state.isBusy}
                isDisabled={isDisabled}
              />
            )}
          </div>

          <div className={messageClassNames}>
            <span>{message}</span>
            <span>{submessage}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default DecoratedButtonWithMessage;
