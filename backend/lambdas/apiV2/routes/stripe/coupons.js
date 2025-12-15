import { getStripeObject } from "./utils.js";

export const getCouponByIdFromStripe = async (couponId) => {
  try {
    if (!couponId) return null;

    const { stripe } = await getStripeObject();
    if (!stripe) throw new Error("stripe cannot be instantiated");

    const promo = await stripe.promotionCodes.retrieve(couponId);
    return promo?.coupon || null;
  } catch (error) {
    return null;
  }
};

export const createCoupon = async (name, couponCode, metadata, discountPercentage = 20, maxRedemptions = 1) => {
  const { stripe } = await getStripeObject();

  const STRIPE_NAME_CHAR_LIMIT = 40;
  const couponName = name?.slice(0, STRIPE_NAME_CHAR_LIMIT) || generateRandomString(6);

  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
    name: couponName,
    metadata: metadata || {},
  });

  const customerFacingCode = couponCode || generateRandomString(6);

  const promotion = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: `${customerFacingCode}-SAVE${discountPercentage}`,
    max_redemptions: maxRedemptions,
  });

  return { coupon_id: coupon.id, coupon_code: promotion.code, promo_id: promotion.id };
};

const generateRandomString = (length) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};
