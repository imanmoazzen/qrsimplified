import { ILLUSTRATIONS } from "../../../../commonComponents/Illustrations/Illustrations.js";
import styles from "./Logo.module.scss";

const Logo = ({ text, onClick }) => {
  return (
    <div onClick={onClick} className={styles["main-container"]}>
      <img className={styles["image"]} src={ILLUSTRATIONS.LOGO} alt="logo" />
      <span className={styles["text"]}>{text}</span>
    </div>
  );
};

export default Logo;
