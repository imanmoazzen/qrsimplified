import { Effect, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";

import { BaseStack } from "../BaseStack.js";
import { defineBuckets } from "./defineBuckets.js";
import { defineTables } from "./defineTables.js";

class UserDataStack extends BaseStack {
  constructor(scope, id, props) {
    const { cdkConfig } = props;
    super(scope, props.cdkConfig?.appName + "-" + id, props);

    const { tables, gsiNames } = defineTables(this, cdkConfig);
    const buckets = defineBuckets(this, cdkConfig);

    for (const [key, table] of Object.entries(tables)) {
      this.createSSMParameter(`${key}_table`, table.tableName);
    }
    for (const [key, gsi] of Object.entries(gsiNames)) {
      this.createSSMParameter(`${key}`, gsi); //IMAN: the key name includes the gsi in it
    }
    for (const [key, bucket] of Object.entries(buckets)) {
      this.createSSMParameter(`${key}_bucket`, bucket.bucketName);
    }
    /* eslint-disable no-unused-vars */
    const AllowReadWriteUserDataAccess = new ManagedPolicy(this, "AllowReadWriteDataAccess", {
      statements: [
        new PolicyStatement({
          sid: "AllowReadWriteDynamoDBTables",
          effect: Effect.ALLOW,
          actions: [
            "dynamodb:BatchGetItem",
            "dynamodb:GetRecords",
            "dynamodb:GetShardIterator",
            "dynamodb:Query",
            "dynamodb:GetItem",
            "dynamodb:Scan",
            "dynamodb:BatchWriteItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:DescribeTable",
          ],
          resources: Object.entries(tables)
            .map(([_, table]) => [table.tableArn, table.tableArn + "/*"])
            .flat(),
        }),
        new PolicyStatement({
          sid: "AllowReadWriteS3Buckets",
          effect: Effect.ALLOW,
          actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
          resources: Object.entries(buckets)
            .map(([_, bucket]) => [bucket.bucketArn, bucket.bucketArn + "/*"])
            .flat(),
        }),
      ],
      description: "Allows read/write access for DynamoDB tables and S3 buckets",
    });

    this.soapsTable = tables.soaps;
    this.createSSMParameter("allowReadWriteDataAccessPolicyArn", AllowReadWriteUserDataAccess.managedPolicyArn);
    this.createSSMParameter("mainDataBucket", buckets.main_data.bucketName);
  }
}

export default UserDataStack;
