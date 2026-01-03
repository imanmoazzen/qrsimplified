import { getSignedUploadUrl, remove, uploadBase64 } from "./assets.js";

export default async function assetsRouter(routeKey, requestBody, pathParameters, userId) {
  switch (routeKey) {
    case "POST /assets/sign": {
      return await getSignedUploadUrl(requestBody, userId);
    }
    case "POST /assets/upload": {
      return await uploadBase64(requestBody, userId);
    }
    case "DELETE /assets/remove": {
      return await remove(requestBody, userId);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
