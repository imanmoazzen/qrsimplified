import { v4 as uuidv4 } from "uuid";

import {
  ACTIONS,
  API_RESPONSE_TYPES,
  CURRENT_PROJECT_VERSION,
  OBJECT_TYPES,
} from "../../../../castofly-common/index.js";
import { getCreationTime } from "../../../../castofly-common/timeUtils.js";
import { BACKEND_CONFIG } from "../../../configurationConstants.js";
import {
  batchDeleteItems,
  batchPutItems,
  deleteItem,
  putItem,
  query,
  updateItemSet,
} from "../../common-aws-utils-v3/dynamoUtils.js";
import { notifyLockStatusChanged, notifyProjectDeleted } from "../../common-aws-utils-v3/invokeHandleMessageHelpers.js";
import { memoizedGetItem, memoizedQuery, memoizedQueryGSI } from "../../common-aws-utils-v3/memoizedDynamoUtils.js";
import { isUndefinedOrNull } from "../../common-utilities/helperFunctions.js";
import { TABLE_NAMES, TABLE_PRIMARY_KEYS } from "../config.js";
import { dynamo, lambda, ssmCache } from "../index.js";
import {
  getAllGranteeRolesForObject,
  getDirectGranteeRolesForObject,
  getGranteeRoleForObject,
  isActionAllowed,
  removeObjectPermissions,
} from "./permissions.js";
import { errorResponse, successResponse } from "./standardResponses.js";

async function newObject(parentObjectId, type, name, extraAttributes = {}) {
  const object_id = `${uuidv4()}${extraAttributes?.isDemoProject ? "-demo-project" : ""}`;
  delete extraAttributes?.isDemoProject;

  try {
    const newObjectEntry = {
      object_id,
      parent_object_id: parentObjectId,
      type,
      creation_time: getCreationTime(extraAttributes?.timeZone || "UTC"),
      is_locked: false,
      name,
      ...extraAttributes,
    };

    await putItem(dynamo, TABLE_NAMES.OBJECTS, newObjectEntry);
    return newObjectEntry;
  } catch (err) {
    console.error("An error occurred in newObject: ", err);
    return null;
  }
}

export async function newProject(
  parentObjectId,
  userId,
  name = "Untitled Project",
  projectType,
  thumbnail,
  isDemoProject
) {
  const extraAttributes = {
    projectType,
    creator_id: userId,
    version: CURRENT_PROJECT_VERSION.versionNumber,
    thumbnail,
    isDemoProject,
  };

  const newObjectEntry = await newObject(parentObjectId, OBJECT_TYPES.PROJECT, name, extraAttributes);

  return successResponse("Succesfully made new project with id: " + newObjectEntry.object_id, { newObjectEntry });
}

export async function newFolder(parentObjectId, userId, name = "Untitled Folder") {
  const newObjectEntry = await newObject(parentObjectId, OBJECT_TYPES.FOLDER, name, { creator_id: userId });

  return successResponse("Succesfully made new folder with id: " + newObjectEntry.object_id, { newObjectEntry });
}

export async function deleteObject(objectId, userId) {
  const objectToBeDeleted = await memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId });
  if (!objectToBeDeleted) return successResponse("Object does not exist");

  const sessionsDeletionPromise = query(dynamo, TABLE_NAMES.SOAPS, { project_id: objectId }).then(async (sessions) => {
    const sessionKeys = sessions.map((session) => {
      return {
        project_id: session.project_id,
        slide_id: session.slide_id,
      };
    });
    return batchDeleteItems(dynamo, TABLE_NAMES.SOAPS, sessionKeys);
  });

  const clientDeletionPromise = deleteItem(dynamo, TABLE_NAMES.CLIENTS, { project_id: objectId });

  const messagesDeletionPromise = query(dynamo, TABLE_NAMES.MESSAGES, { project_id: objectId }).then(
    async (messages) => {
      const messageKeys = messages.map((message) => {
        return {
          project_id: message.project_id,
          message_id: message.message_id,
        };
      });
      return batchDeleteItems(dynamo, TABLE_NAMES.MESSAGES, messageKeys);
    }
  );

  const deletionPromises = [
    deleteItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId }),
    sessionsDeletionPromise,
    clientDeletionPromise,
    messagesDeletionPromise,
  ];

  switch (objectToBeDeleted.type) {
    case OBJECT_TYPES.PROJECT: {
      deletionPromises.push(notifyProjectDeleted(lambda, process.env.HANDLE_MESSAGE_LAMBDA_NAME, objectId));
      deletionPromises.push(deleteProjectEvents(objectId));
      break;
    }
    case OBJECT_TYPES.FOLDER: {
      const childObjects = await getObjectChildren(objectId);
      deletionPromises.push(
        Promise.all(childObjects.map((childObject) => deleteObject(childObject.object_id, userId)))
      );
    }
  }

  // delete related permissions
  deletionPromises.push(deleteObjectPermissions(objectId));

  return await Promise.all(deletionPromises)
    .then(() => {
      return successResponse("Successfully deleted object: " + objectId);
    })
    .catch((err) => {
      console.log("Deletion Promise.all error:", err);
      return errorResponse("Error in deletionPromises");
    });
}

