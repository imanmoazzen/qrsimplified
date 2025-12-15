import { Cors, LambdaIntegration, ResponseType, RestApi } from "aws-cdk-lib/aws-apigateway";

// Defines a REST Api with CORS enabled and a default integration.
class StandardRestApi extends RestApi {
  constructor(scope, id, { handlerLambda, integrationOptions, deployOptions, ...rest }) {
    super(scope, id, {
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"],
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
      defaultIntegration: handlerLambda ? new LambdaIntegration(handlerLambda, integrationOptions) : undefined,
      cloudWatchRole: true,
      deployOptions: {
        stageName: "default",
        ...deployOptions,
      },
      ...rest,
    });
    // ensure all returned responses have required CORS header
    this.addGatewayResponse("4XX_response_" + id, {
      type: ResponseType.DEFAULT_4XX,
      responseHeaders: {
        "Access-Control-Allow-Origin": "'*'",
      },
    });
  }
}

export default StandardRestApi;
