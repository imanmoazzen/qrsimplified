import { getAnonymousToken, migrateAnonTokenProjects } from "./guest.js";

export default async function guestRouter(routeKey, requestBody, pathParameters, userId) {
  switch (routeKey) {
    // Unauthenticated endpoint
    case "POST /guest/getToken": {
      return await getAnonymousToken();
    }
    case "POST /guest/migrateGuest": {
      const { anonymousToken } = requestBody;
      return await migrateAnonTokenProjects(anonymousToken, userId);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
