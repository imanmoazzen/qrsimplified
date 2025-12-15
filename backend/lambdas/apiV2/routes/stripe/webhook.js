import { CAMPAIGN_STATUS } from "../../../../../castofly-common/campaigns.js";
import { HTTP_STATUS_CODES } from "../../../../../castofly-common/commonConstants.js";
import { getProductByName } from "../../../../../castofly-common/purchases/products.js";
import { sortByCreationTime } from "../../../../../castofly-common/sort.js";
import { putItem, query, updateItemAdd, updateItemSet } from "../../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo } from "../../index.js";
import { getUserByEmail } from "../user.js";
import { getStripeObject } from "./utils.js";

export const HANDLED_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: "checkout.session.completed",
  CHARGE_REFUNDED: "charge.refunded",
};

const HANDLED_EVENT_NAMES = Object.values(HANDLED_EVENTS);
const successResponse = { statusCode: HTTP_STATUS_CODES.SUCCESS };
const failureResponse = { statusCode: HTTP_STATUS_CODES.SERVER_ERROR };
const clientErrorResponse = { statusCode: HTTP_STATUS_CODES.CLIENT_ERROR };

export async function webhook(exactRequestBody, signature) {
  try {
    if (!signature) return clientErrorResponse;

    const { stripe, STRIPE_WEBHOOK_SIGNING_KEY, env } = await getStripeObject();
    if (!stripe || !STRIPE_WEBHOOK_SIGNING_KEY) return clientErrorResponse;

    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(exactRequestBody, signature, STRIPE_WEBHOOK_SIGNING_KEY);
    } catch (err) {
      return clientErrorResponse;
    }

    const eventType = stripeEvent?.type;

    if (!eventType) throw new Error("Stripe event type is missing");
    if (!HANDLED_EVENT_NAMES.includes(eventType)) return successResponse;

    const object = stripeEvent.data.object;
    const customer = object?.customer ?? null;

    const purchase_id = await getPurchaseIdFromEvent(eventType, object);
    if (!purchase_id) return failureResponse;

    const email = await getEmailFromEvent(stripe, eventType, object);
    if (!email) return failureResponse;

    const user = await getUserByEmail(email);
    const user_id = user?.user_id;
    if (!user_id) return clientErrorResponse;

    const product_name = object?.metadata?.product_name;
    const price_id = object?.metadata?.price_id;
    const referrer_user_id = object?.metadata?.referrer_user_id;
    const coupon_id = object?.discounts?.[0]?.promotion_code;

    switch (eventType) {
      case HANDLED_EVENTS.CHECKOUT_SESSION_COMPLETED: {
        const payerFields = removeNullOrUndefined({
          customer,
          created: object?.created,
          amount_total: object?.amount_total,
          currency: object?.currency,
          product_name,
          price_id,
          coupon_id,
        });

        const product = getProductByName(product_name, env);
        const qr_credits = product?.units ?? 0;

        await Promise.all([
          updateItemSet(dynamo, TABLE_NAMES.PURCHASES, { user_id, purchase_id }, payerFields),
          updateItemAdd(dynamo, TABLE_NAMES.USER_DATA, { user_id }, { qr_credits }),
          updateTrialOrExpiredCampaign(user_id, qr_credits),
          referrer_user_id
            ? putItem(dynamo, TABLE_NAMES.REFERRAL_RECORDS, {
                referrer_user_id,
                purchase_id,
                referee_user_id: user_id,
                referee_display_name: user?.display_name,
              })
            : Promise.resolve(),
        ]);

        break;
      }

      case HANDLED_EVENTS.CHARGE_REFUNDED: {
        const cumulativeRefund = object?.amount_refunded;
        if (!cumulativeRefund) return successResponse;

        await updateItemSet(
          dynamo,
          TABLE_NAMES.PURCHASES,
          { user_id, purchase_id },
          removeNullOrUndefined({ amount_refunded: cumulativeRefund })
        );

        break;
      }

      default:
        console.warn(`Unhandled event type: ${eventType}`);
        break;
    }

    return successResponse;
  } catch (err) {
    return failureResponse;
  }
}

const updateTrialOrExpiredCampaign = async (user_id, qr_credits) => {
  const campaigns = await query(dynamo, TABLE_NAMES.CAMPAIGN_SOURCES, { user_id });
  const sortedCampaigns = sortByCreationTime(campaigns, true);

  let creditUsed = 0;

  for (const campaign of sortedCampaigns) {
    if (creditUsed >= qr_credits) break;

    const isUpgradable = campaign.status === CAMPAIGN_STATUS.TRIAL || campaign.status === CAMPAIGN_STATUS.EXPIRED;
    if (!isUpgradable) continue;

    await updateItemSet(
      dynamo,
      TABLE_NAMES.CAMPAIGN_SOURCES,
      { user_id, campaign_id: campaign.campaign_id },
      { status: CAMPAIGN_STATUS.LIVE }
    );

    creditUsed += 1;
  }
};

const getPurchaseIdFromEvent = async (eventType, object) => {
  switch (eventType) {
    case HANDLED_EVENTS.CHECKOUT_SESSION_COMPLETED:
    case HANDLED_EVENTS.CHARGE_REFUNDED:
      return object?.payment_intent ?? null;

    default:
      return null;
  }
};

const getEmailFromEvent = async (stripe, eventType, object) => {
  // checkout.session.completed
  if (eventType === HANDLED_EVENTS.CHECKOUT_SESSION_COMPLETED) {
    return (
      object?.customer_email ??
      object?.customer_details?.email ??
      object?.billing_details?.email ??
      (object?.customer ? await getCustomerEmail(stripe, object.customer) : null)
    );
  }

  // charge.refunded (object is Charge)
  if (eventType === HANDLED_EVENTS.CHARGE_REFUNDED) {
    const direct =
      object?.billing_details?.email ??
      object?.receipt_email ??
      (object?.customer ? await getCustomerEmail(stripe, object.customer) : null);

    if (direct) return direct;

    // fallback: load PaymentIntent and use its customer/email
    const piId = object?.payment_intent;
    if (!piId) return null;

    const pi = await stripe.paymentIntents.retrieve(piId);
    return pi?.receipt_email ?? (pi?.customer ? await getCustomerEmail(stripe, pi.customer) : null) ?? null;
  }

  return null;
};

const getCustomerEmail = async (stripe, customer) => {
  const customerInfo = await stripe.customers.retrieve(customer);
  return customerInfo?.email ?? null;
};

const removeNullOrUndefined = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null && value !== undefined));
