export type BookingMode = "undecided" | "booked" | "open";
export interface PreparationPreferences { bookingMode: BookingMode; introSeen: boolean }
export const preparationPreferenceKey = (uid: unknown) => `qodratak.preparation.preferences.${String(uid)}`;
export const openPreparationTarget = (planStatus?: string) => planStatus === "READY" ? "session" : "foundation";
const defaults = (): PreparationPreferences => ({ bookingMode: "undecided", introSeen: false });

export function readPreparationPreferences(storage: Pick<Storage, "getItem"> | undefined, uid: unknown): PreparationPreferences {
  if (!storage || !uid) return defaults();
  try {
    const data = JSON.parse(storage.getItem(preparationPreferenceKey(uid)) || "{}");
    return { bookingMode: data?.bookingMode === "booked" || data?.bookingMode === "open" ? data.bookingMode : "undecided",
      introSeen: data?.introSeen === true };
  } catch { return defaults(); }
}

// Presentation preference only. It never grants access, assigns a level or invents an exam date.
export function preparationNeedsAssessment(
  profile: { status?: string; lastDiagnosticAt?: string | null } | null | undefined,
  course: { level: string; assessmentRequiredAfter?: string } | null | undefined,
  hasRecentEvidence = false, now = Date.now(),
) {
  if (course && course.level !== "unassessed") return false;
  if (profile?.status !== "diagnostic_completed") return true;
  const date = new Date(profile.lastDiagnosticAt || "").getTime();
  if (course?.assessmentRequiredAfter) return !(date > new Date(course.assessmentRequiredAfter).getTime() && date <= now);
  return !hasRecentEvidence && !(Number.isFinite(date) && date <= now && now - date <= 30 * 86400000);
}
