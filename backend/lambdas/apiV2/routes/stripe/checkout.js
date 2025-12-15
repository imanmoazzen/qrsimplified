import { ACTIVE_COUPON_NAME, getCoupon } from "../../../../../castofly-common/purchases/coupons.js";
import { getProductByName } from "../../../../../castofly-common/purchases/products.js";
import { errorResponse, successResponse } from "../standardResponses.js";
import { getUser } from "../user.js";
import { getCouponByIdFromStripe } from "./coupons.js";
import { getStripeObject } from "./utils.js";

export async function checkout(requestBody, user_id) {
  try {
    if (!user_id) throw new Error("userId is missing");

    const { stripe, env } = await getStripeObject();
    if (!stripe || !env) throw new Error("stripe cannot be instantiated");

    const { productName, success_url, cancel_url, referral_id } = requestBody;
    if (!productName) throw new Error("product name is missing");

    const product = getProductByName(productName, env);
    const priceId = product?.priceId;
    if (!priceId) throw new Error("priceId is missing");

    let promotion_code;
    if (ACTIVE_COUPON_NAME) {
      const coupon = getCoupon(ACTIVE_COUPON_NAME, productName, env);

      if (coupon) {
        const stripeCoupon = await getCouponByIdFromStripe(coupon.couponId);
        if (stripeCoupon) promotion_code = coupon.couponId;
      }
    }

    const user = await getUser(user_id);
    const email = user?.email;
    if (!email) throw new Error("Email is missing for this user");

    const portalSession = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      mode: "payment",
      metadata: { product_name: productName, price_id: priceId, referral_id },
      ...(promotion_code && { discounts: [{ promotion_code }] }),
      success_url,
      cancel_url,
    });

    return successResponse("checkout was successful", { url: portalSession.url });
  } catch (err) {
    console.log("erorr", err);
    return errorResponse(`checkout failed for ${user_id}: ${err?.message}`);
  }
}
