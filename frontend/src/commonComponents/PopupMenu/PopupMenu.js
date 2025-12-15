import Overlay from "../Overlay/Overlay.js";
import styles from "./PopupMenu.module.scss";

const PopupMenu = ({ setIsVisible, isVisible, containerClass = "", isResponsive = true, children }) => {
  if (!isVisible) return null;

  return (
    <>
      <div className={`${styles["menu-container"]} ${containerClass}`}>{children}</div>
      <Overlay isActive={isVisible} onClick={() => setIsVisible(false)} isResponsive={isResponsive} />
    </>
  );
};

export default PopupMenu;
