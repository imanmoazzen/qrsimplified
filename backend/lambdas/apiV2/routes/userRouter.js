import { sendEmailNotification } from "./email/sendEmailNotification.js";
import { getUserInfo, sendSMS, setUserInfo, updateUserInfo, verifyClientEmail } from "./user.js";
import { getReferralInfo, reportReferralSignup, reportReferralView } from "./userReferral.js";

export default async function userRouter(routeKey, requestBody, pathParameters, userId) {
  switch (routeKey) {
    case "GET /user/info": {
      return await getUserInfo(userId);
    }
    case "PUT /user/info": {
      return await setUserInfo(userId, requestBody);
    }
    case "POST /user/updateInfo": {
      return await updateUserInfo(userId, requestBody);
    }
    case "POST /user/message/verifyEmail": {
      return await verifyClientEmail(userId);
    }
    case "POST /user/message/sendEmail": {
      return await sendEmailNotification(requestBody);
    }
    case "POST /user/message/sendSMS": {
      const { message } = requestBody;
      return await sendSMS(message);
    }
    case "GET /user/referral/info": {
      return await getReferralInfo(userId);
    }
    case "POST /user/referral/create": {
      // No usage for now as the creation will happen when getting info (if nothing exist)
      break;
    }
    case "PUT /user/referral/view": {
      return await reportReferralView(userId, requestBody);
    }
    case "POST /user/referral/signup": {
      return await reportReferralSignup(userId, requestBody);
    }
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
