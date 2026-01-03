import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../commonComponents/InputBox/InputBox.js";
import { isValidHttpsUrl } from "../../../commonUtil/stringUtils.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { campaignModule, server } from "../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged } from "../store/uiReducer.js";
import { generateQRCodeAsSvgURL, recolorSvgDataUrl } from "../utils.js";
import styles from "./NameAndLandingPage.module.scss";

export const QR_STATES = {
  INIT: "Init",
  NAME_EMPTY: "QR code name cannot be empty",
  URL_EMPTY: "Landing page cannot be empty",
  URL_INVALID: "Please enter a valid link starting with https://",
  CREATING_NEW_CAMPAIGN: "Creating new campaign",
  ERROR: COMMON_MESSAGES.GENERIC_ERROR,
};

const NameAndLandingPage = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const branding = useSelector(campaignModule.getBranding);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [state, setState] = useState(QR_STATES.INIT);

  const { color, background } = branding;
  const isMessageVisible = [QR_STATES.URL_EMPTY, QR_STATES.URL_INVALID, QR_STATES.NAME_EMPTY, QR_STATES.ERROR].includes(
    state
  );

  const createCampaign = async () => {
    try {
      if (!isCampaignValid()) return;

      setState(QR_STATES.CREATING_NEW_CAMPAIGN);

      const res = await server.requestFromApiv2(`/campaign`, {
        method: "POST",
        mode: "cors",
        data: { name, destination },
      });

      const { tracking_link, campaign_id } = res.data.item;
      const svgURL = await generateQRCodeAsSvgURL(tracking_link);
      const svgCode = recolorSvgDataUrl(svgURL, color, background);

      onSuccess?.(svgCode, campaign_id);
      setState(QR_STATES.INIT);
    } catch (error) {
      setState(QR_STATES.ERROR);
    }
  };

  const testLink = () => {
    if (isCampaignValid()) window.open(`${destination}?campaign=${name}`, "_blank", "noopener,noreferrer");
  };

  const isCampaignValid = () => {
    if (!name?.trim()) {
      setState(QR_STATES.NAME_EMPTY);
      return false;
    }

    if (!destination?.trim()) {
      setState(QR_STATES.URL_EMPTY);
      return false;
    }

    if (!isValidHttpsUrl(destination)) {
      setState(QR_STATES.URL_INVALID);
      return false;
    }

    return true;
  };

  return (
    <div className={styles["main-container"]}>
      <InputBox
        label="QR Code Name:"
        value={name}
        setValue={setName}
        onFocus={() => setState(QR_STATES.INIT)}
        isRippling={state === QR_STATES.NAME_EMPTY || !name}
        isDisabled={state === QR_STATES.CREATING_NEW_CAMPAIGN}
        placeholder="Enter a short name, e.g. Vegas Tradeshow Poster 2026"
      />

      <div className={styles["link-container"]}>
        <InputBox
          label="Landing Page:"
          value={destination}
          setValue={setDestination}
          onFocus={() => setState(QR_STATES.INIT)}
          isRippling={state === QR_STATES.URL_EMPTY || state === QR_STATES.URL_INVALID}
          isDisabled={state === QR_STATES.CREATING_NEW_CAMPAIGN}
          placeholder="Link opened after scanning the QR Code"
        />
        <DecoratedButton
          buttonText="Test"
          icon="open_in_new"
          onClick={testLink}
          theme={BUTTON_THEMES.TRANSPARENT}
          extraClasses={styles["test-button"]}
        />
      </div>

      {isMessageVisible && <span className={styles["info"]}>{state}</span>}

      <div className={styles["buttons"]}>
        <DecoratedButton
          buttonText="Cancel"
          icon="close"
          onClick={() => dispatch(campaignPageChanged(CAMPAIGN_PAGES.MAIN))}
        />
        <section>
          <DecoratedButton
            buttonText={state === QR_STATES.CREATING_NEW_CAMPAIGN ? "Creating..." : "Create QR Code"}
            icon="qr_code_2"
            onClick={createCampaign}
            isBusy={state === QR_STATES.CREATING_NEW_CAMPAIGN}
            theme={BUTTON_THEMES.COLORED}
          />
        </section>
      </div>
    </div>
  );
};

export default NameAndLandingPage;
