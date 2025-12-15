import { CONNECTION_STATUS_CHECK, MESSAGE_TYPES } from "../../../castofly-common/commonConstants.js";
import { invokeLambdaRoute } from "./lambdaUtils.js";

export async function notifyProjectDeleted(lambda, handleMessageLambdaName, projectId) {
  return await invokeLambdaRoute(lambda, handleMessageLambdaName, MESSAGE_TYPES.PROJECT_DELETED, { projectId });
}

export async function notifyLockStatusChanged(lambda, handleMessageLambdaName, projectId, newLockStatus) {
  return await invokeLambdaRoute(lambda, handleMessageLambdaName, MESSAGE_TYPES.PROJECT_LOCK_STATUS_CHANGED, {
    projectId,
    newLockStatus,
  });
}

export async function notifyProjectMetadataChanged(lambda, handleMessageLambdaName, projectId, newMetadata) {
  return await invokeLambdaRoute(lambda, handleMessageLambdaName, MESSAGE_TYPES.PROJECT_METADATA_CHANGED, {
    projectId,
    newMetadata,
  });
}

export async function notifyPermissionsChanged(lambda, handleMessageLambdaName, userId) {
  return await invokeLambdaRoute(lambda, handleMessageLambdaName, MESSAGE_TYPES.PERMISSION_CHANGED, { userId });
}

export async function requestConnectionStatusUpdates(lambda, handleMessageLambdaName, projectId) {
  return await invokeLambdaRoute(lambda, handleMessageLambdaName, CONNECTION_STATUS_CHECK, { projectId });
}
