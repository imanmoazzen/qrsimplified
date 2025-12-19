import { useState } from "react";
import { useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { useFadeInImage } from "../../../hooks/useFadeInImage.js";
import { campaignModule, server } from "../../../index.js";
import DataCollection from "./DataCollection.js";
import FORM from "./form.png";
import LANDING from "./landing.png";
import styles from "./LeadCollection.module.scss";

const LeadCollection = ({ campaignId, setStep }) => {
  const qrCode = useSelector(campaignModule.getQRCode);
  const [lead, setLead] = useState(null);
  const [message, setMessage] = useState("");

  const landingImg = useFadeInImage({ src: LANDING, alt: "landging image" });
  const formImg = useFadeInImage({ src: FORM, alt: "form image" });

  const update = async (newLead) => {
    try {
      await server.requestFromApiv2(`/campaign`, {
        method: "PUT",
        mode: "cors",
        data: { campaign_id: campaignId, fieldsToSet: { lead: newLead } },
      });
    } catch (error) {
      setMessage(COMMON_MESSAGES.GENERIC_ERROR);
    }
  };

  return (
    <div className={styles["main-container"]}>
      <DataCollection lead={lead} setLead={setLead} onUpdate={(newLead) => update(newLead)} />

      <div className={styles["how-it-works"]}>
        <h4>{!lead ? "Without data collection" : "With data collection"}</h4>
        <span>Scan QR code to test</span>
      </div>

      <div className={styles["steps-container"]}>
        <div className={styles["step"]}>
          <img className={styles["qr-code-image"]} src={qrCode} alt="QR code for the campaign" />
          <span>Visitor scans the QR code</span>
        </div>

        <span className={`material-symbols-outlined ${styles["arrow"]}`}>arrow_forward</span>

        {lead && (
          <>
            <div className={styles["step"]}>
              {formImg}
              <span>Visitor enters details (e.g. email)</span>
            </div>
            <span className={`material-symbols-outlined ${styles["arrow"]}`}>arrow_forward</span>
          </>
        )}

        <div className={styles["step"]}>
          {landingImg}
          <span>Visitor is taken to the landing page</span>
        </div>
      </div>

      <DecoratedButton
        buttonText={"Finish"}
        icon="celebration"
        onClick={() => setStep(4)}
        theme={BUTTON_THEMES.COLORED}
      />

      {message && <span className={styles["message"]}>{message}</span>}
    </div>
  );
};

export default LeadCollection;
