import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Function, FunctionCode, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

import { BaseStack } from "../BaseStack.js";
import { ENVS } from "../constants.js";
import BucketBackedDistribution from "../standardWrappers/BucketBackedDistribution.js";
import WebsiteBucket from "../standardWrappers/WebsiteBucket.js";

class WebsiteStack extends BaseStack {
  constructor(scope, id, props) {
    const { cdkConfig } = props;
    super(scope, props.cdkConfig?.appName + "-" + id, props);

    if (cdkConfig.environment === ENVS.development) return; // We don't need to deploy the website stack on dev.

    const zone = HostedZone.fromHostedZoneAttributes(this, cdkConfig.appName + "-hostedZone", {
      hostedZoneId: cdkConfig.hostedZoneId,
      zoneName: cdkConfig.hostedZoneName,
    });

    const certificate = Certificate.fromCertificateArn(this, "sslCert", cdkConfig.hostedZoneCertificateArn);

    let basicAuthFunction;

    if (cdkConfig.passwordRequiredForWebsite) {
      // Only enable basic auth on the staging branch, production shouldn't have it.
      basicAuthFunction = new Function(this, "basicAuthFunction", {
        code: FunctionCode.fromFile({ filePath: "./lib/WebsiteStack/basicAuthFunction.js" }),
      });
    }

    const maintenanceBucket = new WebsiteBucket(this, {
      readableName: "maintenancePage",
      cdkConfig,
    });

    const maintenanceOriginOptions = {
      origin: new S3BucketOrigin(maintenanceBucket),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    // IMAN: I don't need this for production
    // this needs modification but I need to find a way to add maintaince page
    const appDist = new BucketBackedDistribution(this, "appDistribution", {
      domainName: cdkConfig.hostedZoneAppRecordName,
      mainBucketReadableName: "app",
      additionalBehaviors: {
        maintenance: maintenanceOriginOptions,
      },
      authFunction: basicAuthFunction,
      certificate,
      zone,
      cdkConfig,
    });

    new BucketDeployment(this, "maintenancePageDeployment", {
      sources: [Source.asset("./lib/WebsiteStack/StaticMaintenancePage/")],
      destinationBucket: maintenanceBucket,
    });

    this.createSSMParameter("appBucketName", appDist.buckets.app.bucketName);
    this.createSSMParameter("appDistributionId", appDist.distribution.distributionId);
  }
}

export default WebsiteStack;
