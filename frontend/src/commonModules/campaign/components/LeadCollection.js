import { useState } from "react";

import DecoratedButton from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../commonComponents/InputBox/InputBox.js";
import SimpleSwitch from "../../../commonComponents/SimpleSwitch/SimpleSwitch.js";
import { useFadeInImage } from "../../../hooks/useFadeInImage.js";
import FORM from "./form.png";
import LANDING from "./landing.png";
import styles from "./LeadCollection.module.scss";
import QR from "./qr.png";

const LeadCollection = () => {
  const [noDataCollection, setNoDataCollection] = useState(true);

  const qrImg = useFadeInImage({ src: QR, alt: "QR image placeholder" });
  const landingImg = useFadeInImage({ src: LANDING, alt: "landging image" });
  const formImg = useFadeInImage({ src: FORM, alt: "form image" });

  const [isNameChecked, setIsNameChecked] = useState(true);
  const [isEmailChecked, setIsEmailChecked] = useState(true);
  const [isPhoneChecked, setIsPhoneChecked] = useState(false);
  const [isJobTitleChecked, setIsJobTitleChecked] = useState(false);
  const [isCommentsChecked, setIsCommentsChecked] = useState(true);

  return (
    <div className={styles["main-container"]}>
      <div className={styles["switch-container"]}>
        <span>Collect user info before redirecting?</span>
        <SimpleSwitch
          leftLabel="No"
          rightLabel="Yes"
          onFlip={() => setNoDataCollection(!noDataCollection)}
          isKnobOnLeft={noDataCollection}
        />
      </div>

      <h4>{noDataCollection ? "Without data collection" : "With data collection"}</h4>
      <div className={styles["steps-container"]}>
        <div className={styles["step"]}>
          <span>Visitor scans the QR code</span>
          {qrImg}
        </div>

        <span className="material-symbols-outlined">arrow_forward</span>

        {!noDataCollection && (
          <>
            <div className={styles["step"]}>
              <span>Visitor enters details (e.g. email)</span>
              {formImg}
            </div>
            <span className="material-symbols-outlined">arrow_forward</span>
          </>
        )}

        <div className={styles["step"]}>
          <span>Visitor is taken to the landing page</span>
          {landingImg}
        </div>
      </div>

      <DecoratedButton icon="open_in_new" buttonText="Test It" />

      {!noDataCollection && (
        <div className={styles["details-container"]}>
          <span className={styles["tip"]}>Collect only essential information to reduce visitor friction</span>
          <div className={styles["chechboxes-container"]}>
            <InputBox
              type="checkbox"
              label="Name"
              value={isNameChecked}
              setValue={setIsNameChecked}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Email"
              value={isEmailChecked}
              setValue={setIsEmailChecked}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Phone"
              value={isPhoneChecked}
              setValue={setIsPhoneChecked}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Job Title"
              value={isJobTitleChecked}
              setValue={setIsJobTitleChecked}
              extraClasses={styles["input-checkbox"]}
            />
            <InputBox
              type="checkbox"
              label="Comments"
              value={isCommentsChecked}
              setValue={setIsCommentsChecked}
              extraClasses={styles["input-checkbox"]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCollection;
