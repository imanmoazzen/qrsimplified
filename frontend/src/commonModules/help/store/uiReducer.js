import { createSlice } from "@reduxjs/toolkit";

export const HELP_IDS = {
  ONBOARDING: "ONBOARDING",
  NEW_PATIENT: "NEW_PATIENT",
  SOAP: "SOAP",
  AUTOFILL: "AUTOFILL",
  TRANSCRIPT: "TRANSCRIPT",
  RECORD: "RECORD",
  IMAGES: "IMAGES",
  UPLOAD_IMAGES: "UPLOAD_IMAGES",
  LAB: "LAB",
  UPLOAD_LAB: "UPLOAD_LAB",
  DIAGNOSIS: "DIAGNOSIS",
  PLAN: "PLAN",
  PLAN_FROM_DOC: "PLAN_FROM_DOC",
  COMMUNICATION: "COMMUNICATION",
  PROFILE: "PROFILE",
  ENHANCE: "ENHANCE",
  UNDO: "UNDO",
  SYNC: "SYNC",
  PHONE: "PHONE",
  CLIENT_PORTAL: "CLIENT_PORTAL",
  CLIENT_PORTAL_INSIDE_PROJECT: "CLIENT_PORTAL_INSIDE_PROJECT",
  COPY_CLIENT_PORTAL: "COPY_CLIENT_PORTAL",
  DRAFT_EMAIL_WITH_AI: "DRAFT_EMAIL_WITH_AI",
  EMAIL_CLIENT: "EMAIL_CLIENT",
  DENTAL: "DENTAL",
  SUGGEST_DENTAL_NOTES: "SUGGEST_DENTAL_NOTES",
  INBOX: "INBOX",
  ANESTHESIA: "ANESTHESIA",
  START_SURGERY: "START_SURGERY",
  ADD_VITAL_SIGNS: "ADD_VITAL_SIGNS",
  ADD_READING: "ADD_READING",
  FINSIH_SURGERY: "FINSIH_SURGERY",
};

export const uiInitialState = {
  activeHelpId: null,
  activeStepId: null,
  isMuted: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState: uiInitialState,
  reducers: {
    activeHelpIdChanged: (state, action) => {
      state.activeHelpId = action.payload;
      state.activeStepId = action.payload;
    },
    activeStepIdChanged: (state, action) => {
      state.activeStepId = action.payload;
    },
    muteStatusChanged: (state, action) => {
      state.isMuted = action.payload;
    },
  },
});

export default uiSlice.reducer;

export const { activeHelpIdChanged, activeStepIdChanged, muteStatusChanged } = uiSlice.actions;
