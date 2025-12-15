import getJWTPayload from "../../../../castofly-common/getJWTPayload.js";
import assetsRouter from "./assets/assetsRouter.js";
import campaignRouter from "./campaign/campaignRouter.js";
import guestRouter from "./guestRouter.js";
import leadsRouter from "./leads/leadsRouter.js";
import stripeRouter from "./stripe/stripeRouter.js";
import userRouter from "./userRouter.js";

export default async function apiRouter(event) {
  // e.g. '/dev/permissions/list' -> ["", "dev", "permissions", "list"]

  const userId = getUserIdFromAuthHeader(event);
  const { requestContext, body, pathParameters, queryStringParameters = {} } = event;

  const routes = requestContext.path.split("/");
  const resource = routes[2];
  const routeKey = requestContext.httpMethod + " " + requestContext.resourcePath;

  let requestBody;
  try {
    requestBody = JSON.parse(body);
  } catch {
    requestBody = body;
  }

  switch (resource) {
    case "guest": {
      return await guestRouter(routeKey, requestBody, pathParameters, userId);
    }
    case "user": {
      return await userRouter(routeKey, requestBody, pathParameters, userId);
    }
    case "stripe": {
      return await stripeRouter(routeKey, requestBody, pathParameters, userId, event);
    }
    case "leads": {
      return await leadsRouter(routeKey, requestBody);
    }
    case "assets": {
      return await assetsRouter(routeKey, requestBody, pathParameters, userId);
    }
    case "campaign": {
      return await campaignRouter(routeKey, requestBody, pathParameters, userId, event);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function. Check main router file.");
    }
  }
}

// Decodes the authorization JWT to extract the user id from an event.
export function getUserIdFromAuthHeader(event) {
  return getJWTPayload(event?.headers?.Authorization)?.sub;
}
