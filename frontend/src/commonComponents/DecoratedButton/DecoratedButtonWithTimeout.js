import { useState } from "react";

import DecoratedButton from "./DecoratedButton.js";
import styles from "./DecoratedButtonWithTimeout.module.scss";

const DecoratedButtonWithTimeout = ({
  onClick,
  defaultText = "Copy",
  defaultIcon = "content_copy",
  afterClickText = "Copied!",
  afterClickIcon = "check",
  timeoutInMs = 5000,
  isRippling,
  extraClasses,
  theme,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleClick = () => {
    onClick?.();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), timeoutInMs);
  };

  return (
    <DecoratedButton
      buttonText={isCopied ? afterClickText : defaultText}
      icon={isCopied ? afterClickIcon : defaultIcon}
      onClick={handleClick}
      extraClasses={`${extraClasses} ${isCopied ? styles["ok"] : ""}`}
      isRippling={isRippling}
      theme={theme}
    />
  );
};

export default DecoratedButtonWithTimeout;
