import { convertToHumanReadableDate } from "../../../../../castofly-common/convertToHumanReadableDate.js";
import { query } from "../../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo } from "../../index.js";
import { errorResponse, successResponse } from "../standardResponses.js";
import { getUserByEmail } from "../user.js";

// need more work

export async function getPaymentInfo(referral_id, user_id) {
  if (!referral_id) throw new Error("referral id is missing");

  try {
    const records = await query(dynamo, TABLE_NAMES.REFERRAL_RECORDS, { referral_id });

    const payments_info = [];
    if (records && records.length > 0) {
      for (const record of records) {
        const email = record?.referee_email;
        const user = await getUserByEmail(email);
        const user_id = user?.user_id;
        if (!user_id) continue;

        const allSubscriptionRecords = await query(dynamo, TABLE_NAMES.PURCHASES, { user_id });

        for (const subscriptionRecord of allSubscriptionRecords) {
          const { created, amount_paid = 0, amount_refunded = 0, quantity = 0 } = subscriptionRecord;
          // const isActive = isSubscriptionActive(subscriptionRecord);
          const isActive = true;
          const revenue = (amount_paid - amount_refunded) / 100;
          const subscriptionStartDate = convertToHumanReadableDate(created);
          // const subscriptionEndDate = convertToHumanReadableDate(getSubscriptionExpiryTime(subscriptionRecord));
          const subscriptionEndDate = convertToHumanReadableDate(created);
          const signupDate = record?.signup_date || null;

          payments_info.push({
            revenue,
            subscriptionStartDate,
            subscriptionEndDate,
            isActive,
            quantity,
            signupDate,
            email,
          });
        }
      }
    }

    return successResponse("payment info success", { payments_info });
  } catch (error) {
    return errorResponse(`payment info failed for ${user_id}`);
  }
}
