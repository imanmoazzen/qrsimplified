import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { verify } from "jsonwebtoken";

import getJWTPayload from "../../../castofly-common/getJWTPayload.js";
import { getSecret } from "../common-aws-utils-v3/secretsManagerUtils.js";

const COGNITO_USER_POOL_ID = process.env.USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.USER_POOL_CLIENT_ID;

const region = process.env.AWS_REGION;
const secretsManager = new SecretsManagerClient({ region });

export async function authorize(token) {
  const payload = getJWTPayload(token);

  if (payload.isAnonymous) {
    const ANON_TOKEN_SECRET = await getSecret(secretsManager, process.env.ANON_TOKEN_SECRET_ARN);
    return verify(token, ANON_TOKEN_SECRET, { ignoreExpiration: true });
  } else {
    const verifier = new CognitoJwtVerifier({
      userPoolId: COGNITO_USER_POOL_ID,
      tokenUse: "access",
      clientId: COGNITO_CLIENT_ID,
    });
    return await verifier.verify(token);
  }
}
