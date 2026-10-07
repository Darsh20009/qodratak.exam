import fs from "node:fs";
import path from "node:path";

export interface DeviceTrialRecord {
  deviceId: string;
  trialStartDate: string;
  trialEndDate: string;
  isActive: boolean;
  createdAt: string;
  [key: string]: unknown;
}

function defaultTrialFiles() {
  const root = process.cwd();
  return [
    path.resolve(root, "artifacts/api-server/server/data/device_trials.json"),
    path.resolve(root, "attached_assets/device_trials.json"),
  ];
}

function readTrialFile(filePath: string): DeviceTrialRecord[] {
  let contents: string;
  try {
    contents = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }

  const parsed: unknown = JSON.parse(contents);
  if (!Array.isArray(parsed)) {
    throw new Error(`Device trial data must be an array: ${filePath}`);
  }

  return parsed.map((trial, index) => {
    if (
      !trial ||
      typeof trial !== "object" ||
      typeof trial.deviceId !== "string" ||
      typeof trial.trialStartDate !== "string" ||
      typeof trial.trialEndDate !== "string"
    ) {
      throw new Error(`Invalid device trial record at ${filePath}:${index}`);
    }
    return trial as DeviceTrialRecord;
  });
}

export function readDeviceTrials(filePaths = defaultTrialFiles()): DeviceTrialRecord[] {
  const byDeviceId = new Map<string, DeviceTrialRecord>();
  for (const filePath of filePaths) {
    for (const trial of readTrialFile(filePath)) {
      byDeviceId.set(trial.deviceId, {
        ...byDeviceId.get(trial.deviceId),
        ...trial,
      });
    }
  }
  return [...byDeviceId.values()];
}

export function writeDeviceTrials(
  trials: DeviceTrialRecord[],
  filePath = path.resolve(process.cwd(), "attached_assets/device_trials.json"),
) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(trials, null, 2), "utf8");
  fs.renameSync(temporaryPath, filePath);
}
