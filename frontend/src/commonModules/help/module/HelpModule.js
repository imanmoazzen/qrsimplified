import { createSelector } from "reselect";

import { AbstractModule } from "../../project-root/index.js";
import uiReducer, { uiInitialState } from "../store/uiReducer.js";

export default class HelpModule extends AbstractModule {
  constructor({ parentModule, name }) {
    super({ parentModule, name });
  }

  uiInitialState = uiInitialState;
  uiReducer = uiReducer;

  connectCustomStoreSubscribers = (store) => {
    this.dispatch = store.dispatch;
    this.store = store;
  };

  getActiveHelpId = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.activeHelpId);
  getActiveStepId = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.activeStepId);
  getMuteStatus = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name]?.isMuted);
}
