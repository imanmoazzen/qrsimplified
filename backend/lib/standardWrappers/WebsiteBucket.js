import { RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";

class WebsiteBucket extends Bucket {
  constructor(scope, { readableName, cdkConfig }) {
    const id = readableName + "-" + cdkConfig.account;
    super(scope, id, {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      removalPolicy: cdkConfig.bucketRemovalPolicy,
      autoDeleteObjects: cdkConfig.bucketRemovalPolicy === RemovalPolicy.DESTROY,
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicPolicy: false,
      }),
    });
  }
}

export default WebsiteBucket;
