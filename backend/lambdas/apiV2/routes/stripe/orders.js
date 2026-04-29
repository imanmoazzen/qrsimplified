import { sortByCreationTime } from "../../../../../castofly-common/sort.js";
import { query } from "../../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo } from "../../index.js";
import { errorResponse, successResponse } from "../standardResponses.js";

export async function getPastOrders(user_id) {
  try {
    const items = await query(dynamo, TABLE_NAMES.PURCHASES, { user_id });
    const orders = sortByCreationTime(items, true);

    return successResponse("Purchases feteched.", { orders });
  } catch (error) {
    return errorResponse("Cannot fetch orders for this user.");
  }
}
