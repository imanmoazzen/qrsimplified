import { UserPool } from "aws-cdk-lib/aws-cognito";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";

import getUserPoolConfigObject from "../../bin/userPoolConfig.js";
import StandardLambda from "../standardWrappers/StandardLambda.js";

// the "errors" alarm on this lambda is turned off because this lambda can throw
// errors during normal operation: When a user's signup attempt is rejected, this
// is communicated by throwing an error in the lambda.
export function addPreSignupLambda(scope, cdkConfig, standardEnv, executionRole, slackbotTopicArn, userPoolId) {
  const onCognitoPreSignupLambda = new StandardLambda(scope, "onCognitoPreSignup", {
    cdkConfig,
    slackbotTopicArn,
    entry: "./lambdas/onCognitoPreSignup/index.js",
    runtime: Runtime.NODEJS_22_X,
    role: executionRole,
    environment: standardEnv,
    enabledAlarmsOverride: {
      errors: false,
    },
  });

  onCognitoPreSignupLambda.addPermission("cognitoAccess", {
    principal: new ServicePrincipal("cognito-idp.amazonaws.com"),
    sourceArn: scope.formatArn({ service: "cognito-idp", resource: "userpool", sep: "/", resourceName: userPoolId }),
  });

  return onCognitoPreSignupLambda;
}

export function addOnSignupLambda(scope, cdkConfig, standardEnv, executionRole, slackbotTopicArn, userPoolId) {
  const onCognitoSignupLambda = new StandardLambda(scope, "onCognitoSignup", {
    cdkConfig,
    slackbotTopicArn,
    entry: "./lambdas/onCognitoSignup/index.js",
    runtime: Runtime.NODEJS_22_X,
    role: executionRole,
    environment: { ...standardEnv, ONBOARDING_PROJECT_ID: cdkConfig.onboardingProjectId },
  });

  onCognitoSignupLambda.addPermission("cognitoAccess", {
    principal: new ServicePrincipal("cognito-idp.amazonaws.com"),
    sourceArn: scope.formatArn({ service: "cognito-idp", resource: "userpool", sep: "/", resourceName: userPoolId }),
  });

  return onCognitoSignupLambda;
}

// IMAN wrote the following comments:
// This exists because our user pool on prodcution already exist and the AWS CDK doesn’t currently support all user pool updates after creation
// CDK can create user pools and set Lambda triggers during creation, but it cannot change those triggers later (e.g., during stack updates). So, this workaround uses an SDK call at deploy time.
// It means that once the user pool is created using CDK, you can’t change certain settings (like Lambda triggers) just by updating your CDK code and redeploying — CDK won’t apply those updates automatically.
// For a brand new user pool it can be defined at the time creation
export function updateUserPoolConfig(scope, cdkConfig, onSignupLambda, onPreSignupLambda, userPoolId) {
  const userPool = UserPool.fromUserPoolId(scope, "cognitoUserPool", userPoolId);
  // Source for this custom resource:
  // https://github.com/aws/aws-cdk/issues/10002#issuecomment-854169838

  const customResourceParams = {
    service: "CognitoIdentityServiceProvider",
    action: "updateUserPool", // this is like CognitoIdentityServiceProvider.updateUserPool
    parameters: {
      UserPoolId: userPoolId,
      LambdaConfig: {
        PostConfirmation: onSignupLambda.functionArn,
        PreSignUp: onPreSignupLambda.functionArn,
      },
      ...getUserPoolConfigObject(cdkConfig),
    },
    physicalResourceId: PhysicalResourceId.of(userPoolId),
  };

  const updateResource = new AwsCustomResource(scope, "UpdateUserPool", {
    resourceType: "Custom::UpdateUserPool",
    onCreate: customResourceParams,
    onUpdate: customResourceParams,
    policy: AwsCustomResourcePolicy.fromStatements([
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["cognito-idp:UpdateUserPool", "cognito-idp:DescribeUserPool"],
        resources: [userPool.userPoolArn],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["iam:CreateServiceLinkedRole"],
        resources: ["*"],
        conditions: {
          StringEquals: { "iam:AWSServiceName": "email.cognito-idp.amazonaws.com" },
        },
      }),
    ]),
  });

  /*
  const updateResource = new AwsCustomResource(scope, "UpdateUserPool", {
    resourceType: "Custom::UpdateUserPool",
    onCreate: customResourceParams,
    onUpdate: customResourceParams,
    policy: AwsCustomResourcePolicy.fromSdkCalls({
      resources: AwsCustomResourcePolicy.ANY_RESOURCE,
    }),
  });
  */

  updateResource.node.addDependency(userPool);
}
