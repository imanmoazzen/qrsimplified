import { useState } from "react";

import { useClassNames } from "../../hooks/useClassNames.js";
import styles from "./ExpandableContainer.module.scss";

const ExpandableContainer = ({
  title,
  titleWhenOpen,
  subtitle,
  extraClasses,
  children,
  isDecorated,
  isInitiallyOpen = false,
  isPlusMinusStyle = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  const mainClasses = useClassNames(
    styles,
    "main-container",
    !isOpen && "closed",
    isDecorated && "decorated",
    extraClasses
  );
  const titleClasses = useClassNames(
    styles,
    "title-container",
    !isOpen && "closed",
    isDecorated && "decorated",
    isPlusMinusStyle && "plus-minus"
  );
  const contentClasses = useClassNames(styles, "content-container", isOpen ? "open" : "closed");
  const arrowClasses = useClassNames(styles, "arrow", "material-symbols-outlined");

  const openIcon = isPlusMinusStyle ? "check_indeterminate_small" : "arrow_drop_up";
  const closeIcon = isPlusMinusStyle ? "add" : "arrow_drop_down";

  return (
    <div className={mainClasses} id={id}>
      <div className={titleClasses} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles["header"]}>
          <h3>{isOpen ? titleWhenOpen ?? title : title}</h3>
          {subtitle && <label>{subtitle}</label>}
        </div>

        <span className={arrowClasses}>{isOpen ? openIcon : closeIcon}</span>
      </div>
      {isOpen && <div className={contentClasses}>{children}</div>}
    </div>
  );
};

export default ExpandableContainer;
