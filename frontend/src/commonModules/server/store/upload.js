import { createSlice } from "@reduxjs/toolkit";

export const UPLOAD_STATES = {
  inProgress: "In progress",
  done: "Done",
  failed: "Failed",
};

export const uploadInitialState = {
  uploadStates: [],
  uploadMonitorOpen: false,
};

const slice = createSlice({
  name: "upload",
  initialState: uploadInitialState,
  reducers: {
    uploadStarted: (state, action) => {
      const { id, name = "Other" } = action.payload;
      state.uploadStates.push({ id, name, uploadState: UPLOAD_STATES.inProgress });
    },
    uploadFinished: (state, action) => {
      const entryIndex = state.uploadStates.findIndex((entry) => entry.id === action.payload);
      state.uploadStates[entryIndex].uploadState = UPLOAD_STATES.done;
    },
    uploadFailed: (state, action) => {
      const entryIndex = state.uploadStates.findIndex((entry) => entry.id === action.payload);
      state.uploadStates[entryIndex].uploadState = UPLOAD_STATES.failed;
    },
    setUploadMonitorOpen: (state, action) => {
      state.uploadMonitorOpen = action.payload;
    },
  },
});

export default slice.reducer;

export const { uploadStarted, uploadFinished, uploadFailed, setUploadMonitorOpen } = slice.actions;
