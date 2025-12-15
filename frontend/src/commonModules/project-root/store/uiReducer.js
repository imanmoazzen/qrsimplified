import { createSlice } from "@reduxjs/toolkit";

export const uiInitialState = {
  id: null,
  currentSlide: null,
  activeItem: null,
};

const slice = createSlice({
  name: "ui",
  initialState: uiInitialState,
  reducers: {
    newSlideRequested: () => {},
    setProjectId: (state, action) => {
      state.id = action.payload;
    },
    setCurrentSlide: (state, action) => {
      state.currentSlide = action.payload;
    },
    setActiveItem: (state, action) => {
      state.activeItem = action.payload;
    },
  },
});

export default slice.reducer;

export const { newSlideRequested, setProjectId, setCurrentSlide, setActiveItem } = slice.actions;
