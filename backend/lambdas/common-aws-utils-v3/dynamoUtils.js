import {
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { getProjectionExpressionProps, getUpdateExpressionProps } from "./expressionUtils.js";

export const translateConfig = {
  marshallOptions: {
    removeUndefinedValues: true,
  },
};

export async function query(dynamoDocClient, tableName, queryKey, includeKeys = undefined, extraParams = {}) {
  const keys = Object.keys(queryKey);
  const values = Object.values(queryKey);

  const expressions = keys.map(
    (key, index) => `${key} = :param${index + 1}${index !== keys.length - 1 ? " and " : ""}`
  );
  const keysExpression = expressions.join("");
  const keysValue = {};
  values.forEach((value, index) => (keysValue[`:param${index + 1}`] = value));

  const peParams = getProjectionExpressionProps(includeKeys);
  if (peParams?.ProjectionExpression) {
    extraParams.ProjectionExpression = peParams.ProjectionExpression;
    let eaNames = peParams.ExpressionAttributeNames;
    if (extraParams.ExpressionAttributeNames) eaNames = { ...eaNames, ...extraParams.ExpressionAttributeNames };
    if (Object.keys(eaNames).length > 0) extraParams.ExpressionAttributeNames = eaNames;
  }

  return await dePaginatedQuery(dynamoDocClient, {
    TableName: tableName,
    KeyConditionExpression: keysExpression,
    ExpressionAttributeValues: keysValue,
    ...extraParams,
  });
}

export async function queryLimitedItems(dynamoDocClient, tableName, key, value, limit, lastKey) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: `${key} = :pid`,
    ExpressionAttributeValues: { ":pid": value },
    Limit: limit,
    ScanIndexForward: false, // newest first
    ExclusiveStartKey: lastKey || undefined,
  };

  const result = await dynamoDocClient.send(new QueryCommand(params));

  return {
    items: result.Items,
    nextKey: result.LastEvaluatedKey || null,
  };
}

export async function queryGSI(dynamoDocClient, tableName, queryKey, gsi) {
  return await query(dynamoDocClient, tableName, queryKey, undefined, { IndexName: gsi });
}

async function dePaginatedQuery(dynamoDocClient, queryParams) {
  const resultArrays = [];
  let cmd = new QueryCommand(queryParams);
  let result = await dynamoDocClient.send(cmd);
  resultArrays.push(result.Items);
  while (result.LastEvaluatedKey) {
    cmd = new QueryCommand({ ...queryParams, ExclusiveStartKey: result.LastEvaluatedKey });
    result = await dynamoDocClient.send(cmd);
    resultArrays.push(result.Items);
  }
  return [].concat(...resultArrays);
}

const DB_MAX_RETRIES = 5;
const DB_EXPONENTIAL_BACKOFF_BASE_DELAY_MS = 500;
const DB_EXPONENTIAL_BACKOFF_BASE_MULTIPLIER = 2;

async function paginatedBatchWrite(dynamoDocClient, batchWriteEntries, tableName) {
  if (batchWriteEntries.length === 0) return;

  const makePromises = (newEntries) => {
    const batchWriteArrays = [];
    while (newEntries.length > 0) {
      batchWriteArrays.push(newEntries.splice(0, 25));
    }
    return batchWriteArrays.map((array) => {
      return dynamoDocClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: array,
          },
        })
      );
    });
  };

  let batchWritePromises = makePromises(batchWriteEntries);
  let tries = 0;
  do {
    if (tries > 0) {
      await sleep(DB_EXPONENTIAL_BACKOFF_BASE_DELAY_MS * DB_EXPONENTIAL_BACKOFF_BASE_MULTIPLIER ** tries);
    }
    tries++;
    const batchWriteResults = await Promise.all(batchWritePromises);
    const unprocessedEntries = batchWriteResults
      .filter((data) => data.UnprocessedItems?.[tableName]?.length > 0)
      .map((data) => data.UnprocessedItems[tableName])
      .flat();
    batchWritePromises = makePromises(unprocessedEntries);
  } while (batchWritePromises.length > 0 && tries < DB_MAX_RETRIES);

  return;
}

export async function batchPutItems(dynamoDocClient, tableName, items) {
  const batchWriteEntries = items.map((item) => {
    return {
      PutRequest: {
        Item: item,
      },
    };
  });
  return await paginatedBatchWrite(dynamoDocClient, batchWriteEntries, tableName);
}

