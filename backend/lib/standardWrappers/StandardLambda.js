import { Duration } from "aws-cdk-lib";
import { Alarm, ComparisonOperator, Metric, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { LambdaDeploymentConfig } from "aws-cdk-lib/aws-codedeploy";
import { Alias } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, MetricFilter } from "aws-cdk-lib/aws-logs";
import { Topic } from "aws-cdk-lib/aws-sns";

import LambdaDeployment from "./LambdaDeployment.js";

class StandardLambda extends NodejsFunction {
  constructor(scope, id, props) {
    const {
      cdkConfig,
      memorySize = 512,
      slackbotTopicArn,
      enableLambdaDeployment = false,
      provisionedConcurrency = null,
      deploymentConfig = LambdaDeploymentConfig.ALL_AT_ONCE,
      metricFilters = [],
      enabledAlarmsOverride = {},
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

    if (!cdkConfig.awsSlackNotificationsEnabled) return;

    const alarmConfig = {
      duration: true,
      errors: true,
      throttles: true,
      invocations: false,
      ...enabledAlarmsOverride,
    };

    const alarms = [];

    if (alarmConfig.duration) {
      // default duration threshold: Half the timeout value
      const alarmDurationThreshold = props.timeout
        ? Math.floor(props.timeout.toMilliseconds() / 2)
        : Duration.seconds(5).toMilliseconds();
      const duration = this.metricDuration({ period: Duration.minutes(5), statistic: "p95" });

      alarms.push(
        duration.createAlarm(this, id + "_durationAlarm", {
          evaluationPeriods: 1,
          threshold: alarmDurationThreshold,
          treatMissingData: TreatMissingData.IGNORE,
          alarmName: id + "_durationAlarm",
        })
      );
    }

    if (alarmConfig.errors) {
      const errors = this.metricErrors({ period: Duration.minutes(5), statistic: "sum" });

      alarms.push(
        errors.createAlarm(this, id + "_errorsAlarm", {
          evaluationPeriods: 1,
          threshold: 1,
          treatMissingData: TreatMissingData.IGNORE,
          alarmName: id + "_errorsAlarm",
        })
      );
    }

    if (alarmConfig.throttles) {
      const throttles = this.metricThrottles({ period: Duration.minutes(5), statistic: "sum" });

      alarms.push(
        throttles.createAlarm(this, id + "_throttlesAlarm", {
          evaluationPeriods: 1,
          threshold: 1,
          treatMissingData: TreatMissingData.IGNORE,
          alarmName: id + "_throttlesAlarm",
        })
      );
    }

    if (alarmConfig.invocations) {
      const invocations = this.metricInvocations({ period: Duration.minutes(5), statistic: "sum" });

      alarms.push(
        invocations.createAlarm(this, id + "_invocationsAlarm", {
          evaluationPeriods: 1,
          threshold: 1000,
          treatMissingData: TreatMissingData.IGNORE,
          alarmName: id + "_invocationsAlarm",
        })
      );
    }

    if (metricFilters && metricFilters.length > 0) {
      // IMAN: This is problematic because AWS automatically create log group after lambda invocation
      // If Lambda was invoked before CDK creates this log group, we'll get an error
      // as the log is not tracked by cdk and now if I wanna create it again cdk can throw an error
      // and I think handle_message log is created twice once in the ApiV2NestedStack and once here
      // I need to fix this later
      /*
      const logGroup = new LogGroup(this, `${id}-LogGroup`, {
        logGroupName: `/aws/lambda/${this.functionName}`,
        removalPolicy: cdkConfig.logRemovalPolicy,
      });
      */

      const logGroup = LogGroup.fromLogGroupName(this, `${id}-ExistingLogGroup`, `/aws/lambda/${this.functionName}`);

      metricFilters.forEach((mf) => {
        const { filterPattern, metricNamespace, metricName, metricValue } = mf;

        const metric = new Metric({
          namespace: metricNamespace,
          metricName,
        });

        new MetricFilter(this, `${id}_${metricName}_MetricFilter`, {
          metricNamespace,
          metricName,
          logGroup,
          filterPattern,
          metricValue,
        });

        const alarm = new Alarm(this, `${id}_${metricName}_Alarm`, {
          metric,
          evaluationPeriods: 1,
          threshold: 1,
          alarmName: `${id}_${metricName}_Alarm`,
          actionsEnabled: true,
          comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
          treatMissingData: TreatMissingData.IGNORE,
          period: Duration.minutes(5),
        });

        alarms.push(alarm);
      });
    }

    const slackbotTopic = Topic.fromTopicArn(this, "SlackbotNotificationsTopic", slackbotTopicArn);
    const slackbotSnsAction = new SnsAction(slackbotTopic);
    this.setupAlarmHandlers(slackbotSnsAction, alarms);
  }

  setupAlarmHandlers(snsAction, alarms) {
    alarms.forEach((a) => {
      a.addAlarmAction(snsAction);
    });
  }
}

export default StandardLambda;
