# QR Simplified MCP Server

This package exposes QR Simplified campaign QR operations as MCP tools for clients such as Claude Desktop and GPT-compatible MCP hosts.

## Tools

- `create_qr_code`: creates a QR Simplified campaign and returns `campaign_id`, `tracking_link`, `destination`, `status`, and an optional SVG QR image.
- `delete_qr_code`: deletes a QR Simplified campaign by `campaign_id`.
- `list_qr_codes`: lists the authenticated user's active campaign QR codes.

## Setup

```bash
cd mcp/qrsimplified
npm install
```

Set these environment variables in your MCP client config:

- `QRSIMPLIFIED_API_BASE_URL`: API v2 base URL, for example `https://nprjpm16wd.execute-api.us-east-1.amazonaws.com/default/`.
- `QRSIMPLIFIED_ACCESS_TOKEN`: the Cognito access token for the QR Simplified user. The existing API expects the raw JWT in the `Authorization` header, without a `Bearer ` prefix.

## Local Stdio Mode

Use this for desktop MCP clients that launch the server as a local process:

```bash
npm --prefix mcp/qrsimplified start
```

## Claude Desktop Example

```json
{
  "mcpServers": {
    "qrsimplified": {
      "command": "node",
      "args": [
        "C:\\Users\\sphac\\OneDrive\\Desktop\\qrsimplified\\codebase\\qrsimplified\\mcp\\qrsimplified\\src\\index.js"
      ],
      "env": {
        "QRSIMPLIFIED_API_BASE_URL": "https://nprjpm16wd.execute-api.us-east-1.amazonaws.com/default/",
        "QRSIMPLIFIED_ACCESS_TOKEN": "paste-access-token-here"
      }
    }
  }
}
```

## HTTP Mode

Use this when hosting the MCP server behind HTTPS:

```bash
QRSIMPLIFIED_MCP_PORT=3737 npm --prefix mcp/qrsimplified run start:http
```

The HTTP endpoint is:

```text
POST /mcp
GET /health
```

Optionally set `QRSIMPLIFIED_MCP_AUTH_TOKEN`. When set, clients must send:

```text
Authorization: Bearer <QRSIMPLIFIED_MCP_AUTH_TOKEN>
```

This HTTP mode is useful for staging and internal deployments. For a public, multi-user MCP, add per-user OAuth or API-key exchange so each caller's QR codes are created in their own QR Simplified account. A single `QRSIMPLIFIED_ACCESS_TOKEN` makes every MCP caller act as the same QR Simplified user.

## Notes

The MCP server is intentionally a thin wrapper around the existing authenticated API:

- `POST /campaign` for create.
- `GET /campaign` for list.
- `DELETE /campaign` for delete.

This keeps QR ownership, credits, trial/live status, tracking links, analytics, and deletion behavior in the existing QR Simplified backend.
