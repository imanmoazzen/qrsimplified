import { Duration } from "aws-cdk-lib";
import { Distribution, FunctionEventType, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

import WebsiteBucket from "./WebsiteBucket.js";

/*
  An important note on the origin we use here:
  The 'S3Origin' class is smart, and will realize that the S3 bucket it's being pointed at is an S3 bucket with
  static website hosting enabled. It'll then create an appropriate HttpOrigin for this bucket, which works the way we need it to.
  It turns out that the default settings that HttpOrigin has are not appropriate, but the AWS console conceals this detail.
  (in particular, protocolPolicy's default is HTTPS_ONLY, but S3 website endpoints are HTTP only.)
*/

class BucketBackedDistribution extends Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    const {
      domainName,
      mainBucketReadableName,
      additionalBucketPathPatterns = [],
      additionalBucketReadableNames = [],
      additionalBehaviors = {},
      authFunction,
      certificate,
      zone,
      cdkConfig,
    } = props;

    this.buckets = {};

    const mainBucket = new WebsiteBucket(this, {
      readableName: mainBucketReadableName,
      cdkConfig,
    });

    this.buckets[mainBucketReadableName] = mainBucket;

    let functionAssociations = [];

    if (authFunction) {
      functionAssociations.push({
        function: authFunction,
        eventType: FunctionEventType.VIEWER_REQUEST,
      });
    }

    additionalBucketPathPatterns.forEach((pathPattern, index) => {
      const bucket = new WebsiteBucket(this, {
        readableName: additionalBucketReadableNames[index],
        cdkConfig,
      });
      this.buckets[additionalBucketReadableNames[index]] = bucket;
      additionalBehaviors[pathPattern] = {
        origin: new S3BucketOrigin(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations,
      };
    });

    if (!cdkConfig.existingDistributionId || !cdkConfig.existingDistributionDomainName) {
      this.distribution = new Distribution(this, "domainName", {
        domainNames: [domainName],
        comment: domainName,
        certificate: certificate,
        defaultBehavior: {
          origin: new S3BucketOrigin(mainBucket),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations,
        },
        additionalBehaviors,
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: Duration.minutes(10),
          },
        ],
      });

      this.distribution.applyRemovalPolicy(cdkConfig.distributionRemovalPolicy);
    } else {
      this.distribution = Distribution.fromDistributionAttributes(this, "ExistingDist", {
        domainName: cdkConfig.existingDistributionDomainName,
        distributionId: cdkConfig.existingDistributionId,
      });
    }

    if (cdkConfig.cdkShouldMakeARecords) {
      new ARecord(this, "AliasToCloudfront", {
        zone,
        recordName: domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
      });
    }
  }
}

export default BucketBackedDistribution;
