export type ProviderConnection = {
  id: string;
  provider: string;
  authType: "oauth" | "apikey" | string;
  name: string;
  priority?: number;
  globalPriority?: number | null;
  defaultModel?: string | null;
  isActive?: boolean;
  email?: string;
  testStatus?: string;
  providerSpecificData?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type Combo = {
  id: string;
  name: string;
  models: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ProviderNode = {
  id: string;
  type: "openai-compatible" | "anthropic-compatible" | string;
  name: string;
  prefix: string;
  apiType?: "chat" | "responses" | string;
  baseUrl: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type ApiKey = {
  id: string;
  name: string;
  key: string;
  machineId?: string;
  isActive?: boolean;
  createdAt?: string;
  [key: string]: unknown;
};

export type Settings = Record<string, unknown> & {
  requireLogin?: boolean;
  requireApiKey?: boolean;
  hasPassword?: boolean;
};

export type UsageStats = {
  totalRequests?: number;
  totalPromptTokens?: number;
  totalCompletionTokens?: number;
  totalCost?: number;
  byProvider?: Record<string, unknown>;
  byModel?: Record<string, unknown>;
  byAccount?: Record<string, unknown>;
  [key: string]: unknown;
};
