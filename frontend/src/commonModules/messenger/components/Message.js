import cx from "classnames";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { USER_MESSAGE_TYPES, removeMessageByID } from "../store/uiReducer.js";
import styles from "./Message.module.scss";

const SLIDE_IN_TIME = 1000;
const FADE_OUT_TIME = 0;

const Message = ({ message }) => {
  const dispatch = useDispatch();

  const replayMessage = message?.replay;
  const slidingInByDefault = !replayMessage;
  const [timeoutIds, setTimeoutIds] = useState([]);
  const [slidingIn, setSlidingIn] = useState(slidingInByDefault);
  const [fadingOut, setFadingOut] = useState(false);

  const restartMessageTimeout = (duration = message.duration) => {
    if (timeoutIds.length > 0) timeoutIds.forEach((id) => clearTimeout(id));

    if (duration > 0) {
      // the below two lines: Math.min and Math.max are used so that even if
      // duration is smaller than SLIDE_IN_TIME + FADE_OUT_TIME, slideInTime and fadeOutTime are still given reasonable values.
      const slideInTime = Math.min(duration / 2, SLIDE_IN_TIME);
      const fadeOutTime = Math.max(duration / 2, duration - FADE_OUT_TIME);

      setFadingOut(false);
      setTimeoutIds([
        setTimeout(() => {
          dispatch(removeMessageByID({ id: message.id }));
        }, duration),
        setTimeout(() => {
          setSlidingIn(false);
        }, slideInTime),
        setTimeout(() => {
          setFadingOut(true);
        }, fadeOutTime),
      ]);
    }
  };

  useEffect(() => {
    restartMessageTimeout();
    if (message.type === USER_MESSAGE_TYPES.ERROR) {
      new Audio(`${process.env.PUBLIC_URL}/assets/sounds/error_sound.wav`).play();
    }
  }, []);

  const onClose = () => dispatch(removeMessageByID({ id: message.id }));

  const animationClasses = cx({
    [styles["sliding-in"]]: slidingIn,
    [styles["fading-out"]]: fadingOut,
    [styles["replay-message"]]: replayMessage,
  });

  switch (message.type) {
    case USER_MESSAGE_TYPES.ERROR:
      return (
        <MessageBox
          icon={"error"}
          content={message.content}
          containerClass={cx(styles["error"], animationClasses)}
          onClose={onClose}
          onInteract={restartMessageTimeout}
          id={message.id}
        />
      );
    case USER_MESSAGE_TYPES.INFO:
      return (
        <MessageBox
          icon={"info"}
          content={message.content}
          containerClass={cx(styles["info"], animationClasses)}
          onClose={onClose}
          onInteract={restartMessageTimeout}
          id={message.id}
        />
      );
    case USER_MESSAGE_TYPES.WARNING:
      return (
        <MessageBox
          icon={"error"}
          content={message.content}
          containerClass={cx(styles["warning"], animationClasses)}
          onClose={onClose}
          onInteract={restartMessageTimeout}
          id={message.id}
        />
      );
    case USER_MESSAGE_TYPES.WAITING:
      return (
        <MessageBox
          icon={"info"}
          heading={"Please Wait!"}
          content={message.content}
          containerClass={cx(styles["info"], animationClasses)}
          onClose={onClose}
          onInteract={restartMessageTimeout}
          id={message.id}
        />
      );
    case USER_MESSAGE_TYPES.SUCCESS:
      return (
        <MessageBox
          icon={"check_circle"}
          heading={"Success!"}
          content={message.content}
          containerClass={cx(styles["success"], animationClasses)}
          onClose={onClose}
          onInteract={restartMessageTimeout}
          id={message.id}
        />
      );
    case USER_MESSAGE_TYPES.UPDATE:
      return (
        <MessageBox
          icon={"sync"}
          content={message.content}
          containerClass={cx(styles["warning"], animationClasses)}
          onClose={onClose}
          onInteract={restartMessageTimeout}
          id={message.id}
        />
      );
    default:
      return null;
  }
};

const MessageBox = ({ icon, heading, content, containerClass, onClose, onInteract, id }) => {
  return (
    <div
      className={`${styles["messagebox-container"]} ${containerClass}`}
      key={id}
      onMouseEnter={() => onInteract(0)}
      onMouseLeave={() => onInteract()}
    >
      <div className={`material-symbols-outlined ${styles["icon"]}`}>{icon}</div>
      <div className={styles["content"]}>
        {heading && <span className={styles["heading"]}>{heading}</span>}
        {content.isHtml ? (
          <HtmlMessageBoxContent content={content.messageContent} />
        ) : (
          <PlainTextMessageBoxContent content={content.messageContent} />
        )}
      </div>
      <div className={`material-symbols-outlined ${styles["close-button"]}`} onClick={onClose}>
        close
      </div>
    </div>
  );
};

const PlainTextMessageBoxContent = ({ content }) => {
  return <div className={styles["body-text"]}>{content}</div>;
};

const HtmlMessageBoxContent = ({ content }) => {
  return <div className={styles["body-text"]} dangerouslySetInnerHTML={{ __html: content }} />;
};

export default Message;
