import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { buildResourcePath, ResourceIdSchema } from "../src/pathSafety.js";
import { AdminApiClient } from "../src/client/adminApi.js";

test("ResourceIdSchema rejects traversal and route-manipulation characters", () => {
  const invalidIds = ["../x", "a/b", "a\\b", "id?x=1", "id#frag", "foo%2Fbar", "foo&x=1"];

  for (const id of invalidIds) {
    assert.throws(() => ResourceIdSchema.parse(id), ZodError);
  }
});

test("buildResourcePath returns stable safe route for valid ids", () => {
  const path = buildResourcePath("/api/providers", "provider_01:prod.alpha");
  assert.equal(path, "/api/providers/provider_01%3Aprod.alpha");
});

test("AdminApiClient blocks invalid resource id before request", async () => {
  let called = false;
  const http = {
    request: async () => {
      called = true;
      return { connection: { id: "x", provider: "p", authType: "apikey", name: "n" } };
    },
  };

  const client = new AdminApiClient(http as never);

  await assert.rejects(() => client.getProvider("../combos/target"), ZodError);
  assert.equal(called, false);
});
