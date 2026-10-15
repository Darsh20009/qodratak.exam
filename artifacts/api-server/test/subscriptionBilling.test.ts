import assert from "node:assert/strict";
import test from "node:test";
import {
  latestFutureSubscriptionEnd,
  subscriptionPeriod,
} from "../src/services/subscriptionBilling";

test("first purchase begins now and retains the exact expiry time", () => {
  const now = new Date("2026-10-12T16:40:32.555Z");
  const period = subscriptionPeriod(now, 90);
  assert.equal(period.startDate.toISOString(), now.toISOString());
  assert.equal(period.endDate.getTime() - now.getTime(), 90 * 86_400_000);
});

test("renewal is active now, but adds all paid days after the remaining period", () => {
  const now = new Date("2026-10-12T16:40:32.555Z");
  const oldEnd = new Date("2026-11-01T21:30:12.123Z");
  const period = subscriptionPeriod(now, 180, oldEnd);
  assert.equal(period.startDate.getTime(), now.getTime());
  assert.equal(period.endDate.getTime(), oldEnd.getTime() + 180 * 86_400_000);
  assert.equal(oldEnd.toISOString(), "2026-11-01T21:30:12.123Z");
});

test("expired subscription is not used as the base, and invalid durations fail", () => {
  const now = new Date("2026-10-12T16:40:32.555Z");
  const period = subscriptionPeriod(now, 90, new Date("2026-09-01T00:00:00Z"));
  assert.equal(period.endDate.getTime(), now.getTime() + 90 * 86_400_000);
  for (const duration of [0, -1, NaN, 1.5, 3651]) {
    assert.throws(() => subscriptionPeriod(now, duration));
  }
});

test("renewal uses the latest unexpired expiry across canonical and legacy records", () => {
  const now = new Date("2026-10-12T16:40:32.555Z");
  const canonicalEnd = new Date("2026-11-01T21:30:12.123Z");
  const legacyEnd = "2027-01-01T00:00:00.000Z";
  const latest = latestFutureSubscriptionEnd(now, canonicalEnd, legacyEnd, "invalid", null);
  assert.equal(latest?.toISOString(), legacyEnd);
  const period = subscriptionPeriod(now, 180, latest);
  assert.equal(period.endDate.getTime(), new Date(legacyEnd).getTime() + 180 * 86_400_000);
  assert.equal(latestFutureSubscriptionEnd(now, new Date("2026-09-01T00:00:00Z")), null);
});
