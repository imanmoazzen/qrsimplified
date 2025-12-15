import { useEffect, useRef, useState } from "react";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import useMobileDetection from "../../../hooks/useMobileDetection.js";
import { helpModule } from "../../../index.js";
import { getHelpVoiceURL } from "../guides/descriptions.js";
import { activeHelpIdChanged, muteStatusChanged } from "../store/uiReducer.js";
import PlayWithCircularProgress from "./PlayWithCircularProgress.js";
import ProgressBar from "./ProgressBar.js";
import styles from "./Step.module.scss";

export const POSTIIONS = {
  BELOW_RIGHT: "below-right",
  BELOW_LEFT: "below-left",
  TOP_RIGHT: "top-right",
  TOP_LEFT: "top-left",
  TOP_CENTER: "top-center",
  ALIGN_RIGHT: "align-right",
  ALIGN_LEFT: "align-left",
  ALIGN_TOP: "align-top",
};

const Step = ({
  stepNumber,
  numberOfSteps,
  title,
  nextTitle,
  description,
  nextDescription,
  defaultButtonIcon,
  defaultButtonText,
  defaultButtonClicked,
  actionButtonIcon,
  actionButtonText,
  nextActionButtonText,
  actionButtonClicked,
  position = POSTIIONS.BELOW_RIGHT,
  isDefaultRippling,
  cleanup,
}) => {
  const dispatch = useDispatch();
  const mainContainerRef = useRef();
  const isMobile = useMobileDetection();
  const [isDefaultButtonClicked, setIsDefaultButtonClicked] = useState(false);
  const [isRefresh, setIsRefresh] = useState(false);
  const isMuted = useSelector(helpModule.getMuteStatus);

  const isDefaultButtonAvailable = (defaultButtonIcon || defaultButtonText) && !isDefaultButtonClicked;
  const isActionButtonAvailable = actionButtonIcon || actionButtonText;
  const isButtonsContainerAvailable = isDefaultButtonAvailable || isActionButtonAvailable;

  const voice = useMemo(() => getHelpVoiceURL(description), [description]);

  useEffect(() => {
    const element = mainContainerRef.current;
    if (!element) return;

    if (isMobile) {
      const parent = element.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        element.style.top = `${parent.offsetHeight}px`;
        element.style.left = `${-parentRect.left}px`;
        setIsRefresh(!isRefresh);
      }
    } else {
      const rect = element.getBoundingClientRect();
      const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (fullyVisible) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      const element = mainContainerRef.current;
      if (!element) return;
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isMobile, isRefresh]);

  return (
    <>
      <div ref={mainContainerRef} className={`${styles["main-container"]} ${styles[position]}`}>
        <div className={styles["top-container"]}>
          {voice && !isDefaultButtonClicked && (
            <div className={styles["sound-container"]}>
              {!isMuted && <PlayWithCircularProgress voice={voice} />}
              <DecoratedButton
                icon={isMuted ? "volume_off" : "volume_up"}
                theme={BUTTON_THEMES.TRANSPARENT}
                onClick={() => dispatch(muteStatusChanged(!isMuted))}
                extraClasses={styles["mute-button"]}
              />
            </div>
          )}
          <span
            onClick={() => {
              cleanup?.();
              dispatch(activeHelpIdChanged(null));
            }}
            className={`${styles["close"]} material-symbols-outlined`}
          >
            close
          </span>
        </div>
        {title && <h2>{isDefaultButtonClicked ? nextTitle || title : title}</h2>}
        {description && <p>{isDefaultButtonClicked ? nextDescription || description : description}</p>}
        {isButtonsContainerAvailable && (
          <div className={styles["buttons"]}>
            {isDefaultButtonAvailable && (
              <DecoratedButton
                icon={defaultButtonIcon}
                buttonText={defaultButtonText}
                onClick={() => {
                  defaultButtonClicked?.();
                  setIsDefaultButtonClicked(true);
                }}
                isRippling={isDefaultRippling}
              />
            )}
            {isActionButtonAvailable && (
              <DecoratedButton
                icon={actionButtonIcon}
                buttonText={isDefaultButtonClicked ? nextActionButtonText || actionButtonText : actionButtonText}
                onClick={actionButtonClicked}
                isRippling={!isDefaultButtonAvailable}
              />
            )}
          </div>
        )}
        <ProgressBar stepNumber={stepNumber} numberOfSteps={numberOfSteps} />
      </div>
      <div className={styles["backdrop"]}></div>
    </>
  );
};

export default Step;
