export default function getUserPoolEmailConfig(cdkConfig) {
  let config = {
    EmailSendingAccount: "COGNITO_DEFAULT",
  };
  if (cdkConfig.cognitoSESEnabled) {
    config = {
      ...config,
      From: cdkConfig.notificationEmail,
      SourceArn: cdkConfig.cognitoSESSourceARN,
      EmailSendingAccount: "DEVELOPER",
    };
  }
  return config;
}
