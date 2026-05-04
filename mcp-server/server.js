import crypto from "crypto";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const {
  COGNITO_DOMAIN,        // e.g. https://auth.qrsimplified.com
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  SERVER_URL,            // e.g. https://mcp.qrsimplified.com
  API_URL,               // e.g. https://api.qrsimplified.com/prod/v2
  MCP_CLIENT_ID = "qrsimplified-mcp",
  MCP_CLIENT_SECRET,     // secret Claude/ChatGPT use when calling /oauth/token
  PORT = 3000,
} = process.env;

const COGNITO_REDIRECT_URI = `${SERVER_URL}/oauth/callback`;

// ─── Stateless token helpers ──────────────────────────────────────────────────
//
// All state is encrypted into the tokens themselves — no server-side storage
// needed, so this works perfectly on Vercel's serverless platform.

function deriveKey() {
  return crypto.scryptSync(MCP_CLIENT_SECRET, "qrsimplified-salt", 32);
}

function encrypt(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString("base64url");
}

function decrypt(token) {
  try {
    const buf = Buffer.from(token, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey(), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(plain.toString("utf8"));
  } catch {
    return null;
  }
}

// Encode { callbackRedirectUri, clientState } into the OAuth state param so
// we don't need to store anything server-side between /authorize and /callback.
function encodeOAuthState(data) {
  return encrypt(data);
}

function decodeOAuthState(state) {
  return decrypt(state);
}

// The "code" we return to Claude/ChatGPT embeds the Cognito id_token + expiry.
function makeCode(idToken) {
  return encrypt({ idToken, exp: Date.now() + 5 * 60 * 1000 }); // 5-min expiry
}

function redeemCode(code) {
  const payload = decrypt(code);
  if (!payload || Date.now() > payload.exp) return null;
  return payload.idToken;
}

// The final access_token Claude/ChatGPT send on every request also embeds the
// Cognito id_token so we never need to look anything up.
function makeAccessToken(idToken) {
  return encrypt({ idToken, exp: Date.now() + 60 * 60 * 1000 }); // 1-hour expiry
}

function getIdTokenFromAccessToken(accessToken) {
  if (!accessToken) return null;
  const payload = decrypt(accessToken);
  if (!payload || Date.now() > payload.exp) return null;
  return payload.idToken;
}

// ─── Request auth helper ──────────────────────────────────────────────────────

function getIdToken(req) {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();
  return getIdTokenFromAccessToken(bearer);
}

// ─── API proxy helper ─────────────────────────────────────────────────────────

async function apiRequest(idToken, path, { method = "GET", body } = {}) {
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

// ─── OAuth 2.0 ────────────────────────────────────────────────────────────────

app.get("/oauth/authorize", (req, res) => {
  const { redirect_uri, state: clientState, client_id } = req.query;

  if (client_id !== MCP_CLIENT_ID) {
    return res.status(400).send("Unknown client_id");
  }

  // Encode the caller's redirect_uri + state into our state param (stateless)
  const ourState = encodeOAuthState({ callbackRedirectUri: redirect_uri, clientState });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: COGNITO_CLIENT_ID,
    redirect_uri: COGNITO_REDIRECT_URI,
    scope: "openid email profile",
    state: ourState,
  });

  res.redirect(`${COGNITO_DOMAIN}/oauth2/authorize?${params}`);
});

app.get("/oauth/callback", async (req, res) => {
  const { code, state } = req.query;
  const stateData = decodeOAuthState(state);

  if (!code || !stateData) {
    return res.status(400).send("Invalid OAuth callback");
  }

  try {
    const tokenRes = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: COGNITO_CLIENT_ID,
        client_secret: COGNITO_CLIENT_SECRET,
        redirect_uri: COGNITO_REDIRECT_URI,
        code,
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.id_token) throw new Error(JSON.stringify(tokens));

    // Issue our own short-lived code (carries the id_token encrypted inside)
    const ourCode = makeCode(tokens.id_token);

    const params = new URLSearchParams({
      code: ourCode,
      state: stateData.clientState ?? "",
    });

    res.redirect(`${stateData.callbackRedirectUri}?${params}`);
  } catch (err) {
    res.status(500).send(`OAuth error: ${err.message}`);
  }
});

app.post("/oauth/token", (req, res) => {
  const { grant_type, code, client_id, client_secret } = req.body;

  if (client_id !== MCP_CLIENT_ID || client_secret !== MCP_CLIENT_SECRET) {
    return res.status(401).json({ error: "invalid_client" });
  }
  if (grant_type !== "authorization_code") {
    return res.status(400).json({ error: "unsupported_grant_type" });
  }

  const idToken = redeemCode(code);
  if (!idToken) return res.status(400).json({ error: "invalid_grant" });

  res.json({
    access_token: makeAccessToken(idToken),
    token_type: "bearer",
    expires_in: 3600,
  });
});

// ─── MCP endpoint (Claude) ────────────────────────────────────────────────────

