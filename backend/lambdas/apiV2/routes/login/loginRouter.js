import { convert, generateLoginCode, getAnonymousToken, verifyLoginCode } from "./login.js";

export default async function loginRouter(routeKey, requestBody) {
  switch (routeKey) {
    // Unauthenticated endpoint
    case "POST /login/guest": {
      return await getAnonymousToken();
    }
    case "POST /login/convert": {
      const { anonymousToken } = requestBody;
      return await convert(anonymousToken, userId);
    }
    case "POST /login/code": {
      const { email } = requestBody;
      return await generateLoginCode(email);
    }
    case "POST /login/verify": {
      const { email, code } = requestBody;
      return await verifyLoginCode(email, code);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
