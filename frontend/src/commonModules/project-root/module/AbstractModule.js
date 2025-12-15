export class AbstractModule {
  parentModule;
  rootModule;
  name;

  initialState;
  globalInitialState;
  staticGlobalInitialState;

  forwardReducer;
  reverseReducer;
  globalForwardReducer;
  globalReverseReducer;
  staticGlobalReducer;

  middlewares;

  uiInitialState;
  uiReducer;

  selector;
  uiSelector;

  constructor({ parentModule, name }) {
    this.parentModule = parentModule;
    this.rootModule = parentModule.rootModule;
    this.name = name;

    this.selector = (state) => this.parentModule.contentSelector(state)[this.name];
    this.uiSelector = (state) => this.parentModule.uiSelector(state)[this.name];
  }

  register() {
    this.parentModule.register(this);
    return this;
  }

  /* eslint no-unused-vars: 0 */
  connectCustomStoreSubscribers(store) {
    // stub
  }
}
