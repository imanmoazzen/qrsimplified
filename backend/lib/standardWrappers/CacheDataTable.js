import { AttributeType } from "aws-cdk-lib/aws-dynamodb";

import UserDataTable from "./UserDataTable.js";

// Table to be used for any kind of cache
// If we want to enable TTL (time to live) it'd also be convenient to specify that here.
class CacheDataTable extends UserDataTable {
  constructor(scope, id, { cdkConfig, ...rest }) {
    super(scope, id, {
      cdkConfig,
      primaryKeys: {
        cache_key: AttributeType.STRING,
      },
      ...rest,
    });
  }
}

export default CacheDataTable;
