import Stripe from "stripe";

import { BACKEND_CONFIG } from "../../../../configurationConstants.js";
import { ENVS } from "../../../../lib/constants.js";
import { getSecret } from "../../../common-aws-utils-v3/secretsManagerUtils.js";
import { secretsManager, ssmCache } from "../../index.js";

export const getStripeObject = async () => {
  const arn = await ssmCache.getValue(BACKEND_CONFIG.SECRETS.STRIPE_API_SECRET_ARN);
  const secret = await getSecret(secretsManager, arn);

  const stripe = new Stripe(secret.api);

  const STRIPE_WEBHOOK_SIGNING_KEY =
    process.env.ENVIRONMENT === ENVS.development
      ? await ssmCache.getValue(BACKEND_CONFIG.STRIPE.SIGNING_KEY)
      : secret.webhook;

  return { stripe, STRIPE_WEBHOOK_SIGNING_KEY, env: secret.env };
};
