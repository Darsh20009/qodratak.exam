import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("new Geidea sessions return to the standalone payment result page", async () => {
  const source = await readFile(new URL("../src/routes/geideaPaymentRoutes.ts", import.meta.url), "utf8");
  assert.match(source, /returnUrl:\s*`[^`]*\/payment\/geidea\/return\?paymentId=.*&popup=1`/);
  assert.doesNotMatch(source, /returnUrl:\s*`[^`]*&embedded=1/);
});
