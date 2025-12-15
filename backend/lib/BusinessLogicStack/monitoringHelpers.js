import { LoggingLevel, SlackChannelConfiguration } from "aws-cdk-lib/aws-chatbot";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Topic } from "aws-cdk-lib/aws-sns";

export function createChatbotToSlackNotifications(scope, props) {
  const { cdkConfig } = props;

  if (cdkConfig.awsSlackNotificationsEnabled) {
    const slackbotSnsTopic = new Topic(scope, "SlackbotNotificationsTopic", {
      topicName: cdkConfig.appName + "_slackbot-notifications-topic",
    });

    new SlackChannelConfiguration(scope, "NotificationsSlackbot", {
      slackChannelConfigurationName: cdkConfig.appName + "_slackbot-notifications-topic",
      slackWorkspaceId: cdkConfig.slackWorkspaceId,
      slackChannelId: cdkConfig.slackChannelId,
      loggingLevel: LoggingLevel.INFO,
      logRetention: RetentionDays.ONE_WEEK,
      notificationTopics: [slackbotSnsTopic],
    });

    return slackbotSnsTopic.topicArn;
  }
  return null;
}
