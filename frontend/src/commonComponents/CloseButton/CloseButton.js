import DecoratedButton, { BUTTON_THEMES } from "../DecoratedButton/DecoratedButton.js";
import styles from "./CloseButton.module.scss";

const CloseButton = ({ onClick, extraClasses, text }) => {
  return (
    <DecoratedButton
      icon="close"
      buttonText={text}
      extraContainerClasses={styles["button-container"]}
      extraClasses={`${styles["button"]} ${extraClasses}`}
      onClick={onClick}
      theme={BUTTON_THEMES.TRANSPARENT}
    />
  );
};

export default CloseButton;
