import appSettings from "./appSettings.js";
import { detectBrowser } from "./commonUtil/detectBrowser.js";
import { auth, root } from "./index.js";

const slackLambdaUrl = appSettings.get("api.slack_lambda_endpoint");

export default async function reportErrorToSlack(error, originString = "unspecified") {
  const errorMessageText = makeErrorMessage(error, originString);

  fetch(slackLambdaUrl, {
    method: "post",
    body: JSON.stringify({
      text: errorMessageText,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function sendObjectToSlack(description, object) {
  const objectMessage = `\n--------------------\n
*sendObjectToSlack called on frontend!*\n
*Description:* ${description}\n
*Stringified Object: *\n
\`\`\`${JSON.stringify(object)}\`\`\`
\n--------------------`;

  fetch(slackLambdaUrl, {
    method: "post",
    body: JSON.stringify({
      text: objectMessage,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function makeErrorMessage(error, originString) {
  const browser = detectBrowser();
  const user = auth.userSelector(root._store.getState());
  const { user_id, email, display_name } = user;

  const errorCause = error.cause
    ? `\n\n*Error Cause:* \`\`\`name: ${error.cause.name}\nmessage: ${error.cause.message}\nstack trace: ${error.cause.stack}\`\`\``
    : "";

  return `\n--------------------\n
*Origin:* ${originString}\n
*User:* ${display_name} (${email})\n
*User ID:* ${user_id}\n
*Time:* ${new Date()}\n
*Browser:* ${browser.name}, version ${browser.version}, running on ${browser.os}\n
*Error:* \`\`\`origin: ${originString}\nname: ${error.name}\nmessage: ${error.message}\nstack trace: ${
    error.stack
  }\`\`\`${errorCause}
\n--------------------`;
}
