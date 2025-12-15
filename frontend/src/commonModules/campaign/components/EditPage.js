import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { useState } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import InputBox from "../../../commonComponents/InputBox/InputBox.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { useFadeInImage } from "../../../hooks/useFadeInImage.js";
import { campaignModule, server } from "../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged, campaignsChanged } from "../store/uiReducer.js";
import { downloadImage } from "../utils.js";
import styles from "./EditPage.module.scss";

const STATES = {
  INIT: "INIT",
  NAME_EDITING: "NAME_EDITING",
  UPDATING: "UPDATING",
  ARCHIVING: "ARCHIVING",
};

const EditPage = () => {
  const dispatch = useDispatch();
  const campaigns = useSelector(campaignModule.getActiveCampaigns);
  const campaign = useSelector(campaignModule.getActiveCampaign);
  const [state, setState] = useState(STATES.INIT);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [requestToArchive, setRequestToArchive] = useState(false);

  const qrCodeImg = useFadeInImage({
    src: campaign.s3URL,
    alt: "QR code url",
  });

  const destination = campaign.destination;

  useEffect(() => {
    setName(campaign?.name ?? "");
  }, [campaign]);

  const update = () => {
    setState(STATES.UPDATING);

    server
      .requestFromApiv2(`/campaign`, {
        method: "PUT",
        mode: "cors",
        data: { campaign_id: campaign.campaign_id, fieldsToSet: { name } },
      })
      .then(() =>
        dispatch(
          campaignsChanged(
            campaigns.map((item) => (item.campaign_id === campaign.campaign_id ? { ...item, name } : item))
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

      <div className={styles["name-container"]}>
        <InputBox
          label="Name:"
          value={name}
          setValue={setName}
          onFocus={() => setState(STATES.NAME_EDITING)}
          placeholder="Enter a short, easy-to-remember name"
          isHorizontal={true}
          extraClasses={styles["input-box"]}
        />

        {(state === STATES.NAME_EDITING || state === STATES.UPDATING) && (
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
      </div>

      <div className={styles["link-container"]}>
        <label className={styles["title"]}>Link:</label>
        <span className={styles["link"]}>{destination}</span>
        <DecoratedButton
          icon="open_in_new"
          onClick={() => window.open(destination, "_blank", "noopener,noreferrer")}
          theme={BUTTON_THEMES.TRANSPARENT}
          extraClasses={styles["open-button"]}
        />
      </div>

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
            buttonText={state === STATES.ARCHIVING ? "Archiving..." : "Archive"}
            icon="archive"
            extraContainerClasses={styles["archive-button-container"]}
          />
        </div>
      )}

      {requestToArchive && (
        <div className={styles["confirm-container"]}>
          <span>Are you sure you want to archive this QR code?</span>
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

      {message && <span className={styles["info"]}>{message}</span>}
    </div>
  );
};

export default EditPage;
