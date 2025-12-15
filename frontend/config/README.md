# React Configuration

This folder contains the configuration that can vary from environment to environment (or machine to machine).

There are 3 config files here:

- `appSettings.development.json`
- `appSettings.staging.json`
- `appSettings.production.json`.

It should be pretty obvious what environment each is for.

These configuration files are **ONLY** for the React apps. See [eventual link]() for handling configuration in backend code.

**NOTE**: We have a git `pre-commit` hook in `scripts/githooks` that you can copy to `.git/hooks` and it will check your config files when you commit to make sure you didn't make any mistakes.

There are a couple of conventions to be aware of:

- When putting URLs in the config files (an API endpoint, for example), the convention is to **NOT** add a trailing `/` (forward slash). It's up to you to ensure that the code using the setting adds the `/` if it's needed. Note that our git `pre-commit` hook will catch this if you add a `/` by mistake.
- We try to be descriptive with the keys so that they document what they're for.

## What should I put in these files?

You want to put settings in these files that can **vary** from environment to environment.

For example, an API endpoint will differ between develpment,
staging and production. This sort of value should be stored here.

## What should I not put in these files?

Generally, if it's a static value (ie: a constant), it doesn't belong here.

For application-wide constants, see the `castofly-common` folder. Application-wide constants
are typically placed here. For front-end specific constants, checkout out `frontend/src/frontEndConstants.js`
