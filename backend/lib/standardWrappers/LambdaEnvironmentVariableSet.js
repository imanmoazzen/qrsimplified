/*
  Adds one or more environment variables to a lambda function as a separate step after it's been deployed.
  Useful for avoiding circular dependencies (for example, giving a lambda function the endpoint of an API that it's attached to)
  source: https://stackoverflow.com/questions/70825543/aws-cdk-update-existing-lambda-environment-variables
*/

import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";

class LambdaEnvironmentVariableSet extends AwsCustomResource {
  constructor(scope, id, { lambda, environmentVariables, dependencyId }) {
    const lambdaUpdateEnvParams = {
      service: "Lambda",
      action: "updateFunctionConfiguration",
      parameters: {
        FunctionName: lambda.functionArn,
        Environment: {
          Variables: {
            ...environmentVariables,
            LAMBDA_CURRENT_VERSION: lambda.currentVersion.version, // include the lambda version to force this resource to update when the lambda does
          },
        },
      },
      physicalResourceId: PhysicalResourceId.of(dependencyId), // When this resource with id 'dependencyId' is created, the above operation will run
      outputPaths: ["FunctionName"], // Have the API response only include the FunctionName, so that the response is guaranteed to not be too big
      // Relevant github issue for the problem this is meant to solve: https://github.com/aws/aws-cdk/issues/2825
    };
    super(scope, id, {
      onCreate: lambdaUpdateEnvParams,
      onUpdate: lambdaUpdateEnvParams,
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [lambda.functionArn],
      }),
    });
  }
}

export default LambdaEnvironmentVariableSet;
