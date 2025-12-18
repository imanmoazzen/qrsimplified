import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Step from "../../commonModules/help/components/Step.js";
import { HELPS } from "../../commonModules/help/index.js";
import { activeHelpIdChanged } from "../../commonModules/help/store/uiReducer.js";
import { useClassNames } from "../../hooks/useClassNames.js";
import { helpModule } from "../../index.js";
import styles from "./DecoratedButton.module.scss";

export const BUTTON_THEMES = {
  COLORED: "colored",
  TRANSPARENT: "transparent",
  POPUP: "popup-button",
  DEFAULT: "default",
  TRANSPARENT_WITH_LIGHT_BACKGROUND: "transparent that shows a light background on hover",
  AI: "ai",
};

const DecoratedButton = ({
  onClick,
  icon,
  buttonText,
  isDisabled = false,
  isBusy = false,
  isRippling = false,
  extraContainerClasses = "",
  extraClasses = "",
  GTMClass,
  isGoogleIconHiddenOnMobile = false,
  isTextHiddenOnMobile,
  theme = BUTTON_THEMES.DEFAULT,
  isHelpOnLeft = true,
  helpId,
  stepId,
  ...rest
}) => {
  const dispatch = useDispatch();
  const activeHelpId = useSelector(helpModule.getActiveHelpId);
  const activeStepId = useSelector(helpModule.getActiveStepId);
  const activeStep = HELPS?.[activeHelpId]?.[activeStepId];
  const isHelpButtonActive = activeHelpId && stepId && stepId === activeStepId;
  const isRipplingActive = isRippling || (isHelpButtonActive && activeStep?.isButtonRipplingEnabled);

  const buttonClassNames = useClassNames(
    styles,
    "button",
    isDisabled && "disabled",
    isBusy && "busy",
    isGoogleIconHiddenOnMobile && "google-icon-hidden",
    isTextHiddenOnMobile && "text-hidden",
    theme === BUTTON_THEMES.COLORED && "colored",
    theme === BUTTON_THEMES.TRANSPARENT && "transparent",
    theme === BUTTON_THEMES.POPUP && "popup",
    theme === BUTTON_THEMES.TRANSPARENT_WITH_LIGHT_BACKGROUND && "transparent-light-background",
    theme === BUTTON_THEMES.AI && "ai",
    isHelpButtonActive && !activeStep?.elevateZIndexDisabled && "active-help",
    extraClasses,
    GTMClass
  );

  useEffect(() => {
    if (isHelpButtonActive) activeStep?.prepare?.();
  }, [activeStep]);

  const buttonClicked = (event) => {
    if (isDisabled || isBusy) return;
    onClick?.(event);
    if (activeStepId === stepId) activeStep?.buttonClicked?.();
  };

  return (
    <div tabIndex={-1} className={`${styles["main-container"]} ${extraContainerClasses}`}>
      <button aria-disabled={isDisabled} className={buttonClassNames} onClick={buttonClicked} {...rest}>
        {!isBusy && icon && <span className="material-symbols-outlined">{icon}</span>}
        {isBusy && <span className={`${styles["progress"]} material-symbols-outlined`}>progress_activity</span>}
        {buttonText && <label>{buttonText}</label>}
        {isRipplingActive && <span className={styles["ripple"]}></span>}
      </button>
      {helpId && (
        <span
          onClick={() => dispatch(activeHelpIdChanged(helpId))}
          className={`${styles["help"]} ${isHelpOnLeft ? styles["on-left"] : ""} material-symbols-outlined`}
        >
          help
        </span>
      )}
      {isHelpButtonActive && <Step {...activeStep} />}
    </div>
  );
};

export default DecoratedButton;
