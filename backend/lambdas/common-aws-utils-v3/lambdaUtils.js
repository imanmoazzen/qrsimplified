import { InvokeCommand } from "@aws-sdk/client-lambda";

export async function invokeLambdaRoute(lambdaClient, lambdaName, route, payload, invokeSynchronously = true) {
  return await invokeLambda(lambdaClient, lambdaName, makeLambdaInvokePayload(payload, route), invokeSynchronously);
}

export async function invokeLambda(lambdaClient, lambdaName, payload, invokeSynchronously = true) {
  const cmd = new InvokeCommand({
    FunctionName: lambdaName,
    InvocationType: invokeSynchronously ? "RequestResponse" : "Event",
    LogType: "None",
    Payload: payload,
  });
  const invokeResponse = await lambdaClient.send(cmd);
  const payloadString = invokeResponse.Payload.transformToString();
  let res;
  try {
    res = JSON.parse(payloadString);
  } catch {
    return payloadString;
  }

  // some lambdas only return responses as proxy response objects; in that case we
  // want to return only the body of that lambda.
  if (res && res.body && res.statusCode && res.headers) {
    // `res` is probably a lambda proxy response; in that case, return the 'body'
    // or throw an error instead if there is one.
    if (res.FunctionError) throw Error(res.FunctionError);
    try {
      return JSON.parse(res.body);
    } catch {
      return res.body;
    }
  } else {
    return res;
  }
}

function makeLambdaInvokePayload(payload, route) {
  const invokePayload = {
    fromOtherLambda: true,
    payload: {
      route,
      ...payload,
    },
  };

  return JSON.stringify(invokePayload);
}
