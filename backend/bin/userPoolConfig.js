// NOTE: For now, if changes are made to the definition of UserPool, they should also be added here as appropriate

import getUserPoolEmailConfig from "../lib/AuthStack/emailConfig.js";

export default function getUserPoolConfigObject(cdkConfig) {
  return {
    AdminCreateUserConfig: {
      AllowAdminCreateUserOnly: !cdkConfig.cognitoSelfSignupEnabled,
    },
    AutoVerifiedAttributes: ["email"],
    EmailVerificationSubject: "Account Confirmation Code",
    EmailConfiguration: getUserPoolEmailConfig(cdkConfig),
  };
}
