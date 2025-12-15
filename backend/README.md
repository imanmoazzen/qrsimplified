# /braveheart/backend

This folder contains a CDK app which defines the backend for the Castofly App.

## Usage

Once you've completed the setup instructions listed below, deploy to your own development environment using `npm run deploy-dev` or `npm run deploy-dev-no-install` if you're sure that all of your packages are up to date. I suggest running `npm run deploy-dev` each time you pull from another branch.

For convenience during development, if all you've changed is lambda code you can deploy individual lambda functions using the `npm run deploy-dev` script defined inside each folder.

## First-Time Setup

### Setting up your AWS CLI Credentials

Prior to deploying anywhere, you'll need to ensure that your AWS CLI credentials are set-up appropriately and that you can access your AWS account through the AWS console GUI. We use AWS's SSO with Google as our Identity Provider to provide seamless access to AWS.

## Set up AWS SSO

### To Access the AWS Console for your development account

1. You should have already been set-up with a Google account (`you@castofly.com`). If not, talk to Iman.
2. As a part of setting up your Google account, Iman should have also added you to AWS as an employee.
3. Go to [this](https://castofly.awsapps.com/start) page and bookmark it. This is our launch point for accessing our AWS accounts. You should be prompted to login to your Google account if you are not already logged in. This page is how you gain access to the GUI AWS console for your development account.
4. It should be obvious which development account is yours, but if it is not clear, check with Matt.
5. By default, you're also granted access to other developer accounts and (in some cases) access to staging and production accounts.

### Setup the AWS CLI on your local machine

In order to make changes to your backend infrastructure, you'll need to ensure that CDK can interact with the AWS APIs. It does this by using the credentials from SSO.

Follow the instructions outlined [here](https://docs.google.com/document/d/1YS1fHn9TLsrwSFetwgh1pOlE4LDyV39cXLTgZCJp81Y/edit#heading=h.y2tb5r2rkpx6) to set this up.

### Daily workflow with AWS

Because we use SSO and short-lived access tokens, after 12 hours, you will need to login to AWS again. Read [this](https://docs.google.com/document/d/1YS1fHn9TLsrwSFetwgh1pOlE4LDyV39cXLTgZCJp81Y/edit#heading=h.4xcztmuk71cy) for more information about how AWS SSO affects your workflow.

### Deploying to Your Own Environment

Prior to attempting to deploy to your dev environment, you'll need to make a `braveheart/backend/.env.development` file. Start by copying the `braveheart/backend/.env.example` file and rename it, filling in the appropriate values for your AWS developer account. The values are described below.

## Development Environment Settings

You should have a `.env.development` file in `braveheart/backend` that you created by copying `braveheart/backend/.env.example`.

The following are the key/values it contains:

1. AWS_CDK_ACCOUNT=\<YOUR DEV AWS ACCOUNT\> (**REQUIRED**) - This is needed for CDK to handle deployments to your AWS environment
2. AWS_CDK_REGION=\<YOUR DEV AWS REGION\> (**REQUIRED**) - This is needed for CDK to handle deployments to your AWS environment
3. NOTIFICATION_EMAIL=\<YOUR DEV EMAIL\> (**NOT REQUIRED**) - This email is used to send emails from your AWS environment.
4. AWS_SLACK_NOTIFICATIONS_ENABLED=\<true/false\> (**NOT REQUIRED**) - This is used to enable Slack alert notifications from your AWS environment. This should only be enabled if you're working on changing or testing the Slack notifications. Read more [here](#alerts-and-slack-notifications).
5. GOOGLE_AUTH_FLOW_ENABLED=\<true/false: is the google auth flow enabled in your dev environment\> (**NOT REQUIRED**)
6. COGNITO_GOOGLE_CLIENT_ID=\<Provide if GOOGLE_AUTH_FLOW_ENABLED: the id of your google client\> (**NOT REQUIRED**)
7. SECRETS_MANAGER_GOOGLE_SECRET_ID=\<Provide if GOOGLE_AUTH_FLOW_ENABLED: the ARN of the AWS Secrets Manager secret storing the google auth secret\> (**NOT REQUIRED**)
8. STRIPE_SIGNING_KEY=\<Provide the signing key of your webhook from https://dashboard.stripe.com/test/webhooks. See stripeWebhook lambda for more details\> (**NOT REQUIRED**)

Once you've configured `braveheart/backend/.env.development`, consult `braveheart/backend/package.json` for a list of available scripts. When deploying to your dev environment for the first time, run `npm run fresh-deploy-dev` for the necessary first-time setup.

Afterwards you can just use `npm run deploy-dev`, or `npm run deploy-dev-no-install` if you're sure that all of your packages are up to date.

I suggest running `npm run deploy-dev` each time you pull from another branch.

In each lambda function you can also run `npm run deploy-dev` to deploy only that lambda function's code to your development environment; this skips running CDK so it takes seconds rather than minutes, but it introduces [stack drift](#avoiding-stack-drift) so it shouldn't be used outside of development.

After `npm run deploy-dev-fresh-deploy` or `npm run deploy-dev` has run, you can switch to the `/frontend` directory and run `npm run start-app` to start the primary frontend app. There are a few other frontends, but for now, this is the one to focus on.

Finally, once you have the app running you'll need an account to sign in as; Cognito is used for authentication for the app, but on the dev environments self-signup is disabled for security reasons. To create an account you need to navigate to the [Cognito](https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools?region=us-east-1) page of the AWS console, click the `castofly-userPool`, and then click the `Create user` button on this page. Supply a user name, email address, and set a temporary password here. Once you've signed in for the first time Cognito will prompt you to change it.

So in summary, to deploy to a dev environment **for the first time**:

1.  Setup your dev AWS account that you can access via the AWS Console. This will be used as your dev acccount.
2.  Setup AWS SSO and ensure that you have a profile called `development` that points to your development AWS account.
3.  Create a `.env.development` file in `braveheart/backend` by copying the `braveheart/backend/.env.example` file, and setting the values appropriately. You can learn more about the values in the file [here](#development-environment-settings).
4.  Navigate to `braveheart/backend` and run `npm run fresh-deploy-dev` in the terminal.
5.  When Step #4 has completed, navigate to `braveheart/frontend` and run `npm run start-app` in the terminal.
6.  Create a [Cognito](https://us-east-1.console.aws.amazon.com/cognito/v2/idp/user-pools?region=us-east-1) user account to use during testing.
7.  Done!

## Enabling the Google Authentication Flow In Your Development Environment

Please refer to [this](../docs//google_oauth_setup.md) README

## Alerts and Slack Notifications

We use AWS's Chatbot to send CloudWatch alerts to Slack. Ordinarily, this is only enabled for production and alerts can be found in `#aws-alerts-production`.

If you need to work on the Chatbot -> Slack code, you can enable it in either your development evironment or in staging by setting
`AWS_SLACK_NOTIFICATIONS_ENABLED=true` in either `.env.development` or `.env.staging`. When enabled, the corresponding Slack channels are `#aws-alerts-dev` and `#aws-alerts-staging`.

Note that you must first ensure that Slack has been connected to the appropriate AWS account first. To do that, go [here](https://us-east-2.console.aws.amazon.com/chatbot/home?region=us-east-1) and follow the instructions.
