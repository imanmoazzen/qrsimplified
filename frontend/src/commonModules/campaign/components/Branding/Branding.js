import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { removeDataBase64 } from "../../../../commonUtil/stringUtils.js";
import { COMMON_MESSAGES } from "../../../../frontEndConstants.js";
import { campaignModule, server } from "../../../../index.js";
import { CAMPAIGN_PAGES, brandingChanged, campaignPageChanged, qrCodeChanged } from "../../store/uiReducer.js";
import { mergeQrAndLogo, recolorSvgDataUrl } from "../../utils.js";
import Adjustment from "./Adjustment.js";
import styles from "./Branding.module.scss";
import QRCodeAndLogo from "./QRCodeAndLogo.js";

const STATES = {
  INIT: "INIT",
  PROCESSING: "PROCESSING",
  ERROR: COMMON_MESSAGES.GENERIC_ERROR,
};

const Branding = ({ setStep, borningCampaignId }) => {
  const dispatch = useDispatch();
  const branding = useSelector(campaignModule.getBranding);
  const qrCode = useSelector(campaignModule.getQRCode);
  const [state, setState] = useState(STATES.INIT);

  const { logo, logo_scale } = branding;

  const onBrandingChanged = async (newBranding) => {
    try {
      const { color, background, isTransparent } = newBranding;
      const isQRCodeUpdateRequired =
        branding.color !== color || branding.background !== background || branding.isTransparent !== isTransparent;

      if (isQRCodeUpdateRequired) dispatch(qrCodeChanged(recolorSvgDataUrl(qrCode, color, background)));
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
        data: { campaign_id: borningCampaignId, fieldsToSet: { s3URL: res.data.url, branding } },
      });

      dispatch(qrCodeChanged(data));
      setState(STATES.INIT);
      setStep?.(3);
    } catch (error) {
      setState(STATES.ERROR);
    }
  };

  return (
    <div className={styles["main-container"]}>
      <QRCodeAndLogo
        qrCode={qrCode}
        branding={branding}
        onBrandingChanged={onBrandingChanged}
        onError={() => setState(STATES.ERROR)}
      />
      <Adjustment branding={branding} onBrandingChanged={onBrandingChanged} onError={() => setState(STATES.ERROR)} />

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
