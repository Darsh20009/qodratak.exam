import assert from "node:assert/strict";
import test from "node:test";
import { createPaperModelPreparationCache } from "../src/services/paperModelPreparationCache.ts";

test("concurrent requests share one prepared paper model", async () => {
  let calls = 0;
  const cache = createPaperModelPreparationCache(async (modelNumber: number) => {
    calls += 1;
    return { modelNumber };
  });

  const [first, second] = await Promise.all([cache.load(3), cache.load(3)]);

  assert.deepEqual(first, { modelNumber: 3 });
  assert.deepEqual(second, { modelNumber: 3 });
  assert.equal(calls, 1);
});

test("startup prewarming prepares unique models in bounded batches", async () => {
  const prepared: number[] = [];
  const cache = createPaperModelPreparationCache(async (modelNumber: number) => {
    prepared.push(modelNumber);
    return { modelNumber };
  });

  const result = await cache.prewarm([1, 2, 2, 3], 2);

  assert.deepEqual(result, { total: 3, ready: 3, failed: 0 });
  assert.deepEqual(prepared, [1, 2, 3]);
});

test("failed or missing models can be retried", async () => {
  let calls = 0;
  const cache = createPaperModelPreparationCache(async () => {
    calls += 1;
    if (calls === 1) throw new Error("temporary database failure");
    return null;
  });

  await assert.rejects(cache.load(7));
  assert.equal(await cache.load(7), null);
  assert.equal(calls, 2);
});
