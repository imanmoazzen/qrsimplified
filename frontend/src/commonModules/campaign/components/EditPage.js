import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import DecoratedButtonWithTimeout from "../../../commonComponents/DecoratedButton/DecoratedButtonWithTimeout.js";
import Header from "../../../commonComponents/Header/Header.js";
import InputBox from "../../../commonComponents/InputBox/InputBox.js";
import { isValidHttpsUrl } from "../../../commonUtil/stringUtils.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { useFadeInImage } from "../../../hooks/useFadeInImage.js";
import { campaignModule, server } from "../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged, campaignsChanged } from "../store/uiReducer.js";
import { downloadImage } from "../utils.js";
import styles from "./EditPage.module.scss";
import { QR_STATES } from "./QRCode.js";

const STATES = {
  INIT: "INIT",
  EDITING: "EDITING",
  UPDATING: "UPDATING",
  ARCHIVING: "ARCHIVING",
};

const EditPage = () => {
  const dispatch = useDispatch();
  const campaigns = useSelector(campaignModule.getActiveCampaigns);
  const campaign = useSelector(campaignModule.getActiveCampaign);
  const [state, setState] = useState(STATES.INIT);
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [requestToArchive, setRequestToArchive] = useState(false);

  const { tracking_link, s3URL } = campaign ?? {};

  const qrCodeImg = useFadeInImage({ src: s3URL, alt: "QR code url" });

  useEffect(() => {
    setName(campaign?.name ?? "");
    setDestination(campaign?.destination ?? "");
  }, [campaign]);

  const update = () => {
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

    server
      .requestFromApiv2(`/campaign`, {
        method: "PUT",
        mode: "cors",
        data: { campaign_id: campaign.campaign_id, fieldsToSet: { name, destination } },
      })
      .then(() =>
        dispatch(
          campaignsChanged(
            campaigns.map((item) => (item.campaign_id === campaign.campaign_id ? { ...item, name, destination } : item))
          )
        )
      )
      .catch(() => setMessage(COMMON_MESSAGES.GENERIC_ERROR))
      .finally(() => setState(STATES.INIT));
  };

  const archive = () => {
    setState(STATES.ARCHIVING);

    const status = CAMPAIGN_STATUS.ARCHIVED;

    server
      .requestFromApiv2(`/campaign`, {
        method: "PUT",
        mode: "cors",
        data: { campaign_id: campaign.campaign_id, fieldsToSet: { status } },
      })
      .then(() => {
        dispatch(
          campaignsChanged(
            campaigns.map((item) => (item.campaign_id === campaign.campaign_id ? { ...item, status } : item))
          )
        );
        dispatch(campaignPageChanged(CAMPAIGN_PAGES.MAIN));
      })
      .catch(() => setMessage(COMMON_MESSAGES.GENERIC_ERROR))
      .finally(() => setState(STATES.INIT));
  };

  return (
    <div className={styles["main-container"]}>
      <Header title="QR Code Details" info={"Rename, download, or archive your QR code"} />

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

      {(state === STATES.EDITING || state === STATES.UPDATING) && (
        <div className={styles["buttons"]}>
          <DecoratedButton buttonText="Cancel" icon="close" onClick={() => setState(STATES.INIT)} />
          <DecoratedButton
            buttonText={state === STATES.UPDATING ? "Updating..." : "Update"}
            icon="check"
            onClick={update}
            theme={BUTTON_THEMES.COLORED}
            isBusy={state === STATES.UPDATING}
          />
        </div>
      )}

      {message && <span className={styles["info"]}>{message}</span>}

      <div className={styles["qrcode-container"]}>
        {qrCodeImg}

        <DecoratedButton
          onClick={async () => await downloadImage(campaign.s3URL)}
          buttonText="Download QR Code"
          icon="download"
        />
      </div>

      {!requestToArchive && (
        <div className={styles["archive-container"]}>
          <span>No longer need this QR code?</span>
          <DecoratedButton
            onClick={() => setRequestToArchive(true)}
            isBusy={state === STATES.ARCHIVING}
            buttonText={state === STATES.ARCHIVING ? "Deleting..." : "Delete"}
            icon="delete"
            extraContainerClasses={styles["archive-button-container"]}
          />
        </div>
      )}

      {requestToArchive && (
        <div className={styles["confirm-container"]}>
          <span>Are you sure you want to delete this QR code?</span>
          <div className={styles["buttons"]}>
            <DecoratedButton buttonText="Cancel" icon="close" onClick={() => setRequestToArchive(false)} />
            <DecoratedButton
              buttonText="Confirm"
              icon="check"
              onClick={() => {
                setRequestToArchive(false);
                archive();
              }}
              theme={BUTTON_THEMES.COLORED}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPage;
