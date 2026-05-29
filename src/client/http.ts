import type { AppConfig } from "../config.js";
import { buildAuthHeaders } from "../auth.js";
import { HttpError } from "../errors.js";

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

export class HttpClient {
  private dynamicCookie?: string;

  constructor(private readonly config: AppConfig) {}

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get authMode(): string {
    return this.config.auth.mode;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (this.config.auth.mode === "password" && !this.dynamicCookie && path !== "/api/auth/login") {
      await this.login();
    }

    let res = await this._doRequest<T>(path, options);

    if (
      res instanceof HttpError &&
      res.status === 401 &&
      this.config.auth.mode === "password" &&
      path !== "/api/auth/login"
    ) {
      await this.login();
      res = await this._doRequest<T>(path, options);
    }

    if (res instanceof HttpError) throw res;
    return res as T;
  }

  private async _doRequest<T>(path: string, options: RequestOptions = {}): Promise<T | HttpError> {
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
        connection: "close",
        ...buildAuthHeaders(this.config),
      };

      if (this.dynamicCookie) {
        headers.cookie = this.dynamicCookie;
      }

      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const rawText = await response.text();
      const parsedBody: unknown = rawText ? tryJson(rawText) : undefined;

      if (!response.ok) {
        return new HttpError(response.status, response.statusText, parsedBody);
      }

      return parsedBody as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async login(): Promise<void> {
    const url = new URL(`${this.config.baseUrl}/api/auth/login`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "connection": "close" },
      body: JSON.stringify({ password: this.config.auth.password }),
    });

    if (!response.ok) {
      const rawText = await response.text();
      throw new Error(`Failed to login: ${response.status} ${response.statusText} - ${rawText}`);
    }

    await response.text(); // consume the body to free the socket

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      this.dynamicCookie = setCookie.split(";")[0];
    } else {
      throw new Error("Login succeeded but no set-cookie header was found in the response.");
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
