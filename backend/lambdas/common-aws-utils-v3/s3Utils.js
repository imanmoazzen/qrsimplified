import fs from "fs";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const URL_EXPIRY_SECONDS = 30 * 60; // 30 minutes

export async function downloadObjectAsString(s3Client, bucket, objectKey) {
  const streamToString = (stream) => {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    });
  };
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });
  const data = await s3Client.send(cmd);
  return await streamToString(data.Body);
}

export async function downloadObjectAsFile(s3Client, bucket, objectKey, destinationPath) {
  const fileWriteStream = fs.createWriteStream(destinationPath);
  const downloadStream = (await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }))).Body;
  return await new Promise((resolve, reject) => {
    downloadStream.on("error", reject);
    fileWriteStream.on("error", reject);
    fileWriteStream.on("finish", () => {
      resolve(destinationPath);
    });
    downloadStream.pipe(fileWriteStream);
  });
}

export async function copyObject(s3Client, bucket, srcObjectKey, destObjectKey, metadata = {}) {
  const cmd = new CopyObjectCommand({
    Bucket: bucket,
    Key: destObjectKey,
    CopySource: `${bucket}/${srcObjectKey}`,
    Metadata: metadata,
    MetadataDirective: "REPLACE",
  });
  return await s3Client.send(cmd);
}

export async function deleteObject(s3Client, bucket, objectKey) {
  const cmd = new DeleteObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });
  return await s3Client.send(cmd);
}

export async function deleteObjectsInS3Bucket(s3, bucket, objectPaths) {
  const objects = objectPaths.map((objPath) => {
    return {
      Key: objPath,
    };
  });
  return await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: objects },
    })
  );
}

export async function uploadFilestreamToS3(
  s3Client,
  fileContentStream,
  bucket,
  objectKey,
  metadata = {},
  partSize = 5 * 1024 * 1024,
  queueSize = 1,
  contentType = undefined,
  ACL = undefined
) {
  const params = {
    Bucket: bucket,
    Key: objectKey,
    Body: fileContentStream,
    Metadata: metadata,
    ContentType: contentType,
    ACL,
  };
  const uploader = new Upload({
    client: s3Client,
    params,
    queueSize,
    partSize,
  });

  const response = await uploader.done();
  return response.Location;
}

export async function uploadDataToS3(
  s3Client,
  bucket,
  objectKey,
  data,
  contentType = "application/json",
  metadata = {},
  ACL = undefined
) {
  const cmd = new PutObjectCommand({
    Key: objectKey,
    Body: data,
    ContentType: contentType,
    Bucket: bucket,
    Metadata: metadata,
    ACL,
  });

  await s3Client.send(cmd);
  return getS3PublicUrl(bucket, objectKey);
}

export async function uploadJSONStringToS3(s3Client, bucket, objectKey, stringContent, metadata = {}) {
  return uploadDataToS3(s3Client, bucket, objectKey, stringContent, "application/json", metadata);
}

export async function uploadStringToS3(s3Client, bucket, objectKey, stringContent, metadata = {}) {
  return uploadDataToS3(s3Client, bucket, objectKey, stringContent, "text/plain", metadata);
}

export async function generatePresignedGetObjectUrl(s3Client, bucket, objectKey, expiresIn = URL_EXPIRY_SECONDS) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
  return await getSignedUrl(s3Client, cmd, { expiresIn });
}

export async function generatePresignedPutObjectUrl(
  s3Client,
  bucket,
  objectKey,
  expiresIn = URL_EXPIRY_SECONDS,
  metadata = {}
) {
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: objectKey, Metadata: metadata });
  return await getSignedUrl(s3Client, cmd, { expiresIn });
}

export async function getS3ObjectMetadata(s3Client, bucket, objectKey) {
  const cmd = new HeadObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });
  const result = await s3Client.send(cmd);
  return result?.Metadata;
}

export function getS3PublicUrl(bucket, objectKey) {
  return `https://${bucket}.s3.amazonaws.com/${objectKey}`;
}

export function getS3LocationUri(bucket, objectKey) {
  return `s3://${bucket}/${objectKey}`;
}

export async function checkFileExistsOnS3(s3, bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    return false;
  }
}

export async function getObjectMetadataFromS3(s3, bucket, key) {
  try {
    return await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    return null;
  }
}
