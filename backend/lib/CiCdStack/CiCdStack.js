import { Duration, Stack } from "aws-cdk-lib";
import { ManagedPolicy, OpenIdConnectProvider, Role, WebIdentityPrincipal } from "aws-cdk-lib/aws-iam";

const GITHUB_DOMAIN = "token.actions.githubusercontent.com";
const STS_CLIENT_ID = "sts.amazonaws.com";

class CiCdStack extends Stack {
  constructor(scope, id, props) {
    const { cdkConfig } = props;

    super(scope, cdkConfig.appName + "-" + id, props);

    const githubProvider = new OpenIdConnectProvider(this, "githubProvider", {
      url: `https://${GITHUB_DOMAIN}`,
      clientIds: [STS_CLIENT_ID],
      thumbprints: ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"],
    });

    const iamRepoDeployAccess = cdkConfig.ciCdRepositoryConfig.map((r) => {
      return `repo:${r.owner}/${r.repo}:${r.filter ?? "*"}`;
    });

    const conditions = {
      StringLike: {
        [`${GITHUB_DOMAIN}:sub`]: iamRepoDeployAccess,
      },
    };

    new Role(this, "githubDeploymentRole", {
      assumedBy: new WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, conditions),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("PowerUserAccess")],
      roleName: cdkConfig.ciCdDeployRoleName,
      description: "This role is used via Github Actions to deploy with AWS CDK on the target AWS account",
      maxSessionDuration: Duration.hours(1),
    });
  }
}

export default CiCdStack;
