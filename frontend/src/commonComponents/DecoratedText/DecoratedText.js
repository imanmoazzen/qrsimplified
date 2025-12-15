import styles from "./DecoratedText.module.css";

const DecoratedText = ({ name, icon, isHorizontal = true, isIconFirst = true, extraClasses }) => {
  return (
    <div
      data-is-horizontal={isHorizontal}
      data-is-icon-first={isIconFirst}
      className={`${styles["main-container"]} ${extraClasses}`}
    >
      <span>{name}</span>
      <span className={`${styles["icon"]} material-symbols-outlined`}>{icon}</span>
    </div>
  );
};

export default DecoratedText;
