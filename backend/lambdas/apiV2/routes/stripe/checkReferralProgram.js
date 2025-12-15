import { convertToHumanReadableDate } from "../../../../../castofly-common/convertToHumanReadableDate.js";
import { BACKEND_CONFIG } from "../../../../configurationConstants.js";
import { batchDeleteItems, putItem, queryGSI } from "../../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo, ssmCache } from "../../index.js";

export const checkReferralProgram = async (userId, email, coupon_id) => {
  if (!coupon_id) return;

  const REFERRAL_COUPON_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.REFERRAL_COUPON_GSI);
  const sources = await queryGSI(dynamo, TABLE_NAMES.REFERRAL_SOURCES, { coupon_id }, REFERRAL_COUPON_GSI);

  const source = sources?.length > 0 ? sources[0] : null;
  if (!source) return;

  const isSelfCouponCodeUsed = source.user_id === userId;
  if (isSelfCouponCodeUsed) return;

  const referral_id = source.referral_id;

  const REFERRAL_EMAIL_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.REFERRAL_EMAIL_GSI);
  const records = await queryGSI(dynamo, TABLE_NAMES.REFERRAL_RECORDS, { referee_email: email }, REFERRAL_EMAIL_GSI);

  const outdatedReferrals = records.filter((record) => record.referral_id !== referral_id);

  const outdatedKeys = outdatedReferrals.map((record) => ({
    referral_id: record.referral_id,
    referee_email: email,
  }));
  await batchDeleteItems(dynamo, TABLE_NAMES.REFERRAL_RECORDS, outdatedKeys);

  const currentReferral = records.find((record) => record.referral_id === referral_id);
  if (currentReferral) return;

  await putItem(dynamo, TABLE_NAMES.REFERRAL_RECORDS, {
    referral_id,
    referee_email: email,
    signup_date: convertToHumanReadableDate(Date.now() / 1000),
  });
};
