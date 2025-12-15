import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuid } from "uuid";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import InputBox from "../../../commonComponents/InputBox/InputBox.js";
import { isValidHttpsUrl } from "../../../commonUtil/stringUtils.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { auth, campaignModule, server } from "../../../index.js";
import config from "../../server/config.js";
import { CAMPAIGN_PAGES, campaignPageChanged } from "../store/uiReducer.js";
import { generateQRCodeAsSVG } from "../utils.js";
import styles from "./QRCode.module.scss";

const STATES = {
  INIT: "Init",
  NAME_EMPTY: "QR code name cannot be empty",
  URL_EMPTY: "Landing page cannot be empty",
  URL_INVALID: "Please enter a valid link starting with https://",
  CREATING_NEW_CAMPAIGN: "Creating new campaign",
  ERROR: COMMON_MESSAGES.GENERIC_ERROR,
};

const QRCode = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const userId = useSelector(auth.userIdSelector);
  const branding = useSelector(campaignModule.getBranding);
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState(STATES.INIT);

  const { color, background } = branding;
  const isMessageVisible = [STATES.URL_EMPTY, STATES.URL_INVALID, STATES.NAME_EMPTY, STATES.ERROR].includes(state);

  const createCampaign = async () => {
    try {
      if (!isCampaignValid()) return;

      setState(STATES.CREATING_NEW_CAMPAIGN);

      const campaign_id = uuid();
      const trackingLink = `${config.apiV2URL}/campaign/${userId}/${campaign_id}`;
      const destination = `${link}?campaign=${campaign_id}`;

      const [svgCode] = await Promise.all([
        generateQRCodeAsSVG(trackingLink, color, background),
        server.requestFromApiv2(`/campaign`, {
          method: "POST",
          mode: "cors",
          data: { campaign_id, destination, name },
        }),
      ]);

      onSuccess?.(svgCode, campaign_id);
      setState(STATES.INIT);
    } catch (error) {
      setState(STATES.ERROR);
    }
  };

  const testLink = () => {
    if (isCampaignValid()) window.open(`${link}?campaign=${name}`, "_blank", "noopener,noreferrer");
  };

  const isCampaignValid = () => {
    if (!name?.trim()) {
      setState(STATES.NAME_EMPTY);
      return false;
    }

    if (!link?.trim()) {
      setState(STATES.URL_EMPTY);
      return false;
    }

    if (!isValidHttpsUrl(link)) {
      setState(STATES.URL_INVALID);
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
        onFocus={() => setState(STATES.INIT)}
        isRippling={state === STATES.NAME_EMPTY || !name}
        isDisabled={state === STATES.CREATING_NEW_CAMPAIGN}
        placeholder="Enter a short name, e.g. Vegas Tradeshow Poster 2026"
      />
      <InputBox
        label="Landing Page:"
        value={link}
        setValue={setLink}
        onFocus={() => setState(STATES.INIT)}
        isRippling={state === STATES.URL_EMPTY || state === STATES.URL_INVALID}
        isDisabled={state === STATES.CREATING_NEW_CAMPAIGN}
        placeholder="Link opened after scanning the QR Code"
      />
      {isMessageVisible && <span className={styles["info"]}>{state}</span>}
      <div className={styles["buttons"]}>
        <DecoratedButton
          buttonText="Cancel"
          icon="close"
          onClick={() => dispatch(campaignPageChanged(CAMPAIGN_PAGES.MAIN))}
        />
        <section>
          <DecoratedButton buttonText="Test Link" icon="open_in_new" onClick={testLink} />
          <DecoratedButton
            buttonText={state === STATES.CREATING_NEW_CAMPAIGN ? "Creating..." : "Create QR Code"}
            icon="qr_code_2"
            onClick={createCampaign}
            isBusy={state === STATES.CREATING_NEW_CAMPAIGN}
            theme={BUTTON_THEMES.COLORED}
          />
        </section>
      </div>
    </div>
  );
};

export default QRCode;