export async function setObjectLock(objectId, newLock) {
  const object = await updateItemSet(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId }, { is_locked: newLock });
  switch (object.type) {
    case OBJECT_TYPES.PROJECT: {
      await notifyLockStatusChanged(lambda, process.env.HANDLE_MESSAGE_LAMBDA_NAME, object.object_id, newLock);
      break;
    }
    case OBJECT_TYPES.FOLDER: {
      console.warn("Unexpectedly called setObjectLock on folder.");
      break;
    }
  }
  return successResponse("Set lock on object: " + objectId + " new lock: " + newLock);
}

export async function setObjectName(objectId, newName) {
  await updateItemSet(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId }, { name: newName });
  return successResponse("Set name on object: " + objectId + " new name: " + newName);
}

export async function setObjectThumbnail(objectId, thumbnail) {
  await updateItemSet(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId }, { thumbnail });
  return successResponse("Set thumbnail on object: " + objectId);
}

// Duplicates an object. If the object is a folder, also duplicates the contents.
// Places the new object under the same parent as the original, if the object had no parent (was a root object) it returns an error.
// TODO: This does *not* duplicate permissions as well. Should it do that?
export async function duplicateObject(objectId, userId) {
  const objectEntry = await memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId });
  if (!objectEntry.parent_object_id) return errorResponse("Target object to duplicate has no parent.");
  await duplicateObjectHelper(objectEntry, objectEntry.parent_object_id, "Copy of " + objectEntry.name, userId);
  return successResponse("Object successfully duplicated.");
}

// optional: provide an array of keys to allow in the resultant objects
// if not provided, returns objects with all keys
export async function getObjectChildren(objectId, includeKeys = undefined) {
  const PARENT_OBJECT_ID_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.OBJECTS_PARENT_OBJECT_ID_GSI);
  return await memoizedQueryGSI(
    dynamo,
    TABLE_NAMES.OBJECTS,
    TABLE_PRIMARY_KEYS.OBJECTS,
    { parent_object_id: objectId },
    PARENT_OBJECT_ID_GSI,
    includeKeys
  );
}

async function duplicateObjectHelper(objectEntry, newParentId, newObjectName, userId) {
  const workPromises = [];
  const clone = cloneObjectForDuplication(objectEntry);
  const newObjectEntry = await newObject(newParentId, objectEntry.type, newObjectName, clone);

  switch (objectEntry.type) {
    case OBJECT_TYPES.FOLDER: {
      const duplicateFolderPromise = getObjectChildren(objectEntry.object_id).then((childObjectArray) => {
        return Promise.all(
          childObjectArray.map((childObject) =>
            duplicateObjectHelper(childObject, newObjectEntry.object_id, childObject.name, userId)
          )
        );
      });
      workPromises.push(duplicateFolderPromise);
      break;
    }
    case OBJECT_TYPES.PROJECT: {
      const duplicateProjectEventsPromise = memoizedQuery(
        dynamo,
        TABLE_NAMES.PROJECT_EVENTS,
        TABLE_PRIMARY_KEYS.PROJECT_EVENTS,
        {
          project_id: objectEntry.object_id,
        }
      ).then((projectEvents) => {
        const newEntries = projectEvents.map((entry) => {
          return {
            ...entry,
            project_id: newObjectEntry.object_id,
          };
        });
        return batchPutItems(dynamo, TABLE_NAMES.PROJECT_EVENTS, newEntries);
      });
      workPromises.push(duplicateProjectEventsPromise);
    }
  }
  await Promise.all(workPromises);
  return newObjectEntry;
}

