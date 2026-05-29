import { z } from "zod";

const AuthModeSchema = z.enum(["none", "bearer", "apiKey", "both", "cookie", "password"]);

const EnvSchema = z.object({
  NINE_ROUTER_BASE_URL: z.string().url().optional(),
  NINE_ROUTER_ADMIN_BASE_URL: z.string().url().optional(),
  NINE_ROUTER_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  NINE_ROUTER_ADMIN_TIMEOUT_MS: z.coerce.number().int().positive().optional(),

  // Optional auth (secondary path)
  NINE_ROUTER_AUTH_MODE: AuthModeSchema.optional(),
  NINE_ROUTER_BEARER_TOKEN: z.string().min(1).optional(),
  NINE_ROUTER_ADMIN_TOKEN: z.string().min(1).optional(),
  NINE_ROUTER_API_KEY: z.string().min(1).optional(),
  NINE_ROUTER_ADMIN_API_KEY: z.string().min(1).optional(),
  NINE_ROUTER_SESSION_COOKIE: z.string().min(1).optional(),
  NINE_ROUTER_ADMIN_PASSWORD: z.string().min(1).optional(),
});

export type AuthMode = z.infer<typeof AuthModeSchema>;

export type AppConfig = {
  baseUrl: string;
  timeoutMs: number;
  auth: {
    mode: AuthMode;
    bearerToken?: string;
    apiKey?: string;
    cookie?: string;
    password?: string;
  };
};

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function resolveAuthMode(input: {
  mode?: AuthMode;
  bearerToken?: string;
  apiKey?: string;
  cookie?: string;
  password?: string;
}): AuthMode {
  if (input.mode) {
    return input.mode;
  }

  const hasBearer = Boolean(input.bearerToken);
  const hasApiKey = Boolean(input.apiKey);
  const hasCookie = Boolean(input.cookie);
  const hasPassword = Boolean(input.password);

  if (hasPassword) return "password";
  if (hasCookie) return "cookie";
  if (hasBearer && hasApiKey) return "both";
  if (hasBearer) return "bearer";
  if (hasApiKey) return "apiKey";
  return "none";
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment config: ${parsed.error.message}`);
  }

  const data = parsed.data;
  const baseUrl =
    data.NINE_ROUTER_BASE_URL ??
    data.NINE_ROUTER_ADMIN_BASE_URL ??
    "http://127.0.0.1:20128";

  const bearerToken = data.NINE_ROUTER_BEARER_TOKEN ?? data.NINE_ROUTER_ADMIN_TOKEN;
  const apiKey = data.NINE_ROUTER_API_KEY ?? data.NINE_ROUTER_ADMIN_API_KEY;
  const cookie = data.NINE_ROUTER_SESSION_COOKIE;
  const password = data.NINE_ROUTER_ADMIN_PASSWORD;
  const mode = resolveAuthMode({
    mode: data.NINE_ROUTER_AUTH_MODE,
    bearerToken,
    apiKey,
    cookie,
    password,
  });

  if ((mode === "bearer" || mode === "both") && !bearerToken) {
    throw new Error("Auth mode requires bearer token but none was provided");
  }

  if ((mode === "apiKey" || mode === "both") && !apiKey) {
    throw new Error("Auth mode requires API key but none was provided");
  }

  if (mode === "cookie" && !cookie) {
    throw new Error("Auth mode requires session cookie but none was provided");
  }

  if (mode === "password" && !password) {
    throw new Error("Auth mode requires password but none was provided");
  }

  return {
    baseUrl: normalizeUrl(baseUrl),
    timeoutMs: data.NINE_ROUTER_ADMIN_TIMEOUT_MS ?? data.NINE_ROUTER_TIMEOUT_MS,
    auth: {
      mode,
      bearerToken,
      apiKey,
      cookie,
      password,
    },
  };
}
