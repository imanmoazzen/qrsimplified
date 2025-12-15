import { createSelector } from "reselect";

import { AbstractModule } from "../../project-root/index.js";
import uiReducer, { USER_MESSAGE_TYPES, addMessage, initialState, removeMessageByID } from "../store/uiReducer.js";

export default class MessengerModule extends AbstractModule {
  uiInitialState = initialState;
  uiReducer = uiReducer;

  removeMessageByID = removeMessageByID;
  getMessages = createSelector(this.parentModule.uiSelector, (ui) => ui[this.name].messages);

  connectCustomStoreSubscribers(store) {
    this.dispatch = store.dispatch;
  }

  showInfoMessage = (message, duration) => {
    this.dispatch(
      addMessage({
        text: message,
        duration,
        type: USER_MESSAGE_TYPES.INFO,
      })
    );
  };
}
