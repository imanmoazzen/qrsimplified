#!/usr/bin/env node

import fs from "fs";

import { App } from "aws-cdk-lib";

import AuthStack from "../lib/AuthStack/AuthStack.js";
import BusinessLogicStack from "../lib/BusinessLogicStack/BusinessLogicStack.js";
import SecretsStack from "../lib/SecretsStack.js";
import UserDataStack from "../lib/UserDataStack/UserDataStack.js";
import WebsiteStack from "../lib/WebsiteStack/WebsiteStack.js";
import { getEnvironmentConfig } from "./environmentConfig.js";

const DEPLOYMENT_ENV_KEY = "deployment-env";

const app = new App();
const deploymentEnv = app.node.tryGetContext(DEPLOYMENT_ENV_KEY);
const cdkConfig = await getEnvironmentConfig(deploymentEnv);

const stackProps = { account: cdkConfig.account, region: cdkConfig.region, cdkConfig };

const authStack = new AuthStack(app, "auth", stackProps);
const secretsStack = new SecretsStack(app, "secrets", stackProps);
const userDataStack = new UserDataStack(app, "userdata", stackProps);

const businessLogicStack = new BusinessLogicStack(app, "businessLogic", {
  auth: {
    userPoolId: authStack.SSMParameters.userPoolId,
    userPoolClientId: authStack.SSMParameters.clientId,
    userPoolPolicyArn: authStack.SSMParameters.userPoolPolicyArn,
    roleTokenSecretArn: authStack.SSMParameters.roleTokenSigningSecretArn,
    anonymousUserTokenSecretArn: authStack.SSMParameters.anonymousUserTokenSigningSecretArn,
    invitationSigningSecretArn: authStack.SSMParameters.invitationTokenSigningSecretArn,
  },
  secrets: {
    allowSecretsAccessPolicyArn: secretsStack.SSMParameters.allowSecretsAccessPolicyArn,
    apiSecretArns: secretsStack.filterSSMParameters("SECRET_ARN"),
  },
  userData: {
    allowReadWriteDataAccessPolicyArn: userDataStack.SSMParameters.allowReadWriteDataAccessPolicyArn,
    tableNames: userDataStack.filterSSMParameters("table"),
    tableGsiNames: userDataStack.filterSSMParameters("_GSI"),
    bucketNames: userDataStack.filterSSMParameters("bucket"),
  },
  ...stackProps,
});

businessLogicStack.addDependency(authStack);
businessLogicStack.addDependency(secretsStack);
businessLogicStack.addDependency(userDataStack);

const websiteStack = new WebsiteStack(app, "website", stackProps);

const appSSMSettings = {
  "cognito.callback_uris": authStack.SSMParameters.callbackUris,
  "cognito.client_id": authStack.SSMParameters.clientId,
  "cognito.signout_uris": authStack.SSMParameters.signoutUris,
  "cognito.token_scopes": authStack.SSMParameters.tokenScopes,
  "cognito.user_pool": authStack.SSMParameters.userPoolId,
  "cognito.user_pool_base_uri": authStack.SSMParameters.userPoolBaseUri,
  ...businessLogicStack.SSMParameters,
  "s3.primary_data_bucket": userDataStack.SSMParameters.mainDataBucket,
  ...websiteStack.SSMParameters,
};

fs.writeFileSync(`cdk-output.${cdkConfig.environment}.ssm.json`, JSON.stringify(appSSMSettings));
