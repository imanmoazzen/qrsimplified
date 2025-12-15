import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import * as url from "url";

import { SSM } from "@aws-sdk/client-ssm";
import { fromSSO } from "@aws-sdk/credential-provider-sso";

import { ENVS } from "../lib/constants.js";
import { getEnvironmentConfig } from "./environmentConfig.js";

const environmentName = process.argv[2];
const profile = process.argv[3];

if (!environmentName)
  throw new Error(`No environment name was passed. It must be one of ${Object.values(ENVS).join(", ")}`);

if (!Object.values(ENVS).includes(environmentName))
  throw new Error(
    `Invalid environment name was passed: ${environmentName}. It must be one of ${Object.values(ENVS).join(", ")}`
  );

const { environment, region, ...cdkConfig } = await getEnvironmentConfig(environmentName);

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const inputFileName = resolve(__dirname, "..", `cdk-output.${environment}.ssm.json`);
const SSMParametersRefs = JSON.parse(readFileSync(inputFileName, "utf8"));

let ssm;
if (environment === ENVS.development) {
  ssm = new SSM({ credentials: fromSSO({ profile }), region });
} else {
  ssm = new SSM({ region });
}

const getParameters = async (refs) => {
  const parameters = Object.entries(refs).splice(0, 10);
  const names = parameters.map(([, value]) => value);

  try {
    const { Parameters } = await ssm.getParameters({
      Names: names,
      WithDecryption: true,
    });

    const params = Parameters.reduce((acc, { Name, Value }) => {
      {
        acc[getKeyByValue(refs, Name)] = Value;
        return acc;
      }
    }, {});

    parameters.map(([key]) => key).forEach((key) => delete refs[key]);

    return params;
  } catch (e) {
    console.error(e);
  }
};

const getKeyByValue = (obj, value) => Object.keys(obj).find((key) => obj[key] === value);

if (existsSync(inputFileName)) {
  console.log("Fetching SSM parameters...");

  let appSettings = {};

  do {
    appSettings = {
      ...appSettings,
      ...(await getParameters(SSMParametersRefs)),
    };
  } while (Object.keys(SSMParametersRefs).length > 0);

  for (const [key, value] of Object.entries(appSettings)) {
    if (["cognito.token_scopes"].includes(key)) {
      appSettings[key] = value.split(",");
    }
  }

  appSettings = {
    ...appSettings,
    "aws.region": cdkConfig.region,
    "app_base_url": cdkConfig.appBaseUrl,
  };

  console.log(`Writing app settings to file "cdk-output.${environment}.json"`);
  writeFileSync(resolve(__dirname, "..", `cdk-output.${environment}.json`), JSON.stringify(appSettings, null, 2));

  console.log("Done.");
}
