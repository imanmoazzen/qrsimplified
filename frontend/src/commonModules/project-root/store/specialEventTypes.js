import { createAction } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";

export const multiEvent = createAction("multiEvent", function prepare(events) {
  return { payload: { id: uuid(), events } };
});

export const targetedMultiEvent = createAction("targetedMultiEvent", function prepare(slideId, events) {
  return { payload: { id: uuid(), slideId, events } };
});

export const blockUndoEvent = createAction("blockUndoEvent", function prepare() {
  return { payload: { id: uuid() } };
});
