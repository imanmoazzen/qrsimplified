import styles from "./ActionDecoratedButton.module.css";
import DecoratedButton from "./DecoratedButton.js";

const ActionDecoratedButton = ({ onClick, icon, buttonText, extraClasses, GTMClass }) => {
  return (
    <DecoratedButton
      onClick={onClick}
      icon={icon}
      buttonText={buttonText}
      extraClasses={`${styles["button"]} ${extraClasses}`}
      GTMClass={GTMClass}
    />
  );
};

export default ActionDecoratedButton;
