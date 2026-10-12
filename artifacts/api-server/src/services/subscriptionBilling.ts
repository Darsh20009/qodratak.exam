const DAY_MS = 86_400_000;

/** Renewal grants access immediately, without losing remaining paid days. */
export function subscriptionPeriod(now: Date, durationDays: number, currentEnd?: Date | null) {
  if (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
    throw new Error("Invalid subscription duration");
  }
  const base = Math.max(now.getTime(), currentEnd?.getTime() || 0);
  return {
    startDate: new Date(now),
    endDate: new Date(base + durationDays * DAY_MS),
  };
}

export function subscriptionPlanName(type: string) {
  return type === "Pro" ? "باقة 3 أشهر"
    : type === "Pro Life Plus" ? "باقة 6 أشهر" : type;
}
