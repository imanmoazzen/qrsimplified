import { RemovalPolicy } from "aws-cdk-lib";
import { BillingMode } from "aws-cdk-lib/aws-dynamodb";
import dotenv from "dotenv";
import GitBranch from "git-branch";

import { AUTH_SUBDOMAINS } from "../../castofly-common/commonConstants.js";
import { COGNITO_HOSTED_DOMAIN_TYPES } from "../lib/constants.js";
import { ENVS } from "../lib/constants.js";

const globalConfig = {
  appName: "qrsimplified",
  region: "us-east-1",
  lambdaTmpFolderLocation: "/tmp",
};

const environmentConfig = {
  [ENVS.development]: {
    bucketRemovalPolicy: RemovalPolicy.DESTROY,
    tableRemovalPolicy: RemovalPolicy.DESTROY,
    userPoolRemovalPolicy: RemovalPolicy.DESTROY,
    secretRemovalPolicy: RemovalPolicy.DESTROY,
    logRemovalPolicy: RemovalPolicy.DESTROY,
    distributionRemovalPolicy: undefined,
    userDataBucketCORSAllowedOrigins: ["http://localhost:3000"],
    lambdaMemoryMax: 3008,
    dynamoUserDataTableBillingMode: BillingMode.PAY_PER_REQUEST,
    pointInTimeRecoveryEnabled: false,
    cognitoSESEnabled: false,
    cognitoSESSourceARN: "arn:aws:ses:us-east-1:909155336690:identity/info@qrsimplified.com",
    cognitoUserPoolId: undefined,
    cognitoImportDomainName: undefined,
    cognitoImportBaseUri: undefined,
    cognitoSelfSignupEnabled: true,
    cognitoGoogleAuthFlow: false,
    cognitoGoogleClientId: undefined,
    secretsManagerGoogleSecretId: undefined,
    hostedZoneId: undefined,
    hostedZoneName: undefined,
    hostedZoneAppRecordName: undefined,
    hostedZoneCertificateArn: undefined,
    cdkShouldMakeARecords: false,
    cognitoPostSignoutURLs: { [AUTH_SUBDOMAINS.APP]: "http://localhost:3000/login" },
    cognitoCallbackURLs: { [AUTH_SUBDOMAINS.APP]: "http://localhost:3000" },
    cognitoHostedDomainType: COGNITO_HOSTED_DOMAIN_TYPES.COGNITO,
    cognitoHostedDomainName: undefined,
    appBaseUrl: "http://localhost:3000",
    notificationEmail: "info@qrsimplified.com",
    secretEncryptionKeyArn: "arn:aws:kms:us-east-1:909155336690:key/6b82a847-6ca4-4983-a2fb-80e83872e37c",
    stripeApiSecretArn: "arn:aws:secretsmanager:us-east-1:909155336690:secret:stripe-test-end-NlURWK",
    slackFeedbackSecretArn: "arn:aws:secretsmanager:us-east-1:648819632526:secret:slackCustomerFeedbackApiUrl-oxveL8",
    slackWorkspaceId: "TR9RS3MUL",
    slackChannelId: "C05BW6EM8SK",
    awsSlackNotificationsEnabled: false,
    enableCiCdStack: false,
    ciCdDeployRoleName: undefined,
    ciCdRepositoryConfig: undefined,
    enableProvisionedConcurrency: false,
    lambdaProvisionedConcurrency: {
      apiV2: 0,
      authorizer: 0,
      handleMessagePersistence: 0,
      openSearch: 0,
    },
    stripeSigningKey: undefined,
    passwordRequiredForWebsite: false,
  },
  [ENVS.production]: {
    account: "950672314670",
    bucketRemovalPolicy: RemovalPolicy.RETAIN,
    tableRemovalPolicy: RemovalPolicy.RETAIN,
    userPoolRemovalPolicy: RemovalPolicy.RETAIN,
    secretRemovalPolicy: RemovalPolicy.RETAIN,
    logRemovalPolicy: RemovalPolicy.RETAIN,
    distributionRemovalPolicy: RemovalPolicy.RETAIN,
    userDataBucketCORSAllowedOrigins: ["*"], // TODO: Change back to "https://*.castofly.com"
    lambdaMemoryMax: 3008, // TODO: change back to 10240
    dynamoUserDataTableBillingMode: BillingMode.PAY_PER_REQUEST,
    pointInTimeRecoveryEnabled: true,
    cognitoSESEnabled: true,
    cognitoSESSourceARN: "arn:aws:ses:us-east-1:950672314670:identity/qrsimplified.com",
    cognitoUserPoolId: undefined,
    cognitoImportDomainName: "https://login.qrsimplified.com",
    cognitoImportBaseUri: "https://login.qrsimplified.com",
    cognitoSelfSignupEnabled: true,
    cognitoGoogleAuthFlow: true,
    cognitoGoogleClientId: "297688401082-hejg6orpv9m6utqprj6uqjnsbkfnouk5.apps.googleusercontent.com",
    secretsManagerGoogleSecretId: "prod-google-auth-secret", // arn might be better
    hostedZoneId: "Z03711781ISD9VJM5D0QS",
    hostedZoneName: "qrsimplified.com",
    hostedZoneAppRecordName: "qrsimplified.com",
    hostedZoneCertificateArn: "arn:aws:acm:us-east-1:950672314670:certificate/1681477b-70c1-4ffe-9f02-5aa17c7369a1",
    existingDistributionId: "EKTG5QJ32IE8A", // I don't need this for production
    existingDistributionDomainName: "d1zahd6939fvq6.cloudfront.net", // I don't need this for production
    cdkShouldMakeARecords: false,
    cognitoPostSignoutURLs: { [AUTH_SUBDOMAINS.APP]: "https://qrsimplified.com/login" },
    cognitoCallbackURLs: { [AUTH_SUBDOMAINS.APP]: "https://qrsimplified.com" },
    cognitoHostedDomainType: COGNITO_HOSTED_DOMAIN_TYPES.CUSTOM,
    cognitoHostedDomainName: "login.qrsimplified.com",
    appBaseUrl: "https://qrsimplified.com",
    notificationEmail: "info@qrsimplified.com",
    secretEncryptionKeyArn: "arn:aws:kms:us-east-1:950672314670:key/972de72b-d427-4ac1-a802-8b1dccce5d1a",
    stripeApiSecretArn: "arn:aws:secretsmanager:us-east-1:950672314670:secret:stripe-qr-simplied-prod-tdtPAF",
    slackFeedbackSecretArn: "arn:aws:secretsmanager:us-east-1:950672314670:secret:slackCustomerFeedbackApiUrl-G5Zt8k",
    slackWorkspaceId: "T09DGRNSV99",
    slackChannelId: "C0A4NFDSLM6",
    awsSlackNotificationsEnabled: true,
    enableCiCdStack: true,
    ciCdDeployRoleName: "prodGithubDeploymentRole",
    ciCdRepositoryConfig: [{ owner: "imanmoazzen", repo: "qrsimplified", filter: "environment:production" }],
    enableProvisionedConcurrency: true,
    lambdaProvisionedConcurrency: {
      apiV2: 0,
      authorizer: 0,
      handleMessagePersistence: 0,
      openSearch: 0,
    },
    stripeSigningKey: undefined,
    passwordRequiredForWebsite: false,
  },
};

