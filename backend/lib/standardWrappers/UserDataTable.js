import { BillingMode, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb";

// e.x:
// const table = new UserDataTable(this, "testTable", {
//   cdkConfig,
//   primaryKeys: { id: AttributeType.STRING }
//   gsiIndices: {
//     otherIdIndex: {
//       otherId: AttributeType.STRING,
//       id: AttributeType.STRING
//     }
//   }
// })
class UserDataTable extends Table {
  constructor(scope, id, { cdkConfig, primaryKeys, gsiIndices = [], enableStreams = false, ...rest }) {
    const keyProps = {};

    const [partitionKey, sortKey] = Object.entries(primaryKeys);
    keyProps.partitionKey = keyValueToNameType(partitionKey);
    if (sortKey) keyProps.sortKey = keyValueToNameType(sortKey);

    super(scope, id, {
      removalPolicy: cdkConfig.tableRemovalPolicy,
      billingMode: cdkConfig.dynamoUserDataTableBillingMode,
      ...keyProps,
      ...rest,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: cdkConfig.pointInTimeRecoveryEnabled,
      },
      stream: enableStreams ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,
    });

    if (cdkConfig.dynamoUserDataTableBillingMode === BillingMode.PROVISIONED) {
      const { autoScaleReadCapacity, autoScaleWriteCapacity } = rest;

      this.autoScaleReadCapacity({
        minCapacity: autoScaleReadCapacity?.min || 1,
        maxCapacity: autoScaleReadCapacity?.max || 10,
      }).scaleOnUtilization({
        targetUtilizationPercent: autoScaleReadCapacity?.targetUtilizationPercent || 70,
      });

      this.autoScaleWriteCapacity({
        minCapacity: autoScaleWriteCapacity?.min || 1,
        maxCapacity: autoScaleWriteCapacity?.max || 10,
      }).scaleOnUtilization({
        targetUtilizationPercent: autoScaleWriteCapacity?.targetUtilizationPercent || 70,
      });
    }

    for (const [gsiName, keys] of Object.entries(gsiIndices)) {
      const [partitionKey, sortKey] = Object.entries(keys);
      const keyProps = {};
      keyProps.partitionKey = keyValueToNameType(partitionKey);
      if (sortKey) keyProps.sortKey = keyValueToNameType(sortKey);
      this.addGlobalSecondaryIndex({
        indexName: gsiName,
        ...keyProps,
      });
    }
  }
}

export default UserDataTable;

// Helper function used to make working with DynamoDB a little nicer
// Converts an array like this:
// [ "aDatabaseKey", AttributeType.SOMETYPE ]
// To an object like this:
// {
//    name: "aDatabaseKey",
//    type: AttributeType.SOMETYPE
// }
function keyValueToNameType(keyValueArray) {
  return {
    name: keyValueArray[0],
    type: keyValueArray[1],
  };
}
