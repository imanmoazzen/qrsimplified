#!/usr/bin/env node

import QRCode from "qrcode";
import { createServer } from "node:http";

const JSON_RPC_VERSION = "2.0";
const API_SUCCESS = "SUCCESS";

const tools = [
  {
    name: "create_qr_code",
    description:
      "Create a QR Simplified campaign QR code. Returns the campaign id, tracking link, destination, status, and optionally an SVG QR image.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["name", "destination"],
      properties: {
        name: {
          type: "string",
          description: "Human-readable QR code/campaign name.",
        },
        destination: {
          type: "string",
          description: "The URL people should land on after scanning the QR code.",
        },
        include_qr_svg: {
          type: "boolean",
          description: "When true, include an SVG QR image generated from the tracking link.",
          default: true,
        },
        qr_color: {
          type: "string",
          description: "QR foreground color as a CSS color string.",
          default: "#000000",
        },
        background_color: {
          type: "string",
          description: "QR background color as a CSS color string. Use #0000 for transparent.",
          default: "#ffffff",
        },
      },
    },
  },
  {
    name: "delete_qr_code",
    description: "Delete a QR Simplified campaign QR code by campaign id.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["campaign_id"],
      properties: {
        campaign_id: {
          type: "string",
          description: "The campaign_id returned by create_qr_code or list_qr_codes.",
        },
      },
    },
  },
  {
    name: "list_qr_codes",
    description: "List the authenticated user's QR Simplified campaign QR codes.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
];

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getApiConfig() {
  return {
    baseUrl: getRequiredEnv("QRSIMPLIFIED_API_BASE_URL"),
    accessToken: getRequiredEnv("QRSIMPLIFIED_ACCESS_TOKEN"),
  };
}

