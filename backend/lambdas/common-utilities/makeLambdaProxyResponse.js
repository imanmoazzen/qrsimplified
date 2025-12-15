function makeLambdaProxyResponse(body, statusCode) {
  return {
    body: typeof body === "string" ? body : JSON.stringify(body), // body must be a string, stringify it if it isn't.
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "ANY",
    },
  };
}

export default makeLambdaProxyResponse;
