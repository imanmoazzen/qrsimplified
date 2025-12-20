import { API_RESPONSE_TYPES } from "castofly-common";
import { APP_PAGES } from "castofly-common/appPages.js";
import { useEffect } from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import DecoratedButton, { BUTTON_THEMES } from "../../../commonComponents/DecoratedButton/DecoratedButton.js";
import WaitIndicator from "../../../commonComponents/WaitIndicator/WaitIndicator.js";
import { COMMON_MESSAGES } from "../../../frontEndConstants.js";
import { campaignModule, server } from "../../../index.js";
import {
  CAMPAIGN_PAGES,
  campaignPageChanged,
  campaignsChanged,
  dashboardingLoadingStatusChanged,
} from "../store/uiReducer.js";
import AnalyticsPage from "./AnalyticsPage.js";
import styles from "./Campaign.module.scss";
import CreationPage from "./CreationPage.js";
import EditPage from "./EditPage.js";
import MainPage from "./MainPage.js";

const Campaign = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const page = useSelector(campaignModule.getPage);
  const campaigns = useSelector(campaignModule.getActiveCampaigns);
  const isDashboardingLoading = useSelector(campaignModule.getDashboardingLoadingStatus);
  const [message, setMessage] = useState("");

  const isMainPage = page === CAMPAIGN_PAGES.MAIN;

  useEffect(() => {
    if (isDashboardingLoading) {
      server
        .requestFromApiv2(`/campaign`, {
          method: "GET",
          mode: "cors",
        })
        .then((res) => {
          if (res.data.message === API_RESPONSE_TYPES.FORBIDDEN) {
            navigate(APP_PAGES.LOGIN);
            return;
          }

          const { campaigns } = res.data;

          dispatch(campaignsChanged(campaigns));
          dispatch(campaignPageChanged(CAMPAIGN_PAGES.MAIN));
        })
        .catch(() => setMessage(COMMON_MESSAGES.GENERIC_ERROR))
        .finally(() => dispatch(dashboardingLoadingStatusChanged(false)));
    }
  }, [isDashboardingLoading]);

  if (isDashboardingLoading) return <WaitIndicator text={"Loading"} />;

  return (
    <div className={styles["main-container"]}>
      <DecoratedButton
        buttonText={isMainPage ? "Create New QR Code" : "Close"}
        icon={isMainPage ? "add" : "close"}
        onClick={() => dispatch(campaignPageChanged(isMainPage ? CAMPAIGN_PAGES.CREATION : CAMPAIGN_PAGES.MAIN))}
        extraContainerClasses={styles["new-campaign-container"]}
        extraClasses={page === CAMPAIGN_PAGES.CREATION && styles["hidden"]}
        theme={isMainPage ? BUTTON_THEMES.COLORED : BUTTON_THEMES.TRANSPARENT}
        isRippling={isMainPage && campaigns.length === 0}
      />

      {page === CAMPAIGN_PAGES.MAIN && <MainPage />}
      {page === CAMPAIGN_PAGES.CREATION && <CreationPage />}
      {page === CAMPAIGN_PAGES.EDIT && <EditPage />}
      {page === CAMPAIGN_PAGES.ANALYTICS && <AnalyticsPage />}

      {message && <span className={styles["info"]}>{message}</span>}
    </div>
  );
};

export default Campaign;
