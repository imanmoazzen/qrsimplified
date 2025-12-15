import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import appSettings from "../../../../../../appSettings.js";
import DecoratedButton from "../../../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { auth } from "../../../../../../index.js";
import styles from "./PayoutRequest.module.scss";

const slackLambdaUrl = appSettings.get("api.slack_lambda_endpoint");

const STATE = {
  INIT: "INIT",
  REQUEST: "REQUEST",
  FINISH: "FINISH",
  ERROR: "ERROR",
};

const PayoutRequest = ({ referralId }) => {
  const userId = useSelector(auth.userIdSelector);
  const userEmail = useSelector(auth.userEmailSelector);
  const [state, setState] = useState(STATE.INIT);

  useEffect(() => {
    setState(STATE.INIT);
  }, []);

  const handleClick = () => {
    setState(STATE.REQUEST);

    const message = JSON.stringify({
      text: `user ${userId} with email ${userEmail} and referral id ${referralId} asked for a payout`,
    });

    fetch(slackLambdaUrl, {
      method: "post",
      body: message,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(() => {
        setState(STATE.FINISH);
      })
      .catch(() => {
        setState(STATE.ERROR);
      });
  };

  return (
    <div className={styles["main-container"]}>
      {state !== STATE.FINISH && (
        <DecoratedButton
          icon="attach_money"
          buttonText="Request Payment"
          extraClasses={styles["button"]}
          onClick={handleClick}
          isBusy={state === STATE.REQUEST}
        />
      )}

      {state === STATE.FINISH && (
        <span>
          We&apos;ve received your request. Someone from our accounting department will follow up with you within 24
          hours.
        </span>
      )}

      {state === STATE.ERROR && (
        <span className={styles["error"]}>
          We couldn&apos;t process your request. Please contact <strong>info@scriptover.com</strong> for help.
        </span>
      )}
    </div>
  );
};

export default PayoutRequest;
