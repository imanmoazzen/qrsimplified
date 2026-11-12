import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import DecoratedButton, { BUTTON_THEMES } from "../../../../commonComponents/DecoratedButton/DecoratedButton.js";
import { campaignModule } from "../../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged } from "../../store/uiReducer.js";
import useArchiveCampaigns from "../../useArchiveCampaigns.js";
import styles from "./Archive.module.scss";

const Archive = ({ onError }) => {
  const dispatch = useDispatch();
  const campaign = useSelector(campaignModule.getActiveCampaign);
  const [requestToArchive, setRequestToArchive] = useState(false);
  const { archive: archiveSelected, isArchiving } = useArchiveCampaigns();

  const archive = async () => {
    try {
      const result = await archiveSelected([campaign.campaign_id]);
      if (!result) return;
      if (result.failedIds.length) onError?.();
      else dispatch(campaignPageChanged(CAMPAIGN_PAGES.MAIN));
    } catch {
      onError?.();
    }
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
