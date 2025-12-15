import { remove, upload } from "./assets.js";

export default async function assetsRouter(routeKey, requestBody, pathParameters, userId) {
  switch (routeKey) {
    case "POST /assets/upload": {
      return await upload(requestBody, userId);
    }
    case "DELETE /assets/remove": {
      return await remove(requestBody, userId);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
