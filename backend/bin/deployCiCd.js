import { App } from "aws-cdk-lib";

import CiCdStack from "../lib/CiCdStack/CiCdStack.js";
import { getEnvironmentConfig } from "./environmentConfig.js";

const app = new App();
const deploymentEnv = app.node.tryGetContext("deployment-env");

if (!deploymentEnv) throw new Error("Missing context: --context deployment-env=<env>");

const cdkConfig = await getEnvironmentConfig(deploymentEnv);
if (!cdkConfig.enableCiCdStack)
  throw new Error("there is no need to have cicd stack for this deployment environement!");

const env = { account: cdkConfig.account, region: cdkConfig.region };

new CiCdStack(app, "cicd", { env, cdkConfig });
