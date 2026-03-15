import { z } from "zod";
import { ResourceIdSchema } from "./pathSafety.js";

const ComboNameRegex = /^[a-zA-Z0-9_-]+$/;

export const IdParamSchema = z.object({
  id: ResourceIdSchema,
});

export const UsagePeriodSchema = z.enum(["24h", "7d", "30d", "60d", "all"]);

export const UsageStatsInputSchema = z.object({
  period: UsagePeriodSchema.default("7d").optional(),
});

export const ProviderCreateSchema = z.object({
  provider: z.string().min(1),
  apiKey: z.string().min(1),
  name: z.string().min(1),
  priority: z.number().int().positive().optional(),
  globalPriority: z.number().int().nullable().optional(),
  defaultModel: z.string().min(1).nullable().optional(),
  testStatus: z.string().min(1).optional(),
  connectionProxyEnabled: z.boolean().optional(),
  connectionProxyUrl: z.string().optional(),
  connectionNoProxy: z.string().optional(),
  proxyPoolId: z.string().nullable().optional(),
});

export const ProviderUpdateSchema = z.object({
  id: ResourceIdSchema,
  name: z.string().min(1).optional(),
  priority: z.number().int().positive().optional(),
  globalPriority: z.number().int().nullable().optional(),
  defaultModel: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  apiKey: z.string().min(1).optional(),
  testStatus: z.string().min(1).optional(),
  lastError: z.string().nullable().optional(),
  lastErrorAt: z.string().datetime({ offset: true }).nullable().optional(),
  providerSpecificData: z.record(z.unknown()).optional(),
  connectionProxyEnabled: z.boolean().optional(),
  connectionProxyUrl: z.string().optional(),
  connectionNoProxy: z.string().optional(),
  proxyPoolId: z.string().nullable().optional(),
});

export const ComboCreateSchema = z.object({
  name: z.string().min(1).regex(ComboNameRegex, "Name can only contain letters, numbers, - and _"),
  models: z.array(z.string().min(1)).default([]).optional(),
});

export const ComboUpdateSchema = z.object({
  id: ResourceIdSchema,
  name: z
    .string()
    .min(1)
    .regex(ComboNameRegex, "Name can only contain letters, numbers, - and _")
    .optional(),
  models: z.array(z.string().min(1)).optional(),
});

export const SettingsUpdateSchema = z
  .object({
    requireLogin: z.boolean().optional(),
    requireApiKey: z.boolean().optional(),
    outboundProxyEnabled: z.boolean().optional(),
    outboundProxyUrl: z.string().optional(),
    outboundNoProxy: z.string().optional(),
    stickyRoundRobinLimit: z.number().int().positive().optional(),
    providerStrategies: z.record(z.unknown()).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(1).optional(),
  })
  .catchall(z.unknown());

export const ProviderNodeCreateInputSchema = z.object({
  name: z.string().min(1),
  prefix: z.string().min(1),
  type: z.enum(["openai-compatible", "anthropic-compatible"]).default("openai-compatible").optional(),
  apiType: z.enum(["chat", "responses"]).optional(),
  baseUrl: z.string().url().optional(),
});

export const ProviderNodeCreateSchema = ProviderNodeCreateInputSchema.superRefine((data, ctx) => {
  const resolvedType = data.type ?? "openai-compatible";

  if (resolvedType === "openai-compatible" && data.apiType === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["apiType"],
      message: "apiType is required when type is openai-compatible",
    });
  }
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1),
});
