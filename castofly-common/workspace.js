const WORKSPACE_SECRET = "qr-simplied-7dcf8b7a4ee5";

export const obfuscate = (string) => {
  const combined = `${WORKSPACE_SECRET}:${string}`;
  return Buffer.from(combined).toString("base64");
};

export const deobfuscate = (encoded) => {
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const [secret, email] = decoded.split(":");
  return secret === WORKSPACE_SECRET ? email : null;
};
