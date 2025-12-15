import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { SSMClient } from "@aws-sdk/client-ssm";

import { HTTP_STATUS_CODES } from "../../../castofly-common/commonConstants.js";
import { BACKEND_CONFIG } from "../../configurationConstants.js";
import { getSecret } from "../common-aws-utils-v3/secretsManagerUtils.js";
import { SsmCache } from "../common-aws-utils-v3/ssmCache.js";
import makeLambdaProxyResponse from "../common-utilities/makeLambdaProxyResponse.js";

const region = process.env.AWS_REGION;
const ssm = new SSMClient({ region });
const ssmCache = new SsmCache(ssm);
const secretsManager = new SecretsManagerClient({ region });

export async function handler(event) {
  try {
    await postToSlack(event.body);
    return makeLambdaProxyResponse(null, HTTP_STATUS_CODES.SUCCESS);
  } catch (err) {
    console.error("An error occurred sending the message to Slack", err);
  }
}

const postToSlack = async (message) => {
  const SLACK_FEEDBACK_API_SECRET_ARN = await ssmCache.getValue(BACKEND_CONFIG.SECRETS.SLACK_FEEDBACK_API_SECRET_ARN);
  const SLACK_CUSTOMER_FEEDBACK_URL = (await getSecret(secretsManager, SLACK_FEEDBACK_API_SECRET_ARN)).key;

  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: message,
  };
  const response = await fetch(SLACK_CUSTOMER_FEEDBACK_URL, options);

  return await response.text();
};
