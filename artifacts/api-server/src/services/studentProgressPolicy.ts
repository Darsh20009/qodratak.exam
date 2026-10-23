export interface VerifiedDailyActivity {
  date: string;
  questionsAnswered: number;
}

export function normalizeDailyGoalTarget(value: unknown, fallback = 20): number {
  const candidate = Number(value);
  if ([5, 10, 20, 30, 50].includes(candidate)) return candidate;
  return [5, 10, 20, 30, 50].includes(Number(fallback)) ? Number(fallback) : 20;
}

export function shiftKsaDate(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function calculateVerifiedStudyDayStreak(
  activity: VerifiedDailyActivity[],
  today: string,
  targetByDate: Map<string, number> = new Map(),
  defaultTarget = 20,
): { current: number; longest: number; weekDays: boolean[] } {
  const targetForDate = (date: string) => {
    return normalizeDailyGoalTarget(targetByDate.get(date), defaultTarget);
  };
  const activeDates = new Set(
    activity.filter((day) => day.questionsAnswered >= targetForDate(day.date)).map((day) => day.date),
  );
  let current = 0;
  let cursor = activeDates.has(today) ? today : shiftKsaDate(today, -1);
  while (activeDates.has(cursor) && current < 366) {
    current++;
    cursor = shiftKsaDate(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous = "";
  for (const date of [...activeDates].sort()) {
    run = previous && shiftKsaDate(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    activeDates.has(shiftKsaDate(today, index - 6)),
  );
  return { current, longest, weekDays };
}

export function creditedStudySeconds(previousAt: Date | string | null | undefined, now: Date): number {
  if (!previousAt) return 0;
  const previousTime = new Date(previousAt).getTime();
  const currentTime = new Date(now).getTime();
  if (!Number.isFinite(previousTime) || !Number.isFinite(currentTime)) return 0;
  const elapsedSeconds = Math.floor((currentTime - previousTime) / 1000);
  return elapsedSeconds >= 15 && elapsedSeconds <= 90 ? elapsedSeconds : 0;
}
