import { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import { campaignModule } from "../../../index.js";
import {
  CAMPAIGN_PAGES,
  campaignPageChanged,
  dashboardingLoadingStatusChanged,
  qrCodeChanged,
} from "../store/uiReducer.js";
import { downloadImage } from "../utils.js";
import Branding from "./Branding/Branding.js";
import styles from "./CreationPage.module.scss";
import LeadCollection from "./LeadCollection.js";
import NameAndLandingPage from "./NameAndLandingPage.js";

const CREATION_STEPS = [
  { label: "Details", icon: "link" },
  { label: "Branding", icon: "palette" },
  { label: "Leads", icon: "contact_mail" },
  { label: "Download", icon: "download" },
];

const CreationPage = () => {
  const dispatch = useDispatch();
  const qrCode = useSelector(campaignModule.getQRCode);
  const [trackingLink, setTrackingLink] = useState();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [info, setInfo] = useState("");
  const [borningCampaignId, setBorningCampaignId] = useState();

  useEffect(() => {
    if (step === 1) {
      setTitle("Add QR Code Details");
      setInfo("Start by entering a name and landing page for your QR code");
    } else if (step === 2) {
      setTitle("QR Code Branding");
      setInfo("Add your logo and colors to reflect your brand");
    } else if (step === 3) {
      setTitle("Lead Collection");
      setInfo("Capture visitor details to better understand your scans");
    } else if (step === 4) {
      setTitle("QR Code Ready");
      setInfo("Download and add this QR code to your marketing materials");
    }
  }, [step]);

  return (
    <div className={`${styles["main-container"]} ${step === 3 && styles["more-space"]}`}>
      <nav className={styles["stage-navigation"]} aria-label="QR code creation progress">
        <ol className={styles["stage-list"]}>
          {CREATION_STEPS.map(({ label, icon }, index) => (
            <li
              key={label}
              className={`${styles["stage"]} ${index + 1 === step ? styles["active"] : ""} ${
                index + 1 < step ? styles["completed"] : ""
              }`}
              aria-current={index + 1 === step ? "step" : undefined}
              aria-label={`Step ${index + 1} of ${CREATION_STEPS.length}: ${label}${
                index + 1 < step ? ", completed" : ""
              }`}
            >
              <span className={styles["stage-top"]} aria-hidden="true">
                <span className={styles["stage-number"]}>{index + 1}</span>
                <span className={styles["stage-label"]}>
                  <span className={`material-symbols-outlined ${styles["stage-icon"]}`}>{icon}</span>
                  <span>{label}</span>
                </span>
              </span>
              <span className={styles["stage-line"]} aria-hidden="true" />
            </li>
          ))}
        </ol>
      </nav>

      <Header title={title} info={info} extraClasses={styles["page-header"]} />

      {step === 1 && (
        <NameAndLandingPage
          onSuccess={(item, campaign_id, tracking_link) => {
            setTrackingLink(tracking_link);
            dispatch(qrCodeChanged(item));
            setBorningCampaignId(campaign_id);
            setStep(2);
          }}
        />
      )}

      {step === 2 && <Branding borningCampaignId={borningCampaignId} trackingLink={trackingLink} setStep={setStep} />}

      {step === 3 && <LeadCollection campaignId={borningCampaignId} setStep={setStep} />}

      {step === 4 && (
        <>
          <div className={styles["image-container"]}>
            <img className={styles["qr-code-image"]} src={qrCode} alt="QR code for the campaign" />
            <span className={styles["moving-bar"]}></span>
          </div>

          <div className={styles["buttons"]}>
            <DecoratedButton
              onClick={() => {
                dispatch(dashboardingLoadingStatusChanged(true));
                dispatch(campaignPageChanged(CAMPAIGN_PAGES.MAIN));
              }}
              buttonText="Go to Dashboard"
              icon="Home"
            />

            <DecoratedButton
              onClick={async () => await downloadImage(qrCode)}
              buttonText="Download QR Code"
              icon="download"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CreationPage;
