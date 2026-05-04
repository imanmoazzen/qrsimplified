#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = process.env.QRSIMPLIFIED_API_URL;
const JWT_TOKEN = process.env.QRSIMPLIFIED_JWT_TOKEN;

if (!API_URL || !JWT_TOKEN) {
  console.error(
    "Missing required env vars: QRSIMPLIFIED_API_URL and QRSIMPLIFIED_JWT_TOKEN must be set."
  );
  process.exit(1);
}

async function apiFetch(path, options = {}) {
  const url = `${API_URL.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT_TOKEN}`,
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

const server = new McpServer({
  name: "qrsimplified",
  version: "1.0.0",
});

server.tool(
  "list_campaigns",
  "List all your QR code campaigns with visit counts and analytics (today / last 7 days / last 30 days / all time, broken down by country and city).",
  {},
  async () => {
    const data = await apiFetch("/campaign");
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "create_campaign",
  "Create a new QR code campaign. Returns the campaign object including the tracking_link URL that the QR code should point to.",
  {
    name: z.string().describe("Human-readable name for the campaign, e.g. 'Summer Sale 2025'"),
    destination: z.string().url().describe("The URL visitors are redirected to when they scan the QR code"),
  },
  async ({ name, destination }) => {
    const data = await apiFetch("/campaign", {
      method: "POST",
      body: JSON.stringify({ name, destination }),
    });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "update_campaign",
  "Update fields on an existing campaign (e.g. change its destination URL or name).",
  {
    campaign_id: z.string().describe("The ID of the campaign to update"),
    fieldsToSet: z
      .record(z.unknown())
      .describe(
        "Key-value pairs of fields to update, e.g. { \"destination\": \"https://example.com\", \"name\": \"New Name\" }"
      ),
  },
  async ({ campaign_id, fieldsToSet }) => {
    const data = await apiFetch("/campaign", {
      method: "PUT",
      body: JSON.stringify({ campaign_id, fieldsToSet }),
    });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

server.tool(
  "delete_campaign",
  "Permanently delete a campaign and all its visit data.",
  {
    campaign_id: z.string().describe("The ID of the campaign to delete"),
  },
  async ({ campaign_id }) => {
    const data = await apiFetch("/campaign", {
      method: "DELETE",
      body: JSON.stringify({ campaign_id }),
    });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
