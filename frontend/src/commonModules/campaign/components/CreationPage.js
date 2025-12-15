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
import Branding from "./Branding.js";
import styles from "./CreationPage.module.scss";
import QRCode from "./QRCode.js";

const CreationPage = () => {
  const dispatch = useDispatch();
  const qrCode = useSelector(campaignModule.getQRCode);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [info, setInfo] = useState("");
  const [isDownloadRippling, setIsDownloadRippling] = useState(true);
  const [borningCampaignId, setBorningCampaignId] = useState();

  useEffect(() => {
    if (step === 1) {
      setInfo("Start by entering a name and landing page for your QR code");
      setTitle("Add QR Code Details");
    } else if (step === 2) {
      setInfo("Add your logo and colors to reflect your brand");
      setTitle("QR Code Branding");
    } else if (step === 3) {
      setInfo("Download and add this QR code to your marketing materials");
      setTitle("QR Code Ready");
    }
  }, [step]);

  // "Create Branded QR Code"

  return (
    <div className={styles["main-container"]}>
      <Header title={title} info={info} />

      {step === 1 && (
        <QRCode
          onSuccess={(item, campaign_id) => {
            dispatch(qrCodeChanged(item));
            setBorningCampaignId(campaign_id);
            setStep(2);
          }}
        />
      )}

      {step === 2 && <Branding setStep={setStep} borningCampaignId={borningCampaignId} />}

      {step === 3 && (
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
              isRippling={!isDownloadRippling}
            />

            <DecoratedButton
              onClick={async () => {
                setIsDownloadRippling(false);
                await downloadImage(qrCode);
              }}
              buttonText="Download QR Code"
              icon="download"
              isRippling={isDownloadRippling}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CreationPage;
