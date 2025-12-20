import { CognitoIdentityProviderClient, ForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SSMClient } from "@aws-sdk/client-ssm";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { AUTHENTICATION_PAGES } from "../../../castofly-common/appPages.js";
import { HTTP_STATUS_CODES } from "../../../castofly-common/commonConstants.js";
import { isEmailValid } from "../../../castofly-common/validators.js";
import { BACKEND_CONFIG } from "../../configurationConstants.js";
import { queryGSI, translateConfig } from "../common-aws-utils-v3/dynamoUtils.js";
import { SsmCache } from "../common-aws-utils-v3/ssmCache.js";
import { MultipleUsersFoundError, NoUserFoundError } from "./errors.js";

const region = process.env.AWS_REGION;

const ssm = new SSMClient({ region });
const dynamoClient = new DynamoDBClient({ region });
const dynamoDbDocClient = DynamoDBDocumentClient.from(dynamoClient, translateConfig);
const ssmCache = new SsmCache(ssm);
const cognitoClient = new CognitoIdentityProviderClient({ region });

const USER_DATA_TABLE_NAME = process.env.USER_DATA_TABLE_NAME;
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

const userAuthApi = new Hono();

userAuthApi.use("*", logger());
userAuthApi.use("*", cors());

userAuthApi.post(AUTHENTICATION_PAGES.FORGOT_PASSWORD, async (context) => forgotPassword(context));

export const handler = handle(userAuthApi);

const forgotPassword = async (context) => {
  try {
    const { usernameOrEmail } = await context.req.json();
    if (!usernameOrEmail) {
      throw new Error("A value is required for the usernameOrEmail parameter.");
    }
    const isEmail = isEmailValid(usernameOrEmail);
    const email = isEmail ? usernameOrEmail : null;
    const username = isEmail ? await getUsernameByEmail(email) : usernameOrEmail;
    const cmd = new ForgotPasswordCommand({
      ClientId: USER_POOL_CLIENT_ID,
      Username: username,
    });
    const result = await cognitoClient.send(cmd);
    const { CodeDeliveryDetails } = result;
    const { Destination } = CodeDeliveryDetails;
    return context.json({ resolvedUsername: username, forwardAddress: Destination }, HTTP_STATUS_CODES.SUCCESS);
  } catch (err) {
    console.error(err);
    let statusCode = HTTP_STATUS_CODES.SERVER_ERROR;
    let message = "Something went wrong";
    if (err.name === "NoUserFoundError" || err.name === "MultipleUsersFoundError") {
      statusCode = HTTP_STATUS_CODES.NOT_FOUND;
      message = err.message;
    }
    return context.json({ message }, statusCode);
  }
};

const getUsernameByEmail = async (email) => {
  const USER_DATA_EMAIL_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.USER_DATA_EMAIL_GSI);
  const records = await queryGSI(dynamoDbDocClient, USER_DATA_TABLE_NAME, { email }, USER_DATA_EMAIL_GSI);
  if (records.length === 0) {
    throw new NoUserFoundError(`No users found with email: ${email}.`);
  }
  if (records.length > 1) {
    throw new MultipleUsersFoundError(`Multiple users found with email: ${email}.`);
  }
  return records[0].username;
};
