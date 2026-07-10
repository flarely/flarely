import { createHash, randomBytes } from "crypto";
import { API_KEY_PREFIX } from "../../constants.js";

export interface GeneratedApiKey {
  rawKey: string;
  keyHash: string;
}

export function generateApiKey(): GeneratedApiKey {
  const rawKey = `${API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  return { rawKey, keyHash };
}
