import test from "node:test";
import assert from "node:assert/strict";
import { ProviderNodeCreateSchema } from "../src/schemas.js";

test("ProviderNodeCreateSchema requires apiType for openai-compatible", () => {
  const parsed = ProviderNodeCreateSchema.safeParse({
    name: "node-a",
    prefix: "na",
    type: "openai-compatible",
    baseUrl: "https://example.com",
  });

  assert.equal(parsed.success, false);
  if (!parsed.success) {
    assert.match(parsed.error.issues[0]?.message ?? "", /apiType is required/i);
  }
});

test("ProviderNodeCreateSchema accepts apiType for openai-compatible", () => {
  const parsed = ProviderNodeCreateSchema.safeParse({
    name: "node-a",
    prefix: "na",
    type: "openai-compatible",
    apiType: "responses",
    baseUrl: "https://example.com",
  });

  assert.equal(parsed.success, true);
});

test("ProviderNodeCreateSchema does not require apiType for anthropic-compatible", () => {
  const parsed = ProviderNodeCreateSchema.safeParse({
    name: "node-b",
    prefix: "nb",
    type: "anthropic-compatible",
    baseUrl: "https://example.com",
  });

  assert.equal(parsed.success, true);
});
