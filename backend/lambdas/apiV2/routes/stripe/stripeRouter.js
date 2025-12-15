import { checkout } from "./checkout.js";
import { webhook } from "./webhook.js";

export default async function stripeRouter(routeKey, requestBody, pathParameters, userId, event) {
  switch (routeKey) {
    case "POST /stripe/checkout": {
      return await checkout(requestBody, userId);
    }
    case "POST /stripe/webhook": {
      const exactRequestBody = event.body;
      const signature = event?.headers["Stripe-Signature"];
      return await webhook(exactRequestBody, signature);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
