import { APP_PAGES } from "castofly-common/appPages.js";
import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { convertToHumanReadableDate } from "castofly-common/convertToHumanReadableDate.js";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import { ILLUSTRATIONS } from "../../../commonComponents/Illustrations/Illustrations.js";
import Label from "../../../commonComponents/Label/Label.js";
import { campaignModule } from "../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged } from "../store/uiReducer.js";
import Demo from "./Demo/Demo.js";
import styles from "./MainPage.module.scss";

const MainPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const page = useSelector(campaignModule.getPage);
  const campaigns = useSelector(campaignModule.getActiveCampaigns);

  const isAnyCampaignActive = page === CAMPAIGN_PAGES.MAIN && campaigns.length > 0;

  return (
    <>
      <div className={styles["main-container"]}>
        {isAnyCampaignActive && <Header title="Your QR Codes" info="View analytics or manage your active QR codes" />}

        {!isAnyCampaignActive && (
          <div className={styles["empty-container"]}>
            <img src={ILLUSTRATIONS.CAMPAIGN} alt="create your first campaign" />
            <Label text="You don’t have any active QR codes yet." />
          </div>
        )}

        {page === CAMPAIGN_PAGES.MAIN && campaigns.length !== 0 && (
          <div className={styles["campaigns"]}>
            <TitleRow />
            {campaigns.map((campaign) => (
              <div key={campaign.campaign_id} className={styles["campaign-container"]}>
                <span className={styles["name"]}>{campaign.name}</span>
                <span className={styles["date"]}>{convertToHumanReadableDate(campaign.creation_time / 1000)}</span>
                <DecoratedButton
                  icon={campaign.status !== CAMPAIGN_STATUS.LIVE ? "info" : "check"}
                  theme={BUTTON_THEMES.TRANSPARENT}
                  onClick={() => navigate(`${APP_PAGES.UPGRADE}?status=${campaign.status}`)}
                  extraClasses={styles[campaign.status !== CAMPAIGN_STATUS.LIVE ? "danger" : "live"]}
                />
                <span className={styles["visits"]}>{campaign.visits ?? 0}</span>

                <DecoratedButton
                  icon="show_chart"
                  theme={BUTTON_THEMES.TRANSPARENT}
                  onClick={() => dispatch(campaignPageChanged({ page: CAMPAIGN_PAGES.ANALYTICS, campaign }))}
                />
                <DecoratedButton
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
      <span>Status</span>
      <span className={styles["visits"]}>Visits</span>
      <span>Analytics</span>
      <span>Edit</span>
    </div>
  );
};
