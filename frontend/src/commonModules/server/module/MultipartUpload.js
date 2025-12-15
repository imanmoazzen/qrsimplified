import requestWithRetry from "../../../commonUtil/requestWithRetry.js";
import config from "../config.js";

const MULTIPART_UPLOAD_STATUSES = {
  PRE_START: "PRE_START",
  ACCEPTING_PARTS: "ACCEPTING_PARTS",
  FAILED: "FAILED",
  RESOLVING: "RESOLVING",
  RESOLVED: "RESOLVED",
};

const URLS_TO_REQUEST = 10;

export default class MultipartUpload {
  serverModule;
  destinationKey;

  uploadId;

  status = MULTIPART_UPLOAD_STATUSES.PRE_START;
  partUploadPromises = [];
  partGetUploadUrlPromises = [];

  constructor(serverModule, destinationKey) {
    this.serverModule = serverModule;
    this.destinationKey = destinationKey;
    this.startPromise = this._start();
  }

  async _start() {
    const res = await this.serverModule.requestWithAuthentication({
      mode: "cors",
      url: config.multipartUploadURL + "/start",
      method: "POST",
      data: { destinationKey: this.destinationKey },
    });
    this.uploadId = (await res.data).uploadId;
    this.status = MULTIPART_UPLOAD_STATUSES.ACCEPTING_PARTS;
  }

  // NOTE: this assumes that addPart calls occur in proper file order
  async addPart(file, contentType) {
    if (this.status === MULTIPART_UPLOAD_STATUSES.PRE_START) await this.startPromise;
    if (this.status !== MULTIPART_UPLOAD_STATUSES.ACCEPTING_PARTS)
      throw Error("Multipart upload error: Incorrect status " + this.status);
    const newPartNum = this.partUploadPromises.length + 1;
    const uploadPromise = this._getPartUploadUrl(newPartNum).then((url) =>
      requestWithRetry({
        method: "PUT",
        url,
        headers: {
          "Content-Type": contentType,
        },
        data: file,
      }).then((res) => {
        const { etag } = res.headers;
        return {
          ETag: etag,
          PartNumber: newPartNum,
        };
      })
    );
    this.partUploadPromises.push(uploadPromise);
    await uploadPromise;
  }

  // NOTE: This function assumes that it's called with 'partNum' sequentially, without skipping or going back.
  async _getPartUploadUrl(partNum) {
    const partGetUploadUrlPromise = this.partGetUploadUrlPromises[partNum - 1];
    if (partGetUploadUrlPromise) {
      // this part upload URL already been requested; await the promise
      return await partGetUploadUrlPromise;
    }
    // this part upload URL has not yet been requested, request the next batch of urls
    const firstPartNumber = this.partGetUploadUrlPromises.length + 1;
    const getSignedUrlsPromise = this.serverModule.requestWithAuthentication({
      mode: "cors",
      url: config.multipartUploadURL + "/makeUrls",
      method: "POST",
      data: {
        destinationKey: this.destinationKey,
        uploadId: this.uploadId,
        firstPartNumber: firstPartNumber,
        desiredSignedUrls: URLS_TO_REQUEST,
      },
    });
    for (let i = 0; i < URLS_TO_REQUEST; i++) {
      const urlPromise = getSignedUrlsPromise.then((res) => res.data).then((data) => data.signedUrls[i]);
      this.partGetUploadUrlPromises.push(urlPromise);
    }
    return await this.partGetUploadUrlPromises[partNum - 1];
  }

  async finish() {
    this.status = MULTIPART_UPLOAD_STATUSES.RESOLVING;
    try {
      const parts = await Promise.all(this.partUploadPromises);
      parts.sort((a, b) => a.PartNumber - b.PartNumber);

      const res = await this.serverModule.requestWithAuthentication({
        mode: "cors",
        url: config.multipartUploadURL + "/finish",
        method: "POST",
        data: {
          uploadId: this.uploadId,
          destinationKey: this.destinationKey,
          parts,
        },
      });

      this.status = MULTIPART_UPLOAD_STATUSES.RESOLVED;
      return (await res.data).url;
    } catch (err) {
      this.status = MULTIPART_UPLOAD_STATUSES.FAILED;
      console.log("Error caught in finish in MultipartUpload.js");
    }
  }
}
