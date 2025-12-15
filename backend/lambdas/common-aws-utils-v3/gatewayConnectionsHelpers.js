import { PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

import { deleteItem, query } from "./dynamoUtils.js";

// returns true if post was successful, false if a stale connection is found + deleted

export async function postById(dynamo, gateway, connectionTableName, { project_id, connection_id }, postData) {
  try {
    await gateway.send(new PostToConnectionCommand({ ConnectionId: connection_id, Data: JSON.stringify(postData) }));
    return true;
  } catch (e) {
    if (e.name === "GoneException") {
      // Found a stale connection, delete it
      await deleteItem(dynamo, connectionTableName, { project_id, connection_id });
    } else {
      throw e;
    }
    return false;
  }
}

export async function getConnections(dynamo, connectionTableName, projectIDToFind) {
  return await query(dynamo, connectionTableName, { project_id: projectIDToFind });
}

export function getObjectSizeBytes(object) {
  return Buffer.byteLength(JSON.stringify(object), "utf8");
}
