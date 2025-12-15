import { CAMPAIGN_STATUS } from "../../../../castofly-common/campaigns.js";
import { getItem, query } from "../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../config.js";
import { dynamo } from "../index.js";
import { errorResponse, successResponse } from "./standardResponses.js";

export const getReferralInfo = async (userId) => {
  try {
    const [campaign, visits, sources] = await Promise.all([
      getItem(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, {
        user_id: userId,
        campaign_id: userId,
      }),
      query(dynamo, TABLE_NAMES.CAMPAIGN_VISITS, {
        campaign_id: userId,
      }),
      query(dynamo, TABLE_NAMES.REFERRAL_RECORDS, { referrer_user_id: userId }),
    ]);

    if (!campaign || campaign.status !== CAMPAIGN_STATUS.REFERRAL)
      return successResponse("Successfully got the info", { campaign: null, visits: 0, purchases: [] });

    const details = await Promise.all(
      sources.map(async (item) => {
        const { purchase_id, referee_user_id, referee_display_name } = item;

        if (referee_user_id === userId) return null;

        const purchase = await getItem(dynamo, TABLE_NAMES.PURCHASES, {
          user_id: referee_user_id,
          purchase_id,
        });

        if (!purchase) return null;

        const { amount_total = 0, amount_refunded = 0, currency, product_name } = purchase;
        const net = Math.max(0, amount_total - amount_refunded);
        if (!net) return null;

        return {
          amount_total: net / 100,
          currency,
          referee_display_name,
          product_name,
        };
      })
    );

    const validDetails = details.filter(Boolean);

    return successResponse("Successfully got the info", {
      campaign,
      visits: visits.length ?? 0,
      purchases: validDetails,
    });
  } catch (error) {
    return errorResponse(error.message);
  }
};
