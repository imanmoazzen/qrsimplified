import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { S3Client } from "@aws-sdk/client-s3";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { SNSClient } from "@aws-sdk/client-sns";
import { SSMClient } from "@aws-sdk/client-ssm";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { translateConfig } from "./dynamoUtils.js";
import { SsmCache } from "./ssmCache.js";

const region = process.env.AWS_REGION;
const dynamoDbClient = new DynamoDBClient({ region });
const ssmClient = new SSMClient({ region });

export const dynamo = DynamoDBDocumentClient.from(dynamoDbClient, translateConfig);
export const lambda = new LambdaClient({ region });
export const ssmCache = new SsmCache(ssmClient);
export const s3 = new S3Client({ region, signatureVersion: "v4" });
export const sns = new SNSClient({ region });

export const secretsManager = new SecretsManagerClient({ region });

export const getSSMValue = async (name) => await ssmCache.getValue(name);
