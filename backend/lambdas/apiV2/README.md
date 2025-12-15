# ApiV2Castofly

This project is the main API lambda used by the application.

# To Build

Just run `npm run build` from the root of this app. This will use `esbuild` to transpile the javascript code into a single CommonJS file.

# To Deploy

For deploying this (and other lambda functions) to your dev environment just run `npm run deploy-dev`. For deployment to production or staging, please deploy the entire CDK app instead of just deploying individual lambdas.
