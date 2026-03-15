import type { AppConfig } from "../config.js";
import { buildAuthHeaders } from "../auth.js";
import { HttpError } from "../errors.js";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export class HttpClient {
  constructor(private readonly config: AppConfig) {}

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get authMode(): string {
    return this.config.auth.mode;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${path}`);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        accept: "application/json",
        ...buildAuthHeaders(this.config),
      };

      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const rawText = await response.text();
      const parsedBody: unknown = rawText ? tryJson(rawText) : undefined;

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, parsedBody);
      }

      return parsedBody as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function tryJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
