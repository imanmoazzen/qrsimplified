import { APP_PAGES } from "castofly-common/appPages.js";
import { CAMPAIGN_STATUS, TRIAL_CAMPAIGN_VISIT_LIMIT } from "castofly-common/campaigns.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import { auth } from "../../../index.js";
import styles from "./UpgradePage.module.scss";

const UpgradePage = () => {
  const navigate = useNavigate();
  const isAnonymous = useSelector(auth.isAnonymousSelector);

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
    info = `This QR code has expired and no longer redirects. ${
      !isAnonymous ? "Buy the QR code to unlock unlimited, lifetime scans." : ""
    }`;
  } else if (status === CAMPAIGN_STATUS.ARCHIVED) {
    title = "Archived QR Code";
    info = "This QR code has been archived and no longer works.";
  } else if (status === CAMPAIGN_STATUS.NOT_EXISTS) {
    title = "QR Code Unavailable";
    info = "This QR code doesn’t exist.";
  }

  if (!status) return null;

  return (
    <div className={styles["main-container"]}>
      {!isAnonymous && (
        <DecoratedButton
          buttonText={"Close"}
          icon={"close"}
          onClick={() => navigate("/")}
          extraContainerClasses={styles["close-container"]}
          theme={BUTTON_THEMES.TRANSPARENT}
        />
      )}

      <span className={`material-symbols-outlined ${styles["qr-code"]}`}>qr_code</span>
      <Header title={title} />
      <p> {info}</p>

      {!isAnonymous && status !== CAMPAIGN_STATUS.ARCHIVED && status !== CAMPAIGN_STATUS.NOT_EXISTS && (
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
