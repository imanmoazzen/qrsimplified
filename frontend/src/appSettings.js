import appSettings from "./appSettings.json";

class ApplicationSettings {
  constructor() {
    this.appSettings = appSettings;
  }

  get(key) {
    return this.appSettings[key];
  }

  isDevelopment() {
    return this._isEnvironment("development");
  }

  isProduction() {
    return this._isEnvironment("production");
  }

  isStaging() {
    return this._isEnvironment("staging");
  }

  _isEnvironment(environmentName) {
    return this.appSettings["environment"] === environmentName;
  }
}

export default new ApplicationSettings();
