export default {
  collectCoverage: false,
  verbose: true,
  collectCoverageFrom: ["src/**/*.{js,jsx}"],
  coverageDirectory: "coverage",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  displayName: {
    name: "Front-end",
    color: "blue",
  },
  errorOnDeprecated: true,
  injectGlobals: true,
  notify: true,
  notifyMode: "always",
  randomize: true,
};
