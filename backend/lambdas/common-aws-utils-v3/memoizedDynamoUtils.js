import { getHashForContent } from "../common-utilities/hashingUtils.js";
import { addMemoEntry, promiseMemoizer } from "../common-utilities/promiseMemoizer.js";
import { batchGet, getItem, query } from "./dynamoUtils.js";
import { getProjectionExpressionProps } from "./expressionUtils.js";

// memoizedQuery and memoizedQueryGSI also take an array of primary key names
// so that the results of the query can be memoized for subsequent getItem calls.

export async function memoizedQuery(
  dynamo,
  tableName,
  primaryKeyNames,
  queryKey,
  includeKeys = undefined,
  extraParams = {}
) {
  const memoKeyParts = ["query", tableName, ...Object.values(queryKey)];
  const projectionExpression = getProjectionExpressionProps(includeKeys)?.ProjectionExpression;
  if (projectionExpression) memoKeyParts.push(projectionExpression);
  const memoKey = memoKeyParts.join("-");

  return await promiseMemoizer(async () => {
    const items = await query(dynamo, tableName, queryKey, includeKeys, extraParams);
    items.forEach((item) => {
      const itemKeys = primaryKeyNames.map((key) => item[key]);
      const memoKeyParts = ["getItem", tableName, ...itemKeys];
      if (projectionExpression) memoKeyParts.push(projectionExpression);
      const memoKey = memoKeyParts.join("-");
      addMemoEntry(item, memoKey);
    });
    return items;
  }, memoKey);
}

export async function memoizedQueryGSI(dynamo, tableName, primaryKeyNames, queryKey, gsi, includeKeys = undefined) {
  const memoKeyParts = ["queryGSI", tableName, gsi, ...Object.values(queryKey)];
  const projectionExpression = getProjectionExpressionProps(includeKeys)?.ProjectionExpression;
  if (projectionExpression) memoKeyParts.push(projectionExpression);
  const memoKey = memoKeyParts.join("-");

  return await promiseMemoizer(async () => {
    /* eslint-disable no-undef */
    const items = await query(dynamo, tableName, queryKey, includeKeys, { IndexName: gsi });
    items.forEach((item) => {
      const itemKeys = primaryKeyNames.map((key) => item[key]);
      const memoKeyParts = ["getItem", tableName, ...itemKeys];
      if (projectionExpression) memoKeyParts.push(projectionExpression);
      const memoKey = memoKeyParts.join("-");
      addMemoEntry(item, memoKey);
    });
    return items;
  }, memoKey);
}

export async function memoizedGetItem(dynamo, tableName, keyObject, includeKeys = undefined) {
  const memoKeyParts = ["getItem", tableName, ...Object.values(keyObject)];
  if (includeKeys) memoKeyParts.push(getProjectionExpressionProps(includeKeys).ProjectionExpression);
  const memoKey = memoKeyParts.join("-");
  return promiseMemoizer(() => getItem(dynamo, tableName, keyObject, includeKeys), memoKey);
}

// Also takes an array of primary key names so that the results of the
// call can be memoized for subsequent getItem calls.
export async function memoizedBatchGet(dynamo, tableName, keys, primaryKeyNames, includeKeys = undefined) {
  const hash = getHashForContent(keys);

  const memoKeyParts = ["batchGet", tableName, hash];
  const projectionExpression = getProjectionExpressionProps(includeKeys)?.ProjectionExpression;
  if (projectionExpression) memoKeyParts.push(projectionExpression);
  const memoKey = memoKeyParts.join("-");

  return promiseMemoizer(async () => {
    const items = await batchGet(dynamo, tableName, keys, includeKeys);
    items.forEach((item) => {
      const itemKeys = primaryKeyNames.map((key) => item[key]);
      const memoKeyParts = ["getItem", tableName, ...itemKeys];
      if (projectionExpression) memoKeyParts.push(projectionExpression);
      const memoKey = memoKeyParts.join("-");
      addMemoEntry(item, memoKey);
    });
    return items;
  }, memoKey);
}
