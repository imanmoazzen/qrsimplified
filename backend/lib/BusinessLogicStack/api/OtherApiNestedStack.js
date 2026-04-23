import { Duration } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";

import { BaseNestedStack } from "../../BaseStack.js";
import StandardLambda from "../../standardWrappers/StandardLambda.js";
import StandardRestApi from "../../standardWrappers/StandardRestApi.js";

class OtherApiNestedStack extends BaseNestedStack {
  constructor(scope, id, { cdkConfig, slackbotTopicArn, standardEnv, executionRoleName }) {
    super(scope, id, { cdkConfig });

    const executionRole = Role.fromRoleName(this, "executionRole", executionRoleName);

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
  }
}

export default OtherApiNestedStack;
