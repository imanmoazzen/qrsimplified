import { CAMPAIGN_STATUS, TRIAL_CAMPAIGN_VISIT_LIMIT } from "castofly-common/campaigns.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import { APP_PAGES } from "../../../frontEndConstants.js";
import { auth } from "../../../index.js";
import styles from "./UpgradePage.module.scss";

const UpgradePage = () => {
  const navigate = useNavigate();
  const isAnonymous = useSelector(auth.isAnonymousSelector);
  const user = useSelector(auth.userSelector);

  const qr_credits = user?.qr_credits;
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");

  let isLive = false;
  let title;
  let info;
  if (status === CAMPAIGN_STATUS.LIVE) {
    title = "Live QR Code";
    info = "This QR code is live and can be scanned unlimited times forever.";
    isLive = true;
  } else if (status === CAMPAIGN_STATUS.TRIAL) {
    title = "Trial QR Code";
    info = `Trial QR code lets you test that scanning works, but it can only be scanned up to ${TRIAL_CAMPAIGN_VISIT_LIMIT} times. Buy the QR code to unlock unlimited, lifetime scans.`;
  } else if (status === CAMPAIGN_STATUS.EXPIRED) {
    title = "Expired QR Code";
    info = "This QR code has expired and no longer redirects. Buy the QR code to unlock unlimited, lifetime scans.";
  } else if (status === CAMPAIGN_STATUS.ARCHIVED) {
    title = "Archived QR Code";
    info = "This QR code has been archived and no longer works.";
  }

  if (!status) return null;

  return (
    <div className={styles["main-container"]}>
      <span className={`material-symbols-outlined ${styles["qr-code"]}`}>qr_code</span>
      <Header title={title}>
        {user && qr_credits > 0 && (
          <span>
            You can create {qr_credits === 1 ? "one" : `up to ${qr_credits}`} lifetime QR code
            {qr_credits !== 1 ? "s" : ""}.
          </span>
        )}
      </Header>

      <p> {info}</p>

      {!isAnonymous && status !== CAMPAIGN_STATUS.ARCHIVED && (
        <DecoratedButton
          icon={isLive ? "home" : "shopping_cart"}
          buttonText={isLive ? "Go to Dashboard" : "Buy Now"}
          onClick={() => navigate(isLive ? APP_PAGES.DASHBOARD : APP_PAGES.CART)}
          isRippling={true}
        />
      )}
    </div>
  );
};

export default UpgradePage;
