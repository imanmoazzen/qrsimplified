import { createAction, createReducer, createSlice } from "@reduxjs/toolkit";
import { getCreationTime, getLocalTimeZone } from "castofly-common/timeUtils.js";
import { v4 as uuid } from "uuid";

import { blockUndoEvent, multiEvent, targetedMultiEvent } from "./specialEventTypes.js";

const merge = require("deepmerge");

export const makeUndoableProjectSlice = ({
  initialState,
  globalInitialState,
  staticGlobalInitialState,
  forwardReducers,
  reverseReducers,
  globalForwardReducers,
  globalReverseReducers,
  staticGlobalReducers,
}) => {
  const makeSlideInitialState = (id = uuid()) => {
    return {
      id,
      ownerId: null,
      creation_time: getCreationTime(getLocalTimeZone()),
      ...initialState,
    };
  };

  const makePresentInitialState = () => {
    return {
      slides: [],
      global: { ...globalInitialState },
      staticGlobal: { ...staticGlobalInitialState },
    };
  };

  const undoableProjectSlice = createSlice({
    name: "project",
    initialState: {
      pastProjectEvents: [],
      present: makePresentInitialState(),
      futureProjectEvents: [],
    },
    reducers: {
      undo: (state, action) => {
        if (state.pastProjectEvents.length === 0) return;
        /* eslint no-unsafe-optional-chaining: 0 */
        const { targetEventId, skipFutureAddition } = action?.payload;
        let projectEvent;

        if (state.pastProjectEvents[state.pastProjectEvents.length - 1].type === blockUndoEvent.type) return;

        if (targetEventId) {
          const tempEventStack = [];
          while (state.pastProjectEvents.length > 0) {
            const tempEvent = state.pastProjectEvents.pop();
            state.present = reverseApplyEvent(state.present, tempEvent);
            if (tempEvent.payload.id === targetEventId) {
              projectEvent = tempEvent;
              break;
            } else {
              tempEventStack.push(tempEvent);
            }
            if (tempEvent.type === blockUndoEvent.type) break;
          }
          // replay events occuring after the one that was undone
          while (tempEventStack.length > 0) {
            const tempEvent = tempEventStack.pop();
            addEventInOrder(state, tempEvent);
          }

          // This proves that there is a problem with the return value of
          // forwardApplyEvent, because if you assigned newState to state.present, it explodes.
          // If you clone newState (using JSON.stringify/parse), everything works

          // I think it's failing because when we set state.present to newState, we're setting
          // it to a proxy object that has been revoked.

          // This idea is suppored by the fact that the errors seen in the call stack are actually
          // related to attempting to read from the new state. For example,
          // AudioRoomModule.js:73 Uncaught TypeError: Cannot perform 'get' on a proxy that has been revoked
          // is throwing an error because the getAudioProxies selector is reading from state.

          // I think that forwardApplyEvent is not making a new object in all cases.
          state.present = JSON.parse(JSON.stringify(state.present));
        } else {
          projectEvent = state.pastProjectEvents.pop();
          state.present = reverseApplyEvent(state.present, projectEvent);
        }

        if (!skipFutureAddition) {
          state.futureProjectEvents.push(projectEvent);
        }
      },
      redo: (state) => {
        if (state.futureProjectEvents.length === 0) return;
        const projectEvent = state.futureProjectEvents.pop();
        addEventInOrder(state, projectEvent);
      },
      addProjectEvent: (state, action) => {
        const projectEvent = action.payload;
        addEventInOrder(state, projectEvent);
        if (state.futureProjectEvents.length !== 0) {
          state.futureProjectEvents = [];
        }
      },
      addStaticGlobalEvent: (state, action) => {
        state.present.staticGlobal = handleStaticGlobalEvent(state.present.staticGlobal, action.payload);
      },
      addProjectEventFromServer: (state, action) => {
        const projectEvent = action.payload;
        addEventInOrder(state, projectEvent);
      },
      addProjectEventArrayFromServer: (state, action) => {
        const array = action.payload;
        if (array.length === 0) return;
        state.pastProjectEvents = [...state.pastProjectEvents, ...array];
        state.pastProjectEvents.sort((a, b) => a.timestamp - b.timestamp);
        state.present = state.pastProjectEvents.reduce(forwardApplyEvent, {
          ...state.present,
          slides: [],
          global: { ...globalInitialState },
          staticGlobal: { ...staticGlobalInitialState },
        });
      },
      removeEventsByIdArrayFromServer: (state, action) => {
        // NOTE: this assumes that addProjectEventArrayFromServer is always called immediately afterward, so it doesn't update the present.
        const idsToRemove = action.payload;
        state.pastProjectEvents = state.pastProjectEvents.filter((event) => !idsToRemove.includes(event.payload.id));
      },
      addHydratedStateFromServer: (state, action) => {
        const { slides, global } = action.payload;
        state.present = {
          ...makePresentInitialState,
          slides,
          global,
        };
      },
      resetProjectState: (state) => {
        state.pastProjectEvents = [];
        state.futureProjectEvents = [];
        state.present = makePresentInitialState();
      },
    },
  });

  function handleStaticGlobalEvent(staticGlobal, event) {
    if (event.type === multiEvent.type) {
      return event.payload.events.reduce(handleStaticGlobalEvent, staticGlobal);
    } else {
      return staticGlobalReducers(staticGlobal, event);
    }
  }

  function reverseApplyEvent(presentState, event) {
    switch (event.type) {
      case multiEvent.type: {
        return event.payload.events.reduceRight(reverseApplyEvent, presentState);
      }
      case targetedMultiEvent.type: {
        const newSlides = presentState.slides.map((slide) => {
          if (event.payload.slideId && slide.id !== event.payload.slideId) return slide;
          return event.payload.events.reduceRight(reverseReducers, slide);
        });
        return {
          ...presentState,
          slides: newSlides,
        };
      }
      default: {
        return slideReverseReducer(presentState, event);
      }
    }
  }

  function forwardApplyEvent(presentState, event) {
    switch (event.type) {
      case multiEvent.type: {
        return event.payload.events.reduce(forwardApplyEvent, presentState);
      }
      case targetedMultiEvent.type: {
        const newSlides = presentState.slides.map((slide) => {
          if (event.payload.slideId && slide.id !== event.payload.slideId) return slide;
          return event.payload.events.reduce(forwardReducers, slide);
        });
        return {
          ...presentState,
          slides: newSlides,
        };
      }
      default: {
        return slideForwardReducer(presentState, event);
      }
    }
  }

  // Add an event to pastProjectEvents, ensuring it's inserted in the correct place
  const addEventInOrder = (state, projectEvent) => {
    if (projectEvent.timestamp) {
      const tempEventStack = [];
      while (
        state.pastProjectEvents.length > 0 &&
        state.pastProjectEvents[state.pastProjectEvents.length - 1].timestamp > projectEvent.timestamp
      ) {
        const tempEvent = state.pastProjectEvents.pop();
        state.present = reverseApplyEvent(state.present, tempEvent);
        tempEventStack.push(tempEvent);
      }
      tempEventStack.push(projectEvent);
      while (tempEventStack.length > 0) {
        const tempEvent = tempEventStack.pop();
        state.pastProjectEvents.push(tempEvent);
        state.present = forwardApplyEvent(state.present, tempEvent);
      }
    } else {
      state.pastProjectEvents.push(projectEvent);
      state.present = forwardApplyEvent(state.present, projectEvent);
    }
  };

  const addSlide = createAction("addSlide", function prepare(index = 0, slideId, presetValues = {}) {
    return {
      payload: {
        id: uuid(),
        slide: { ...makeSlideInitialState(slideId), ...presetValues },
        index,
      },
    };
  });

  const deleteSlide = createAction("deleteSlide", function prepare(slideToDelete, index) {
    return { payload: { id: uuid(), slide: slideToDelete, index } };
  });

  const slideActions = {
    addSlide,
    deleteSlide,
  };

  const slideForwardReducer = createReducer(makeSlideInitialState, (builder) => {
    builder
      .addCase(addSlide, (state, action) => {
        state.slides.splice(action.payload.index, 0, merge(makeSlideInitialState(), action.payload.slide));
      })
      .addCase(deleteSlide, (state, action) => {
        state.slides = state.slides.filter((slide) => slide.id !== action.payload.slide.id);
      })
      .addDefaultCase((state, action) => {
        //default case: call the action on the slides
        state.slides = state.slides.map((slide) => {
          if (action.payload.slideId && slide.id !== action.payload.slideId) return slide;
          return forwardReducers(slide, action);
        });
        state.global = globalForwardReducers(state.global, action);
      });
  });

  const slideReverseReducer = createReducer(makeSlideInitialState, (builder) => {
    builder
      .addCase(addSlide, (state, action) => {
        state.slides = state.slides.filter((slide) => slide.id !== action.payload.slide.id);
      })
      .addCase(deleteSlide, (state, action) => {
        const slideToReAdd = {
          ...makeSlideInitialState(),
          ...action.payload.slide,
        };
        state.slides.splice(action.payload.index, 0, slideToReAdd);
      })
      .addDefaultCase((state, action) => {
        //default case: call the action on the slides
        state.slides = state.slides.map((slide) => {
          if (action.payload.slideId && slide.id !== action.payload.slideId) return slide;
          return reverseReducers(slide, action);
        });
        state.global = globalReverseReducers(state.global, action);
      });
  });

  return [undoableProjectSlice, slideActions];
};
