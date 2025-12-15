import { Effect, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";

import { BACKEND_CONFIG } from "../configurationConstants.js";
import { BaseStack } from "./BaseStack.js";

class SecretsStack extends BaseStack {
  constructor(scope, id, props) {
    const { cdkConfig } = props;
    super(scope, props.cdkConfig?.appName + "-" + id, props);

    const allowSecretAccessPolicy = new ManagedPolicy(this, "SecretsAllowSecretsAccess", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["kms:Decrypt"],
          resources: [cdkConfig.secretEncryptionKeyArn],
        }),
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
          resources: [
            cdkConfig.stripeApiSecretArn,
            cdkConfig.slackFeedbackSecretArn,
            cdkConfig.openaiApiKeySecretArn,
            cdkConfig.twilioSecretArn,
          ],
        }),
      ],
      description: "Allows usage of secrets in the secrets manager",
    });

    this.createSSMParameter("allowSecretsAccessPolicyArn", allowSecretAccessPolicy.managedPolicyArn);
    this.createSSMParameter(BACKEND_CONFIG.SECRETS.STRIPE_API_SECRET_ARN, cdkConfig.stripeApiSecretArn);
    this.createSSMParameter(BACKEND_CONFIG.SECRETS.SLACK_FEEDBACK_API_SECRET_ARN, cdkConfig.slackFeedbackSecretArn);
  }
}

export default SecretsStack;
