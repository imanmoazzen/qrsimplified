import {
  API_RESPONSE_TYPES,
  EMAIL_TYPES,
  REFERRAL_PERCENTAGE,
  USER_FEEDBACK_LISTENERS,
} from "castofly-common/commonConstants.js";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import DecoratedButtonWithTimeout from "../../../../commonComponents/DecoratedButton/DecoratedButtonWithTimeout.js";
import DropdownSelector from "../../../../commonComponents/DropdownSelector/DropdownSelector.js";
import Header from "../../../../commonComponents/Header/Header.js";
import SegmentedToggle from "../../../../commonComponents/SegmentedToggle/SegmentedToggle.js";
import WaitIndicator from "../../../../commonComponents/WaitIndicator/WaitIndicator.js";
import { APP_PAGES, COMMON_MESSAGES } from "../../../../frontEndConstants.js";
import { useFadeInImage } from "../../../../hooks/useFadeInImage.js";
import { auth, server } from "../../../../index.js";
import { generateReferralQRCode } from "../../../campaign/utils.js";
import styles from "./Referral.module.scss";

const PAYMENT_OPTIONS = ["PayPal", "Stripe Connect Express", "Amazon Gift Card"];
const TOGGLE_OPTIONS = ["Your Referral Code", "Your Earnings"];

const STATES = {
  LOADING: "LOADING",
  READY: "READY",
  CLAIMING: "CLAIMING",
  CLAIM_SUBMITTED: "CLAIM_SUBMITTED",
};

const Referral = () => {
  const navigate = useNavigate();
  const isAnonymous = useSelector(auth.isAnonymousSelector);
  const user = useSelector(auth.userSelector);
  const [campaign, setCampaign] = useState();
  const [visits, setVisits] = useState(0);
  const [purchases, setPurchases] = useState([]);
  const [state, setState] = useState(STATES.LOADING);
  const [paymentOption, setPaymentOption] = useState(PAYMENT_OPTIONS[0]);
  const [activeOption, setActiveOption] = useState();
  const [message, setMessage] = useState("");

  const { user_id, email, display_name } = user ?? {};

  const { tracking_link, s3URL } = campaign ?? {};

  const qrCodeImg = useFadeInImage({ src: s3URL, alt: "QR code url" });

  useEffect(() => {
    if (isAnonymous) navigate(APP_PAGES.SIGNUP);
  }, [isAnonymous]);

  useEffect(() => {
    setMessage("");
  }, [activeOption]);

  useEffect(() => {
    (async () => {
      try {
        setState(STATES.LOADING);
        const infoResponse = await server.requestFromApiv2(`/user/referral/info`, {
          method: "GET",
          mode: "cors",
        });

        const { campaign, visits, purchases } = infoResponse.data;

        setVisits(visits);
        setPurchases(purchases);

        if (campaign) {
          setCampaign(campaign);
          return;
        }

        const creationResponse = await generateReferralQRCode(user_id);
        setCampaign(creationResponse.data.campaign);
      } catch {
        setMessage(COMMON_MESSAGES.GENERIC_ERROR);
      } finally {
        setState(STATES.READY);
      }
    })();
  }, []);

  const claim = () => {
    if (purchases.length === 0) {
      setMessage("No payment can be issued as there are no earnings yet.");
      return;
    }

    setState(STATES.CLAIMING);

    const message = `Email: ${email}\nName: ${display_name}\nId: ${user_id}\nOption: ${paymentOption}\nTime: ${new Date().toLocaleString()}\nMessage: User claimed the earnings.`;

    server
      .requestFromApiv2("/user/message/sendEmail", {
        method: "POST",
        mode: "cors",
        data: {
          type: EMAIL_TYPES.USER_FEEDBACK,
          recipients: USER_FEEDBACK_LISTENERS,
          message,
          subject: "User Claimed Earning",
        },
      })
      .then((res) => {
        if (res?.data?.message !== API_RESPONSE_TYPES.SUCCESS) throw new Error(res?.data?.info);
        setState(STATES.CLAIM_SUBMITTED);
        setMessage(
          "Thank you! We’ve received your request. Our accounting team will contact you via email within 24 hours to process the payment."
        );
      })
      .catch(() => {
        setMessage(COMMON_MESSAGES.GENERIC_ERROR);
        setState(STATES.READY);
      });
  };

  if (state === STATES.LOADING) return <WaitIndicator text="Please wait..." />;

  return (
    <div className={styles["main-container"]}>
      <DecoratedButton
        buttonText={"Close"}
        icon={"close"}
        onClick={() => navigate("/")}
        extraContainerClasses={styles["close-container"]}
        theme={BUTTON_THEMES.TRANSPARENT}
      />
      <Header title="Referral Program">
        <span>
          Love QR Simplified? Share it with your network and earn {REFERRAL_PERCENTAGE}% of the revenue when someone
          buys QR codes.
        </span>
      </Header>

      <div className={styles["core-container"]}>
        <SegmentedToggle
          leftOption={TOGGLE_OPTIONS[0]}
          rightOption={TOGGLE_OPTIONS[1]}
          handleChange={(option) => setActiveOption(option)}
        />

        {activeOption === TOGGLE_OPTIONS[0] && campaign && (
          <div className={styles["referral-info-container"]}>
            <div className={styles["qrcode-container"]}>
              <span className={styles["label"]}>Ask people to scan this QR code:</span>
              {qrCodeImg}
            </div>
            <div className={styles["link-container"]}>
              <span className={styles["label"]}>Or share this link with them:</span>
              <section>
                <span className={styles["link"]}>{tracking_link}</span>
                <DecoratedButtonWithTimeout
                  onClick={async () => await navigator.clipboard.writeText(tracking_link)}
                  theme={BUTTON_THEMES.TRANSPARENT}
                  extraClasses={styles["cta-button"]}
                />
              </section>
            </div>
          </div>
        )}

        {activeOption === TOGGLE_OPTIONS[1] && (
          <div className={styles["performance"]}>
            <span className={styles["visits"]}>Your referral link has been visited {visits} times.</span>

            <div className={styles["purchases"]}>
              <PurchaseRow />
              {purchases.length === 0 && (
                <span className={styles["no-purchase"]}>No purchases have been made yet via this QR code.</span>
              )}
              {purchases.map((purchase, index) => (
                <div key={index} className={styles["purchase-container"]}>
                  <span>{purchase.referee_display_name}</span>
                  <span>${purchase.amount_total}</span>
                  <span>${Math.round((purchase.amount_total * REFERRAL_PERCENTAGE) / 100)}</span>
                </div>
              ))}
            </div>

            <div className={styles["payment-container"]}>
              <DecoratedButton
                buttonText={state === STATES.CLAIMING ? "Submitting" : "Claim Your Earnings"}
                icon="redeem"
                theme={BUTTON_THEMES.COLORED}
                onClick={claim}
                isBusy={state === STATES.CLAIMING}
              />
              <section>
                <label>Via:</label>
                <DropdownSelector
                  value={paymentOption}
                  setValue={setPaymentOption}
                  options={PAYMENT_OPTIONS}
                  optionLabels={PAYMENT_OPTIONS}
                />
              </section>
            </div>
          </div>
        )}

        {message && <span className={styles["message"]}>{message}</span>}
      </div>
    </div>
  );
};

export default Referral;

const PurchaseRow = () => {
  return (
    <div className={`${styles["purchase-container"]} ${styles["title-container"]}`}>
      <span></span>
      <span>Purchase Amount</span>
      <span>Your Earnings</span>
    </div>
  );
};
