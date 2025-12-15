import "react-tooltip/dist/react-tooltip.css";

import "./index.css";
import "./tooltip_overrides.css";

import ReactDOM from "react-dom/client";

import App from "./app/App.js";
import appSettings from "./appSettings.js";
import { AuthModule } from "./commonModules/auth/index.js";
import CampaignModule from "./commonModules/campaign/module/CampaignModule.js";
import { HelpModule } from "./commonModules/help/index.js";
import { MessengerModule } from "./commonModules/messenger/index.js";
import { ProjectRootModule } from "./commonModules/project-root/index.js";
import { ServerModule } from "./commonModules/server/index.js";

const env = appSettings.get("environment");
const isDev = env === "development";

export const root = new ProjectRootModule({ devTools: isDev });
export const auth = new AuthModule({ parentModule: root, name: "auth" }).register();
export const server = new ServerModule({ parentModule: root, authModule: auth, name: "server" }).register();
export const messenger = new MessengerModule({ parentModule: root, name: "message" }).register();

export const helpModule = new HelpModule({
  parentModule: root,
  name: "help",
}).register();

export const campaignModule = new CampaignModule({
  parentModule: root,
  name: "campaign",
}).register();

export const store = root.makeStore();
export const { undo, redo, addProjectEvent } = root.actions;

const docRoot = ReactDOM.createRoot(document.getElementById("root"));
docRoot.render(<App />);
