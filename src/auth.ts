import type { AppConfig } from "./config.js";

export function buildAuthHeaders(config: AppConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  if ((config.auth.mode === "bearer" || config.auth.mode === "both") && config.auth.bearerToken) {
    headers.authorization = `Bearer ${config.auth.bearerToken}`;
  }

  if ((config.auth.mode === "apiKey" || config.auth.mode === "both") && config.auth.apiKey) {
    headers["x-api-key"] = config.auth.apiKey;
  }

  return headers;
}
