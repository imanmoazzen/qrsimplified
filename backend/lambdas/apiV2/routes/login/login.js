import { sign, verify } from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { v4 as uuidv4 } from "uuid";

import { EMAIL_TYPES, LOGIN_ERROR } from "../../../../../castofly-common/commonConstants.js";
import { getItem, putItem } from "../../../common-aws-utils-v3/dynamoUtils.js";
import { TABLE_NAMES } from "../../config.js";
import { dynamo } from "../../index.js";
import { sendEmailNotification } from "../email/sendEmailNotification.js";
import { errorResponse, successResponse } from "../standardResponses.js";

const ANON_TOKEN_SECRET = "9f3c6b7e-2a41-4d9b-8f5e-1c7a3e92d6b4";
const PASSWORDLESS_LOGIN_SECRET = "3f8c7a5e-2d4b-4c9a-9f6e-1b7d3a92e5c1";

export async function getAnonymousToken() {
  const tokenPayload = {
    sub: uuidv4(),
    isAnonymous: true,
  };

  const newToken = sign(tokenPayload, ANON_TOKEN_SECRET);

  await putItem(dynamo, TABLE_NAMES.ANONYMOUS_USERS, {
    anonymous_user_id: tokenPayload.sub,
    creation_date: new Date().toISOString(),
  });

  return successResponse("Generated new token.", { token: newToken });
}

export async function convert(anonymousToken, userId) {
  const anonUserId = verify(anonymousToken, ANON_TOKEN_SECRET)?.sub;
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

  return successResponse("user conversion was successful");
}

export const generateLoginCode = async (email) => {
  try {
    if (!email) throw new Error(LOGIN_ERROR.EMAIL_MISSING);

    const normalizedEmail = email.trim().toLowerCase();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = _getCodeHash(normalizedEmail, code);

    const now = Date.now();
    const codeExpiryTimeInMins = 20;
    const expiresAt = Math.floor((now + codeExpiryTimeInMins * 60 * 1000) / 1000);

    await putItem(dynamo, TABLE_NAMES.PASSWORDLESS_CODES, {
      email: normalizedEmail,
      codeHash,
      createdAt: now,
      expiresAt,
    });

    await sendEmailNotification({
      type: EMAIL_TYPES.USER_FEEDBACK,
      recipients: [normalizedEmail],
      message: `Your login code is: ${code}. It will expire in ${codeExpiryTimeInMins} minutes.`,
      subject: `${code} - QR Simplified Verification`,
    });

    return successResponse("Verification code sent!");
  } catch (err) {
    return errorResponse("Failed to send verification code.");
  }
};

export const verifyLoginCode = async (email, code) => {
  try {
    if (!email) throw new Error(LOGIN_ERROR.EMAIL_MISSING_VERIFICATION);
    if (!code) throw new Error(LOGIN_ERROR.CODE_MISSING);

    const normalizedEmail = email.trim().toLowerCase();

    const item = await getItem(dynamo, TABLE_NAMES.PASSWORDLESS_CODES, { email: normalizedEmail });
    if (!item) throw new Error(LOGIN_ERROR.EMAIL_NOT_SET);

    const now = Date.now();
    const nowInSecs = Math.floor(now / 1000);
    if (item.expiresAt < nowInSecs) throw new Error(LOGIN_ERROR.CODE_EXPIRED);

    const incomingHash = _getCodeHash(normalizedEmail, code);
    if (incomingHash !== item.codeHash) throw new Error(LOGIN_ERROR.CODE_INCORRECT);

    // await deleteItem(dynamo, TABLE_NAMES.PASSWORDLESS_CODES, { email: normalizedEmail });

    const sessionExpiryTimeInDays = 30;
    const accessTokenExpiryInSecs = 60 * 60; // 1 hour
    const refreshTokenExpiryInSecs = 60 * 60 * 24 * sessionExpiryTimeInDays;

    const sessionId = randomBytes(32).toString("base64url");
    const refreshToken = randomBytes(32).toString("base64url");
    const refreshTokenHash = _getHashToken(refreshToken);

    const accessToken = sign(
      {
        sessionId,
        email: normalizedEmail,
        exp: nowInSecs + accessTokenExpiryInSecs,
      },
      PASSWORDLESS_LOGIN_SECRET
    );

    await putItem(dynamo, TABLE_NAMES.PASSWORDLESS_SESSIONS, {
      sessionId,
      email: normalizedEmail,
      refreshTokenHash,
      createdAt: now,
      expiresAt: nowInSecs + refreshTokenExpiryInSecs,
      revoked: false,
    });

    return {
      statusCode: 200,
      multiValueHeaders: {
        "Set-Cookie": [
          `accessToken=${accessToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${accessTokenExpiryInSecs}`,
          `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${refreshTokenExpiryInSecs}`,
        ],
      },
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": "true",
      },
      body: JSON.stringify({
        success: true,
        message: "Session created!",
      }),
    };
  } catch (err) {
    return errorResponse(err?.message ?? "Something went wrong during code verification. Please try again.");
  }
};

const _getCodeHash = (email, code) =>
  createHash("sha256").update(`${email}:${code}:${PASSWORDLESS_LOGIN_SECRET}`).digest("hex");
const _getHashToken = (token) => createHash("sha256").update(`${token}:${PASSWORDLESS_LOGIN_SECRET}`).digest("hex");
