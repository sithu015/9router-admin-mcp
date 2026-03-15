import { z } from "zod";
import { HttpClient } from "./http.js";
import { buildResourcePath } from "../pathSafety.js";
import type { ApiKey, Combo, ProviderConnection, ProviderNode, Settings, UsageStats } from "../types.js";

const ProviderConnectionSchema: z.ZodType<ProviderConnection> = z
  .object({
    id: z.string(),
    provider: z.string(),
    authType: z.string(),
    name: z.string(),
    priority: z.number().optional(),
    globalPriority: z.number().nullable().optional(),
    defaultModel: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    email: z.string().optional(),
    testStatus: z.string().optional(),
    providerSpecificData: z.record(z.unknown()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
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

export class AdminApiClient {
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
    return ProviderOneSchema.parse(res).connection;
  }

  async updateProvider(id: string, payload: Record<string, unknown>): Promise<ProviderConnection> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/providers", id), {
      method: "PUT",
      body: payload,
    });
    return ProviderOneSchema.parse(res).connection;
  }

  async deleteProvider(id: string): Promise<{ deleted: boolean; id: string; message?: string }> {
    const res = await this.http.request<unknown>(buildResourcePath("/api/providers", id), { method: "DELETE" });
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
    const res = await this.http.request<unknown>("/api/settings", { method: "GET" });
    return SettingsSchema.parse(res);
  }

  async updateSettings(settings: Record<string, unknown>): Promise<Settings> {
    const res = await this.http.request<unknown>("/api/settings", {
      method: "PATCH",
      body: settings,
    });
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
