import { combineReducers, configureStore } from "@reduxjs/toolkit";

import uiReducer, { newSlideRequested, setCurrentSlide, uiInitialState } from "../store/uiReducer.js";
import { makeUndoableProjectSlice } from "../store/undoableProjectSlice.js";

export class ProjectRootModule {
  _initialState = {};
  _globalInitialState = {};
  _staticGlobalInitialState = {};

  _forwardReducers = {
    id: (state = null) => state,
    ownerId: (state = null) => state,
    creation_time: (state = null) => state,
    version: (state = null) => state,
  };
  _reverseReducers = {
    id: (state = null) => state,
    ownerId: (state = null) => state,
    creation_time: (state = null) => state,
    version: (state = null) => state,
  };
  _globalForwardReducers = {};
  _globalReverseReducers = {};
  _staticGlobalReducers = {};

  _middlewares = {};

  _uiInitialState = {};
  _uiSliceReducers = {};

  _modules = [];

  _devTools;
  _store;

  actions;
  slideActions;
  slideUIActions = { newSlideRequested, setCurrentSlide };

  name = "project";
  rootModule;

  constructor({ devTools = false }) {
    this._devTools = devTools;
    this.rootModule = this;

    this.uiInitialState = uiInitialState;
    this.uiReducer = uiReducer;
    this.register(this);
  }

  contentSelector = (state) => state.project.present.slides.find((slide) => slide.id === state.ui.project.currentSlide);
  pastProjectEventsSelector = (state) => state.project.pastProjectEvents;
  presentSelector = (state) => state.project.present;
  futureProjectEventsSelector = (state) => state.project.futureProjectEvents;
  slideIdsSelector = (state) => state.project.present.slides.map((slide) => slide.id);
  slidesSelector = (state) => this.presentSelector(state).slides;

  uiSelector = (state) => state.ui;
  projectIdSelector = (state) => state.ui.project.id;
  currentSlideIdSelector = (state) => state.ui.project.currentSlide;
  activeItemSelector = (state) => state.ui.project.activeItem;

  makeStore() {
    const [projectSlice, slideActions] = makeUndoableProjectSlice({
      initialState: this._initialState,
      globalInitialState: this._globalInitialState,
      staticGlobalInitialState: this._staticGlobalInitialState,
      forwardReducers: combineReducers(this._forwardReducers),
      reverseReducers: combineReducers(this._reverseReducers),
      globalForwardReducers: combineReducers(this._globalForwardReducers),
      globalReverseReducers: combineReducers(this._globalReverseReducers),
      staticGlobalReducers: combineReducers(this._staticGlobalReducers),
    });
    const uiReducer = combineReducers(this._uiSliceReducers);

    let middlewares = [];
    for (let key in this._middlewares) {
      middlewares = [...middlewares, ...this._middlewares[key]];
    }

    this._store = configureStore({
      reducer: {
        project: projectSlice.reducer,
        ui: uiReducer,
      },
      middleware: (getDefaultMiddleware) => [...getDefaultMiddleware(), ...middlewares],
      devTools: this._devTools,
    });

    this.actions = projectSlice.actions;
    this.slideActions = slideActions;

    this._modules.forEach((module) => {
      module.connectCustomStoreSubscribers(this._store);
    });

    return this._store;
  }

  register(module) {
    this._modules.push(module);
    if (module.initialState && module.forwardReducer && module.reverseReducer) {
      this._initialState[module.name] = module.initialState;
      this._forwardReducers[module.name] = module.forwardReducer;
      this._reverseReducers[module.name] = module.reverseReducer;
    }
    if (module.staticGlobalInitialState && module.staticGlobalReducer) {
      this._staticGlobalInitialState[module.name] = module.staticGlobalInitialState;
      this._staticGlobalReducers[module.name] = module.staticGlobalReducer;
    }
    if (module.globalInitialState && module.globalForwardReducer && module.globalReverseReducer) {
      this._globalInitialState[module.name] = module.globalInitialState;
      this._globalForwardReducers[module.name] = module.globalForwardReducer;
      this._globalReverseReducers[module.name] = module.globalReverseReducer;
    }
    if (module.uiInitialState && module.uiReducer) {
      this._uiInitialState[module.name] = module.uiInitialState;
      this._uiSliceReducers[module.name] = module.uiReducer;
    }
    if (module.middlewares && module.middlewares.length > 0) {
      this._middlewares[module.name] = module.middlewares;
    }
  }

  /* eslint no-unused-vars: 0 */
  connectCustomStoreSubscribers(store) {
    // stub
  }
}
