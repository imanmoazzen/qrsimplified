import { APP_PAGES } from "castofly-common/appPages.js";
import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { convertToHumanReadableDate } from "castofly-common/convertToHumanReadableDate.js";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import { ILLUSTRATIONS } from "../../../commonComponents/Illustrations/Illustrations.js";
import Label from "../../../commonComponents/Label/Label.js";
import { campaignModule } from "../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged } from "../store/uiReducer.js";
import useArchiveCampaigns from "../useArchiveCampaigns.js";
import Demo from "./Demo/Demo.js";
import styles from "./MainPage.module.scss";

const MainPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const page = useSelector(campaignModule.getPage);
  const campaigns = useSelector(campaignModule.getActiveCampaigns);
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingArchiveIds, setPendingArchiveIds] = useState(null);
  const [archiveError, setArchiveError] = useState("");
  const { archive, isArchiving } = useArchiveCampaigns();
  const selectedCampaigns = campaigns.filter((campaign) => selectedIds.includes(campaign.campaign_id));

  const toggleSelection = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const confirmArchive = async () => {
    if (!pendingArchiveIds?.length || isArchiving) return;
    setArchiveError("");
    try {
      const result = await archive(pendingArchiveIds);
      if (!result) return;
      setSelectedIds((current) => current.filter((id) => !result.archivedIds.includes(id)));
      setPendingArchiveIds(null);
      if (result.failedIds.length) {
        setArchiveError(
          `${result.failedIds.length} QR code${
            result.failedIds.length === 1 ? "" : "s"
          } could not be deleted. They remain selected; please try again.`
        );
      }
    } catch {
      setPendingArchiveIds(null);
      setArchiveError("Unable to delete the selected QR codes. Please try again.");
    }
  };

  const isAnyCampaignActive = page === CAMPAIGN_PAGES.MAIN && campaigns.length > 0;

  return (
    <>
      <div className={styles["main-container"]}>
        {isAnyCampaignActive && (
          <Header
            title="Your QR Codes"
            info="View analytics or manage your active QR codes"
            extraClasses={selectedCampaigns.length > 0 ? styles["selection-header"] : undefined}
          />
        )}

        {!isAnyCampaignActive && (
          <div className={styles["empty-container"]}>
            <img src={ILLUSTRATIONS.CAMPAIGN} alt="create your first campaign" />
            <Label text="You don’t have any active QR codes yet." />
          </div>
        )}

        {page === CAMPAIGN_PAGES.MAIN && campaigns.length !== 0 && (
          <div className={styles["campaigns"]}>
            {archiveError && (
              <p className={styles["archive-error"]} role="alert">
                {archiveError}
              </p>
            )}
            {selectedCampaigns.length > 0 && (
              <div className={styles["selection-actions"]}>
                {pendingArchiveIds && (
                  <div className={styles["archive-confirmation"]}>
                    <span>
                      Are you sure you want to delete{" "}
                      {pendingArchiveIds.length === 1 ? "this QR code" : `these ${pendingArchiveIds.length} QR codes`}?
                    </span>
                    <div className={styles["confirmation-buttons"]}>
                      <DecoratedButton
                        type="button"
                        buttonText="Cancel"
                        icon="close"
                        isDisabled={isArchiving}
                        onClick={() => setPendingArchiveIds(null)}
                      />
                      <DecoratedButton
                        type="button"
                        buttonText={isArchiving ? "Deleting..." : "Confirm"}
                        icon="check"
                        isBusy={isArchiving}
                        theme={BUTTON_THEMES.COLORED}
                        onClick={confirmArchive}
                      />
                    </div>
                  </div>
                )}
                {!pendingArchiveIds && (
                  <>
                    <span>{selectedCampaigns.length} selected</span>
                    <DecoratedButton
                      type="button"
                      buttonText="Cancel"
                      onClick={() => {
                        setSelectedIds([]);
                        setArchiveError("");
                      }}
                    />
                    <DecoratedButton
                      type="button"
                      buttonText={selectedCampaigns.length > 1 ? "Delete All" : "Delete"}
                      icon="delete"
                      theme={BUTTON_THEMES.COLORED}
                      onClick={() => {
                        setArchiveError("");
                        setPendingArchiveIds(selectedCampaigns.map((campaign) => campaign.campaign_id));
                      }}
                    />
                  </>
                )}
              </div>
            )}
            <TitleRow />
            {campaigns.map((campaign) => (
              <div key={campaign.campaign_id} className={styles["campaign-container"]}>
                <label className={styles["name-selection"]}>
                  <input
                    type="checkbox"
                    disabled={Boolean(pendingArchiveIds) || isArchiving}
                    checked={selectedIds.includes(campaign.campaign_id)}
                    onChange={() => toggleSelection(campaign.campaign_id)}
                    aria-label={`Select QR code ${campaign.name}`}
                  />
                  <span className={styles["name"]}>{campaign.name}</span>
                </label>
                <span className={styles["date"]}>{convertToHumanReadableDate(campaign.creation_time / 1000)}</span>
                <span className={styles["visits"]}>{campaign.visits ?? 0}</span>
                <DecoratedButton
                  isDisabled={isArchiving}
                  icon={campaign.status !== CAMPAIGN_STATUS.LIVE ? "info" : "check"}
                  theme={BUTTON_THEMES.TRANSPARENT}
                  onClick={() => navigate(`${APP_PAGES.UPGRADE}?status=${campaign.status}`)}
                  extraClasses={styles[campaign.status !== CAMPAIGN_STATUS.LIVE ? "danger" : "live"]}
                />

                <DecoratedButton
                  isDisabled={isArchiving}
                  icon="show_chart"
                  theme={BUTTON_THEMES.TRANSPARENT}
                  onClick={() => dispatch(campaignPageChanged({ page: CAMPAIGN_PAGES.ANALYTICS, campaign }))}
                />
                <DecoratedButton
                  isDisabled={isArchiving}
                  icon="edit"
                  theme={BUTTON_THEMES.TRANSPARENT}
                  onClick={() => dispatch(campaignPageChanged({ page: CAMPAIGN_PAGES.EDIT, campaign }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {!isAnyCampaignActive && <Demo />}
    </>
  );
};

export default MainPage;

export const TitleRow = () => {
  return (
    <div className={`${styles["campaign-container"]} ${styles["title-container"]}`}>
      <span className={styles["name"]}>Name</span>
      <span className={styles["date"]}>Date</span>
      <span className={styles["visits"]}>Visits</span>
      <span>Status</span>
      <span>Analytics</span>
      <span>Edit</span>
    </div>
  );
};
