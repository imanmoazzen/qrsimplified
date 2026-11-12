import { API_RESPONSE_TYPES } from "castofly-common/commonConstants.js";
import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";

export async function archiveCampaigns(campaignIds, request) {
  const ids = [...new Set(campaignIds)];
  const results = await Promise.allSettled(
    ids.map(async (campaign_id) => {
      const response = await request("/campaign", {
        method: "PUT",
        mode: "cors",
        data: { campaign_id, fieldsToSet: { status: CAMPAIGN_STATUS.ARCHIVED } },
      });
      if (response?.data?.message !== API_RESPONSE_TYPES.SUCCESS) throw new Error("Unable to archive QR code.");
    })
  );
  return {
    archivedIds: ids.filter((_, index) => results[index].status === "fulfilled"),
    failedIds: ids.filter((_, index) => results[index].status === "rejected"),
  };
}
