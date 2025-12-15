import { SESClient } from "@aws-sdk/client-ses";

import { EMAIL_TYPES } from "../../../../../castofly-common/commonConstants.js";
import { isEmailValid } from "../../../../../castofly-common/validators.js";
import { BACKEND_CONFIG } from "../../../../configurationConstants.js";
import { sendEmail } from "../../../common-aws-utils-v3/sesUtils.js";
import { ssmCache } from "../../index.js";
import { errorResponse, successResponse } from "../standardResponses.js";

const region = process.env.AWS_REGION;
const sesClient = new SESClient({ region });

export async function sendEmailNotification(requestBody) {
  const { type, recipients, message } = requestBody;

  try {
    if (!recipients) throw new Error("Email addresses are missing!");

    const validRecipients = recipients.filter((email) => isEmailValid(email));
    if (validRecipients.length === 0) throw new Error("No valid email address is available!");

    const verifiedEmailArn = await ssmCache.getValue(BACKEND_CONFIG.SES.VERIFIED_SES_IDENTITY_ARN);
    const senderEmail = process.env.NOTIFICATION_EMAIL;

    for (const recipient of validRecipients) {
      switch (type) {
        case EMAIL_TYPES.USER_FEEDBACK: {
          const params = {
            Destination: {
              ToAddresses: [recipient],
            },
            Message: {
              Body: {
                Text: { Data: message },
              },
              Subject: { Data: `User feedback` },
            },
            Source: senderEmail,
            SourceArn: verifiedEmailArn,
          };

          await sendEmail(sesClient, params);
          break;
        }

        default:
          throw new Error("The invite type is not valid!");
      }
    }

    return successResponse("Emails sent");
  } catch (err) {
    return errorResponse(err.message);
  }
}
