import { v4 as uuid } from "uuid";

import { CAMPAIGN_STATUS, TRIAL_CAMPAIGN_VISIT_LIMIT } from "../../../../../castofly-common/campaigns.js";
import { sortByCreationTime } from "../../../../../castofly-common/sort.js";
import {
  batchDeleteItems,
  deleteItem,
  getItem,
  putItem,
  query,
  updateItemSet,
} from "../../../common-aws-utils-v3/dynamoUtils.js";
import { getGeoLocation } from "../../../common-utilities/getGeoLocation.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo } from "../../index.js";
import { errorResponse, forbiddenResponse, successResponse } from "../standardResponses.js";
import { getUser } from "../user.js";
import { getCampaignAnalytics } from "./utils.js";

export const getCampaigns = async (userId) => {
  try {
    const allCampaigns = await query(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id: userId });
    const noArchivedCampaigns = allCampaigns.filter((item) => item.status !== CAMPAIGN_STATUS.ARCHIVED);

    const visitsForEachCampaign = await Promise.all(
      noArchivedCampaigns.map((item) => query(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, { campaign_id: item.campaign_id }))
    );

    const campaigns = noArchivedCampaigns.map((item, index) => ({
      ...item,
      visits: visitsForEachCampaign[index].length,
      analytics: getCampaignAnalytics(visitsForEachCampaign[index]),
    }));

    return successResponse("campaigns feteched", { campaigns: sortByCreationTime(campaigns, true) });
  } catch (err) {
    return errorResponse(`cannot fetch campaings: ${err?.message}`);
  }
};

export const addCampaign = async (requestBody, userId) => {
  try {
    const { campaign_id, name, destination } = requestBody;
    if (!campaign_id || !name || !destination) throw new Error("required params are missing");

    const [user, allCampaigns] = await Promise.all([
      getUser(userId),
      query(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id: userId }),
    ]);

    const qr_credits = user?.qr_credits ?? 0;
    const noArchivedCampaigns = allCampaigns.filter((item) => item.status !== CAMPAIGN_STATUS.ARCHIVED);

    const status = qr_credits > noArchivedCampaigns.length ? CAMPAIGN_STATUS.LIVE : CAMPAIGN_STATUS.TRIAL;

    const item = {
      user_id: userId,
      campaign_id,
      name,
      destination,
      creation_time: Date.now(),
      status,
    };

    await putItem(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, item);

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

export const visit = async (user_id, campaign_id, event) => {
  try {
    if (!user_id || !campaign_id) throw new Error("required params are missing");

    const campaign = await getItem(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id, campaign_id });
    if (!campaign) throw new Error("the campaign doesn't exist");

    switch (campaign.status) {
      case CAMPAIGN_STATUS.EXPIRED:
        return {
          statusCode: 302,
          headers: {
            Location: `${process.env.APP_BASE_URL}/upgrade?status:${CAMPAIGN_STATUS.EXPIRED}`,
          },
          body: "",
        };

      case CAMPAIGN_STATUS.TRIAL: {
        const visits = await query(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, { campaign_id });

        if (visits.length >= TRIAL_CAMPAIGN_VISIT_LIMIT) {
          await updateItemSet(
            dynamo,
            TABLE_NAMES.CAMPAIGN_SOURCES,
            { user_id, campaign_id },
            { status: CAMPAIGN_STATUS.EXPIRED }
          );

          return {
            statusCode: 302,
            headers: {
              Location: `${process.env.APP_BASE_URL}/upgrade?status:${CAMPAIGN_STATUS.EXPIRED}`,
            },
            body: "",
          };
        }
        break;
      }

      case CAMPAIGN_STATUS.ARCHIVED:
        return forbiddenResponse("This QR code has been archived and is no longer valid.");
    }

    const geo = await getGeoLocation(event);
    const { country, city } = geo;

    const item = {
      campaign_id,
      visit_id: uuid(),
      creation_time: Date.now(),
      country,
      city,
    };

    await putItem(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, item);

    return {
      statusCode: 302,
      headers: {
        Location: campaign.destination,
      },
      body: "",
    };
  } catch (err) {
    return errorResponse(`cannot count the visit and return the destination url: ${err?.message}`);
  }
};
