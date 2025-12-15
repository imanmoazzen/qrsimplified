import { SecretValue } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  OAuthScope,
  ProviderAttribute,
  UserPool,
  UserPoolClientIdentityProvider,
  UserPoolDomain,
  UserPoolIdentityProviderGoogle,
} from "aws-cdk-lib/aws-cognito";
import { Effect, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { UserPoolDomainTarget } from "aws-cdk-lib/aws-route53-targets";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";

import { BACKEND_CONFIG } from "../../configurationConstants.js";
import { BaseStack } from "../BaseStack.js";
import { COGNITO_HOSTED_DOMAIN_TYPES } from "../constants.js";
import DynamicEnvironmentVariable from "../standardWrappers/DynamicEnvironmentVariable.js";

class AuthStack extends BaseStack {
  constructor(scope, id, props) {
    super(scope, props.cdkConfig?.appName + "-" + id, props);

    const { cdkConfig } = props;
    const tokenScopes = [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE];

    const pool = this.fetchOrCreateUserPool(cdkConfig);
    let googleIdp;
    if (cdkConfig.cognitoGoogleAuthFlow) {
      googleIdp = this.createUserPoolIdentityProvider(cdkConfig, pool);
    }

    const client = this.addClientToUserPool(cdkConfig, pool, tokenScopes);
    if (googleIdp) client.node.addDependency(googleIdp);
    const domain = this.fetchOrCreateUserPoolDomain(cdkConfig, pool);

    const roleTokenSigningSecret = this.createSigningSecret(
      "roleTokenSecret",
      "Secret used in the signing of role tokens",
      cdkConfig.secretRemovalPolicy
    );

    const anonymousUserTokenSigningSecret = this.createSigningSecret(
      "anonymousUserTokenSecret",
      "Secret used in the signing of anonymous user tokens",
      cdkConfig.secretRemovalPolicy
    );

    const invitationTokenSigningSecret = this.createSigningSecret(
      "invitationSigningSecret",
      "Secret used in the signing of invitation tokens",
      cdkConfig.secretRemovalPolicy
    );

    const userPoolPolicy = this.createIamUserPoolPolicy(pool, [
      roleTokenSigningSecret.secretArn,
      anonymousUserTokenSigningSecret.secretArn,
      invitationTokenSigningSecret.secretArn,
    ]);

    if (cdkConfig.cognitoSESEnabled) {
      this.registerSESIdentityEmailSendingPolicy(cdkConfig.cognitoSESSourceARN);
      new DynamicEnvironmentVariable(this, "VerifiedSESIdentityArn", {
        name: BACKEND_CONFIG.SES.VERIFIED_SES_IDENTITY_ARN,
        value: cdkConfig.cognitoSESSourceARN,
      });
    }

    this.createSSMParameter("callbackUris", JSON.stringify(cdkConfig.cognitoCallbackURLs));
    this.createSSMParameter("clientId", client.userPoolClientId);
    this.createSSMParameter("signoutUris", JSON.stringify(cdkConfig.cognitoPostSignoutURLs));
    this.createSSMParameter("tokenScopes", tokenScopes.map((scope) => scope.scopeName).join(","));
    this.createSSMParameter("userPoolId", pool.userPoolId);
    this.createSSMParameter("userPoolBaseUri", cdkConfig.cognitoImportBaseUri ?? domain.baseUrl());
    this.createSSMParameter("userPoolPolicyArn", userPoolPolicy.managedPolicyArn);
    this.createSSMParameter("roleTokenSigningSecretArn", roleTokenSigningSecret.secretArn);
    this.createSSMParameter("anonymousUserTokenSigningSecretArn", anonymousUserTokenSigningSecret.secretArn);
    this.createSSMParameter("invitationTokenSigningSecretArn", invitationTokenSigningSecret.secretArn);
  }

  // ref: https://stackoverflow.com/questions/67653405/cdk-add-policy-to-custom-created-ses-verified-email
  // ref: https://stackoverflow.com/questions/69678825/configure-aws-cognito-by-cdk-for-aws-ses-simple-email-service-service-linked?rq=2
  registerSESIdentityEmailSendingPolicy(identityArn) {
    const policy = {
      Version: "2008-10-17",
      Statement: [
        {
          Sid: "stmt1621717794524",
          Effect: "Allow",
          Principal: {
            Service: "cognito-idp.amazonaws.com",
          },
          Action: ["ses:SendEmail", "ses:SendRawEmail"],
          Resource: identityArn,
        },
      ],
    };
    new AwsCustomResource(this, "PutIdentityPolicy", {
      onCreate: {
        service: "SES",
        action: "putIdentityPolicy",
        parameters: {
          Identity: identityArn,
          Policy: JSON.stringify(policy),
          PolicyName: "CognitoSESEmailPolicy",
        },
        physicalResourceId: PhysicalResourceId.of(`policy-${identityArn}`),
      },
      onDelete: {
        service: "SES",
        action: "deleteIdentityPolicy",
        parameters: {
          Identity: identityArn,
          PolicyName: "CognitoSESEmailPolicy",
        },
      },
      policy: AwsCustomResourcePolicy.fromStatements([
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["ses:PutIdentityPolicy", "ses:DeleteIdentityPolicy"],
          resources: ["*"],
        }),
      ]),
    });
  }

  fetchOrCreateUserPool(cdkConfig) {
    const { appName, cognitoUserPoolId, userPoolRemovalPolicy, cognitoSelfSignupEnabled } = cdkConfig;

    let pool;

    if (cognitoUserPoolId) {
      pool = UserPool.fromUserPoolId(this, appName + "-userPool", cognitoUserPoolId);
    } else {
      // NOTE: If changes are made to the props of UserPool, ensure that bin/userPoolConfig.js is updated accordingly.
      pool = new UserPool(this, appName + "-userPool", {
        userPoolName: appName + "-userPool",
        signInCaseSensitive: false,
        removalPolicy: userPoolRemovalPolicy,
        selfSignUpEnabled: cognitoSelfSignupEnabled,
        signInAliases: { username: true },
        autoVerify: { email: true },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
        },
      });
    }

    return pool;
  }

  createUserPoolIdentityProvider(cdkConfig, pool) {
    const { appName, cognitoGoogleClientId, secretsManagerGoogleSecretId } = cdkConfig;

    return new UserPoolIdentityProviderGoogle(this, appName + "-googleIDP", {
      userPool: pool,
      clientId: cognitoGoogleClientId,
      clientSecretValue: SecretValue.secretsManager(secretsManagerGoogleSecretId, {
        jsonField: "client_secret",
      }),
      attributeMapping: {
        givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: ProviderAttribute.GOOGLE_FAMILY_NAME,
        email: ProviderAttribute.GOOGLE_EMAIL,
        profilePicture: ProviderAttribute.GOOGLE_PICTURE,
      },
      scopes: ["email", "profile", "openid"],
    });
  }

  addClientToUserPool(cdkConfig, pool, scopes) {
    const { appName, cognitoGoogleAuthFlow, cognitoCallbackURLs, cognitoPostSignoutURLs } = cdkConfig;
    const supportedIdentityProviders = cognitoGoogleAuthFlow
      ? [UserPoolClientIdentityProvider.COGNITO, UserPoolClientIdentityProvider.GOOGLE]
      : [UserPoolClientIdentityProvider.COGNITO];

    return pool.addClient(appName + "-appClient", {
      supportedIdentityProviders,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: Object.values(cognitoCallbackURLs),
        logoutUrls: Object.values(cognitoPostSignoutURLs),
        scopes,
      },
    });
  }

  fetchOrCreateUserPoolDomain(cdkConfig, pool) {
    const {
      account,
      appName,
      cognitoImportDomainName,
      cognitoHostedDomainType,
      cognitoHostedDomainName,
      hostedZoneCertificateArn,
      hostedZoneId,
      hostedZoneName,
    } = cdkConfig;

    let domain;

    if (cognitoImportDomainName) {
      // import the domain
      domain = UserPoolDomain.fromDomainName(this, appName + "-userPoolDomain", cognitoImportDomainName);
    } else {
      // create the domain

      // A: Currently CDK / Cloudformation doesn't support hosted UI customization.
      // a (very) hacky workaround for that exists here: https://github.com/aws/aws-cdk/issues/6953
      // I might give this a shot later but for now the assosciated hosted ui files exist in ./hostedUI
      // They can be uploaded manually after deployment.
      if (cognitoHostedDomainType === COGNITO_HOSTED_DOMAIN_TYPES.COGNITO) {
        domain = new UserPoolDomain(this, appName + "-userPoolDomain", {
          userPool: pool,
          cognitoDomain: {
            domainPrefix: appName + "-" + account,
          },
        });
      } else {
        const certificate = Certificate.fromCertificateArn(this, "domainCertificate", hostedZoneCertificateArn);
        domain = new UserPoolDomain(this, appName + "-userPoolDomain", {
          userPool: pool,
          customDomain: {
            domainName: cognitoHostedDomainName,
            certificate: certificate,
          },
        });

        new ARecord(this, "userPoolCloudfrontAliasRecord", {
          zone: HostedZone.fromHostedZoneAttributes(this, appName + "-hostedZone", {
            hostedZoneId: hostedZoneId,
            zoneName: hostedZoneName,
          }),
          recordName: cognitoHostedDomainName,
          target: RecordTarget.fromAlias(new UserPoolDomainTarget(domain)),
        });
      }
    }

    return domain;
  }

  createIamUserPoolPolicy(pool, secretArns) {
    const allowListUsers = new PolicyStatement({
      actions: ["cognito-idp:ListUsers"],
      effect: Effect.ALLOW,
      resources: [pool.userPoolArn],
    });

    const allowReadSecrets = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
      resources: secretArns,
    });

    const statements = [allowListUsers, allowReadSecrets];

    return new ManagedPolicy(this, "AuthUserPoolReadAccess", {
      statements,
      description: "Allows read access to the user pool.",
    });
  }

  createSigningSecret(name, description, removalPolicy) {
    return new Secret(this, name, {
      description,
      generateSecretString: {
        passwordLength: 64,
      },
      removalPolicy,
    });
  }
}

export default AuthStack;
