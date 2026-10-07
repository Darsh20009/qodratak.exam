import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readDeviceTrials, writeDeviceTrials } from "../src/services/deviceTrialStore";

test("device trial reads merge both storage paths and keep the canonical record current", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "qodratak-device-trials-"));
  const legacyPath = path.join(directory, "legacy.json");
  const canonicalPath = path.join(directory, "canonical.json");
  const start = "2026-10-07T10:00:00.000Z";
  const laterEnd = "2026-10-10T12:00:00.000Z";
  try {
    fs.writeFileSync(
      legacyPath,
      JSON.stringify([
        {
          deviceId: "existing-device",
          trialStartDate: start,
          trialEndDate: "2026-10-10T10:00:00.000Z",
          isActive: true,
          createdAt: start,
          legacyMarker: "preserve",
        },
      ]),
    );
    fs.writeFileSync(
      canonicalPath,
      JSON.stringify([
        {
          deviceId: "existing-device",
          trialStartDate: start,
          trialEndDate: laterEnd,
          isActive: true,
          createdAt: start,
        },
        {
          deviceId: "new-device",
          trialStartDate: start,
          trialEndDate: laterEnd,
          isActive: true,
          createdAt: start,
        },
      ]),
    );

    const merged = readDeviceTrials([legacyPath, canonicalPath]);
    assert.equal(merged.length, 2);
    assert.equal(merged[0]?.trialEndDate, laterEnd);
    assert.equal(merged[0]?.legacyMarker, "preserve");

    writeDeviceTrials(merged, canonicalPath);
    assert.equal(readDeviceTrials([legacyPath, canonicalPath]).length, 2);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("missing device-trial files are treated as an empty store", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "qodratak-device-trials-"));
  try {
    assert.deepEqual(
      readDeviceTrials([
        path.join(directory, "missing-legacy.json"),
        path.join(directory, "missing-current.json"),
      ]),
      [],
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
