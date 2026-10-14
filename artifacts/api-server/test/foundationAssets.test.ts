import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createFoundationAssetsRouter } from "../src/routes/foundationAssets";

test("hosted foundation videos support streaming, HEAD, ranges and safe paths", async () => {
  const calls: Array<{ key: string; method?: string; range?: string }> = [];
  const app = express();
  app.use("/foundation/quantitative", createFoundationAssetsRouter(async (key, options = {}) => {
    calls.push({ key, method: options.method, range: options.range });
    if (key.includes("missing")) return new Response(null, { status: 404 });
    const isImage = /\.jpe?g$/i.test(key);
    if (options.method === "HEAD") {
      return new Response(null, { headers: {
        "content-length": "10",
        "content-type": isImage ? "application/octet-stream" : "video/mp4",
        "accept-ranges": "bytes",
      } });
    }
    return new Response("012", { status: 206, headers: {
      "content-type": isImage ? "application/octet-stream" : "video/mp4",
      "content-length": "3", "content-range": "bytes 0-2/10", "accept-ranges": "bytes",
    } });
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/foundation/quantitative`;
  try {
    const response = await fetch(`${base}/computer-banks/computer-bank-01.mp4`, { headers: { Range: "bytes=0-2" } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get("content-range"), "bytes 0-2/10");
    assert.equal(await response.text(), "012");
    assert.equal(calls[0].key, "foundation/quantitative/computer-banks/computer-bank-01.mp4");
    assert.equal(calls[0].range, "bytes=0-2");
    const head = await fetch(`${base}/computer-banks/computer-bank-01.mp4`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get("content-length"), "10");
    assert.equal(await head.text(), "");
    assert.equal((await fetch(`${base}/missing.mp4`)).status, 404);
    const count = calls.length;
    assert.equal((await fetch(`${base}/bad%2F..%2Fsecret.mp4`)).status, 400);
    assert.equal((await fetch(`${base}/config.json`)).status, 404);
    assert.equal(calls.length, count);
    const image = await fetch(`${base}/computer-banks/exam-51/question-001.jpeg`, {
      headers: { Range: "bytes=0-2" },
    });
    assert.equal(image.status, 206);
    assert.equal(image.headers.get("content-type"), "image/jpeg");
    assert.match(image.headers.get("cache-control") || "", /immutable/);
    assert.equal(calls.at(-1)?.key, "foundation/quantitative/computer-banks/exam-51/question-001.jpeg");
    const imageHead = await fetch(`${base}/computer-banks/exam-51/question-001.jpeg`, { method: "HEAD" });
    assert.equal(imageHead.status, 200);
    assert.equal(imageHead.headers.get("content-type"), "image/jpeg");
    assert.equal((await fetch(`${base}/computer-banks/exam-51/answer-key.pdf`)).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
