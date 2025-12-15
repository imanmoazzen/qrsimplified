import { RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";

class UserDataBucket extends Bucket {
  constructor(scope, { readableName, autoDeleteObjects = true, cdkConfig }) {
    const id = readableName + "-" + cdkConfig.account;
    super(scope, id, {
      removalPolicy: cdkConfig.bucketRemovalPolicy,
      autoDeleteObjects: autoDeleteObjects && cdkConfig.bucketRemovalPolicy === RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.HEAD, HttpMethods.PUT, HttpMethods.POST, HttpMethods.DELETE],
          allowedOrigins: cdkConfig.userDataBucketCORSAllowedOrigins,
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
        },
      ],
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicPolicy: false, // I might need to change this for sensitive info (Iman)
      }),
    });
  }
}

export default UserDataBucket;
