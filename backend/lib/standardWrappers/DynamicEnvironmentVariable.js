import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

// This construct stores a configuration value in SSM Parameter Store under a specific key.
// This should be used in place of environmental variables to ensure that we do not exceed
// the 4KB limit on total size of environmental variables. (As of 08/21/2023) we were very close).

// IMAN: THIS IS USED TO STORE CONSTANTS FOR THE BACKEND

class DynamicEnvironmentVariable extends Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    const { name, value } = props;

    // IMAN: this is not a good as the only uniqueness comes from having unique name
    // but for now I keep it as is to avoid changing the fetch logic in the backend
    const parameterName = `/app/configuration/${name}`;

    new StringParameter(this, parameterName, {
      parameterName,
      stringValue: value,
    });
  }
}

export default DynamicEnvironmentVariable;
