import appSettings from "../../frontend/src/appSettings.js";
import { PRODUCT_NAMES } from "./products.js";
import { STRIPE_ENV_IN_SECRET_MANAGER } from "./stripe.js";

export const COUPON_NAMES = {
  SEASONAL_OFFER: "SEASONAL_OFFER",
};

export const ACTIVE_COUPON_NAME = COUPON_NAMES.SEASONAL_OFFER;

export const COUPONS = {
  [COUPON_NAMES.SEASONAL_OFFER]: {
    metaData: {
      message: "LIMITED HOLIDAY OFFER",
      icon: "featured_seasonal_and_gifts",
      endDate: "2025-08-31T23:59:59",
    },
    details: [
      {
        productName: PRODUCT_NAMES.SINGLE,
        discountAmount: 5,
        couponIds: {
          [STRIPE_ENV_IN_SECRET_MANAGER.DEV]: "promo_1SeAY7E3d2sGycgE16dHgLte",
          [STRIPE_ENV_IN_SECRET_MANAGER.PROD]: "promo_1SemWuA1TPo8c24y3vUhYKF0",
        },
      },
      {
        productName: PRODUCT_NAMES.TEN,
        discountAmount: 30,
        couponIds: {
          [STRIPE_ENV_IN_SECRET_MANAGER.DEV]: "promo_1Se0wCE3d2sGycgE2Iu56hHz",
          [STRIPE_ENV_IN_SECRET_MANAGER.PROD]: "promo_1SemXvA1TPo8c24yvXnMAAKd",
        },
      },
      {
        productName: PRODUCT_NAMES.HUNDRED,
        discountAmount: 100,
        couponIds: {
          [STRIPE_ENV_IN_SECRET_MANAGER.DEV]: "promo_1Se13ZE3d2sGycgEtKVq6og9",
          [STRIPE_ENV_IN_SECRET_MANAGER.PROD]: "promo_1SemZ6A1TPo8c24y9tO9pl8V",
        },
      },
    ],
  },
};

export const getCoupon = (couponName, productName, env) => {
  if (!couponName) return null;

  const { metaData, details } = COUPONS[couponName] ?? {};
  const info = details?.find((item) => item.productName === productName);

  return { ...metaData, discountAmount: info?.discountAmount, couponId: info?.couponIds?.[env] };
};
