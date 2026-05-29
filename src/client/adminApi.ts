import { z } from "zod";
import { HttpClient } from "./http.js";
import { buildResourcePath } from "../pathSafety.js";
import type { ApiKey, Combo, ProviderConnection, ProviderNode, Settings, UsageStats } from "../types.js";

// ---------------------------------------------------------------------------
// LRU Cache (fix: was FIFO — now true LRU via Map insertion-order re-insert)
// ---------------------------------------------------------------------------
class LRUCache<K, V> {
  private cache: Map<K, { value: V; expiry: number }> = new Map();
  private maxAge: number;
  private maxSize: number;

  constructor(maxAgeMs: number = 5000, maxSize: number = 100) {
    this.maxAge = maxAgeMs;
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    // Move to end for LRU tracking (Map preserves insertion order)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: K, value: V): void {
    // If key already exists, remove first so re-insert becomes most-recently-used
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least-recently-used (first key in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.maxAge,
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (String(key).includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------
const ProviderConnectionSchema: z.ZodType<ProviderConnection> = z
  .object({
    id: z.string(),
    provider: z.string(),
    authType: z.string(),
    name: z.string(),
    priority: z.number().nullable().optional(),
    globalPriority: z.number().nullable().optional(),
    defaultModel: z.string().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
    email: z.string().nullable().optional(),
    testStatus: z.string().nullable().optional(),
    providerSpecificData: z.record(z.unknown()).nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

const ProviderListSchema = z.object({
  connections: z.array(ProviderConnectionSchema),
});

const ProviderOneSchema = z.object({
  connection: ProviderConnectionSchema,
});

const ComboSchema: z.ZodType<Combo> = z
  .object({
    id: z.string(),
    name: z.string(),
    models: z.array(z.string()),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .catchall(z.unknown());

const ComboListSchema = z.object({
  combos: z.array(ComboSchema),
});

const ProviderNodeSchema: z.ZodType<ProviderNode> = z
  .object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    prefix: z.string(),
    apiType: z.string().optional(),
    baseUrl: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .catchall(z.unknown());

const ProviderNodeListSchema = z.object({
  nodes: z.array(ProviderNodeSchema),
});

const ProviderNodeCreateSchema = z.object({
  node: ProviderNodeSchema,
});

const ApiKeySchema: z.ZodType<ApiKey> = z
  .object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
    machineId: z.string().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.string().optional(),
  })
  .catchall(z.unknown());

const ApiKeyListSchema = z.object({
  keys: z.array(ApiKeySchema),
});

const ApiKeyCreateSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  machineId: z.string().optional(),
});

const SettingsSchema: z.ZodType<Settings> = z
  .object({
    requireLogin: z.boolean().optional(),
    requireApiKey: z.boolean().optional(),
    hasPassword: z.boolean().optional(),
  })
  .catchall(z.unknown());

const UsageStatsSchema: z.ZodType<UsageStats> = z
  .object({
    totalRequests: z.number().optional(),
    totalPromptTokens: z.number().optional(),
    totalCompletionTokens: z.number().optional(),
    totalCost: z.number().optional(),
    byProvider: z.record(z.unknown()).optional(),
    byModel: z.record(z.unknown()).optional(),
    byAccount: z.record(z.unknown()).optional(),
  })
  .catchall(z.unknown());

const DeleteMessageSchema = z.object({
  message: z.string().optional(),
  success: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// AdminApiClient
// ---------------------------------------------------------------------------
export class AdminApiClient {
  private cache = new LRUCache<string, unknown>(5000, 100); // 5s TTL, 100 items max

  constructor(private readonly http: HttpClient) {}

  async health(): Promise<Record<string, unknown>> {
    const settings = await this.getSettings();
    return {
      status: "ok",
      apiBase: this.http.baseUrl,
      authMode: this.http.authMode,
      requireLogin: settings.requireLogin ?? null,
      requireApiKey: settings.requireApiKey ?? null,
      hasPassword: settings.hasPassword ?? null,
    };
  }

  async listProviders(): Promise<ProviderConnection[]> {
    const res = await this.http.request<unknown>("/api/providers", { method: "GET" });
    return ProviderListSchema.parse(res).connections;
  }

  async getProvider(id: string): Promise<ProviderConnection> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/providers", id), { method: "GET" });
    return ProviderOneSchema.parse(res).connection;
  }

  async createProvider(payload: Record<string, unknown>): Promise<ProviderConnection> {
    const res = await this.http.request<unknown>("/api/providers", {
      method: "POST",
      body: payload,
    });
    this.cache.invalidate("providers");
    return ProviderOneSchema.parse(res).connection;
  }

  async updateProvider(id: string, payload: Record<string, unknown>): Promise<ProviderConnection> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/providers", id), {
      method: "PUT",
      body: payload,
    });
    this.cache.invalidate("providers");
    return ProviderOneSchema.parse(res).connection;
  }

  async deleteProvider(id: string): Promise<{ deleted: boolean; id: string; message?: string }> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/providers", id), { method: "DELETE" });
    this.cache.invalidate("providers");
    const parsed = DeleteMessageSchema.parse(res);
    return { deleted: true, id, message: parsed.message };
  }

  async listCombos(): Promise<Combo[]> {
    const res = await this.http.request<unknown>("/api/combos", { method: "GET" });
    return ComboListSchema.parse(res).combos;
  }

  async getCombo(id: string): Promise<Combo> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/combos", id), { method: "GET" });
    return ComboSchema.parse(res);
  }

