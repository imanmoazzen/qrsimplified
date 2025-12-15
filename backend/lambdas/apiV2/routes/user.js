import { GetIdentityVerificationAttributesCommand, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses";
import { PublishCommand } from "@aws-sdk/client-sns";
import sanitize from "sanitize-html";

import { BACKEND_CONFIG } from "../../../configurationConstants.js";
import { putItem, updateItemSet } from "../../common-aws-utils-v3/dynamoUtils.js";
import { memoizedGetItem, memoizedQueryGSI } from "../../common-aws-utils-v3/memoizedDynamoUtils.js";
import { clearPromiseMemoizerCache } from "../../common-utilities/promiseMemoizer.js";
import { TABLE_NAMES, TABLE_PRIMARY_KEYS } from "../config.js";
import { dynamo, ses, sns, ssmCache } from "../index.js";
import { errorResponse, successResponse } from "./standardResponses.js";

export async function getUserInfo(userId) {
  try {
    const user = await getUser(userId);

    return successResponse("Successfully got user attributes and subscription info", {
      user,
      isAuthenticated: true,
      isAnonymous: false,
    });
  } catch (err) {
    return errorResponse("Failed to get user attributes");
  }
}

export async function setUserInfo(userId, info) {
  try {
    const { display_name, signature, user_uploaded_picture } = info;
    if (!display_name) throw new Error("Display name cannot be empty.");
    const sanitizedDisplayName = sanitize(display_name, { allowedTags: [], allowedAttributes: [] });

    const oldUserInfo = await getUser(userId);
    const newUserInfo = {
      ...oldUserInfo,
      display_name: sanitizedDisplayName,
      signature,
      ...(user_uploaded_picture && { user_uploaded_picture }),
    };

    await putItem(dynamo, TABLE_NAMES.USER_DATA, newUserInfo);
    clearPromiseMemoizerCache();
    return successResponse("Successfully set user info.");
  } catch (err) {
    return errorResponse(err?.message || "Failed to set user.");
  }
}

export async function updateUserInfo(userId, fieldsToSet) {
  try {
    await updateItemSet(dynamo, TABLE_NAMES.USER_DATA, { user_id: userId }, fieldsToSet);
    clearPromiseMemoizerCache();
    return successResponse("Successfully updated user.");
  } catch (err) {
    return errorResponse(err?.message || "Failed to update user.");
  }
}

export async function getUser(userId) {
  return await memoizedGetItem(dynamo, TABLE_NAMES.USER_DATA, { user_id: userId });
}

export async function getUserByEmail(email) {
  const USER_DATA_EMAIL_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.USER_DATA_EMAIL_GSI);

  const res = await memoizedQueryGSI(
    dynamo,
    TABLE_NAMES.USER_DATA,
    TABLE_PRIMARY_KEYS.USER_DATA,
    { email },
    USER_DATA_EMAIL_GSI
  );

  return res.length > 0 ? res[0] : undefined;
}

export async function verifyClientEmail(user_id) {
  try {
    const user = await getUser(user_id);
    if (!user) throw new Error("user doesn't exist!");

    const { email, email_verified } = user;
    if (email_verified) return successResponse(`Email is already verified`, { isVerified: true });

    const isVerified = await getClientEmailStatus(email);

    if (isVerified) {
      await updateItemSet(dynamo, TABLE_NAMES.USER_DATA, { user_id }, { email_verified: true });
      return successResponse(`Email is already verified`, { isVerified: true });
    }

    const cmd = new VerifyEmailIdentityCommand({ EmailAddress: email });
    await ses.send(cmd);
    return successResponse(`Verification email sent.`, { isVerified: false });
  } catch (err) {
    return errorResponse(err.message);
  }
}

async function getClientEmailStatus(email) {
  try {
    const cmd = new GetIdentityVerificationAttributesCommand({ Identities: [email] });
    const res = await ses.send(cmd);
    const attr = res.VerificationAttributes[email];

    return attr?.VerificationStatus === "Success";
  } catch (err) {
    return false;
  }
}

export async function sendSMS(message) {
  try {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: "+12508858164",
    });

    await sns.send(command);

    return successResponse("sms sent");
  } catch (err) {
    return errorResponse(err.message);
  }
}
