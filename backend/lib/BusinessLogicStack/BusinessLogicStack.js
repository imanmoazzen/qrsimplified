import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

import { BACKEND_CONFIG } from "../../configurationConstants.js";
import { BaseStack } from "../BaseStack.js";
import DynamicEnvironmentVariable from "../standardWrappers/DynamicEnvironmentVariable.js";
import StandardLambda from "../standardWrappers/StandardLambda.js";
import ApiV2NestedStack from "./api/ApiV2NestedStack.js";
import OtherApiNestedStack from "./api/OtherApiNestedStack.js";
import { addOnSignupLambda, addPreSignupLambda, updateUserPoolConfig } from "./businessLogicHelpers.js";
import { createChatbotToSlackNotifications } from "./monitoringHelpers.js";

class BusinessLogicStack extends BaseStack {
  constructor(scope, id, props) {
    const { account, cdkConfig } = props;
    super(scope, props.cdkConfig?.appName + "-" + id, props);

    let { auth, secrets, userData } = props;

    this.unfoldSSMParameters({ auth, secrets, userData });

    auth = {
      ...auth,
      // Instantiate the secret objects from the secret ARNs
      anonymousUserTokenSecret: Secret.fromSecretCompleteArn(
        this,
        "anonymousUserTokenSecretArn",
        auth.anonymousUserTokenSecretArn
      ),
      invitationSigningSecret: Secret.fromSecretCompleteArn(
        this,
        "invitationSigningSecretArn",
        auth.invitationSigningSecretArn
      ),
      roleTokenSecret: Secret.fromSecretCompleteArn(this, "roleTokenSecretArn", auth.roleTokenSecretArn),
    };

    const API_V2_LAMBDA_NAME = cdkConfig.appName + "_" + "APIv2";
    const standardEnv = this.generateStandardEnv(cdkConfig, auth, userData, API_V2_LAMBDA_NAME);
    this.generateDynamicEnvVars(secrets.apiSecretArns);
    this.generateDynamicEnvVars(userData.tableGsiNames);

    let slackbotTopicArn;
    if (cdkConfig.awsSlackNotificationsEnabled) {
      slackbotTopicArn = createChatbotToSlackNotifications(this, { cdkConfig });
    }

    const ssmAccessPolicy = this.createSSMAccessPolicy(cdkConfig);

    const executionRole = this.createDefaultExecutionRole(cdkConfig.appName, [
      ManagedPolicy.fromManagedPolicyArn(this, "userPoolPolicy", auth.userPoolPolicyArn),
      ManagedPolicy.fromManagedPolicyArn(this, "allowSecretsAccessPolicy", secrets.allowSecretsAccessPolicyArn),
      ManagedPolicy.fromManagedPolicyArn(
        this,
        "allowReadWriteDataAccessPolicy",
        userData.allowReadWriteDataAccessPolicyArn
      ),
      ManagedPolicy.fromManagedPolicyArn(this, "ssmAccessPolicy", ssmAccessPolicy.managedPolicyArn),
    ]);

    let provisionedConcurrency = null;
    if (cdkConfig.enableProvisionedConcurrency && cdkConfig.lambdaProvisionedConcurrency?.authorizer > 0)
      provisionedConcurrency = cdkConfig.lambdaProvisionedConcurrency.authorizer;

    const authorizerLambda = new StandardLambda(this, "authorizer", {
      cdkConfig,
      slackbotTopicArn,
      entry: "./lambdas/authorizer/index.js",
      runtime: Runtime.NODEJS_22_X,
      environment: {
        USER_POOL_ID: auth.userPoolId,
        USER_POOL_CLIENT_ID: auth.userPoolClientId,
        ANON_TOKEN_SECRET_ARN: auth.anonymousUserTokenSecretArn,
      },
      provisionedConcurrency,
    });

    auth.anonymousUserTokenSecret.grantRead(authorizerLambda);

    const layers = {};

    if (cdkConfig.stripeSigningKey) {
      new DynamicEnvironmentVariable(this, "StripeSigningKey", {
        name: BACKEND_CONFIG.STRIPE.SIGNING_KEY,
        value: cdkConfig.stripeSigningKey,
      });
    }

    const onSignupLambda = addOnSignupLambda(
      this,
      cdkConfig,
      standardEnv,
      executionRole,
      slackbotTopicArn,
      auth.userPoolId
    );

    const onPreSignupLambda = addPreSignupLambda(
      this,
      cdkConfig,
      standardEnv,
      executionRole,
      slackbotTopicArn,
      auth.userPoolId
    );

    // updateUserPoolConfig(this, cdkConfig, onSignupLambda, onPreSignupLambda, auth.userPoolId); test

    const otherApis = new OtherApiNestedStack(this, "OtherApis", {
      cdkConfig,
      slackbotTopicArn,
      standardEnv: { ...standardEnv, USER_POOL_CLIENT_ID: auth.userPoolClientId },
      // Passing the execution role name to the nested stack so it can instantiate the role
      // and manipulate it all in the context of the given stack to avoid circular dependencies
      executionRoleName: executionRole.roleName,
      authorizerLambda,
      layers,
    });

    const apiV2 = new ApiV2NestedStack(this, {
      cdkConfig,
      slackbotTopicArn,
      standardEnv: {
        ...standardEnv,
        AWS_ACCOUNT_ID: account,
        ANON_TOKEN_SECRET_ARN: auth.anonymousUserTokenSecretArn,
        INVITATION_SECRET_ARN: auth.invitationSigningSecretArn,
        DEBUG_STAGING_API_V2: cdkConfig.debugStagingApiV2,
        DEBUG_PROD_API_V2: cdkConfig.debugProdApiV2,
      },
      executionRole,
      authorizerLambda,
      layers,
    });

    auth.anonymousUserTokenSecret.grantRead(apiV2.lambda);
    auth.invitationSigningSecret.grantRead(apiV2.lambda);

    this.createSSMParameter("api.v2_base_endpoint", apiV2.api.url);

    // Assimilate the parameters from the other APIs
    this.SSMParameters = {
      ...this.SSMParameters,
      ...otherApis.SSMParameters,
    };
  }

