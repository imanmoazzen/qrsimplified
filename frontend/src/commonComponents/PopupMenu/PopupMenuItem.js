import styles from "./PopupMenu.module.scss";

const PopupMenuItem = ({ icon, optionText, onClick, className }) => {
  return (
    <div className={className} onClick={onClick ? onClick : () => {}}>
      <i className={"material-symbols-outlined " + styles["item-icon"]}>{icon}</i>
      <span className={styles["item-text"]}>{optionText}</span>
    </div>
  );
};

export default PopupMenuItem;
