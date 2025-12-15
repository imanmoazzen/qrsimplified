import appSettings from "../../appSettings.js";

const config = {
  apiV2URL: appSettings.get("api.v2_base_endpoint"),
  sendAssetWithExtensionToS3URL: appSettings.get("api.send_asset_with_extension_to_s3_endpoint"),
  checkFileExists: appSettings.get("api.check_file_exists_endpoint"),
  multipartUploadURL: appSettings.get("api.multipart_upload_to_s3_endpoint"),
};

export default config;
