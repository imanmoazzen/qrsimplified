import { createHash } from "node:crypto";

export const getHashForContent = (content = {}) => {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
};
