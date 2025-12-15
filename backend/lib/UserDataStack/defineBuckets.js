import { Duration } from "aws-cdk-lib";

import UserDataBucket from "../standardWrappers/UserDataBucket.js";

export function defineBuckets(parent, cdkConfig) {
  const buckets = {};

  buckets.main_data = new UserDataBucket(parent, {
    readableName: "main-data",
    cdkConfig,
  });

  buckets.main_data.addLifecycleRule({
    abortIncompleteMultipartUploadAfter: Duration.days(1),
  });

  return buckets;
}
