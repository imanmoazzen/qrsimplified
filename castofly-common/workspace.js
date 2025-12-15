const WORKSPACE_SECRET = "scriptover-7dcf8b7a4ee5";

export const obfuscate = (string) => {
  const combined = `${WORKSPACE_SECRET}:${string}`;
  return Buffer.from(combined).toString("base64");
};

export const deobfuscate = (encoded) => {
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const [secret, email] = decoded.split(":");
  return secret === WORKSPACE_SECRET ? email : null;
};

export const JSON_WEB_TOKEN_SECRET = "scriptover-e4b57c1e-1c42-4f94-8b7c-5a264c53f221";

export const getOpenSearchId = (projectId, slideId) => `${projectId}::${slideId}`;
export const extractProjectId = (openSearchId) => openSearchId?.split("::")[0] ?? null;
