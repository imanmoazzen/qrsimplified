import { v4 as uuid } from "uuid";

import { APP_PAGES } from "../../../../../castofly-common/appPages.js";
import { CAMPAIGN_STATUS, TRIAL_CAMPAIGN_VISIT_LIMIT } from "../../../../../castofly-common/campaigns.js";
import { sortByCreationTime } from "../../../../../castofly-common/sort.js";
import { getBase36, toSafeKey } from "../../../../../castofly-common/stringHelpers.js";
import { BACKEND_CONFIG } from "../../../../configurationConstants.js";
import {
  batchDeleteItems,
  deleteItem,
  getItem,
  putItem,
  query,
  queryGSI,
  updateItemAdd,
  updateItemSet,
} from "../../../common-aws-utils-v3/dynamoUtils.js";
import { getGeoLocation } from "../../../common-utilities/getGeoLocation.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo, ssmCache } from "../../index.js";
import { errorResponse, successResponse } from "../standardResponses.js";
import { getUser } from "../user.js";
import { IMAN_USER_IDS_IN_BOTH_ENV, generateMockupDataForDemo } from "./mockupData.js";
import { getCampaignAnalytics, getLeadKeys } from "./utils.js";

export const getCampaigns = async (userId) => {
  try {
    const allCampaigns = await query(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id: userId });
    const validCampaigns = allCampaigns.filter(
      (item) => item.status !== CAMPAIGN_STATUS.ARCHIVED && item.status !== CAMPAIGN_STATUS.REFERRAL
    );

    const visitsForEachCampaign = await Promise.all(
      validCampaigns.map((item) => query(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, { campaign_id: item.campaign_id }))
    );

    const campaigns = validCampaigns.map((campaign, index) => {
      const visits = sortByCreationTime(visitsForEachCampaign[index]) ?? [];

      const leadKeys = getLeadKeys(campaign);
      let leads = null;

      if (leadKeys?.length) {
        leads = visits
          .map((visit) => Object.fromEntries(leadKeys.map((key) => [key, visit[key] ?? ""])))
          .filter((lead) => Object.values(lead).some((v) => v !== ""));
      }

      return {
        ...campaign,
        visits: visits.length,
        analytics: getCampaignAnalytics(visits),
        leads,
      };
    });

    let temp = campaigns;
    if (IMAN_USER_IDS_IN_BOTH_ENV.includes(userId)) {
      const fakeCampaigns = generateMockupDataForDemo();
      temp = [...campaigns, ...fakeCampaigns];
    }

    return successResponse("campaigns feteched", { campaigns: sortByCreationTime(temp, true) });
  } catch (err) {
    return errorResponse(`cannot fetch campaings: ${err?.message}`);
  }
};

export const addCampaign = async (requestBody, userId) => {
  try {
    const { name, destination } = requestBody;
    if (!name || !destination) throw new Error("required params are missing");

    const sanitizedKey = toSafeKey(name) || `qr-${getBase36()}`;

    const [user, allCampaigns, campaignIdItem] = await Promise.all([
      getUser(userId),
      query(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id: userId }),
      getItem(dynamo, TABLE_NAMES.CAMPAIGN_ID_COUNTER, { campaign_id: sanitizedKey }),
    ]);

    let selectedId;
    if (!campaignIdItem) selectedId = sanitizedKey;
    else selectedId = `${sanitizedKey}-${(campaignIdItem?.counter ?? 0) + 1}${getBase36(1)}`;
    const tracking_link = `${process.env.APP_BASE_URL}/${selectedId}`;

    const qr_credits = user?.qr_credits ?? 0;
    const validCampaigns = allCampaigns.filter(
      (item) => item.status !== CAMPAIGN_STATUS.ARCHIVED && item.status !== CAMPAIGN_STATUS.REFERRAL
    );
    const status = qr_credits > validCampaigns.length ? CAMPAIGN_STATUS.LIVE : CAMPAIGN_STATUS.TRIAL;

    const item = {
      user_id: userId,
      campaign_id: selectedId,
      name,
      tracking_link,
      destination,
      creation_time: Date.now(),
      status,
    };

    await Promise.all([
      putItem(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, item),
      updateItemAdd(dynamo, TABLE_NAMES.CAMPAIGN_ID_COUNTER, { campaign_id: sanitizedKey }, { counter: 1 }),
    ]);

    return successResponse("item was added", { item });
  } catch (err) {
    return errorResponse(`cannot add item: ${err?.message}`);
  }
};

