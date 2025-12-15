import { addNewLead, verifyEmail } from "./leads.js";

export default async function leadsRouter(routeKey, requestBody) {
  switch (routeKey) {
    case "POST /leads/new": {
      const { email, lead } = requestBody;
      return await addNewLead(email, lead);
    }
    case "POST /leads/verify": {
      const { code } = requestBody;
      return verifyEmail(code);
    }
    case "POST /leads/update": {
      // not in use for now
      break;
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
