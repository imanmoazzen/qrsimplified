import { Duration } from "aws-cdk-lib";
import { Alarm, ComparisonOperator, Metric, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { LambdaDeploymentConfig } from "aws-cdk-lib/aws-codedeploy";
import { Alias } from "aws-cdk-lib/aws-lambda";
import { DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import { LogGroup, MetricFilter } from "aws-cdk-lib/aws-logs";
import { Topic } from "aws-cdk-lib/aws-sns";

import LambdaDeployment from "./LambdaDeployment.js";

class StandardDockerLambda extends DockerImageFunction {
  constructor(scope, id, props) {
    const {
      cdkConfig,
      memorySize = 512,
      slackbotTopicArn,
      enableLambdaDeployment = false,
      provisionedConcurrency = null,
      deploymentConfig = LambdaDeploymentConfig.ALL_AT_ONCE,
      metricFilters = [],
    } = props;

    super(scope, id, {
      functionName: cdkConfig.appName + "_" + id, // override the default behavior: if functionName isn't specified CDK will generate a randomized unique name
      timeout: Duration.seconds(10),
      ...props,
      memorySize: memorySize > cdkConfig.lambdaMemoryMax ? cdkConfig.lambdaMemoryMax : memorySize,
    });

    if (enableLambdaDeployment || provisionedConcurrency) {
      let aliasProps = {
        aliasName: "default",
        version: this.currentVersion,
      };

      if (provisionedConcurrency) {
        aliasProps = {
          ...aliasProps,
          provisionedConcurrentExecutions: provisionedConcurrency,
        };
      }

      const alias = new Alias(this, `${id}-Alias`, aliasProps);

      if (enableLambdaDeployment) {
        new LambdaDeployment(this, `${id}-Deployment`, {
          alias,
          deploymentConfig,
        });
      }
    }

    // default duration threshold: Half the timeout value
    const alarmDurationThreshold = props.timeout
      ? Math.floor(props.timeout.toMilliseconds() / 2)
      : Duration.seconds(5).toMilliseconds();

    const duration = this.metricDuration();
    const durationAlarm = duration.createAlarm(this, id + "_durationAlarm", {
      evaluationPeriods: 1,
      threshold: alarmDurationThreshold,
      alarmName: id + "_durationAlarm",
    });

    const errors = this.metricErrors();
    const errorsAlarm = errors.createAlarm(this, id + "_errorsAlarm", {
      evaluationPeriods: 1,
      threshold: 1,
      alarmName: id + "_errorsAlarm",
    });

    const invocations = this.metricInvocations();
    const invocationAlarms = invocations.createAlarm(this, id + "_invocationsAlarm", {
      evaluationPeriods: 1,
      threshold: 1000,
      alarmName: id + "_invocationsAlarm",
    });

    const throttles = this.metricThrottles();
    const throttlesAlarm = throttles.createAlarm(this, id + "_throttlesAlarm", {
      evaluationPeriods: 1,
      threshold: 1,
      alarmName: id + "_throttlesAlarm",
    });

    const alarms = [throttlesAlarm, invocationAlarms, errorsAlarm, durationAlarm];

    if (metricFilters && metricFilters.length > 0) {
      metricFilters.forEach((mf) => {
        const { filterPattern, filterName, namespace, metricValue } = mf;

        const metric = new Metric({
          namespace: namespace,
          metricName: filterName,
        });

        new MetricFilter(this, `${id}_${filterName}_MetricFilter`, {
          metricName: filterName,
          metricNamespace: namespace,

          logGroup: LogGroup.fromLogGroupName(this, `${id}-LogGroup`, `/aws/lambda/${this.functionName}`),
          filterPattern,
          metricValue,
        });

        const alarm = new Alarm(this, `${id}_${filterName}_Alarm`, {
          metric,
          evaluationPeriods: 1,
          threshold: 1,
          alarmName: `${id}_${filterName}_Alarm`,
          actionsEnabled: true,
          comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData: TreatMissingData.IGNORE,
          period: Duration.minutes(1),
        });

        alarms.push(alarm);
      });
    }

    if (cdkConfig.awsSlackNotificationsEnabled) {
      const slackbotTopic = Topic.fromTopicArn(this, "SlackbotNotificationsTopic", slackbotTopicArn);
      const slackbotSnsAction = new SnsAction(slackbotTopic);
      this.setupAlarmHandlers(slackbotSnsAction, alarms);
    }
  }

  setupAlarmHandlers(snsAction, alarms) {
    alarms.forEach((a) => {
      a.addAlarmAction(snsAction);
    });
  }
}

export default StandardDockerLambda;
