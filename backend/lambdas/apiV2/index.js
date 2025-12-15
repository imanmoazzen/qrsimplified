import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { SESClient } from "@aws-sdk/client-ses";
import { SNSClient } from "@aws-sdk/client-sns";
import { SSMClient } from "@aws-sdk/client-ssm";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { HTTP_STATUS_CODES } from "../../../castofly-common/commonConstants.js";
import { translateConfig } from "../common-aws-utils-v3/dynamoUtils.js";
import { SsmCache } from "../common-aws-utils-v3/ssmCache.js";
import makeLambdaProxyResponse from "../common-utilities/makeLambdaProxyResponse.js";
import { clearPromiseMemoizerCache } from "../common-utilities/promiseMemoizer.js";
import apiRouter from "./routes/apiRouter.js";
import { errorResponse } from "./routes/standardResponses.js";

const region = process.env.AWS_REGION;

export const ssmClient = new SSMClient({ region });
export const ssmCache = new SsmCache(ssmClient);
export const lambda = new LambdaClient({ region });
export const dynamoDbClient = new DynamoDBClient({ region });
export const dynamo = DynamoDBDocumentClient.from(dynamoDbClient, translateConfig);
export const secretsManager = new SecretsManagerClient({ region });
export const ses = new SESClient({ region });
export const s3 = new S3Client({ region });
export const sns = new SNSClient({ region });

export async function handler(event) {
  let body;
  let statusCode = HTTP_STATUS_CODES.SUCCESS;

  clearPromiseMemoizerCache();

  try {
    body = await apiRouter(event);
    if (body?.statusCode === HTTP_STATUS_CODES.TEMPORARY_REDIRECT) {
      return {
        statusCode: HTTP_STATUS_CODES.TEMPORARY_REDIRECT,
        headers: body.headers,
      };
    }
  } catch (err) {
    statusCode = HTTP_STATUS_CODES.CLIENT_ERROR;
    console.log(err);
    body = errorResponse(err.message);
  }

  if (body?.isActualResponse) {
    delete body.isActualResponse;
    return body;
  }

  return makeLambdaProxyResponse(body, statusCode);
}
