import { AUTH_SUBDOMAINS } from "castofly-common/commonConstants.js";

import appSettings from "../../appSettings.js";

const CALLBACK_URLS = JSON.parse(appSettings.get("cognito.callback_uris"));
const SIGNOUT_URLS = JSON.parse(appSettings.get("cognito.signout_uris"));

const config = {
  cognito: {
    region: appSettings.get("aws.region"),
    userPool: appSettings.get("cognito.user_pool"),
    userPoolBaseUri: appSettings.get("cognito.user_pool_base_uri"),
    clientId: appSettings.get("cognito.client_id"),
    callbackUri: CALLBACK_URLS[AUTH_SUBDOMAINS.APP],
    signoutUri: SIGNOUT_URLS[AUTH_SUBDOMAINS.APP],
    tokenScopes: appSettings.get("cognito.token_scopes"),
  },
  apiv2AnonymousTokenEndpoint: appSettings.get("api.v2_base_endpoint") + "/guest/getToken",
  apiv2MigrateEndpoint: appSettings.get("api.v2_base_endpoint") + "/guest/migrateGuest",
};

export default config;
