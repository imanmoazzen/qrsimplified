import { API_RESPONSE_TYPES } from "castofly-common";
import { v4 as uuid } from "uuid";

import requestWithRetry from "../../../commonUtil/requestWithRetry.js";
import { JSON_CONTENT_TYPE } from "../../../frontEndConstants.js";
import { AbstractModule } from "../../project-root/index.js";
import config from "../config.js";
import uploadReducer, {
  UPLOAD_STATES,
  uploadFailed,
  uploadFinished,
  uploadInitialState,
  uploadStarted,
} from "../store/upload.js";
import connectUploadObserver from "../store/uploadObserver.js";
import MultipartUpload from "./MultipartUpload.js";

export default class ServerModule extends AbstractModule {
  constructor({ parentModule, name, authModule }) {
    super({ parentModule, name });
    this.authModule = authModule;
    this.uploadListeners = [];
  }

  uiInitialState = uploadInitialState;
  uiReducer = uploadReducer;

  uploadStatesSelector = (state) => state.ui[this.name].uploadStates;
  uploadsInProgressSelector = (state) =>
    this.uploadStatesSelector(state).filter((entry) => entry.uploadState === UPLOAD_STATES.inProgress).length;

  uploadMonitorOpenSelector = (state) => state.ui[this.name].uploadMonitorOpen;

  addUploadListener = (observer) => {
    if (!this.uploadListeners.includes(observer)) this.uploadListeners.push(observer);
  };

  removeUploadListener = (observer) => {
    this.uploadListeners = this.uploadListeners.filter((item) => item !== observer);
  };

  notifyUploadListeners = (isUploading) => {
    this.uploadListeners.forEach((observer) => observer(isUploading));
  };

  getCurrentUserId = () => {
    return this.authModule.userIdSelector(this.store.getState());
  };

  getCurrentSlide = () => {
    return this.parentModule.contentSelector(this.store.getState());
  };

  getCurrentProjectId = () => {
    return this.parentModule.projectIdSelector(this.store.getState());
  };

  request = async (params) => {
    return await requestWithRetry(params);
  };

  requestWithAuthentication = async (params, initialDelay = 500, maxTries = 1) => {
    const accessToken = await this.authModule.getAccessToken();
    const paramsWithAccessToken = { ...params, headers: { ...params.headers, Authorization: accessToken } };
    return await requestWithRetry(paramsWithAccessToken, initialDelay, maxTries);
  };

  requestFromApiv2 = async (endpoint, params, initialDelay = 500, maxTries = 1) => {
    const url = config.apiV2URL + endpoint;
    return await this.requestWithAuthentication({ ...params, ...{ url } }, initialDelay, maxTries);
  };

  getConvertedImageURLs = async (assetId) => {
    const accessToken = await this.authModule.getAccessToken();

    const params = {
      url: `${config.apiV2URL}/assets/${assetId}/convertedURLs`,
      method: "GET",
      mode: "cors",
      headers: {
        Authorization: accessToken,
      },
    };

    const response = (await requestWithRetry(params)).data;
    if (response.message === API_RESPONSE_TYPES.SUCCESS) {
      return response.images;
    } else {
      return null;
    }
  };

  setConvertedImagesURLs = async (assetId, originalURL, images) => {
    const accessToken = await this.authModule.getAccessToken();
    const params = {
      url: `${config.apiV2URL}/assets/${assetId}/convertedURLs`,
      method: "PUT",
      mode: "cors",
      headers: {
        Authorization: accessToken,
      },
      data: {
        originalURL,
        images,
      },
    };
    await requestWithRetry(params).data;
  };

  generatePredefinedS3UploadURL = (targetDataLocation, name) => {
    if (!targetDataLocation) return null;

    const { bucket, parentFolder, folder } = targetDataLocation;
    if (!bucket) return null;

    const baseURL = `https://${bucket}.s3.amazonaws.com`;
    return `${baseURL}${parentFolder ? "/" + parentFolder : ""}${folder ? "/" + folder : ""}${name ? "/" + name : ""}`;
  };

