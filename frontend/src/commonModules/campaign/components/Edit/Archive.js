import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { campaignModule, server } from "../../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged, campaignsChanged } from "../../store/uiReducer.js";
import styles from "./Archive.module.scss";

const Archive = ({ onError }) => {
  const dispatch = useDispatch();
  const campaigns = useSelector(campaignModule.getActiveCampaigns);
  const campaign = useSelector(campaignModule.getActiveCampaign);
  const [requestToArchive, setRequestToArchive] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const archive = () => {
    setIsArchiving(true);

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
      .catch(() => onError?.())
      .finally(() => setIsArchiving(false));
  };

  return (
    <>
      {!requestToArchive && (
        <div className={styles["archive-container"]}>
          <span>No longer need this QR code?</span>
          <DecoratedButton
            onClick={() => setRequestToArchive(true)}
            isBusy={isArchiving}
            buttonText={isArchiving ? "Deleting..." : "Delete"}
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
    </>
  );
};

export default Archive;
