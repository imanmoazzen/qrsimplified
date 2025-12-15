import { Method } from "aws-cdk-lib/aws-apigateway";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnPermission } from "aws-cdk-lib/aws-lambda";

import StandardAuthorizer from "./StandardAuthorizer.js";
import StandardRestApi from "./StandardRestApi.js";

export const AUTH = "authenticated";
export const NOAUTH = "unauthenticated";
const HTTP_METHODS = ["ANY", "GET", "POST", "PUT", "PATCH", "HEAD", "DELETE", "OPTIONS"];

// Defines a REST API with resourcs + methods defined using an object template.
// Assumes a single lambda integration and a single request authorizer lambda.
class ObjectDefinedLambdaRestApi extends StandardRestApi {
  constructor(
    scope,
    id,
    { definitionObject, authorizerLambda, handlerLambda, integrationOptions, deployOptions, ...rest }
  ) {
    super(scope, id, { handlerLambda, integrationOptions, deployOptions, ...rest });

    const authorizer = authorizerLambda ? new StandardAuthorizer(this, "lambdaAuth", authorizerLambda) : undefined;

    this.defineApiWithObject(definitionObject, authorizer);

    // Below: This is a fix for an error to do with permissions policy getting too big
    this.stripMethodPermissions();
    handlerLambda.addPermission("PermitAPIInvocation", {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: this.arnForExecuteApi("*"),
    });
  }

  /*
    Helper function to consume an object representing an API and produce an actual REST api from it.
    Makes these assumptions:
    - Exactly one integration (the default integration) is used by any method in the API
    - Exactly one authentication method is used by the API
    - Methods may or may not use auth

  Example object:
  {
    assets: {
      PUT: AUTH,
      "{asset_id}"": {
        GET: NOAUTH
      }
    },
    users: {
      "{user_id}": {
        GET: AUTH,
        PUT: AUTH
      }
    }
  }
  */

  defineApiWithObject(defObject, authorizer) {
    recursiveApiHelper(this.root, defObject, authorizer);
  }

  stripMethodPermissions() {
    recursiveStripMethodPermissionsHelper(this.root.node);
  }
}

function recursiveApiHelper(resource, defObject, authorizer) {
  for (const key in defObject) {
    if (typeof defObject[key] === "string") {
      // this key represents a method to add to the resource
      const method = key;
      const isAuthenticated = defObject[key] === AUTH;
      if (!HTTP_METHODS.includes(method)) continue;
      resource.addMethod(method, resource.defaultIntegration, {
        authorizer: isAuthenticated ? authorizer : undefined,
      });
    } else {
      // this key represents a sub-resource to add to the resource
      const subResourceDefObject = defObject[key];
      const subResource = resource.addResource(key);
      recursiveApiHelper(subResource, subResourceDefObject, authorizer);
    }
  }
}

// Used to solve an issue with the permissions policy size getting way too big
// due to a separate entry being added for each additional method added to the API
// source: https://stackoverflow.com/questions/63674175/aws-cdk-lambdarestapi-the-final-policy-size-is-bigger-than-the-limit
// we strip out all of the individual permissions with this, and add a wildcard invoke permission to the top level
function recursiveStripMethodPermissionsHelper(node) {
  for (const child of node.children) {
    /* eslint-disable no-unsafe-negation */
    if ((!child) instanceof Method) continue;
    const permissions = child.node.children.filter((c) => c instanceof CfnPermission);
    permissions.forEach((permission) => {
      child.node.tryRemoveChild(permission.node.id);
    });
    recursiveStripMethodPermissionsHelper(child.node);
  }
}

export default ObjectDefinedLambdaRestApi;
