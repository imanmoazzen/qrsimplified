import { createSlice } from "@reduxjs/toolkit";

export const CAMPAIGN_PAGES = {
  MAIN: "main page",
  CREATION: "create new campaign",
  EDIT: "edit campaign",
  ANALYTICS: "campaign analytics",
};

export const TIME_FILTERS = {
  TODAY: "Today",
  LAST_7_DAYS: "Last 7 Days",
  LAST_30_DAYS: "Last 30 Days",
  ALL: "All",
};

export const REGION_FILTERS = {
  COUNTRY: "Country",
  CITY: "City",
};

export const uiInitialState = {
  isDashboardingLoading: true,
  page: CAMPAIGN_PAGES.MAIN,
  campaigns: [],
  activeCampaign: null,
  timeFilter: TIME_FILTERS.TODAY,
  regionFilter: REGION_FILTERS.COUNTRY,
  qrCode: null,
  branding: {
    logo: null,
    logo_scale: 4,
    color: "#000000",
    background: "#0000",
    isTransparent: true,
  },
};

const slice = createSlice({
  name: "ui",
  initialState: uiInitialState,
  reducers: {
    dashboardingLoadingStatusChanged: (state, action) => {
      state.isDashboardingLoading = action.payload;
    },
    campaignPageChanged: (state, action) => {
      state.page = action.payload.page ?? action.payload;
      state.activeCampaign = action.payload.campaign ?? null;
    },
    campaignsChanged: (state, action) => {
      state.campaigns = action.payload;
    },
    brandingChanged: (state, action) => {
      state.branding = action.payload;
    },
    timeFilterChanged: (state, action) => {
      state.timeFilter = action.payload;
    },
    regionFilterChanged: (state, action) => {
      state.regionFilter = action.payload;
    },
    qrCodeChanged: (state, action) => {
      state.qrCode = action.payload;
    },
  },
});

export default slice.reducer;

export const {
  dashboardingLoadingStatusChanged,
  campaignPageChanged,
  campaignsChanged,
  brandingChanged,
  timeFilterChanged,
  regionFilterChanged,
  qrCodeChanged,
} = slice.actions;
