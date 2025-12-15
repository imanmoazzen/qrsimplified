import { EMAIL_TYPES } from "../../../../../castofly-common/commonConstants.js";
import { isEmailValid } from "../../../../../castofly-common/validators.js";
import { deobfuscate } from "../../../../../castofly-common/workspace.js";
import { updateItemSet } from "../../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo } from "../../index.js";
import { sendEmailNotification } from "../email/sendEmailNotification.js";
import { errorResponse, successResponse } from "../standardResponses.js";

export async function addNewLead(email, lead) {
  try {
    const isValid = isEmailValid(email);
    if (!isValid) return errorResponse("Email address is not valid!");

    await updateItemSet(
      dynamo,
      TABLE_NAMES.LEADS,
      { email_address: email },
      { lead: lead ?? "", creation_time: Date.now(), unsubscribed: false, verified: false }
    );

    await sendEmailNotification({ type: EMAIL_TYPES.EMAIL_VERIFICATION, recipients: [email] });

    return successResponse("Added item to the table and emailed!");
  } catch (err) {
    return errorResponse("Something went wrong!");
  }
}

export async function verifyEmail(code) {
  try {
    const email = deobfuscate(code);

    const isValid = isEmailValid(email);
    if (!isValid) return errorResponse("Email address is not valid!");

    await updateItemSet(dynamo, TABLE_NAMES.LEADS, { email_address: email }, { verified: true });
    return successResponse("Email verified!");
  } catch (err) {
    return errorResponse("Something went wrong!");
  }
}
