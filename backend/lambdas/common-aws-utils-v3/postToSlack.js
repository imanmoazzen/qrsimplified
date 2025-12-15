import fetch from "node-fetch";

import { BACKEND_CONFIG } from "../../configurationConstants.js";
import { getSecret } from "./secretsManagerUtils.js";

export default async function postToSlack(ssmCache, secretsManager, messageText) {
  const SLACK_FEEDBACK_API_SECRET_ARN = await ssmCache.getValue(BACKEND_CONFIG.SECRETS.SLACK_FEEDBACK_API_SECRET_ARN);
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: messageText }),
  };
  const SLACK_CUSTOMER_FEEDBACK_URL = (await getSecret(secretsManager, SLACK_FEEDBACK_API_SECRET_ARN)).key;
  const response = await fetch(SLACK_CUSTOMER_FEEDBACK_URL, options);
  return await response.text();
}

export async function reportErrorToSlack(
  ssmCache,
  secretsManager,
  error,
  originString = "Not specified",
  userId = "Not specified"
) {
  const errorCause = error.cause
    ? `\n\n*Error Cause:* \`\`\`name: ${error.cause.name}\nmessage: ${error.cause.message}\nstack trace: ${error.cause.stack}\`\`\``
    : "";

  const errorMessage = `\n--------------------\n
*Origin:* ${originString}\n
*User ID:* ${userId}\n
*Time:* ${new Date()}\n
*Error:* \`\`\`origin: ${originString}\nname: ${error.name}\nmessage: ${error.message}\nstack trace: ${
    error.stack
  }\`\`\`${errorCause}
\n--------------------`;
  return await postToSlack(ssmCache, secretsManager, errorMessage);
}

export async function sendObjectToSlack(ssmCache, secretsManager, object, description = "Not specified") {
  const objectMessage = `\n--------------------\n
*sendObjectToSlack called on backend!*\n
*Description:* ${description}\n
*Stringified Object: *\n
\`\`\`${JSON.stringify(object)}\`\`\`
\n--------------------`;
  return await postToSlack(ssmCache, secretsManager, objectMessage);
}
