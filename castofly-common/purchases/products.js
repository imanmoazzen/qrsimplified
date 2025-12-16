import { STRIPE_ENV_IN_SECRET_MANAGER } from "./stripe.js";

export const PRODUCT_NAMES = {
  SINGLE: "SINGLE",
  TEN: "TEN",
  HUNDRED: "HUNDRED",
};

const UNITS = {
  [PRODUCT_NAMES.SINGLE]: 1,
  [PRODUCT_NAMES.TEN]: 10,
  [PRODUCT_NAMES.HUNDRED]: 100,
};

export const PRODUCTS = [
  {
    name: PRODUCT_NAMES.SINGLE,
    displayName: "One QR Code",
    units: UNITS[PRODUCT_NAMES.SINGLE],
    amount: 29,
    priceIds: {
      [STRIPE_ENV_IN_SECRET_MANAGER.DEV]: "price_1Sdd9mE3d2sGycgE8YJoaSqz",
      [STRIPE_ENV_IN_SECRET_MANAGER.PROD]: "price_1SdxcwA1TPo8c24y48KUImjH",
    },
  },
  {
    name: PRODUCT_NAMES.TEN,
    displayName: "Pack of 10",
    units: UNITS[PRODUCT_NAMES.TEN],
    amount: 129,
    priceIds: {
      [STRIPE_ENV_IN_SECRET_MANAGER.DEV]: "price_1SddCTE3d2sGycgEE2WFG4Ys",
      [STRIPE_ENV_IN_SECRET_MANAGER.PROD]: "price_1SdxdGA1TPo8c24yLgigjOjP",
    },
  },
  {
    name: PRODUCT_NAMES.HUNDRED,
    displayName: "Pack of 100",
    units: UNITS[PRODUCT_NAMES.HUNDRED],
    amount: 499,
    priceIds: {
      [STRIPE_ENV_IN_SECRET_MANAGER.DEV]: "price_1SddDzE3d2sGycgEX6Arok68",
      [STRIPE_ENV_IN_SECRET_MANAGER.PROD]: "price_1SdxddA1TPo8c24y9JxeZy8S",
    },
  },
];

export const getProductByName = (name, env) => {
  const product = PRODUCTS.find((price) => price.name === name);
  const priceId = env ? product?.priceIds?.[env] : null;

  return { ...product, priceId };
};

export const getFeatures = (name) => {
  const product = PRODUCTS.find((price) => price.name === name);
  const units = product?.units ?? 1;
  const label = units > 1 ? "Lifetime QR Codes" : "Lifetime QR Code";

  return [
    { text: `${units} ${label}`, icon: "qr_code_2" },
    { text: "Custom Branding", icon: "colors" },
    { text: "Advanced Tracking", icon: "show_chart" },
    { text: "Ultra-Sharp for Printing", icon: "print" },
  ];
};
