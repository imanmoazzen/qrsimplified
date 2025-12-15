import { Duration } from "aws-cdk-lib";
import { Alarm } from "aws-cdk-lib/aws-cloudwatch";
import { LambdaApplication, LambdaDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";

class LambdaDeployment extends LambdaApplication {
  constructor(scope, id, props) {
    super(scope, id, props);
    const deploymentAlarms = props.alarms || [];
    this.deploymentGroup = new LambdaDeploymentGroup(this, `${id} Code Deployment Group`, {
      application: this,
      alias: props.alias,
      deploymentConfig: props.deploymentConfig,
      alarms: [
        ...deploymentAlarms,
        new Alarm(this, "Lambda Error Rate", {
          metric: props.alias.metricErrors({ period: Duration.seconds(60) }),
          threshold: 1,
          evaluationPeriods: 1,
        }),
      ],
    });
  }
}

export default LambdaDeployment;
