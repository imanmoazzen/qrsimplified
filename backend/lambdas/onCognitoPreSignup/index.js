import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SSMClient } from "@aws-sdk/client-ssm";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { LOGIN_ERROR } from "../../../castofly-common/commonConstants.js";
import { BACKEND_CONFIG } from "../../configurationConstants.js";
import { queryGSI, translateConfig } from "../common-aws-utils-v3/dynamoUtils.js";
import { SsmCache } from "../common-aws-utils-v3/ssmCache.js";

const region = process.env.AWS_REGION;

const ssmClient = new SSMClient({ region });
const ssmCache = new SsmCache(ssmClient);
const dynamoDbClient = new DynamoDBClient({ region });
const dynamo = DynamoDBDocumentClient.from(dynamoDbClient, translateConfig);

const USER_DATA_TABLE_NAME = process.env.USER_DATA_TABLE_NAME;

export async function handler(event, context, callback) {
  // Trigger sources can be:
  // PreSignUp_AdminCreateUser - user was manually created through AWS console
  // PreSignUp_SignUp - Normal user signup (not social)
  // PreSignUp_ExternalProvider - Signup via social
  // We want to handle them all, so we're not examining them here

  const email = event.request?.userAttributes?.email;
  if (!email) throw new Error("Email is not present.");

  const USER_DATA_EMAIL_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.USER_DATA_EMAIL_GSI);
  const results = await queryGSI(dynamo, USER_DATA_TABLE_NAME, { email }, USER_DATA_EMAIL_GSI);

  const user = results?.[0];

  if (user) {
    throw new Error(
      user.account_from_google ? LOGIN_ERROR.EMAIL_ALREADY_IN_USE_GOOGLE : LOGIN_ERROR.EMAIL_ALREADY_IN_USE_PASSWORDLESS
    );
  }

  callback(null, event);
}
