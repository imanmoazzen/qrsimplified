import { sendEmailNotification } from "./email/sendEmailNotification.js";
import { getReferralInfo } from "./referral.js";
import { getUserInfo, sendSMS, setUserInfo, updateUserInfo, verifyClientEmail } from "./user.js";

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
    default: {
      throw new Error("Route is defined in API Gateway but unknown to lambda function");
    }
  }
}
