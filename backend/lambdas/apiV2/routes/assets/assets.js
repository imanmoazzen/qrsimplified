import { PutObjectCommand } from "@aws-sdk/client-s3";

import { deleteObject } from "../../../common-aws-utils-v3/s3Utils.js";
import { s3 } from "../../index.js";
import { errorResponse, successResponse } from "../standardResponses.js";

const BUCKET_NAME = process.env.MAIN_DATA_BUCKET_NAME;
const REGION = process.env.AWS_REGION;

export const upload = async (requestBody, userId = "anonymous") => {
  try {
    const { file, name, type, folder = "uploads" } = requestBody;

    if (!file) throw new Error("file is required");

    const fileName = name || `${Date.now()}.bin`;
    const contentType = type || "application/octet-stream";
    const base64ToBuffer = Buffer.from(file, "base64");
    const key = `${folder}/${userId}/${fileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: base64ToBuffer,
        ContentType: contentType,
      })
    );

    const url = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

    return successResponse("file saved in s3", { url });
  } catch (err) {
    return errorResponse(`failed to save the file in s3: ${err?.message}`);
  }
};

export const remove = async (requestBody, userId) => {
  try {
    const { url } = requestBody;

    const u = new URL(url);
    const [bucket] = u.hostname.split(".");
    const key = u.pathname.slice(1);
    const parts = key.split("/");
    const isOwnedByUser = parts[1] === userId;

    if (!isOwnedByUser) throw new Error("You don't have permission to delete this file");

    return await deleteObject(s3, bucket, key);
  } catch (err) {
    return errorResponse(`failed to remove the file in s3: ${err?.message}`);
  }
};

