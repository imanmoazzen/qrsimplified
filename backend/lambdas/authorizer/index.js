import { authorize } from "./authorize.js";

export const handler = async (event) => {
  let token;
  if (event?.headers?.authorization) token = event.headers.authorization;
  if (event?.headers?.Authorization) token = event.headers.Authorization;
  if (event?.queryStringParameters?.auth) token = event.queryStringParameters.auth;

  try {
    const payload = await authorize(token);
    const sub = payload.sub;
    // Returning a wildcard resource here as per: https://www.alexdebrie.com/posts/lambda-custom-authorizers/#caching-across-multiple-functions
    // Note that this MAY someday be an issue if we use this authorizer for more than just binary can/cannot access the api type logic.

    // Using "*" in the IAM policy will give a user that makes an authorized request the ability to follow that up with
    // a request that should be forbidden but won't be due to the cache. Currently, this isn't an issue because in our case, a
    // user either has access or they don't .. it's no more fine-grained than that.

    // If the situation where we need more fine grained control does arise, I think we'd need to create authorizers per role
    // and apply them to the endpoints where they are needed
    return {
      principalId: sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*",
          },
        ],
      },
    };
  } catch (err) {
    return {
      principalId: "none",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: event.methodArn,
          },
        ],
      },
    };
  }
};