function buildApiUrl(baseUrl, endpoint) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(endpoint.replace(/^\//, ""), normalizedBase).toString();
}

async function requestFromApi(endpoint, { method = "GET", body } = {}) {
  const { baseUrl, accessToken } = getApiConfig();
  const response = await fetch(buildApiUrl(baseUrl, endpoint), {
    method,
    headers: {
      Authorization: accessToken,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`QR Simplified API returned HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  if (data?.message && data.message !== API_SUCCESS) {
    throw new Error(data.info || `QR Simplified API returned ${data.message}`);
  }

  return data;
}

async function createQrCode(args) {
  const name = requireString(args, "name");
  const destination = requireString(args, "destination");
  validateUrl(destination, "destination");

  const data = await requestFromApi("/campaign", {
    method: "POST",
    body: { name, destination },
  });

  const item = data.item;
  if (!item?.tracking_link) {
    throw new Error("QR Simplified API did not return a tracking_link");
  }

  const includeQrSvg = args.include_qr_svg !== false;
  const result = {
    campaign_id: item.campaign_id,
    name: item.name,
    destination: item.destination,
    tracking_link: item.tracking_link,
    status: item.status,
    creation_time: item.creation_time,
  };

  if (includeQrSvg) {
    const qrSvg = await QRCode.toString(item.tracking_link, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: args.qr_color || "#000000",
        light: args.background_color || "#ffffff",
      },
    });
    result.qr_svg = qrSvg;
    result.qr_svg_data_url = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;
  }

  return result;
}

async function deleteQrCode(args) {
  const campaignId = requireString(args, "campaign_id");
  await requestFromApi("/campaign", {
    method: "DELETE",
    body: { campaign_id: campaignId },
  });

  return {
    deleted: true,
    campaign_id: campaignId,
  };
}

async function listQrCodes() {
  const data = await requestFromApi("/campaign", { method: "GET" });
  return {
    campaigns: data.campaigns ?? [],
  };
}

function requireString(args, key) {
  const value = args?.[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value.trim();
}

function validateUrl(value, key) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error(`${key} must be a valid http(s) URL`);
  }
}

async function callTool(name, args) {
  switch (name) {
    case "create_qr_code":
      return await createQrCode(args);
    case "delete_qr_code":
      return await deleteQrCode(args);
    case "list_qr_codes":
      return await listQrCodes();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleRequest(message) {
  const { id, method, params } = message;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "qrsimplified",
            version: "0.1.0",
          },
        },
      };

    case "notifications/initialized":
      return null;

    case "ping":
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: {},
      };

    case "tools/list":
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: { tools },
      };

    case "tools/call": {
      const result = await callTool(params?.name, params?.arguments ?? {});
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        },
      };
    }

    case "resources/list":
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: { resources: [] },
      };

    case "prompts/list":
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        result: { prompts: [] },
      };

    default:
      return {
        jsonrpc: JSON_RPC_VERSION,
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
  }
}

function errorResponse(id, err) {
  return {
    jsonrpc: JSON_RPC_VERSION,
    id: id ?? null,
    error: {
      code: -32000,
      message: err?.message || "Unknown error",
    },
  };
}

function writeMessage(message) {
  if (!message) return;
  const payload = JSON.stringify(message);
  const length = Buffer.byteLength(payload, "utf8");
  process.stdout.write(`Content-Length: ${length}\r\n\r\n${payload}`);
}

let buffer = Buffer.alloc(0);

function startStdioServer() {
  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    void drainBuffer();
  });

  process.stdin.resume();
}

async function drainBuffer() {
  while (buffer.length > 0) {
    const message = readNextMessage();
    if (!message) return;

    try {
      const response = await handleRequest(message);
      writeMessage(response);
    } catch (err) {
      writeMessage(errorResponse(message?.id, err));
    }
  }
}

function readNextMessage() {
  const headerEnd = buffer.indexOf("\r\n\r\n");
  if (headerEnd !== -1) {
    const header = buffer.slice(0, headerEnd).toString("utf8");
    const match = header.match(/Content-Length:\s*(\d+)/i);
    if (!match) {
      throw new Error("Missing Content-Length header");
    }

    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (buffer.length < bodyEnd) return null;

    const body = buffer.slice(bodyStart, bodyEnd).toString("utf8");
    buffer = buffer.slice(bodyEnd);
    return JSON.parse(body);
  }

  const newlineIndex = buffer.indexOf("\n");
  if (newlineIndex === -1) return null;

  const line = buffer.slice(0, newlineIndex).toString("utf8").trim();
  buffer = buffer.slice(newlineIndex + 1);
  if (!line) return null;
  return JSON.parse(line);
}

function startHttpServer() {
  const port = Number(process.env.QRSIMPLIFIED_MCP_PORT || 3737);
  const authToken = process.env.QRSIMPLIFIED_MCP_AUTH_TOKEN;

  const server = createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        writeJsonResponse(response, 200, { ok: true, name: "qrsimplified" });
        return;
      }

      if (request.method !== "POST" || request.url !== "/mcp") {
        writeJsonResponse(response, 404, { error: "Not found" });
        return;
      }

      if (authToken) {
        const expected = `Bearer ${authToken}`;
        if (request.headers.authorization !== expected) {
          writeJsonResponse(response, 401, { error: "Unauthorized" });
          return;
        }
      }

      const body = await readRequestBody(request);
      const message = JSON.parse(body);
      const result = Array.isArray(message)
        ? await Promise.all(message.map((item) => handleRequest(item).catch((err) => errorResponse(item?.id, err))))
        : await handleRequest(message);

      writeJsonResponse(response, 200, result);
    } catch (err) {
      writeJsonResponse(response, 400, errorResponse(null, err));
    }
  });

  server.listen(port, () => {
    console.error(`QR Simplified MCP HTTP server listening on http://localhost:${port}/mcp`);
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        reject(new Error("Request body is too large"));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function writeJsonResponse(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
}

if (process.argv.includes("--http")) {
  startHttpServer();
} else {
  startStdioServer();
}
