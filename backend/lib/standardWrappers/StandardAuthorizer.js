import { Duration } from "aws-cdk-lib";
import { IdentitySource, RequestAuthorizer } from "aws-cdk-lib/aws-apigateway";

class StandardAuthorizer extends RequestAuthorizer {
  constructor(scope, id, authorizerLambda) {
    super(scope, id, {
      handler: authorizerLambda,
      identitySources: [IdentitySource.header("Authorization")],
      resultsCacheTtl: Duration.minutes(5),
    });
  }
}

export default StandardAuthorizer;
