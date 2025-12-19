import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { convertToHumanReadableDate } from "castofly-common/convertToHumanReadableDate.js";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import Header from "../../../commonComponents/Header/Header.js";
import { ILLUSTRATIONS } from "../../../commonComponents/Illustrations/Illustrations.js";
import Label from "../../../commonComponents/Label/Label.js";
import { APP_PAGES } from "../../../frontEndConstants.js";
import { campaignModule } from "../../../index.js";
import { CAMPAIGN_PAGES, campaignPageChanged } from "../store/uiReducer.js";
import LeadCollection from "./LeadCollection.js";
import styles from "./MainPage.module.scss";

const MainPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const page = useSelector(campaignModule.getPage);
  const campaigns = useSelector(campaignModule.getActiveCampaigns);

  return (
    <div className={styles["main-container"]}>
      <Header title="Your QR Codes" info="View analytics or manage your active QR codes" />

      <LeadCollection />

      {page === CAMPAIGN_PAGES.MAIN && campaigns.length === 0 && (
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
              <span>{campaign.name}</span>
              <span className={styles["date"]}>{convertToHumanReadableDate(campaign.creation_time / 1000)}</span>
              <span>{campaign.visits ?? 0}</span>
              <DecoratedButton
                icon={campaign.status !== CAMPAIGN_STATUS.LIVE ? "info" : "check"}
                theme={BUTTON_THEMES.TRANSPARENT}
                onClick={() => navigate(`${APP_PAGES.UPGRADE}?status=${campaign.status}`)}
                extraClasses={styles[campaign.status !== CAMPAIGN_STATUS.LIVE ? "danger" : "live"]}
              />
              <DecoratedButton
                icon="show_chart"
                theme={BUTTON_THEMES.TRANSPARENT}
                onClick={() => dispatch(campaignPageChanged({ page: CAMPAIGN_PAGES.ANALYTICS, campaign }))}
              />
              <DecoratedButton
                icon="more_vert"
                theme={BUTTON_THEMES.TRANSPARENT}
                onClick={() => dispatch(campaignPageChanged({ page: CAMPAIGN_PAGES.EDIT, campaign }))}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MainPage;

export const TitleRow = () => {
  return (
    <div className={`${styles["campaign-container"]} ${styles["title-container"]}`}>
      <span>Name</span>
      <span className={styles["date"]}>Date</span>
      <span>Visits</span>
      <span>Status</span>
      <span>Analytics</span>
      <span></span>
    </div>
  );
};
