import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuid } from "uuid";

import ColorPicker from "../../../commonComponents/ColorPicker/ColorPicker.js";
import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { fileSelector } from "../../../commonComponents/FileSelector/FileSelector.js";
import SimpleSwitch from "../../../commonComponents/SimpleSwitch/SimpleSwitch.js";
import { removeDataBase64 } from "../../../commonUtil/stringUtils.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { campaignModule, server } from "../../../index.js";
import { CAMPAIGN_PAGES, brandingChanged, campaignPageChanged, qrCodeChanged } from "../store/uiReducer.js";
import { fileToBase64, getSizeFromScale, mergeQrAndLogo, recolorSvgDataUrl } from "../utils.js";
import styles from "./Branding.module.scss";

const STATES = {
  INIT: "INIT",
  UPLOADING_LOGO: "UPLOADING_LOGO",
  DELETING_LOGO: "DELETING_LOGO",
  PROCESSING: "PROCESSING",
  ERROR: COMMON_MESSAGES.GENERIC_ERROR,
};

const Branding = ({ setStep, borningCampaignId }) => {
  const dispatch = useDispatch();
  const branding = useSelector(campaignModule.getBranding);
  const qrCode = useSelector(campaignModule.getQRCode);
  const [state, setState] = useState(STATES.INIT);

  const { logo, logo_scale, color, background, isTransparent } = branding;
  const size = getSizeFromScale(logo_scale);

  const upload = () => {
    fileSelector.choose("image/*", () => {
      fileSelector.getImages().forEach(async (file) => {
        try {
          setState(STATES.UPLOADING_LOGO);

          const base64 = await fileToBase64(file);

          const res = await server.requestFromApiv2("/assets/upload", {
            method: "POST",
            mode: "cors",
            data: {
              file: base64,
              name: uuid(),
              type: file.type,
              folder: "logos",
            },
          });

          updateBranding({ ...branding, logo: res.data.url });
          setState(STATES.INIT);
        } catch (error) {
          setState(STATES.ERROR);
        }
      });
    });
  };

  const remove = async () => {
    try {
      setState(STATES.DELETING_LOGO);

      await server.requestFromApiv2("/assets/remove", {
        method: "DELETE",
        mode: "cors",
        data: { url: logo },
      });

      updateBranding({ ...branding, logo: null });
      setState(STATES.INIT);
    } catch (error) {
      setState(STATES.ERROR);
    }
  };

  const scale = (e) => updateBranding({ ...branding, logo_scale: e.target.value });

  const updateColor = (newColor) => {
    updateBranding({ ...branding, color: newColor });
    dispatch(qrCodeChanged(recolorSvgDataUrl(qrCode, newColor, background)));
  };

  const updateBackground = (newColor) => {
    updateBranding({ ...branding, background: newColor });
    dispatch(qrCodeChanged(recolorSvgDataUrl(qrCode, color, newColor)));
  };

  const updateOpacity = async () => {
    const newOpacity = !isTransparent;
    const newBackground = newOpacity ? "#0000" : background !== "#0000" ? background : "#000000";
    updateBranding({ ...branding, isTransparent: newOpacity, background: newBackground });
    dispatch(qrCodeChanged(recolorSvgDataUrl(qrCode, color, newBackground)));
  };

  const updateBranding = async (newBranding) => {
    try {
      dispatch(brandingChanged(newBranding));
      server.requestFromApiv2("/user/updateInfo", {
        method: "POST",
        mode: "cors",
        data: { branding: newBranding },
      });
    } catch (error) {
      setState(STATES.ERROR);
    }
  };

  const cancel = async () => {
    dispatch(campaignPageChanged(CAMPAIGN_PAGES.MAIN));

    try {
      server.requestFromApiv2(`/campaign`, {
        method: "DELETE",
        mode: "cors",
        data: { campaign_id: borningCampaignId },
      });
    } catch (error) {
      setState(COMMON_MESSAGES.GENERIC_ERROR);
    }
  };

  const confirm = async () => {
    try {
      setState(STATES.PROCESSING);
      const data = await mergeQrAndLogo(qrCode, logo, logo_scale);
      const sanitizedForS3 = removeDataBase64(data);

      const res = await server.requestFromApiv2("/assets/upload", {
        method: "POST",
        mode: "cors",
        data: {
          file: sanitizedForS3,
          name: borningCampaignId,
          type: "image/png",
          folder: "qr-codes",
        },
      });

      await server.requestFromApiv2(`/campaign`, {
        method: "PUT",
        mode: "cors",
        data: { campaign_id: borningCampaignId, fieldsToSet: { s3URL: res.data.url } },
      });

      dispatch(qrCodeChanged(data));
      setState(STATES.INIT);
      setStep(3);
    } catch (error) {
      console(error);
      setState(STATES.ERROR);
    }
  };

  return (
    <div className={styles["main-container"]}>
      <div className={styles["logo-container"]}>
        <span className={styles["moving-bar"]}></span>
        <img className={styles["qr-code-image"]} src={qrCode} alt="QR code for the campaign" />

        {!logo && (
          <DecoratedButton
            buttonText={state === STATES.UPLOADING_LOGO ? "Uploading..." : "Upload Logo"}
            icon="upload"
            onClick={upload}
            isBusy={state === STATES.UPLOADING_LOGO}
            extraContainerClasses={styles["upload-button-container"]}
          />
        )}

        {logo && <img src={logo} style={{ width: `${size}px` }} alt="logo for the company" />}
      </div>

      {logo && (
        <div className={styles["resize-container"]}>
          <div className={`${styles["scan-to-check-message"]} ${logo_scale > 4 && styles["visible"]}`}>
            <span className="material-symbols-outlined">mobile_hand</span>
            <span>
              Scan the QR code with your phone to make sure it still works with the larger logo. If not, make the logo
              smaller.
            </span>
          </div>
          <div className={styles["resize-slider"]}>
            <section>
              <label>Resize Logo:</label>
              <input
                type="range"
                min="1"
                max="11"
                value={logo_scale}
                step={1}
                onChange={scale}
                className={styles["slider"]}
              />
            </section>
            <DecoratedButton
              buttonText={state === STATES.DELETING_LOGO ? "Deleting..." : "Delete Logo"}
              icon="delete"
              onClick={remove}
              isBusy={state === STATES.DELETING_LOGO}
            />
          </div>
        </div>
      )}

      <ColorPicker currentColor={color} setCurrentColor={updateColor} label="Color:" />

      <div className={styles["background-color-container"]}>
        {!isTransparent && (
          <ColorPicker currentColor={background} setCurrentColor={updateBackground} label="Background Color:" />
        )}
        <SimpleSwitch
          leftLabel="Transparent"
          rightLabel="Solid Background"
          isKnobOnLeft={isTransparent}
          onFlip={updateOpacity}
        />
      </div>

      <div className={styles["buttons"]}>
        <DecoratedButton icon="close" buttonText={"Cancel"} onClick={cancel} />
        <DecoratedButton
          icon="check"
          buttonText={state === STATES.PROCESSING ? "Processing…" : "Confirm"}
          onClick={confirm}
          theme={BUTTON_THEMES.COLORED}
          isBusy={state === STATES.PROCESSING}
        />
      </div>

      {state === STATES.ERROR && <span className={styles["info"]}>{state}</span>}
    </div>
  );
};

export default Branding;