// Returns a 'config' object appropriate for the current environment.
// The fields of this object are set according to precedence:
// .env-*environment* > environmentConfig[*environment*] > globalConfig
export const getEnvironmentConfig = async (environmentName) => {
  if (!environmentName)
    throw new Error("The deployment environment must be provided via the cli --context deployment-env flag");

  if (!Object.values(ENVS).includes(environmentName))
    throw new Error("Invalid deployment environment provided via the --context deployment-env flag");

  // If we're in development, load development-specific config from .env.development
  // In staging and production, this should not be done because nothing should be overridden and
  // all values come from the config defined above.
  if (environmentName === ENVS.development) {
    const res = dotenv.config({ path: `./.env.${ENVS.development}` });
    if (res.error) throw new Error(`./.env.${ENVS.development} file not found. Terminating.`);
  } else {
    const currentBranch = await GitBranch();
    if (currentBranch !== "main")
      throw new Error(
        `The current branch is ${currentBranch}. When deploying to ${environmentName}, only the main branch can be used.`
      );
  }
  const config = { ...globalConfig, ...environmentConfig[environmentName], environment: environmentName };
  if (process.env.AWS_CDK_ACCOUNT) config.account = process.env.AWS_CDK_ACCOUNT;
  if (process.env.AWS_CDK_REGION) config.region = process.env.AWS_CDK_REGION;
  if (process.env.NOTIFICATION_EMAIL) config.notificationEmail = process.env.NOTIFICATION_EMAIL;
  if (process.env.AWS_SLACK_NOTIFICATIONS_ENABLED)
    config.awsSlackNotificationsEnabled = process.env.AWS_SLACK_NOTIFICATIONS_ENABLED === "true";
  if (process.env.GOOGLE_AUTH_FLOW_ENABLED) config.cognitoGoogleAuthFlow = process.env.GOOGLE_AUTH_FLOW_ENABLED;
  if (process.env.COGNITO_GOOGLE_CLIENT_ID) config.cognitoGoogleClientId = process.env.COGNITO_GOOGLE_CLIENT_ID;
  if (process.env.SECRETS_MANAGER_GOOGLE_SECRET_ID)
    config.secretsManagerGoogleSecretId = process.env.SECRETS_MANAGER_GOOGLE_SECRET_ID;

  // if process.env.STRIPE_SIGNING_KEY exists, use it instead of the secret
  // key. NOTE: This should be used for dev only.
  if (environmentName === ENVS.development && process.env.STRIPE_SIGNING_KEY)
    config.stripeSigningKey = process.env.STRIPE_SIGNING_KEY;

  return config;
};
