const TRACKABLE_STUDY_PREFIXES = [
  "/foundation",
  "/student-program",
  "/computerized",
  "/learning/today",
  "/tahsili",
  "/tahsilik/question-bank",
  "/question-bank",
  "/flashcards",
  "/courses",
  "/training",
];

const EXCLUDED_EXAM_PREFIXES = [
  "/qiyas",
  "/paper-exam",
  "/paper-models",
  "/tahsili/exams",
  "/tahsilik/tests",
  "/abilities",
  "/custom-exam",
  "/adaptive-test",
  "/book-exam",
  "/test-results",
  "/exam-review",
];

export function isTrackableStudyPath(location: string): boolean {
  const path = String(location || "/").split("?")[0].split("#")[0] || "/";
  if (EXCLUDED_EXAM_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  if (/^\/question-bank\/[^/]+\/\d+$/.test(path)) return false;
  return TRACKABLE_STUDY_PREFIXES.some((prefix) => path.startsWith(prefix));
}
