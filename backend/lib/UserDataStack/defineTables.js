import { AttributeType } from "aws-cdk-lib/aws-dynamodb";

import { BACKEND_CONFIG } from "../../configurationConstants.js";
import CacheDataTable from "../standardWrappers/CacheDataTable.js";
import UserDataTable from "../standardWrappers/UserDataTable.js";

export function defineTables(parent, cdkConfig) {
  const tables = {};

  // IMAN: Note for tables we cannot do this because the names are not still present
  // IMAN: Note for naming _ and - are not allowed and will be omitted during the creation
  const gsiNames = {
    [BACKEND_CONFIG.GSI.COGNITO_ATTRIBUTES_EMAIL_GSI]: "email-index",
    [BACKEND_CONFIG.GSI.USER_DATA_EMAIL_GSI]: "email-index",
    [BACKEND_CONFIG.GSI.SLACK_USER_ID_GSI]: "slack_user_id-index",
    [BACKEND_CONFIG.GSI.REFERRAL_ID_GSI]: "referral_id-index",
    [BACKEND_CONFIG.GSI.REFERRAL_COUPON_GSI]: "referral_coupon-index",
    [BACKEND_CONFIG.GSI.REFERRAL_EMAIL_GSI]: "referral_email-index",
  };

  tables.anonymous_users = new UserDataTable(parent, "anonymous_users", {
    cdkConfig,
    primaryKeys: {
      anonymous_user_id: AttributeType.STRING,
    },
  });

  tables.leads = new UserDataTable(parent, "leads", {
    cdkConfig,
    primaryKeys: {
      email_address: AttributeType.STRING,
    },
  });

  tables.purchases = new UserDataTable(parent, "purchases", {
    cdkConfig,
    primaryKeys: {
      user_id: AttributeType.STRING,
      purchase_id: AttributeType.STRING,
    },
  });

  tables.user_data = new UserDataTable(parent, "user_data", {
    cdkConfig,
    primaryKeys: {
      user_id: AttributeType.STRING,
    },
    gsiIndices: {
      [gsiNames[BACKEND_CONFIG.GSI.USER_DATA_EMAIL_GSI]]: {
        email: AttributeType.STRING,
      },
    },
  });

  tables.cognito_attributes = new CacheDataTable(parent, "cached_cognito_attributes", {
    cdkConfig,
    gsiIndices: {
      [gsiNames[BACKEND_CONFIG.GSI.COGNITO_ATTRIBUTES_EMAIL_GSI]]: {
        email: AttributeType.STRING,
      },
    },
  });

  tables.referral_sources = new UserDataTable(parent, "referral_sources", {
    cdkConfig,
    primaryKeys: {
      user_id: AttributeType.STRING,
      referral_id: AttributeType.STRING,
    },
    gsiIndices: {
      [gsiNames[BACKEND_CONFIG.GSI.REFERRAL_ID_GSI]]: {
        referral_id: AttributeType.STRING,
      },
      [gsiNames[BACKEND_CONFIG.GSI.REFERRAL_COUPON_GSI]]: {
        coupon_id: AttributeType.STRING,
      },
    },
  });

  tables.referral_records = new UserDataTable(parent, "referral_records", {
    cdkConfig,
    primaryKeys: {
      referral_id: AttributeType.STRING,
      referee_email: AttributeType.STRING,
    },
    gsiIndices: {
      [gsiNames[BACKEND_CONFIG.GSI.REFERRAL_EMAIL_GSI]]: {
        referee_email: AttributeType.STRING,
      },
    },
  });

  tables.campaign_sources = new UserDataTable(parent, "campaign_sources", {
    cdkConfig,
    primaryKeys: {
      user_id: AttributeType.STRING,
      campaign_id: AttributeType.STRING,
    },
  });

  tables.campaign_visits = new UserDataTable(parent, "campaign_visits", {
    cdkConfig,
    primaryKeys: {
      campaign_id: AttributeType.STRING,
      visit_id: AttributeType.STRING,
    },
  });

  return { tables, gsiNames };
}
