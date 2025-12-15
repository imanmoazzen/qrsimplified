import { useState } from "react";
import { useEffect } from "react";

import styles from "./SegmentedToggle.module.scss";

const SegmentedToggle = ({ leftOption, rightOption, handleChange }) => {
  const [active, setActive] = useState(leftOption);

  useEffect(() => {
    handleChange?.(active);
  }, [active]);

  return (
    <div className={styles["main-container"]}>
      <span className={`${styles["slider"]} ${active === leftOption ? styles["left"] : ""}`}></span>
      <span onClick={() => setActive(leftOption)} className={active === leftOption ? styles["active"] : ""}>
        {leftOption}
      </span>
      <span onClick={() => setActive(rightOption)} className={active === rightOption ? styles["active"] : ""}>
        {rightOption}
      </span>
    </div>
  );
};

export default SegmentedToggle;