function buildMcpServer(idToken) {
  const server = new McpServer({ name: "qrsimplified", version: "1.0.0" });

  server.tool(
    "list_campaigns",
    "List all your QRSimplified campaigns with visit counts and analytics (today / last 7 days / last 30 days / all time, by country and city).",
    {},
    async () => {
      const data = await apiRequest(idToken, "/campaign");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_campaign",
    "Create a new QR code campaign. Returns the campaign including the tracking_link URL to encode into the QR code.",
    {
      name: z.string().describe('Campaign name, e.g. "Summer Sale 2025"'),
      destination: z.string().url().describe("URL visitors land on after scanning the QR code"),
    },
    async ({ name, destination }) => {
      const data = await apiRequest(idToken, "/campaign", {
        method: "POST",
        body: { name, destination },
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_campaign",
    "Update a campaign — change its destination URL, name, or other fields.",
    {
      campaign_id: z.string().describe("ID of the campaign to update"),
      fieldsToSet: z
        .record(z.unknown())
        .describe('Key-value pairs to update, e.g. { "destination": "https://new-url.com" }'),
    },
    async ({ campaign_id, fieldsToSet }) => {
      const data = await apiRequest(idToken, "/campaign", {
        method: "PUT",
        body: { campaign_id, fieldsToSet },
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_campaign",
    "Permanently delete a campaign and all its visit data.",
    {
      campaign_id: z.string().describe("ID of the campaign to delete"),
    },
    async ({ campaign_id }) => {
      const data = await apiRequest(idToken, "/campaign", {
        method: "DELETE",
        body: { campaign_id },
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  return server;
}

async function handleMcp(req, res) {
  const idToken = getIdToken(req);
  if (!idToken) {
    return res.status(401).json({ error: "Unauthorized — connect your QRSimplified account first" });
  }
  const server = buildMcpServer(idToken);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

app.post("/mcp", handleMcp);
app.get("/mcp", handleMcp);

// ─── REST proxy for ChatGPT GPT Actions ──────────────────────────────────────

app.get("/api/campaign", async (req, res) => {
  const idToken = getIdToken(req);
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  res.json(await apiRequest(idToken, "/campaign"));
});

app.post("/api/campaign", async (req, res) => {
  const idToken = getIdToken(req);
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  res.json(await apiRequest(idToken, "/campaign", { method: "POST", body: req.body }));
});

app.put("/api/campaign", async (req, res) => {
  const idToken = getIdToken(req);
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  res.json(await apiRequest(idToken, "/campaign", { method: "PUT", body: req.body }));
});

app.delete("/api/campaign", async (req, res) => {
  const idToken = getIdToken(req);
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });
  res.json(await apiRequest(idToken, "/campaign", { method: "DELETE", body: req.body }));
});

// ─── OpenAPI spec (ChatGPT reads this) ───────────────────────────────────────

app.get("/openapi.json", (req, res) => {
  const base = SERVER_URL ?? `${req.protocol}://${req.get("host")}`;
  res.json({
    openapi: "3.1.0",
    info: {
      title: "QRSimplified",
      description: "Create and manage trackable QR code campaigns.",
      version: "1.0.0",
    },
    servers: [{ url: base }],
    paths: {
      "/api/campaign": {
        get: {
          operationId: "listCampaigns",
          summary: "List all QR campaigns",
          description: "Returns all campaigns with visit counts and analytics.",
          responses: {
            200: { description: "Campaign list", content: { "application/json": { schema: { type: "object" } } } },
          },
        },
        post: {
          operationId: "createCampaign",
          summary: "Create a QR campaign",
          description: "Creates a campaign and returns a tracking_link URL to encode into the QR code.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "destination"],
                  properties: {
                    name: { type: "string", description: "Campaign name" },
                    destination: { type: "string", format: "uri", description: "URL to redirect scanners to" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Created campaign", content: { "application/json": { schema: { type: "object" } } } },
          },
        },
        put: {
          operationId: "updateCampaign",
          summary: "Update a campaign",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["campaign_id", "fieldsToSet"],
                  properties: {
                    campaign_id: { type: "string" },
                    fieldsToSet: { type: "object", description: "Fields to update" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Update result", content: { "application/json": { schema: { type: "object" } } } },
          },
        },
        delete: {
          operationId: "deleteCampaign",
          summary: "Delete a campaign",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["campaign_id"],
                  properties: { campaign_id: { type: "string" } },
                },
              },
            },
          },
          responses: {
            200: { description: "Delete result", content: { "application/json": { schema: { type: "object" } } } },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        oauth2: {
          type: "oauth2",
          flows: {
            authorizationCode: {
              authorizationUrl: `${base}/oauth/authorize`,
              tokenUrl: `${base}/oauth/token`,
              scopes: { openid: "OpenID Connect", email: "Email address", profile: "Profile info" },
            },
          },
        },
      },
    },
    security: [{ oauth2: ["openid", "email", "profile"] }],
  });
});

app.get("/", (req, res) => {
  const base = SERVER_URL ?? `${req.protocol}://${req.get("host")}`;
  res.json({
    name: "QRSimplified MCP Server",
    mcp_endpoint: `${base}/mcp`,
    openapi_spec: `${base}/openapi.json`,
    oauth_authorize: `${base}/oauth/authorize`,
    oauth_token: `${base}/oauth/token`,
  });
});

// On Vercel, export the app — Vercel handles the HTTP server itself.
// Locally, start the server normally.
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log(`QRSimplified MCP server listening on port ${PORT}`));
}

export default app;
