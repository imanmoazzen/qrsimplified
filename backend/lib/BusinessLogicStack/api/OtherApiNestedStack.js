import { Duration } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";

import { BaseNestedStack } from "../../BaseStack.js";
import StandardLambda from "../../standardWrappers/StandardLambda.js";
import StandardRestApi from "../../standardWrappers/StandardRestApi.js";

class OtherApiNestedStack extends BaseNestedStack {
  constructor(scope, id, { cdkConfig, slackbotTopicArn, standardEnv, executionRoleName, authorizerLambda }) {
    super(scope, id, { cdkConfig });

    const executionRole = Role.fromRoleName(this, "executionRole", executionRoleName);

    // IMAN: By default, CDK will create a new IAM role for each Lambda unless you specify one.
    // this does not mean that the role can invoke the Lambda.
    // The role assigned to the Lambda defines what the Lambda can do when it runs — like read from S3, write to DynamoDB, access secrets, etc.
    // If you want someone else (like another Lambda, user, or service witht the same rule) to invoke this Lambda, you have to explicitly grant that permission.
    // that's why in the buseinss stack we do grant the invoke permission
    this.userAuthLambda = new StandardLambda(this, "userAuth", {
      cdkConfig,
      slackbotTopicArn,
      entry: "./lambdas/userAuth/index.js",
      runtime: Runtime.NODEJS_22_X,
      environment: standardEnv,
      role: executionRole,
      timeout: Duration.minutes(5),
    });

    const userAuthApi = new StandardRestApi(this, "userAuth" + cdkConfig.appName, {
      handlerLambda: this.userAuthLambda,
    });
    userAuthApi.root.addResource("forgot-password").addMethod("POST");
    // added by Iman: the following might be simpler
    // Forward all paths/methods to the Lambda
    // userAuthApi.root.addProxy();

    this.slackFeedbackLambda = new StandardLambda(this, "slackFeedback", {
      cdkConfig,
      slackbotTopicArn,
      entry: "./lambdas/slackFeedback/index.js",
      runtime: Runtime.NODEJS_22_X,
      environment: standardEnv,
      role: executionRole,
      timeout: Duration.minutes(1),
    });

    const slackFeedback = new StandardRestApi(this, "slackFeedback" + cdkConfig.appName, {
      handlerLambda: this.slackFeedbackLambda,
    });
    slackFeedback.root.addMethod("POST");

    this.createSSMParameter("api.slack_lambda_endpoint", slackFeedback.url);
    this.createSSMParameter("api.user_auth_endpoint", userAuthApi.url);
  }
}

export default OtherApiNestedStack;