  handleFileTransfer = async ({
    file,
    targetDataLocation,
    name,
    extension,
    onUploadStarted,
    onUploadFinished,
    onUploadFailed,
    readableName,
    allowDuplicateUploads = false,
    isUploadStatusTrackingRequired = true,
  }) => {
    if (!targetDataLocation) return;

    const url = this.generatePredefinedS3UploadURL(targetDataLocation, name);
    const isAvailable = !allowDuplicateUploads ? await this.isURLAvailableOnS3(url) : false;
    const userId = this.getCurrentUserId();
    const currentSlide = this.getCurrentSlide();
    const slideId = currentSlide?.id;
    const templateId = currentSlide?.template?.value;
    const projectId = this.getCurrentProjectId();

    if (!isAvailable) {
      const uploadLocalId = uuid();
      if (isUploadStatusTrackingRequired) this.dispatch(uploadStarted({ id: uploadLocalId, name: readableName }));
      try {
        onUploadStarted?.();
        const { parentFolder, folder } = targetDataLocation;
        const url = await this.sendAssetToS3(file, userId, {
          parentFolder,
          folder,
          name,
          extension,
          slideId,
          projectId,
          templateId,
        });

        if (isUploadStatusTrackingRequired) this.dispatch(uploadFinished(uploadLocalId));
        onUploadFinished?.(url);
      } catch (err) {
        if (isUploadStatusTrackingRequired) this.dispatch(uploadFailed(uploadLocalId));
        onUploadFailed?.();
      }
    } else {
      onUploadFinished?.(url);
    }
  };

  sendAssetToS3 = async (file, userId, info) => {
    return await this._sendResourceToS3(file, userId, file.type, info);
  };

  sendJSONToS3 = async (object, userId, info) => {
    return await this._sendResourceToS3(object, userId, JSON_CONTENT_TYPE, info);
  };

  getFileFromS3 = async (url, isDefaultCache = true) => {
    return await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: isDefaultCache ? "default" : "no-store",
    }).then((res) => res.json());
  };

  connectCustomStoreSubscribers(store) {
    this.dispatch = store.dispatch;
    this.store = store;
    connectUploadObserver(this, store);
  }

  isURLAvailableOnS3 = async (urls) => {
    const isAvailable = await this.isAvailableOnS3(urls);
    return isAvailable ? isAvailable.every((flag) => flag) : false;
  };

  _sendResourceToS3 = async (resource, userId, fileType, info) => {
    const templateId = info.templateId;
    let templateIdString = undefined;
    if (templateId !== undefined && templateId !== null) templateIdString = String(templateId);

    const params = {
      url: config.sendAssetWithExtensionToS3URL + "/",
      method: "POST",
      mode: "cors",
      data: {
        userId,
        templateId: templateIdString,
        slideId: info.slideId ? info.slideId : undefined,
        projectId: info.projectId ? info.projectId : undefined,
        folder: info.folder,
        parentFolder: info.parentFolder,
        name: info.name,
        extension: info.extention,
      },
    };

    try {
      const res = await requestWithRetry(params);
      const secureURL = await res.data;
      const response = await this._putResourceInS3(resource, fileType, secureURL);

      if (response.status === 200) {
        const S3URL = secureURL.split("?")[0];
        return S3URL;
      }
    } catch (err) {
      return null;
    }
  };

  _putResourceInS3 = async (resource, fileType, secureURL) => {
    const params = {
      url: secureURL,
      method: "PUT",
      headers: {
        "Content-Type": fileType,
      },
      data: resource,
    };

    return await requestWithRetry(params);
  };

  multipartUploads = {};

  startMultipartUpload(destinationKey) {
    this.multipartUploads[destinationKey] = new MultipartUpload(this, destinationKey);
  }

  // NOTE: The part being uploaded *must* be greater than 5MB, unless it's the last part of the upload.
  async addPartToUpload(destinationKey, file, contentType) {
    const upload = this.multipartUploads[destinationKey];
    if (!upload) throw Error("Multipart upload has not been started. Key: " + destinationKey);
    return await upload.addPart(file, contentType);
  }

  async finishMultipartUpload(destinationKey) {
    const upload = this.multipartUploads[destinationKey];
    if (!upload) throw Error("Multipart upload has not been started. Key: " + destinationKey);
    return await upload.finish();
  }
}
