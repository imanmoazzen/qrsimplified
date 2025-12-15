import { API_RESPONSE_TYPES, EMAIL_TYPES, USER_FEEDBACK_LISTENERS } from "castofly-common/commonConstants.js";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { APP_PAGES } from "../../frontEndConstants.js";
import { auth, server } from "../../index.js";
import DecoratedButton, { BUTTON_THEMES } from "../DecoratedButton/DecoratedButton.js";
import DynamicTextArea from "../DynamicTextArea/DynamicTextArea.js";
import Header from "../Header/Header.js";
import { FEEDBACK_DETAILS, FEEDBACK_TYPE, SUCCESS_MESSAGES } from "./data.js";
import styles from "./Feedback.module.scss";
import FeedbackType from "./FeedbackType.js";

const STATES = {
  INIT: "INIT",
  DETAILS: "DETAILS",
  SUBMITTING: "SUBMITTING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

const Feedback = () => {
  const navigate = useNavigate();
  const user = useSelector(auth.userSelector);
  const [state, setState] = useState(STATES.INIT);
  const [details, setDetails] = useState("");
  const [type, setType] = useState(FEEDBACK_TYPE.POSITIVE);
  const [title, setTitle] = useState();

  useEffect(() => {
    if (state === STATES.INIT) {
      setTitle("What kind of feedback do you have?");
    } else if (state === STATES.DETAILS) {
      setTitle(FEEDBACK_DETAILS[type].title);
    } else if (state === STATES.SUBMITTING) {
      setTitle("");
    } else if (state === STATES.SUCCESS) {
      setTitle(SUCCESS_MESSAGES[type].title);
    } else if (state === STATES.ERROR) {
      setTitle("Something went wrong!");
    }
  }, [state, type]);

  const submit = () => {
    const { display_name, email } = user;
    const message = `${display_name}\nEmail: ${email}\nTime: ${new Date().toLocaleString()}\nFeedback Type: ${type}\nMessage: ${details}`;

    setState(STATES.SUBMITTING);

    server
      .requestFromApiv2("/user/message/sendEmail", {
        method: "POST",
        mode: "cors",
        data: {
          type: EMAIL_TYPES.USER_FEEDBACK,
          recipients: USER_FEEDBACK_LISTENERS,
          message,
        },
      })
      .then((res) => {
        if (res?.data?.message !== API_RESPONSE_TYPES.SUCCESS) throw new Error(res?.data?.info);
        setState(STATES.SUCCESS);
      })
      .catch(() => setState(STATES.ERROR));
  };

  return (
    <div className={styles["main-container"]}>
      <DecoratedButton
        buttonText={"Close"}
        icon={"close"}
        onClick={() => navigate(APP_PAGES.DASHBOARD)}
        extraContainerClasses={styles["close-container"]}
        theme={BUTTON_THEMES.TRANSPARENT}
      />

      <div className={styles["core-container"]}>
        <Header title={title} extraClasses={state === STATES.SUCCESS ? styles["success"] : ""} />

        {state === STATES.INIT && <FeedbackType type={type} setType={setType} />}

        {state === STATES.DETAILS && (
          <DynamicTextArea
            text={details}
            onTempTextChanged={setDetails}
            setText={setDetails}
            placeholder="Type your feedback here..."
            minimumNumberOfRows={8}
          />
        )}

        {state !== STATES.SUCCESS && state !== STATES.ERROR && (
          <div className={styles["buttons"]}>
            {state === STATES.INIT && (
              <DecoratedButton buttonText="Next" icon="arrow_forward" onClick={() => setState(STATES.DETAILS)} />
            )}

            {state === STATES.DETAILS && (
              <DecoratedButton buttonText="Go Back" icon="arrow_back" onClick={() => setState(STATES.INIT)} />
            )}

            {(state === STATES.DETAILS || state === STATES.SUBMITTING) && (
              <DecoratedButton
                buttonText={state === STATES.DETAILS ? "Submit" : "Submitting..."}
                icon="done"
                onClick={submit}
                isBusy={state === STATES.SUBMITTING}
              />
            )}
          </div>
        )}

        {(state === STATES.SUCCESS || state === STATES.ERROR) && (
          <div className={styles["message-container"]}>
            <span className={styles["message"]}>
              {state === STATES.SUCCESS
                ? SUCCESS_MESSAGES[type].message
                : "We couldn’t receive your feedback. Please try again later."}
            </span>

            <DecoratedButton
              buttonText="Go to Dashboard"
              icon="home"
              onClick={() => navigate(APP_PAGES.DASHBOARD)}
              isRippling={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
