# Braveheart

[![Lint And Test](https://github.com/Castofly-Technologies/braveheart/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/Castofly-Technologies/braveheart/actions/workflows/lint-and-test.yml)

This repository is a monorepo containing the client-side code for `app.castofly.com`, `tv.castofly.com`, and `tools.castofly.com` as well as a CDK app defining the serverside resources used in the apps' operation.

## Other Documentation

- [Overall Architecture](./docs/architecture.md)
- [Backend](./backend/README.md)
- [CDK](./docs/cdk.md);
- [Castofly Modules](./docs/modules.md)
- [Sample User Journey (Outdated)](./docs/user_journey.md)
- [Persistence and Collaboration](./docs/persistence_and_collaboration.md)
- [Projects, Permissions, and Ownership](./docs/projects_permissions_ownership.md)
- [Authentication](./docs/authentication.md)
- [Subscriptions](./docs/subscriptions.md)
- [Tables and Buckets](./docs/tables_and_buckets.md)
- [Audio Editing and Proxies](./docs/audio_editing_and_proxies.md)
- [Enabling and Disabling Maintenance Mode](./docs/maintenance.md)
- [CI/CD Information](./docs/ci_cd.md)
- [AI Video Generation](./docs/ai_video_generation.md)
- [Google OAuth Setup for developers](./docs/google_oauth_setup.md)
- [Playback Functionality](./docs/play.md)
- [Video Generation](./docs/video_generation.md)
- [Lambda Bundling](./docs/lambda-bundling.md)

## Architecture Overview

The entire system primarily uses AWS services. The webapp sites (`app.castofly.com`, `tv.castofly.com`, and `tools.castofly.com`) are hosted using Cloudfront CDN, using an S3 bucket as its source. The URL routing is handled by Route 53.

Cognito is used to provide authentication with federated login options (currently only Google) to the connecting user.

Once the user has connected, the clientside interacts with the backend via HTTP requests to API Gateway endpoints. The API Gateway endpoints invoke Lambda functions, which can then interact with eachother, Cognito, and various DynamoDB tables or S3 buckets to provide the needed functionality to the client.

## Testing

_NOTE: Some work has been done to enable unit testing in this codebase; however at the time of writing (February 2025) only a single test file still exists. Should additional tests be added later, they can be added with the existing system, and any tests added will be automatically run during the CI/CD pipeline._

This system uses [Jest](https://jestjs.io/) on the front-end for unit testing. Currently, the back-end code is not tested.

- Tests can be run from the root of the front-end by running `npm test`. This will by default run all tests that are found inside the front-end.

- Tests should be placed within a folder called `test` and test files should end in `*.test.js`. For example, `myThing.test.js` would contain tests related to the code found in `myThing.js`. A `test` folder can be anywhere. For example, if you want to test the middleware under `./frontend/src/commonModules/persistence/store/middleware` called `projectUnloadMiddleware.js`, then you could place your tests in `./frontend/src/commonModules/persistence/store/middleware/test/projectUnloadMiddleware.test.js` and it would be picked up automatically by Jest.

You can also run `npm run coverage` and Jest will run any tests it finds and print out a code coverage report. The report can also be found in the `coverage` folder in the `braveheart/frontend/`. This will tell you how much of your code is covered by your unit tests.

Note that when writing Jest tests, you don't have to import anything because things like `expect`, `it` and `describe` are automatically injected into the global world. This is set in `jest.config.js`.

### Copying projects between environments

For certain kinds of integration testing it's useful to be able to copy over projects from one environment to another (e.g. from production to staging/development). On the staging and development environments a tool is available to do that using the console. To do so, find the ID of the project you'd like to copy over, ensure that it's been published at least once (this tool copies the most recent snapshot- if you made changes that you want to copy over, please republish the project), open up the client app on your desired environment, and type this in to copy from staging:

```
window.copyFromStaging("PROJECT-ID-HERE")
```

Or, to copy from production:

```
window.copyFromProd("PROJECT-ID-HERE")
```

It will then copy the project over from the target environment into a new project in this environment and automatically refresh the dashboard when done. Please note that if the project is very large, the network request may time out- if this happens, give it a few minutes and then refresh the dashboard manually, and if the copy was sucessful the new project should be visible.

## Client-side

The client-side app is contained in `braveheart/frontend`. It was built using create-react-app and makes extensive use of Redux, with a custom-made class-based module system used to extend functionality in a more predictable manner. The contents of this folder builds into the site for either `app.castofly.com`, `tv.castofly.com`, or `tools.castofly.com` depending on the setting of an environment variable. Deployment to production is crudely automated using some package.json scripts; consult `frontend/package.json` for a listing of the available scripts.

The majority of the code on the client-side is arranged into 'modules'. More info on that [here](./docs/modules.md).

**IMPORTANT** Note that because we have more environments than just `development` and `production`, we **DO NOT** use `process.env.NODE_ENV` to check the current environment. That is because `process.env.NODE_ENV` is set automatically and cannot be changed. Instead, we use `appSettings.get('environment')`, which is guaranteed to be set correctly.

# Deployment

All of our code is deployed using our CI/CD pipeline. For details, please see [here](./docs/ci_cd.md).
