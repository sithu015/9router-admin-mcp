import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AdminApiClient } from "../client/adminApi.js";
import {
  ApiKeyCreateSchema,
  ComboCreateSchema,
  ComboUpdateSchema,
  IdParamSchema,
  ProviderCreateSchema,
  ProviderNodeCreateInputSchema,
  ProviderNodeCreateSchema,
  ProviderUpdateSchema,
  SettingsUpdateSchema,
  UsageStatsInputSchema,
} from "../schemas.js";
import { toToolErrorResult } from "../errors.js";

function ok(name: string, data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ tool: name, data }, null, 2),
      },
    ],
    structuredContent: { data },
  };
}

export function registerAdminTools(server: McpServer, api: AdminApiClient): void {
  server.registerTool(
    "9router_health",
    {
      description:
        "Health check for 9router admin API availability and runtime auth flags (requireLogin/requireApiKey/hasPassword)",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await api.health();
        return ok("9router_health", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_list_providers",
    {
      description: "List provider connections via GET /api/providers",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await api.listProviders();
        return ok("9router_list_providers", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_get_provider",
    {
      description: "Get one provider connection by id via GET /api/providers/:id",
      inputSchema: IdParamSchema.shape,
    },
    async (args) => {
      try {
        const { id } = IdParamSchema.parse(args);
        const data = await api.getProvider(id);
        return ok("9router_get_provider", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_create_provider",
    {
      description: "Create provider connection via POST /api/providers",
      inputSchema: ProviderCreateSchema.shape,
    },
    async (args) => {
      try {
        const payload = ProviderCreateSchema.parse(args);
        const data = await api.createProvider(payload);
        return ok("9router_create_provider", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_update_provider",
    {
      description: "Update provider connection via PUT /api/providers/:id",
      inputSchema: ProviderUpdateSchema.shape,
    },
    async (args) => {
      try {
        const { id, ...patch } = ProviderUpdateSchema.parse(args);
        const data = await api.updateProvider(id, patch);
        return ok("9router_update_provider", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_delete_provider",
    {
      description: "Delete provider connection via DELETE /api/providers/:id",
      inputSchema: IdParamSchema.shape,
    },
    async (args) => {
      try {
        const { id } = IdParamSchema.parse(args);
        const data = await api.deleteProvider(id);
        return ok("9router_delete_provider", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_list_combos",
    {
      description: "List combos via GET /api/combos",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await api.listCombos();
        return ok("9router_list_combos", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_get_combo",
    {
      description: "Get combo by id via GET /api/combos/:id",
      inputSchema: IdParamSchema.shape,
    },
    async (args) => {
      try {
        const { id } = IdParamSchema.parse(args);
        const data = await api.getCombo(id);
        return ok("9router_get_combo", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_create_combo",
    {
      description: "Create combo via POST /api/combos",
      inputSchema: ComboCreateSchema.shape,
    },
    async (args) => {
      try {
        const payload = ComboCreateSchema.parse(args);
        const data = await api.createCombo(payload);
        return ok("9router_create_combo", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_update_combo",
    {
      description:
        "Update combo via PUT /api/combos/:id. Experimental: upstream/runtime behavior may be unreliable; prefer delete+create when correctness matters.",
      inputSchema: ComboUpdateSchema.shape,
    },
    async (args) => {
      try {
        const { id, ...patch } = ComboUpdateSchema.parse(args);
        const data = await api.updateCombo(id, patch);
        return ok("9router_update_combo", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_delete_combo",
    {
      description: "Delete combo via DELETE /api/combos/:id",
      inputSchema: IdParamSchema.shape,
    },
    async (args) => {
      try {
        const { id } = IdParamSchema.parse(args);
        const data = await api.deleteCombo(id);
        return ok("9router_delete_combo", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_get_settings",
    {
      description: "Get app settings via GET /api/settings",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await api.getSettings();
        return ok("9router_get_settings", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_update_settings",
    {
      description: "Update app settings via PATCH /api/settings",
      inputSchema: SettingsUpdateSchema.shape,
    },
    async (args) => {
      try {
        const payload = SettingsUpdateSchema.parse(args);
        const data = await api.updateSettings(payload);
        return ok("9router_update_settings", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_get_usage_stats",
    {
      description: "Get usage stats via GET /api/usage/stats?period=7d",
      inputSchema: UsageStatsInputSchema.shape,
    },
    async (args) => {
      try {
        const { period } = UsageStatsInputSchema.parse(args);
        const data = await api.getUsageStats(period ?? "7d");
        return ok("9router_get_usage_stats", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  // Optional but available in current 9router
  server.registerTool(
    "9router_list_provider_nodes",
    {
      description: "List provider nodes via GET /api/provider-nodes",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await api.listProviderNodes();
        return ok("9router_list_provider_nodes", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_create_provider_node",
    {
      description: "Create provider node via POST /api/provider-nodes",
      inputSchema: ProviderNodeCreateInputSchema.shape,
    },
    async (args) => {
      try {
        const payload = ProviderNodeCreateSchema.parse(args);
        const data = await api.createProviderNode(payload);
        return ok("9router_create_provider_node", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_list_api_keys",
    {
      description: "List API keys via GET /api/keys",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await api.listApiKeys();
        return ok("9router_list_api_keys", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );

  server.registerTool(
    "9router_create_api_key",
    {
      description: "Create API key via POST /api/keys",
      inputSchema: ApiKeyCreateSchema.shape,
    },
    async (args) => {
      try {
        const payload = ApiKeyCreateSchema.parse(args);
        const data = await api.createApiKey(payload);
        return ok("9router_create_api_key", data);
      } catch (err) {
        return toToolErrorResult(err);
      }
    },
  );
}