export async function moveObjectWithChecks(objectId, newParentId) {
  const [objectEntry, newParentEntry] = await Promise.all([
    memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId }),
    memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: newParentId }),
  ]);

  // Check if the action is actually permitted
  if (!objectEntry.parent_object_id || objectEntry.parent_object_id === "")
    return errorResponse("Tried to move a root object (id: " + objectId + ")");
  if (!newParentEntry) return errorResponse("Tried to move an object (id: " + objectId + ") into nonexistent folder");
  if (newParentEntry.type !== OBJECT_TYPES.FOLDER)
    return errorResponse("Tried to move an object (id: " + objectId + ") into a non-folder (id: " + newParentId + ")");

  // Do the actual action and return a success response
  await updateItemSet(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId }, { parent_object_id: newParentId });
  return successResponse("Moved an object (id: " + objectId + ") into a folder (id: " + newParentId + ")");
}

// Special kind of 'move' operation: permitted if and only if userId === creator_id
export async function transferObject(userId, objectId, newParentId) {
  const { type, creator_id } = await memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId });
  if (userId !== creator_id) return errorResponse("Transfer denied; user does not own the object.");
  if (type === OBJECT_TYPES.FOLDER) return errorResponse("Transfer denied; folders cannot be moved.");

  const moveResult = await moveObjectWithChecks(objectId, newParentId);
  if (moveResult.message !== API_RESPONSE_TYPES.SUCCESS) return moveResult;

  // permissions on the project might not necessarily be valid in the other workspace
  // (e.g: you gave 'edit' access to a user not a part of the team, and you move it to the team workspace)
  // this would help make things a little easier to understand from a user perspective
  await removeObjectPermissions(objectId);

  return successResponse(`Sucessfully transfered the project.`);
}

// Due to the way permissions work, in many cases moving an object will result in
// a change in who has access to the object and the children of the moved object.
// Returns an object with information about the change in permissions if the object is moved
export async function getPermissionsChangeIfObjectMoved(objectId, newParentId) {
  const oldParentId = (await memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId })).parent_object_id;
  const [oldParentUserRoles, newParentUserRoles, objectDirectUserRoles] = await Promise.all([
    getAllGranteeRolesForObject(oldParentId),
    getAllGranteeRolesForObject(newParentId),
    getDirectGranteeRolesForObject(objectId),
  ]);

  // find arrays of the roles from each parent that WILL apply to the the object if it were a child
  // (i.e. roles which would not be overidden by a role on the child)
  const oldParentRolesToInherit = oldParentUserRoles.filter(
    (role) => !objectDirectUserRoles.find((directRole) => directRole.grantee === role.grantee)
  );
  const newParentRolesToInherit = newParentUserRoles.filter(
    (role) => !objectDirectUserRoles.find((directRole) => directRole.grantee === role.grantee)
  );

  const rolesBefore = [...oldParentRolesToInherit, ...objectDirectUserRoles];
  const rolesAfter = [...newParentRolesToInherit, ...objectDirectUserRoles];

  let foundChangeSoFar = false;

  if (rolesBefore.length !== rolesAfter.length) {
    foundChangeSoFar = true;
  } else {
    const compareAll = (arr1, arr2) => {
      for (const role of arr1) {
        const otherRoleWithSameGrantee = arr2.find((otherRole) => otherRole.grantee === role.grantee);
        if (!otherRoleWithSameGrantee || otherRoleWithSameGrantee.role !== role.role) {
          foundChangeSoFar = true;
          break;
        }
      }
    };
    compareAll(rolesBefore, rolesAfter);
    if (!foundChangeSoFar) compareAll(rolesAfter, rolesBefore);
  }

  return successResponse(
    "Sucessfully got permissions change if object (id: " + objectId + " ) moved to folder (id: " + newParentId + " )",
    {
      rolesBefore,
      rolesAfter,
      isChanged: foundChangeSoFar,
    }
  );
}

async function deleteProjectEvents(objectId) {
  return await memoizedQuery(dynamo, TABLE_NAMES.PROJECT_EVENTS, TABLE_PRIMARY_KEYS.PROJECT_EVENTS, {
    project_id: objectId,
  }).then(async (events) => {
    const eventKeys = events.map((event) => {
      return {
        project_id: event.project_id,
        event_id: event.event_id,
      };
    });
    return batchDeleteItems(dynamo, TABLE_NAMES.PROJECT_EVENTS, eventKeys);
  });
}

async function deleteObjectPermissions(objectId) {
  const PERMISSION_TARGET_ID_GSI = await ssmCache.getValue(BACKEND_CONFIG.GSI.PERMISSION_TARGET_ID_GSI);
  return await memoizedQueryGSI(
    dynamo,
    TABLE_NAMES.PERMISSIONS,
    TABLE_PRIMARY_KEYS.PERMISSIONS,
    {
      target_object_id: objectId,
    },
    PERMISSION_TARGET_ID_GSI
  ).then((permissions) => {
    const keys = permissions.map((permission) => {
      return {
        grantee: permission.grantee,
        permission_id: permission.permission_id,
      };
    });
    batchDeleteItems(dynamo, TABLE_NAMES.PERMISSIONS, keys);
  });
}

