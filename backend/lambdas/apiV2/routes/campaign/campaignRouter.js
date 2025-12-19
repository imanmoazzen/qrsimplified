import {
  addCampaign,
  addReferralCampaign,
  deleteCampaign,
  getCampaigns,
  updateCampaign,
  updateVisit,
  visit,
} from "./campaign.js";

export default async function campaignRouter(routeKey, requestBody, pathParameters, userId, event) {
  switch (routeKey) {
    case "GET /campaign": {
      return await getCampaigns(userId);
    }
    case "POST /campaign": {
      return await addCampaign(requestBody, userId);
    }
    case "POST /campaign/referral": {
      return await addReferralCampaign(requestBody, userId);
    }
    case "PUT /campaign": {
      return await updateCampaign(requestBody, userId);
    }
    case "DELETE /campaign": {
      return await deleteCampaign(requestBody, userId);
    }
    case "GET /campaign/{user_id}/{campaign_id}": {
      const { user_id, campaign_id } = pathParameters;
      return await visit(user_id, campaign_id, event);
    }
    case "PUT /campaign/lead": {
      return await updateVisit(requestBody);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
