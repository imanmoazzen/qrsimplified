import { Duration, NestedStack, RemovalPolicy } from "aws-cdk-lib";
import { AccessLogFormat, LogGroupLogDestination, MethodLoggingLevel } from "aws-cdk-lib/aws-apigateway";
import { LambdaDeploymentConfig } from "aws-cdk-lib/aws-codedeploy";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

import { ENVS } from "../../constants.js";
import LambdaEnvironmentVariableSet from "../../standardWrappers/LambdaEnvironmentVariableSet.js";
import ObjectDefinedLambdaRestApi from "../../standardWrappers/ObjectDefinedRestApi.js";
import StandardLambda from "../../standardWrappers/StandardLambda.js";
import { API_V2_DEFINITION } from "./apiV2Definition.js";

class ApiV2NestedStack extends NestedStack {
  // eslint-disable-next-line no-unused-vars
  constructor(scope, { cdkConfig, standardEnv, executionRole, slackbotTopicArn, authorizerLambda, layers }) {
    super(scope, "ApiV2");

    let provisionedConcurrency = null;
    if (
      cdkConfig.enableProvisionedConcurrency &&
      cdkConfig.lambdaProvisionedConcurrency?.apiV2 &&
      cdkConfig.lambdaProvisionedConcurrency.apiV2 > 0
    ) {
      provisionedConcurrency = cdkConfig.lambdaProvisionedConcurrency.apiV2;
    }

    this.lambda = new StandardLambda(this, "apiV2", {
      cdkConfig,
      slackbotTopicArn,
      enableLambdaDeployment: true,
      deploymentConfig: LambdaDeploymentConfig.ALL_AT_ONCE,
      entry: "./lambdas/apiV2/index.js",
      runtime: Runtime.NODEJS_22_X,
      environment: standardEnv,
      role: executionRole,
      functionName: standardEnv.API_V2_LAMBDA_NAME,
      bundling: {
        externalModules: ["@aws-sdk/*"],
        loader: { ".png": "file" },
      },
      memorySize: 4096,
      timeout: Duration.minutes(5),
      provisionedConcurrency,
    });

    this.lambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:VerifyEmailIdentity",
          "ses:GetIdentityVerificationAttributes",
          "sns:Publish",
        ],
        resources: ["*"],
        effect: Effect.ALLOW,
      })
    );

    let definitionObject = API_V2_DEFINITION;

    const logGroup = new LogGroup(this, `apiV2-${cdkConfig.appName}-Logs`, {
      logGroupName: `apiV2-${cdkConfig.appName}-AccessLogs`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: cdkConfig.environment === ENVS.production ? RetentionDays.THREE_MONTHS : RetentionDays.ONE_WEEK,
    });

    this.api = new ObjectDefinedLambdaRestApi(this, "apiV2" + cdkConfig.appName, {
      handlerLambda: this.lambda,
      authorizerLambda,
      definitionObject,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(logGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: cdkConfig.environment === ENVS.production,
        dataTraceEnabled: cdkConfig.environment === ENVS.production,
      },
    });

    new LambdaEnvironmentVariableSet(this, "updateApiV2Var", {
      lambda: this.lambda,
      environmentVariables: { ...standardEnv, API_V2_BASE_URL: this.api.url },
      dependencyId: "apiV2" + cdkConfig.appName,
    });
  }
}

export default ApiV2NestedStack;
