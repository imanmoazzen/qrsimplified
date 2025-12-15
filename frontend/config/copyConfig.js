import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { ENVS } from "../../backend/lib/constants.js";

const env = process.argv[2];
if (!Object.values(ENVS).includes(env)) {
  console.error(`Invalid env: ${env} specified. Must be one of ${Object.values(ENVS).join(", ")}`);
  // Exiting the process with a non-zero value will ensure that the next command will not run
  // For example, in the command: "node ./config/copyConfig.js development && react-scripts start"
  // If this exits with 1, react-scripts start will not run
  process.exit(1);
}

const configPath = path.resolve("config");
const srcPath = path.resolve("src");

// Returns an object representing the JSON in the contained file;
// Returns an empty object if the path is undefined or the file doesn't exist
const readJSON = (path) => {
  return new Promise((resolve, reject) => {
    if (!path) {
      resolve({});
      return;
    }
    if (!fs.existsSync(path)) {
      resolve({});
      return;
    }
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
};

// Necessary for our codebases expectations of the config file
const stripTrailingSlash = (str) => (str.endsWith("/") ? str.slice(0, -1) : str);

// This function creates a new `appSettings.${environment}.json` by combining the existing file, the output of CDK,
// Order of precedence (greatest to least):
// 1. `backend/cdk-output.${environment}.json`  (if it exists)
// 2. `appSettings.${environment}.json`         (if it exists)
const generateAppSettings = async (cdkOutPath, appSettingsPath) => {
  const [cdkOut, appSettings] = await Promise.all([readJSON(cdkOutPath), readJSON(appSettingsPath)]);

  let cdkAppSettings = {};
  if (cdkOut) {
    cdkAppSettings = cdkOut;
    for (const [key, value] of Object.entries(cdkAppSettings)) {
      if (typeof value === "string") cdkAppSettings[key] = stripTrailingSlash(value);
    }
  }

  const combinedAppSettings = {
    ...appSettings,
    ...cdkAppSettings,
  };

  fs.writeFileSync(appSettingsPath, JSON.stringify(combinedAppSettings));
  execSync(`npx prettier "${appSettingsPath}" --write`);
};

const copyOverConfig = (configFileName) => {
  const srcConfigFilePath = path.join(configPath, configFileName);
  const destConfigFilePath = path.join(srcPath, "appSettings.json");
  if (fs.existsSync(srcConfigFilePath)) {
    if (fs.existsSync(destConfigFilePath)) {
      fs.rmSync(destConfigFilePath);
    }
    fs.copyFileSync(srcConfigFilePath, destConfigFilePath);
  } else {
    console.error(`Config source file: ${srcConfigFilePath} does not exist!`);
    process.exit(1);
  }
};

const cdkOutputPath = path.join("..", "backend", `cdk-output.${env}.json`);
const appSettingsPath = path.join(configPath, `appSettings.${env}.json`);
await generateAppSettings(cdkOutputPath, appSettingsPath);
copyOverConfig(`appSettings.${env}.json`);

process.exit(0);
