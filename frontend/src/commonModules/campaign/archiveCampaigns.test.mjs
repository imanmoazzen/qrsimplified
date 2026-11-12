import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { API_RESPONSE_TYPES } from "castofly-common/commonConstants.js";
import { CAMPAIGN_STATUS } from "castofly-common/campaigns.js";
import { archiveCampaigns } from "./archiveCampaigns.js";
// Match the app's Babel interop for the installed CommonJS Redux Toolkit build.
const require = createRequire(import.meta.url);
const { code } = require("@babel/core").transformFileSync(
  fileURLToPath(new URL("./store/uiReducer.js", import.meta.url)),
  {
    babelrc: false,
    configFile: false,
    presets: [["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }]],
  }
);
const reducerModule = { exports: {} };
new Function("require", "module", "exports", code)(require, reducerModule, reducerModule.exports);
const { default: reducer, campaignsArchived } = reducerModule.exports;

test("archives each selected code once through the existing API", async () => {
  const calls = [];
  const result = await archiveCampaigns(["a", "b", "a"], async (...args) => {
    calls.push(args);
    return { data: { message: API_RESPONSE_TYPES.SUCCESS } };
  });
  assert.deepEqual(result, { archivedIds: ["a", "b"], failedIds: [] });
  assert.deepEqual(
    calls,
    ["a", "b"].map((campaign_id) => [
      "/campaign",
      {
        method: "PUT",
        mode: "cors",
        data: { campaign_id, fieldsToSet: { status: CAMPAIGN_STATUS.ARCHIVED } },
      },
    ])
  );
});

test("network and API-level failures remain failed without discarding successes", async () => {
  const result = await archiveCampaigns(["success", "network", "api-error", "empty"], async (_, { data }) => {
    if (data.campaign_id === "network") throw new Error("Network unavailable");
    if (data.campaign_id === "empty") return undefined;
    return {
      data: { message: data.campaign_id === "success" ? API_RESPONSE_TYPES.SUCCESS : API_RESPONSE_TYPES.ERROR },
    };
  });
  assert.deepEqual(result, { archivedIds: ["success"], failedIds: ["network", "api-error", "empty"] });
});

test("no selection sends no requests", async () => {
  assert.deepEqual(await archiveCampaigns([], () => assert.fail("Unexpected request")), {
    archivedIds: [],
    failedIds: [],
  });
});

test("archive updates use current Redux state and preserve failed, unselected, and previously archived codes", () => {
  const state = { ...reducer(undefined, { type: "init" }) };
  state.campaigns = [
    { campaign_id: "success", status: CAMPAIGN_STATUS.LIVE, name: "Latest edit" },
    { campaign_id: "failed", status: CAMPAIGN_STATUS.TRIAL },
    { campaign_id: "unselected", status: CAMPAIGN_STATUS.LIVE },
    { campaign_id: "old-archive", status: CAMPAIGN_STATUS.ARCHIVED },
  ];
  const next = reducer(state, campaignsArchived(["success"]));
  assert.deepEqual(
    next.campaigns,
    state.campaigns.map((item) =>
      item.campaign_id === "success" ? { ...item, status: CAMPAIGN_STATUS.ARCHIVED } : item
    )
  );
  assert.equal(state.campaigns[0].status, CAMPAIGN_STATUS.LIVE);
});
