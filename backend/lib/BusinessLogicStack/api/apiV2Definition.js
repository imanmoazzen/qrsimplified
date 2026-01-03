import { AUTH, NOAUTH } from "../../standardWrappers/ObjectDefinedRestApi.js";

export const API_V2_DEFINITION = {
  guest: {
    migrateGuest: {
      POST: AUTH,
    },
    getToken: {
      POST: NOAUTH,
    },
  },
  user: {
    info: {
      GET: AUTH,
      PUT: AUTH,
    },
    updateInfo: { POST: AUTH },
    message: {
      verifyEmail: { POST: AUTH },
      sendEmail: { POST: AUTH },
      sendSMS: { POST: AUTH },
    },
    referral: {
      info: { GET: AUTH },
    },
  },
  stripe: {
    checkout: {
      POST: AUTH,
    },
    webhook: {
      POST: NOAUTH,
    },
  },
  leads: {
    new: {
      POST: NOAUTH,
    },
    verify: {
      POST: NOAUTH,
    },
    update: {
      POST: NOAUTH,
    },
  },
  assets: {
    sign: {
      POST: AUTH,
    },
    upload: {
      POST: AUTH,
    },
    remove: {
      DELETE: AUTH,
    },
  },
  campaign: {
    GET: AUTH,
    POST: AUTH,
    PUT: AUTH,
    DELETE: AUTH,
    referral: {
      POST: AUTH,
    },
    lead: {
      PUT: NOAUTH,
    },
    id: {
      "{campaign_id}": {
        GET: NOAUTH,
      },
    },
  },
};
