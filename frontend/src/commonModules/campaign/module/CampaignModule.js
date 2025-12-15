import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { createSelector } from "reselect";

import { AbstractModule } from "../../project-root/index.js";
import uiReducer, { uiInitialState } from "../store/uiReducer.js";

export default class CampaignModule extends AbstractModule {
  constructor({ parentModule, name }) {
    super({ parentModule, name });
  }

  uiInitialState = uiInitialState;
  uiReducer = uiReducer;

  getDashboardingLoadingStatus = createSelector(
    this.parentModule.uiSelector,
    (ui) => ui[this.name]?.isDashboardingLoading
  );
  getPage = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.page);
  getActiveCampaign = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.activeCampaign);
  getActiveCampaigns = createSelector(this.parentModule.uiSelector, (ui) =>
    ui[this.name]?.campaigns?.filter((item) => item.status !== CAMPAIGN_STATUS.ARCHIVED)
  );

  getQRCode = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.qrCode);
  getTimeFilter = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.timeFilter);
  getRegionFilter = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.regionFilter);
  getBranding = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.branding);

  connectCustomStoreSubscribers = (store) => {
    this.dispatch = store.dispatch;
    this.store = store;
  };
}
