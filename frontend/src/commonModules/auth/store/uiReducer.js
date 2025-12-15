import { createSlice } from "@reduxjs/toolkit";

export const uiInitialState = {
  session: {},
  pleaseSignupModalVisible: false,
  isSessionLoadComplete: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState: uiInitialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
    },
    setRequestSignupModalVisible: (state, action) => {
      state.pleaseSignupModalVisible = action.payload;
    },
    setSessionLoadComplete: (state) => {
      state.isSessionLoadComplete = true;
    },
  },
});

export const { setSession, setSessionLoadComplete, setRequestSignupModalVisible } = uiSlice.actions;

export default uiSlice.reducer;
