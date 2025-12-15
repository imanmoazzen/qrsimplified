import { sign, verify } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { putItem, updateItemSet } from "../../common-aws-utils-v3/dynamoUtils.js";
import { getSecret } from "../../common-aws-utils-v3/secretsManagerUtils.js";
import { TABLE_NAMES } from "../config.js";
import { dynamo, secretsManager } from "../index.js";
import { errorResponse, successResponse } from "./standardResponses.js";

export async function getAnonymousToken() {
  const tokenPayload = {
    sub: uuidv4(),
    isAnonymous: true,
  };

  const ANON_TOKEN_SECRET = await getSecret(secretsManager, process.env.ANON_TOKEN_SECRET_ARN);
  const newToken = sign(tokenPayload, ANON_TOKEN_SECRET);

  await putItem(dynamo, TABLE_NAMES.ANONYMOUS_USERS, {
    anonymous_user_id: tokenPayload.sub,
    creation_date: new Date().toISOString(),
  });

  return successResponse("Generated new token.", { token: newToken });
}

async function verifyAnonymousToken(anonymousToken) {
  const ANON_TOKEN_SECRET = await getSecret(secretsManager, process.env.ANON_TOKEN_SECRET_ARN);
  return verify(anonymousToken, ANON_TOKEN_SECRET);
}

export async function migrateAnonTokenProjects(anonymousToken, userId) {
  const anonUserId = (await verifyAnonymousToken(anonymousToken)).sub;
  if (!anonUserId) return errorResponse("Anonymous user id is missing.");

  await updateItemSet(
    dynamo,
    TABLE_NAMES.ANONYMOUS_USERS,
    { anonymous_user_id: anonUserId },
    {
      migration_date: new Date().toISOString(),
      migrated_to_user_id: userId,
    }
  );

  return successResponse("Migration was successful");
}
