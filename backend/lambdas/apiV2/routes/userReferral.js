import { v4 as uuidv4 } from "uuid";

import { convertToHumanReadableDate } from "../../../../castofly-common/convertToHumanReadableDate.js";
import { BACKEND_CONFIG } from "../../../configurationConstants.js";
import { getItem, putItem, query, queryGSI, updateItemAdd } from "../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../config.js";
import { dynamo, ssmCache } from "../index.js";
import { errorResponse, successResponse } from "./standardResponses.js";
import { createCoupon } from "./stripe/coupons.js";
import { getPaymentInfo } from "./stripe/getPaymentInfo.js";
import { getUser } from "./user.js";

export const getReferralInfo = async (userId) => {
  try {
    const sources = await query(dynamo, TABLE_NAMES.REFERRAL_SOURCES, { user_id: userId });

    const isSourceAvailable = sources?.length > 0;
    const referral_id = isSourceAvailable ? sources[0].referral_id : uuidv4();

    const views = isSourceAvailable ? sources[0].views : 0;
    const coupon_code = sources[0]?.coupon_code;
    const stripeData = isSourceAvailable ? await getPaymentInfo(referral_id) : await createCoupon();
    const info = { referral_id, coupon_code, views, ...stripeData };

    if (!isSourceAvailable) await putItem(dynamo, TABLE_NAMES.REFERRAL_SOURCES, { user_id: userId, ...info });

    return successResponse("Successfully got the info", info);
  } catch (error) {
    return errorResponse(error.message);
  }
};

export const reportReferralView = async (userId, requestBody) => {
  try {
    const { referral_id } = requestBody;
    if (!referral_id) throw new Error("there is no refferal id!");

    const REFERRAL_ID_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.REFERRAL_ID_GSI);
    const sources = await queryGSI(dynamo, TABLE_NAMES.REFERRAL_SOURCES, { referral_id }, REFERRAL_ID_GSI);

    const source = sources?.length === 1 ? sources[0] : null;
    if (!source) throw new Error("this is not a valid referral id");

    await updateItemAdd(dynamo, TABLE_NAMES.REFERRAL_SOURCES, { user_id: source.user_id, referral_id }, { views: 1 });

    return successResponse("Successfully record a view", { isViewingOwnReferral: source.user_id === userId });
  } catch (error) {
    return errorResponse(error.message);
  }
};

export const reportReferralSignup = async (userId, requestBody) => {
  try {
    const { referral_id, referee_email } = requestBody;
    if (!referral_id || !referee_email) throw new Error("required parameters are missing!");

    const REFERRAL_ID_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.REFERRAL_ID_GSI);
    const sources = await queryGSI(dynamo, TABLE_NAMES.REFERRAL_SOURCES, { referral_id }, REFERRAL_ID_GSI);

    const source = sources?.length === 1 ? sources[0] : null;
    if (!source) throw new Error("this is not a valid referral id");
    if (source.user_id === userId) throw new Error("user cannot refer themselves");

    const [selfSources, referralUserInfo] = await Promise.all([
      query(dynamo, TABLE_NAMES.REFERRAL_SOURCES, { user_id: userId }),
      getUser(source.user_id),
    ]);

    const selfSource = selfSources?.length > 0 ? selfSources[0] : null;

    if (selfSource) {
      const circularItem = await getItem(dynamo, TABLE_NAMES.REFERRAL_RECORDS, {
        referral_id: selfSource.referral_id,
        referee_email: referralUserInfo.email,
      });

      if (circularItem) throw new Error("this is a circular referral");
    }

    const record = await getItem(dynamo, TABLE_NAMES.REFERRAL_RECORDS, {
      referral_id,
      referee_email,
    });

    if (record) throw new Error("this referral is already recorded");

    await putItem(dynamo, TABLE_NAMES.REFERRAL_RECORDS, {
      referral_id,
      referee_email,
      signup_date: convertToHumanReadableDate(Date.now() / 1000),
    });

    return successResponse("Successfully recorded a new referral");
  } catch (error) {
    return errorResponse(error.message);
  }
};
