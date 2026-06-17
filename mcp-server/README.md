# QRSimplified MCP Server

A single server that lets users connect QRSimplified to Claude, ChatGPT, Cursor, and any other MCP/GPT-Action-compatible AI tool — using their own QRSimplified account via OAuth.

## What's in this server

| Endpoint | Purpose |
|---|---|
| `GET /oauth/authorize` | Starts the OAuth login flow |
| `GET /oauth/callback` | Cognito redirects here after login |
| `POST /oauth/token` | Issues access tokens to Claude/ChatGPT |
| `POST /mcp` | MCP endpoint for Claude |
| `GET /api/campaign` | REST endpoint for ChatGPT GPT Actions |
| `POST /api/campaign` | ↑ |
| `PUT /api/campaign` | ↑ |
| `DELETE /api/campaign` | ↑ |
| `GET /openapi.json` | OpenAPI spec (ChatGPT reads this) |

## Step 1 — One-time Cognito setup

In AWS Console → Cognito → User Pools → your pool → App Integration:

1. Add a new **App client** (or update the existing one) and enable:
   - ✅ Authorization code grant
   - ✅ Generate a client secret
   - Scopes: `openid`, `email`, `profile`
2. Under **Allowed callback URLs**, add: `https://mcp.qrsimplified.com/oauth/callback`
3. Note down the **Client ID** and **Client secret** — you'll need them in `.env`

## Step 2 — Deploy the server

The server is a plain Node.js Express app. Deploy it anywhere that runs Node:

### Railway (easiest)
1. Create a new project at railway.app
2. Connect this repo, select the `mcp-server/` directory
3. Add the env vars from `.env.example`
4. Railway gives you a public URL → set that as `SERVER_URL`

### Render
Same steps — create a Web Service, point to `mcp-server/`, set env vars.

### Any VPS (DigitalOcean, Hetzner, etc.)
```bash
cd mcp-server
npm install
cp .env.example .env   # fill in your values
node server.js
```
Put it behind nginx with a TLS cert (Let's Encrypt).

## Step 3 — Register with Claude (MCP)

Submit your server to Anthropic's MCP registry:
- URL: https://github.com/anthropics/mcp/blob/main/CONTRIBUTING.md
- You'll provide: your MCP endpoint URL, name, description, OAuth details

While waiting for approval, users can add it manually in Claude settings:
```
MCP Server URL: https://mcp.qrsimplified.com/mcp
```

## Step 4 — Register with ChatGPT (GPT Actions)

1. Go to https://chat.openai.com → Create a GPT → Configure → Add Action
2. Import from URL: `https://mcp.qrsimplified.com/openapi.json`
3. Under **Authentication**, choose **OAuth** and enter:
   - Client ID: `qrsimplified-mcp` (your `MCP_CLIENT_ID`)
   - Client Secret: your `MCP_CLIENT_SECRET`
   - Authorization URL: `https://mcp.qrsimplified.com/oauth/authorize`
   - Token URL: `https://mcp.qrsimplified.com/oauth/token`
   - Scope: `openid email profile`
4. Publish the GPT to the GPT Store

## What users experience

1. User opens Claude or ChatGPT
2. They connect QRSimplified (one-time OAuth login with their existing account)
3. They can now say:
   - *"Create a QR code for my restaurant menu"*
   - *"Which of my campaigns got the most scans today?"*
   - *"Update the Summer Sale QR to point to the new landing page"*

## Production notes

- The in-memory session store in `server.js` resets on every restart. For production, replace `sessions`, `codes`, and `pending` Maps with Redis.
- Cognito id_tokens expire after 1 hour. Add refresh token support (store `refresh_token` alongside `id_token` and call `/oauth2/token` with `grant_type=refresh_token` when you get a 401 from the API).
