import { useState } from "react";

import { useClassNames } from "../../hooks/useClassNames.js";
import styles from "./Menu.module.scss";

const Menu = ({ children, direction = "column", position = "left", extraClasses }) => {
  const [isOpen, setIsOpen] = useState(false);

  const aboveMobileContainerClasses = useClassNames(
    styles,
    "above-mobile-container",
    direction === "row" ? "row" : "column",
    extraClasses
  );

  const mobileContainerClasses = useClassNames(
    styles,
    "mobile-container",
    position === "left" ? "left" : position === "right" ? "right" : "center",
    extraClasses
  );

  const mobileOptionsClasses = useClassNames(
    styles,
    "mobile-options",
    position === "left" ? "left" : position === "right" ? "right" : "center",
    isOpen && "open"
  );

  return (
    <>
      <div className={aboveMobileContainerClasses}> {children}</div>

      <div onClick={() => setIsOpen(!isOpen)} className={mobileContainerClasses}>
        <span className={`material-symbols-outlined ${styles["mobile-button"]}`}>{isOpen ? "close" : "menu"}</span>
        {isOpen && <div className={mobileOptionsClasses}>{children}</div>}
        <div className={`${styles["overlay"]} ${isOpen ? styles["active"] : ""}`}></div>
      </div>
    </>
  );
};

export default Menu;
