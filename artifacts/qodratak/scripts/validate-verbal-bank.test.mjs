import assert from "node:assert/strict";
import test from "node:test";

import {
  EXPECTED_VIDEO_COUNT,
  checkVideoLink,
  getVideoIds,
  validateVideoData,
} from "./validate-verbal-bank.mjs";

const VALID_IDS = Array.from(
  { length: EXPECTED_VIDEO_COUNT },
  (_, index) => index.toString(36).padStart(11, "0"),
);

function sourceFor(ids) {
  return `const verbalBankVideoIds = [
${ids.map((id) => `  "${id}",`).join("\n")}
] as const;

const videos = verbalBankVideoIds.map((videoId) => ({
  videoId,
  videoUrl: \`https://www.youtube.com/watch?v=\${videoId}\`,
}));`;
}

test("reports an incorrect verbal bank video count", () => {
  const ids = VALID_IDS.slice(0, -1);

  assert.deepEqual(validateVideoData(sourceFor(ids), ids), [
    "Expected exactly 200 verbal bank videos, but found 199.",
  ]);
});

test("reports duplicate YouTube IDs", () => {
  const ids = [...VALID_IDS];
  ids[1] = ids[0];

  assert.deepEqual(validateVideoData(sourceFor(ids), ids), [
    `Duplicate YouTube video ID(s): ${ids[0]}.`,
  ]);
});

test("reports IDs that do not match YouTube's eleven-character format", () => {
  const ids = [...VALID_IDS];
  ids[0] = "not-a-valid-id";

  assert.deepEqual(validateVideoData(sourceFor(ids), ids), [
    `Video 1 has invalid YouTube ID "not-a-valid-id". IDs must contain exactly 11 letters, numbers, "_" or "-".`,
  ]);
});

test("extracts the static video ID list without contacting YouTube", () => {
  const { ids, errors } = getVideoIds(sourceFor(VALID_IDS));

  assert.deepEqual(ids, VALID_IDS);
  assert.deepEqual(errors, []);
});

test("accepts a successful mocked oEmbed response", async () => {
  const requestedUrls = [];
  const result = await checkVideoLink("abcdefghijk", 0, {
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ title: "Static fixture" }),
      };
    },
  });

  assert.equal(result, null);
  assert.deepEqual(requestedUrls, [
    "https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabcdefghijk&format=json",
  ]);
});

test("reports an HTTP failure from mocked oEmbed", async () => {
  const result = await checkVideoLink("abcdefghijk", 1, {
    fetchImpl: async () => ({ ok: false, status: 404 }),
  });

  assert.equal(
    result,
    "Video 2 (abcdefghijk) is not reachable: YouTube returned HTTP 404 for https://www.youtube.com/watch?v=abcdefghijk.",
  );
});

test("reports an invalid mocked oEmbed response body", async () => {
  const result = await checkVideoLink("abcdefghijk", 2, {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("fixture is not JSON");
      },
    }),
  });

  assert.equal(
    result,
    "Video 3 (abcdefghijk) is not reachable: YouTube returned an invalid response for https://www.youtube.com/watch?v=abcdefghijk.",
  );
});

test("reports a mocked network error with its message", async () => {
  const result = await checkVideoLink("abcdefghijk", 3, {
    fetchImpl: async () => {
      throw new Error("fixture network failure");
    },
  });

  assert.equal(
    result,
    "Video 4 (abcdefghijk) could not be checked: network error: fixture network failure (https://www.youtube.com/watch?v=abcdefghijk).",
  );
});