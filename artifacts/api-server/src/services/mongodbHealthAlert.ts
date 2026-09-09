import { logger } from "../lib/logger";

export const DEFAULT_MONGODB_OUTAGE_ALERT_THRESHOLD_MS = 60_000;
export const MONGODB_OUTAGE_ALERT_THRESHOLD_ENV =
  "MONGODB_OUTAGE_ALERT_THRESHOLD_MS";

export type MongoHealthAlert =
  | {
      event: "mongodb_outage";
      component: "mongodb";
      state: "disconnected";
      thresholdMs: number;
    }
  | {
      event: "mongodb_recovered";
      component: "mongodb";
      state: "connected";
      outageDurationMs: number;
    };

export type MongoHealthAlertNotifier = (alert: MongoHealthAlert) => void;

export interface MongoHealthAlertMonitorOptions {
  thresholdMs?: number;
  now?: () => number;
  notify?: MongoHealthAlertNotifier;
}

function configuredThresholdMs(): number {
  const configured = Number(process.env[MONGODB_OUTAGE_ALERT_THRESHOLD_ENV]);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MONGODB_OUTAGE_ALERT_THRESHOLD_MS;
}

function logMongoHealthAlert(alert: MongoHealthAlert): void {
  if (alert.event === "mongodb_outage") {
    logger.error(alert, "MongoDB outage persisted past alert threshold");
  } else {
    logger.info(alert, "MongoDB connection recovered");
  }
}

/**
 * Tracks one MongoDB outage at a time and emits at most one alert for it.
 * The payload intentionally contains health state and timing only.
 */
export class MongoHealthAlertMonitor {
  private readonly thresholdMs: number;
  private readonly now: () => number;
  private readonly notify: MongoHealthAlertNotifier;
  private outageStartedAt: number | null = null;
  private outageAlerted = false;
  private alertTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: MongoHealthAlertMonitorOptions = {}) {
    this.thresholdMs = options.thresholdMs ?? configuredThresholdMs();
    if (!Number.isFinite(this.thresholdMs) || this.thresholdMs <= 0) {
      throw new Error("MongoDB outage alert threshold must be greater than zero");
    }
    this.now = options.now ?? Date.now;
    this.notify = options.notify ?? logMongoHealthAlert;
  }

  markDisconnected(): void {
    if (this.outageStartedAt !== null) return;

    this.outageStartedAt = this.now();
    this.alertTimer = setTimeout(() => this.emitOutageAlert(), this.thresholdMs);
    // A health alert must not keep a graceful shutdown or a test process alive.
    this.alertTimer.unref?.();
  }

  markConnected(): void {
    if (this.outageStartedAt === null) return;

    const outageDurationMs = Math.max(0, this.now() - this.outageStartedAt);
    if (this.alertTimer) {
      clearTimeout(this.alertTimer);
      this.alertTimer = null;
    }

    if (this.outageAlerted) {
      this.notify({
        event: "mongodb_recovered",
        component: "mongodb",
        state: "connected",
        outageDurationMs,
      });
    }

    this.outageStartedAt = null;
    this.outageAlerted = false;
  }

  private emitOutageAlert(): void {
    this.alertTimer = null;
    if (this.outageStartedAt === null || this.outageAlerted) return;

    this.outageAlerted = true;
    this.notify({
      event: "mongodb_outage",
      component: "mongodb",
      state: "disconnected",
      thresholdMs: this.thresholdMs,
    });
  }
}

export const mongoHealthAlertMonitor = new MongoHealthAlertMonitor();