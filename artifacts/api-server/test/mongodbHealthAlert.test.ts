import assert from "node:assert/strict";
import test from "node:test";
import {
  MongoHealthAlertMonitor,
  type MongoHealthAlert,
} from "../src/services/mongodbHealthAlert.ts";

test("alerts once after a sustained MongoDB outage and emits recovery", async () => {
  let now = 1_000;
  const alerts: MongoHealthAlert[] = [];
  const monitor = new MongoHealthAlertMonitor({
    thresholdMs: 10,
    now: () => now,
    notify: (alert) => alerts.push(alert),
  });

  monitor.markDisconnected();
  monitor.markDisconnected();
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.deepEqual(alerts, [
    {
      event: "mongodb_outage",
      component: "mongodb",
      state: "disconnected",
      thresholdMs: 10,
    },
  ]);

  now = 1_025;
  monitor.markConnected();
  assert.deepEqual(alerts[1], {
    event: "mongodb_recovered",
    component: "mongodb",
    state: "connected",
    outageDurationMs: 25,
  });
});

test("does not alert or emit recovery for a short outage", async () => {
  let now = 2_000;
  const alerts: MongoHealthAlert[] = [];
  const monitor = new MongoHealthAlertMonitor({
    thresholdMs: 30,
    now: () => now,
    notify: (alert) => alerts.push(alert),
  });

  monitor.markDisconnected();
  now = 2_010;
  monitor.markConnected();
  await new Promise((resolve) => setTimeout(resolve, 40));

  assert.deepEqual(alerts, []);
});

test("alert payload contains no connection details", async () => {
  const alerts: MongoHealthAlert[] = [];
  const monitor = new MongoHealthAlertMonitor({
    thresholdMs: 5,
    notify: (alert) => alerts.push(alert),
  });

  monitor.markDisconnected();
  await new Promise((resolve) => setTimeout(resolve, 15));

  assert.deepEqual(Object.keys(alerts[0] ?? {}).sort(), [
    "component",
    "event",
    "state",
    "thresholdMs",
  ]);
  const serializedAlerts = JSON.stringify(alerts);
  assert.equal(serializedAlerts.includes("MONGODB_URI"), false);
  assert.equal(serializedAlerts.includes("password"), false);
  assert.equal(serializedAlerts.includes("secret"), false);
});