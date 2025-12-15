import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { putItem, translateConfig } from "../common-aws-utils-v3/dynamoUtils.js";

const region = process.env.AWS_REGION;
const dynamoDbClient = new DynamoDBClient({ region });
const dynamo = DynamoDBDocumentClient.from(dynamoDbClient, translateConfig);

export async function handler(event) {
  // apparently this lambda also gets hit during the forgot password  flow; skip if it isn't a ConfirmSignUp event.
  if (event.triggerSource !== "PostConfirmation_ConfirmSignUp") return event;

  const userData = userDataFromEvent(event);
  await putItem(dynamo, process.env.USER_DATA_TABLE_NAME, userData);

  return event;
}

function userDataFromEvent(event) {
  const { sub, email, family_name, given_name, picture, identities } = event.request.userAttributes;
  const username = event.userName;
  const account_from_google = identities?.length > 0;

  return {
    user_id: sub,
    email,
    username,
    display_name: computeInitialDisplayName(email, family_name, given_name, account_from_google),
    picture,
    cognito_created: Date.now(),
    cognito_modified: Date.now(),
    account_from_google,
  };
}

function computeInitialDisplayName(email, last_name, first_name) {
  if (!email) {
    throw new Error("User with no email found.");
  }
  if (last_name && first_name) return `${first_name} ${last_name}`;
  if (last_name || first_name) return last_name || first_name;
  const emailParts = email.split("@");
  return emailParts[0];
}
