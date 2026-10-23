export type DashboardSavedTestProgram = "qudrat" | "tahsili" | "general";

const QUDRAT_TEST_TYPES = new Set([
  "verbal",
  "quantitative",
  "free-verbal",
  "free-quantitative",
  "qiyas",
]);

export function classifySavedTestProgram(
  programValue: unknown,
  testTypeValue: unknown,
): DashboardSavedTestProgram {
  const program = String(programValue || "").trim().toLowerCase();
  const testType = String(testTypeValue || "").trim().toLowerCase();
  if (program === "qudrat") return "qudrat";
  if (program === "tahsili") return "tahsili";
  if ((program === "general" || !program) && QUDRAT_TEST_TYPES.has(testType)) return "qudrat";
  return "general";
}