  createSSMAccessPolicy(cdkConfig) {
    return new ManagedPolicy(this, "BusinessLogicAllowSSMAccess", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"],
          resources: [`arn:aws:ssm:${cdkConfig.region}:${cdkConfig.account}:*`],
        }),
      ],
      description: "Allows reading parameters from AWS Systems Manager Parameter Store",
    });
  }

  createDefaultExecutionRole(appName, policiesArn) {
    return new Role(this, "sharedLambdaExecutionRole", {
      roleName: "sharedLambdaExecutionRole" + "_" + appName,
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      description: "Shared role assumed by all application lambda functions.",
      managedPolicies: policiesArn,
      inlinePolicies: {
        publishLogs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });
  }

  generateDynamicEnvVars(items) {
    for (const [key, value] of Object.entries(items)) {
      new DynamicEnvironmentVariable(this, key, {
        name: key,
        value,
      });
    }
  }

  generateStandardEnv(cdkConfig, auth, userData, API_V2_LAMBDA_NAME) {
    const standardEnv = {
      APP_BASE_URL: cdkConfig.appBaseUrl,
      USER_POOL_ID: auth.userPoolId,
      ENVIRONMENT: cdkConfig.environment,
      API_V2_LAMBDA_NAME,
      NOTIFICATION_EMAIL: cdkConfig.notificationEmail,
      TMP_FOLDER_LOCATION: cdkConfig.lambdaTmpFolderLocation,
    };

    for (const [key, value] of Object.entries(userData.tableNames)) {
      standardEnv[key.toUpperCase() + "_NAME"] = value;
    }
    for (const [key, value] of Object.entries(userData.bucketNames)) {
      standardEnv[key.toUpperCase() + "_NAME"] = value;
    }

    return standardEnv;
  }

  unfoldSSMParameters({ auth, secrets, userData }) {
    auth.userPoolId = BaseStack.readSSMParameterValue(this, auth.userPoolId);
    auth.userPoolClientId = BaseStack.readSSMParameterValue(this, auth.userPoolClientId);
    auth.userPoolPolicyArn = BaseStack.readSSMParameterValue(this, auth.userPoolPolicyArn);
    auth.roleTokenSecretArn = BaseStack.readSSMParameterValue(this, auth.roleTokenSecretArn);
    auth.anonymousUserTokenSecretArn = BaseStack.readSSMParameterValue(this, auth.anonymousUserTokenSecretArn);
    auth.invitationSigningSecretArn = BaseStack.readSSMParameterValue(this, auth.invitationSigningSecretArn);
    secrets.allowSecretsAccessPolicyArn = BaseStack.readSSMParameterValue(this, secrets.allowSecretsAccessPolicyArn);
    for (const [key, apiSecretArnSSMParameter] of Object.entries(secrets.apiSecretArns)) {
      secrets.apiSecretArns[key] = BaseStack.readSSMParameterValue(this, apiSecretArnSSMParameter);
    }
    userData.allowReadWriteDataAccessPolicyArn = BaseStack.readSSMParameterValue(
      this,
      userData.allowReadWriteDataAccessPolicyArn
    );
    for (const [key, tableNameSSMParameter] of Object.entries(userData.tableNames)) {
      userData.tableNames[key] = BaseStack.readSSMParameterValue(this, tableNameSSMParameter);
    }
    for (const [key, tableGsiNameSSMParameter] of Object.entries(userData.tableGsiNames)) {
      userData.tableGsiNames[key] = BaseStack.readSSMParameterValue(this, tableGsiNameSSMParameter);
    }
    for (const [key, bucketNameSSMParameter] of Object.entries(userData.bucketNames)) {
      userData.bucketNames[key] = BaseStack.readSSMParameterValue(this, bucketNameSSMParameter);
    }
  }
}

export default BusinessLogicStack;