  async createCombo(payload: Record<string, unknown>): Promise<Combo> {
    const res = await this.http.request<unknown>("/api/combos", {
      method: "POST",
      body: payload,
    });
    return ComboSchema.parse(res);
  }

  async updateCombo(id: string, payload: Record<string, unknown>): Promise<Combo> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/combos", id), {
      method: "PUT",
      body: payload,
    });
    return ComboSchema.parse(res);
  }

  async deleteCombo(id: string): Promise<{ deleted: boolean; id: string; success?: boolean }> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/combos", id), { method: "DELETE" });
    const parsed = DeleteMessageSchema.parse(res);
    return { deleted: true, id, success: parsed.success };
  }

  async getSettings(): Promise<Settings> {
    const cacheKey = "settings";
    const cached = this.cache.get(cacheKey);
    if (cached) return SettingsSchema.parse(cached);

    const res = await this.http.request<unknown>("/api/settings", { method: "GET" });
    const settings = SettingsSchema.parse(res);
    this.cache.set(cacheKey, settings);
    return settings;
  }

  async updateSettings(settings: Record<string, unknown>): Promise<Settings> {
    const res = await this.http.request<unknown>("/api/settings", {
      method: "PATCH",
      body: settings,
    });
    this.cache.invalidate("settings");
    return SettingsSchema.parse(res);
  }

  async listProviderNodes(): Promise<ProviderNode[]> {
    const res = await this.http.request<unknown>("/api/provider-nodes", { method: "GET" });
    return ProviderNodeListSchema.parse(res).nodes;
  }

  async createProviderNode(payload: Record<string, unknown>): Promise<ProviderNode> {
    const res = await this.http.request<unknown>("/api/provider-nodes", {
      method: "POST",
      body: payload,
    });
    return ProviderNodeCreateSchema.parse(res).node;
  }

  async listApiKeys(): Promise<ApiKey[]> {
    const res = await this.http.request<unknown>("/api/keys", { method: "GET" });
    return ApiKeyListSchema.parse(res).keys;
  }

  async createApiKey(payload: Record<string, unknown>): Promise<ApiKey> {
    const res = await this.http.request<unknown>("/api/keys", {
      method: "POST",
      body: payload,
    });
    return ApiKeyCreateSchema.parse(res);
  }

  async getUsageStats(period = "7d"): Promise<UsageStats> {
    const res = await this.http.request<unknown>("/api/usage/stats", {
      method: "GET",
      query: { period },
    });
    return UsageStatsSchema.parse(res);
  }
}