export async function batchDeleteItems(dynamoDocClient, tableName, keyObjects) {
  const batchWriteEntries = keyObjects.map((keyObject) => {
    return {
      DeleteRequest: {
        Key: keyObject,
      },
    };
  });
  return await paginatedBatchWrite(dynamoDocClient, batchWriteEntries, tableName);
}

export async function updateItemSet(dynamoDocClient, tableName, key, fieldsToSet, returnValues = "ALL_NEW") {
  const cmd = new UpdateCommand({
    TableName: tableName,
    Key: key,
    ...getUpdateExpressionProps("SET", fieldsToSet),
    ReturnValues: returnValues,
  });
  const response = await dynamoDocClient.send(cmd);
  return response.Attributes;
}

// e.g. updateItemAdd(dynamo, "SAMPLE_TABLE", { object_id: "abcd1234" }, { likes: 5 })
// would add 5 to whatever the current value of the entry is
export async function updateItemAdd(dynamoDocClient, tableName, key, fieldsToUpdate, returnValues = "ALL_NEW") {
  const response = await dynamoDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key,
      ...getUpdateExpressionProps("ADD", fieldsToUpdate),
      ReturnValues: returnValues,
    })
  );
  return response.Attributes;
}

// e.g. updateItemDelete(dynamo, "SAMPLE_TABLE", { object_id: "abcd1234" }, [attribute_name])
// would remove attribute_name
export async function updateItemDelete(dynamoDocClient, tableName, key, attributesToDelete) {
  if (!attributesToDelete || attributesToDelete.length === 0) {
    throw new Error("No attributes specified for deletion.");
  }
  const ExpressionAttributeNames = {};
  attributesToDelete.forEach((key, index) => {
    ExpressionAttributeNames["#k" + index] = key;
  });
  const updateExpression = `REMOVE ${Object.keys(ExpressionAttributeNames).join(",")}`;
  return await dynamoDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames,
      ReturnValues: "ALL_NEW",
    })
  );
}

export async function putItem(dynamoDbDocClient, tableName, item) {
  const cmd = new PutCommand({
    Item: item,
    TableName: tableName,
  });
  return await dynamoDbDocClient.send(cmd);
}

export async function deleteItem(dynamoDocClient, tableName, keyObject) {
  const cmd = new DeleteCommand({
    TableName: tableName,
    Key: keyObject,
  });
  return await dynamoDocClient.send(cmd);
}

export async function getItem(dynamoDocClient, tableName, keyObject, includeKeys = undefined) {
  const cmd = new GetCommand({
    TableName: tableName,
    Key: keyObject,
    ...getProjectionExpressionProps(includeKeys),
  });
  const response = await dynamoDocClient.send(cmd);
  return response.Item;
}

// dynamo.batchGet takes up to 100 keys at a time and returns a result which may or may not be paginated
// this function splits it up into multiple requests if necessary and depaginates the results.
// If the logic here is confusing; this has similar control flow to paginatedBatchWrite with something like depaginatedQuery in each promise.
export async function batchGet(dynamoDocClient, tableName, keys, includeKeys = undefined) {
  if (keys.length === 0) return [];
  const keysArrays = [];
  while (keys.length > 0) {
    keysArrays.push(keys.splice(0, 100));
  }
  const batchGetPromises = keysArrays.map(async (keyArray) => {
    let cmd = new BatchGetCommand({
      RequestItems: {
        [tableName]: {
          Keys: keyArray,
          ...getProjectionExpressionProps(includeKeys),
        },
      },
    });
    let batchGetRes = await dynamoDocClient.send(cmd);
    const resultArrays = [batchGetRes.Responses[tableName]];

    while (batchGetRes.UnprocessedKeys.length > 0) {
      cmd = new BatchGetCommand({
        RequestItems: {
          [tableName]: {
            Keys: batchGetRes.UnprocessedKeys,
            ...getProjectionExpressionProps(includeKeys),
          },
        },
      });
      batchGetRes = await dynamoDocClient.send(cmd);
      resultArrays.push(batchGetRes.Responses[tableName]);
    }

    return resultArrays.flat();
  });

  return (await Promise.all(batchGetPromises)).flat();
}

export async function scanReturnAll(dynamo, tableName) {
  const resultArrays = [];

  const params = { TableName: tableName };
  let queryRes;
  do {
    queryRes = await dynamo.scan(params).promise();
    resultArrays.push(queryRes.Items);
    params.ExclusiveStartKey = queryRes.LastEvaluatedKey;
  } while (queryRes.LastEvaluatedKey);

  return resultArrays.flat();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
