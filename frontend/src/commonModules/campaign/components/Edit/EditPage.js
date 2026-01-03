import { API_RESPONSE_TYPES } from "castofly-common";
import { jsonToHash } from "castofly-common/hash.js";
import { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import DecoratedButtonWithTimeout from "../../../../commonComponents/DecoratedButton/DecoratedButtonWithTimeout.js";
import Header from "../../../../commonComponents/Header/Header.js";
import InputBox from "../../../../commonComponents/InputBox/InputBox.js";
import WaitIndicator from "../../../../commonComponents/WaitIndicator/WaitIndicator.js";
import { base64ToFile, isValidHttpsUrl } from "../../../../commonUtil/stringUtils.js";
import { COMMON_MESSAGES } from "../../../../frontEndConstants.js";
import { campaignModule, server } from "../../../../index.js";
import { campaignsChanged } from "../../store/uiReducer.js";
import {
  downloadImage,
  generateQRCodeAsSvgURL,
  mergeQrAndLogo,
  recolorSvgDataUrl,
  transferQRCodeFileToS3,
} from "../../utils.js";
import Adjustment from "../Branding/Adjustment.js";
import QRCodeAndLogo from "../Branding/QRCodeAndLogo.js";
import DataCollection from "../DataCollection.js";
import { QR_STATES } from "../NameAndLandingPage.js";
import Archive from "./Archive.js";
import styles from "./EditPage.module.scss";

const STATES = {
  LOADING: "LOADING",
  INIT: "INIT",
  EDITING: "EDITING",
  UPDATING: "UPDATING",
};

const EditPage = () => {
  const dispatch = useDispatch();
  const campaigns = useSelector(campaignModule.getActiveCampaigns);
  const campaign = useSelector(campaignModule.getActiveCampaign);
  const [state, setState] = useState(STATES.LOADING);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [lead, setLead] = useState();
  const [message, setMessage] = useState("");
  const [branding, setBranding] = useState();
  const [qrCode, setQRCode] = useState();

  const { tracking_link } = campaign ?? {};

  useEffect(() => {
    reset(campaign);
  }, [campaign]);

  const reset = (campaign) => {
    setState(STATES.LOADING);
    setBranding(campaign?.branding);
    setName(campaign?.name ?? "");
    setDestination(campaign?.destination ?? "");
    setLead(campaign?.lead ?? null);

    generateQRCodeAsSvgURL(tracking_link)
      .then((svgURL) => {
        const svgCode = recolorSvgDataUrl(svgURL, campaign?.branding?.color, campaign?.branding?.background);
        setQRCode(svgCode);
      })
      .catch(() => setMessage(COMMON_MESSAGES.GENERIC_ERROR))
      .finally(() => setState(STATES.INIT));
  };

  const onBrandingChanged = (newBranding) => {
    setBranding(newBranding);
    setQRCode(recolorSvgDataUrl(qrCode, newBranding.color, newBranding.background));
    setState(STATES.EDITING);
  };

  const update = async () => {
    if (!name?.trim()) {
      setMessage(QR_STATES.NAME_EMPTY);
      return;
    }

    if (!destination?.trim()) {
      setMessage(QR_STATES.URL_EMPTY);
      return;
    }

    if (!isValidHttpsUrl(destination)) {
      setMessage(QR_STATES.URL_INVALID);
      return;
    }

    setState(STATES.UPDATING);

    try {
      let s3URL = campaign?.s3URL;
      const isBrandingChanged = jsonToHash(campaign?.branding) !== jsonToHash(branding);

      if (isBrandingChanged) {
        const data = await mergeQrAndLogo(qrCode, branding.logo, branding.logo_scale);
        const file = base64ToFile(data, campaign.campaign_id);
        s3URL = await transferQRCodeFileToS3(file, "qr-codes");
      }

      const fieldsToSet = { name, destination, lead, branding, s3URL };

      const updateResponse = await server.requestFromApiv2(`/campaign`, {
        method: "PUT",
        mode: "cors",
        data: {
          campaign_id: campaign.campaign_id,
          fieldsToSet,
        },
      });

      if (updateResponse?.data.message !== API_RESPONSE_TYPES.SUCCESS) throw new Error("update failed");

      dispatch(
        campaignsChanged(
          campaigns.map((item) => (item.campaign_id === campaign.campaign_id ? { ...item, ...fieldsToSet } : item))
        )
      );
    } catch (error) {
      setMessage(COMMON_MESSAGES.GENERIC_ERROR);
    } finally {
      setState(STATES.INIT);
    }
  };

  const cancel = () => reset(campaign);

  return (
    <div className={styles["main-container"]}>
      <Header title="QR Code Settings" info={"Edit, download, or delete your QR code"} />

      {state === STATES.LOADING && <WaitIndicator text="Loading..." />}

      {state !== STATES.LOADING && (
        <div className={styles["core-container"]}>
          <div className={styles["edit-container"]}>
            <InputBox
              label="QR Code Name:"
              value={name}
              setValue={setName}
              onFocus={() => {
                setMessage("");
                setState(STATES.EDITING);
              }}
              isRippling={message === QR_STATES.NAME_EMPTY}
              isDisabled={state === STATES.UPDATING}
              placeholder="Enter a short, easy-to-remember name"
              extraClasses={styles["input-box"]}
            />

            <div className={styles["link-container"]}>
              <InputBox
                label="Landing Page:"
                value={destination}
                setValue={setDestination}
                onFocus={() => {
                  setMessage("");
                  setState(STATES.EDITING);
                }}
                isRippling={message === QR_STATES.URL_EMPTY || message === QR_STATES.URL_INVALID}
                isDisabled={state === STATES.UPDATING}
                placeholder="Link opened after scanning the QR Code"
                extraClasses={styles["input-box"]}
              />

              <DecoratedButton
                buttonText="Open"
                icon="open_in_new"
                onClick={() => window.open(destination, "_blank", "noopener,noreferrer")}
                theme={BUTTON_THEMES.TRANSPARENT}
                extraClasses={styles["cta-button"]}
              />
            </div>

            <div className={styles["link-container"]}>
              <InputBox
                label="Tracking Link (Not Editable):"
                value={tracking_link}
                extraClasses={`${styles["input-box"]} ${styles["no-editable"]}`}
              />

              <DecoratedButtonWithTimeout
                onClick={async () => await navigator.clipboard.writeText(tracking_link)}
                theme={BUTTON_THEMES.TRANSPARENT}
                extraClasses={styles["cta-button"]}
              />
            </div>

            <DataCollection
              lead={lead}
              setLead={setLead}
              onUpdate={() => setState(STATES.EDITING)}
              extraClasses={styles["data-collection"]}
            />

            <Adjustment
              onBrandingChanged={onBrandingChanged}
              branding={branding}
              onError={() => setMessage(COMMON_MESSAGES.GENERIC_ERROR)}
            />
          </div>

          <div className={styles["result-container"]}>
            <QRCodeAndLogo
              qrCode={qrCode}
              branding={branding}
              onBrandingChanged={onBrandingChanged}
              onError={() => setMessage(COMMON_MESSAGES.GENERIC_ERROR)}
            />

            <div className={styles["buttons"]}>
              {(state === STATES.EDITING || state === STATES.UPDATING) && (
                <>
                  {state !== STATES.UPDATING && <DecoratedButton buttonText="Cancel" icon="close" onClick={cancel} />}
                  <DecoratedButton
                    buttonText={state === STATES.UPDATING ? "Updating..." : "Update"}
                    icon="check"
                    onClick={update}
                    theme={BUTTON_THEMES.COLORED}
                    isBusy={state === STATES.UPDATING}
                  />
                </>
              )}
              {state === STATES.INIT && (
                <DecoratedButton
                  onClick={async () => await downloadImage(campaign.s3URL)}
                  buttonText="Download QR Code"
                  icon="download"
                />
              )}
            </div>

            {state === STATES.INIT && <Archive onError={() => setMessage(COMMON_MESSAGES.GENERIC_ERROR)} />}
          </div>
        </div>
      )}

      {message && <span className={styles["info"]}>{message}</span>}
    </div>
  );
};

export default EditPage;