export const addReferralCampaign = async (userId) => {
  try {
    const user = await getUser(userId);
    const { display_name, email } = user ?? {};
    if (!user || !email) throw new Error("user is not valid");

    const sanitizedKey = toSafeKey(display_name || email) || `ref-${getBase36()}`;
    const campaignIdItem = await getItem(dynamo, TABLE_NAMES.CAMPAIGN_ID_COUNTER, { campaign_id: sanitizedKey });

    let selectedId;
    if (!campaignIdItem) selectedId = sanitizedKey;
    else selectedId = `${sanitizedKey}-${(campaignIdItem?.counter ?? 0) + 1}${getBase36(1)}`;
    const tracking_link = `${process.env.APP_BASE_URL}/${selectedId}`;

    const item = {
      user_id: userId,
      campaign_id: selectedId,
      name: "Referral QR Code",
      tracking_link,
      destination: `${process.env.APP_BASE_URL}${APP_PAGES.SIGNUP}/?ref=${selectedId}`,
      creation_time: Date.now(),
      status: CAMPAIGN_STATUS.REFERRAL,
    };

    await Promise.all([
      putItem(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, item),
      updateItemAdd(dynamo, TABLE_NAMES.CAMPAIGN_ID_COUNTER, { campaign_id: sanitizedKey }, { counter: 1 }),
    ]);

    return successResponse("item was added", { item });
  } catch (err) {
    return errorResponse(`cannot add item: ${err?.message}`);
  }
};

export const updateCampaign = async (requestBody, userId) => {
  try {
    const { campaign_id, fieldsToSet } = requestBody;
    if (!campaign_id) throw new Error("campaign id is missing");

    const items = await query(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id: userId });

    const selected = items.filter((item) => item.campaign_id === campaign_id);
    if (!selected) throw new Error("campaign doesn't belong to this user");

    await updateItemSet(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id: userId, campaign_id }, fieldsToSet);
    return successResponse("item was updated");
  } catch (err) {
    return errorResponse(`cannot update the item: ${err?.message}`);
  }
};

export const deleteCampaign = async (requestBody, userId) => {
  try {
    const { campaign_id } = requestBody;
    if (!campaign_id) throw new Error("campaign id is missing");

    const visits = await query(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, { campaign_id });
    const keys = visits.map((item) => ({ campaign_id, visit_id: item.visit_id }));

    await Promise.all([
      deleteItem(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id: userId, campaign_id }),
      batchDeleteItems(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, keys),
    ]);

    return successResponse("item was deleted");
  } catch (err) {
    return errorResponse(`cannot delete the item: ${err?.message}`);
  }
};

export const visit = async (campaign_id, event) => {
  try {
    if (!campaign_id) throw new Error("campaign id is missing");

    const CAMPAIGN_ID_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.CAMPAIGN_ID_GSI);
    const results = await queryGSI(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { campaign_id }, CAMPAIGN_ID_GSI);

    const campaign = results?.[0];
    if (!campaign)
      return redirect(`${process.env.APP_BASE_URL}${APP_PAGES.UPGRADE}?status=${CAMPAIGN_STATUS.NOT_EXISTS}`);

    const user_id = campaign.user_id;

    switch (campaign.status) {
      case CAMPAIGN_STATUS.EXPIRED:
        return redirect(`${process.env.APP_BASE_URL}${APP_PAGES.UPGRADE}?status=${CAMPAIGN_STATUS.EXPIRED}`);

      case CAMPAIGN_STATUS.TRIAL: {
        const visits = await query(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, { campaign_id });

        if (visits.length >= TRIAL_CAMPAIGN_VISIT_LIMIT) {
          await updateItemSet(
            dynamo,
            TABLE_NAMES.CAMPAIGN_SOURCES,
            { user_id, campaign_id },
            { status: CAMPAIGN_STATUS.EXPIRED }
          );

          return redirect(`${process.env.APP_BASE_URL}${APP_PAGES.UPGRADE}?status=${CAMPAIGN_STATUS.EXPIRED}`);
        }
        break;
      }

      case CAMPAIGN_STATUS.ARCHIVED:
        return redirect(`${process.env.APP_BASE_URL}${APP_PAGES.UPGRADE}?status=${CAMPAIGN_STATUS.ARCHIVED}`);
    }

    const geo = await getGeoLocation(event);
    const { country, city } = geo;

    const visit_id = uuid();

    const item = {
      campaign_id,
      visit_id,
      creation_time: Date.now(),
      country,
      city,
    };

    await putItem(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, item);

    const leadKeys = getLeadKeys(campaign);

    if (leadKeys.length) {
      const user = await getUser(user_id);

      const params = new URLSearchParams();

      leadKeys.forEach((key) => {
        params.set(key, "true");
      });

      if (user?.branding?.logo) params.set("logo", user?.branding?.logo);
      params.set("destination", campaign?.destination);
      params.set("campaign_id", campaign_id);
      params.set("visit_id", visit_id);

      return redirect(`${process.env.APP_BASE_URL}${APP_PAGES.LEAD}?${params.toString()}`);
    }

    return redirect(campaign.destination);
  } catch (err) {
    return errorResponse(`cannot count the visit and return the destination url: ${err?.message}`);
  }
};

export const updateVisit = async (requestBody) => {
  const { campaign_id, visit_id, fieldsToSet } = requestBody;

  try {
    const item = await getItem(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, { campaign_id, visit_id });
    if (!item) throw new Error("item doesn't exist");

    await updateItemSet(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, { campaign_id, visit_id }, fieldsToSet);
    return successResponse("item was updated");
  } catch (err) {
    return errorResponse(`cannot update the item: ${err?.message}`);
  }
};

const redirect = (url) => {
  return {
    statusCode: 302,
    headers: {
      Location: url,
    },
    body: "",
  };
};