/**
 * Given an objectId, return an object representing the full path of the objectId given. Each key-value pair in the returned object is a [objectId, name] pair
 * @param {string} objectId
 * @returns {Object} objectPath
 */
export async function getObjectPath(userId, objectId) {
  let pathObjects = await parentTraverse(objectId, (objectEntry) => objectEntry);
  pathObjects.reverse(); // now the 0th entry of the array is the root, ...length-1'th entry is the entry with objectId

  const roles = await Promise.all(pathObjects.map((object) => getGranteeRoleForObject(userId, object.object_id)));

  const objectPath = [];
  roles.forEach((role, index) => {
    const objectProps = {
      object_id: pathObjects[index].object_id,
      name: pathObjects[index].name,
      current_user_role: role,
    };
    objectPath.push(objectProps);
  });

  return objectPath;
}

export async function batchDeleteObjects(userId, objectIds) {
  // filter out any non-existent or locked objects; we'll just ignore these.
  const objects = (
    await Promise.all(objectIds.map((id) => memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: id })))
  )
    .filter((obj) => !isUndefinedOrNull(obj))
    .filter((obj) => !obj?.isLocked);
  if (objects.length === 0) return errorResponse("No valid object ids were provided.");

  const canDeleteAll = objects
    .map((object) => isActionAllowed(userId, object.object_id, ACTIONS.DELETE_OBJECT))
    .every((value) => value);
  if (!canDeleteAll) return errorResponse("User lacks sufficient permissions to delete one or more objects.");

  await Promise.all(objects.map((object) => deleteObject(object.object_id, userId)));
  return successResponse(`Successfully deleted ${objects.length} objects for userId: ${userId}`);
}

// HELPER FUNCTION: Starting at the object indicated by objectId, traverse the directory tree up to the root
// calling 'fn' with each object table entry along the way, and return the results of these calls in an array
// e.g. If we had an object "A" inside 'Folder1' which is inside 'Folder2', calling 'parentTraverse("object A id", fn)
// would return the array [fn(A), fn(Folder1), fn(Folder2)]

// 'fn' takes three parameters: objectEntry, depth, stopTraversal
// objectEntry is the object to process, depth is the current distance from the starting object,
// and 'stopTraversal' is a function that may be called to halt traversal early

export async function parentTraverse(objectId, fn) {
  let resultPromises = [];
  let depth = 0;

  let nextObjectId = objectId;
  let stopTraverse = false;
  const stopTraversal = () => (stopTraverse = true);
  do {
    let objectEntry = await memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: nextObjectId });
    if (!objectEntry && depth === 0) return [];
    if (!objectEntry) console.log("Orphaned object found!");

    resultPromises.push(fn(objectEntry, depth, stopTraversal));

    nextObjectId = objectEntry.parent_object_id;
    depth++;
  } while (nextObjectId && !stopTraverse);

  const res = await Promise.all(resultPromises);
  return res;
}

// HELPER FUNCTION: Analagous to parentTraverse but instead of starting from an object and traversing up the tree to the root,
// it starts from an object and traverses *down* the tree to all of its children.
// Since an object may have more than one child, this function is written recursively.
// For it to work properly, don't pass it 'depth'.

// 'fn' takes two parameters: objectEntry and depth.

// returns an array containing the result of calling 'fn' on each entry in the tree.
export async function childTraverse(objectId, fn, depth = 0) {
  const thisEntry = await memoizedGetItem(dynamo, TABLE_NAMES.OBJECTS, { object_id: objectId });
  switch (thisEntry.type) {
    case OBJECT_TYPES.FOLDER: {
      const childObjects = await getObjectChildren(objectId);
      const childResults = (
        await Promise.all(childObjects.map((object) => childTraverse(object.object_id, fn, depth + 1)))
      ).flat();
      return [await fn(thisEntry, depth), ...childResults];
    }
    case OBJECT_TYPES.PROJECT: {
      return [await fn(thisEntry, depth)];
    }
  }
}

function cloneObjectForDuplication(objectEntry) {
  const clone = { ...objectEntry };
  delete clone.object_id;
  delete clone.creation_time;
  delete clone.is_locked;
  delete clone.name;
  delete clone.parent_object_id;
  delete clone.type;
  return clone;
}
