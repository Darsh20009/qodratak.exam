const primarySections = {
  dashboard: {
    paths: ["/", "/learning/today", "/book-exam", "/pre-exam-day", "/time-management"],
    excludes: [],
  },
  foundation: {
    paths: [
      "/foundation",
      "/student-program",
      "/tahsili",
      "/student/foundation-book",
      "/learn",
      "/library",
      "/ai-tutor",
    ],
    excludes: ["/foundation/coverage-test"],
  },
  training: {
    paths: [
      "/training",
      "/computerized",
      "/qiyas",
      "/qiyas-hub",
      "/verbal-tests",
      "/quantitative-tests",
      "/question-bank",
      "/mock-exams",
      "/custom-exam",
      "/paper-exam",
      "/paper-models",
      "/bubble-sheet-scan",
      "/standard-test",
      "/seasonal-exams",
      "/abilities",
      "/tahsilik/tests",
      "/tahsilik/question-bank",
      "/adaptive-test",
      "/mistake-challenge",
      "/enhanced-mistake-challenge",
      "/free-verbal-test",
      "/free-quantitative-test",
      "/advanced-verbal-test",
      "/advanced-quantitative-test",
      "/test-me",
      "/courses",
      "/strategy-library",
      "/study-rooms",
      "/flashcards",
      "/challenges",
      "/foundation/coverage-test",
    ],
    excludes: [],
  },
  results: {
    paths: [
      "/records",
      "/test-results",
      "/paper-exam-results",
      "/exam-review",
      "/skill-progress",
      "/performance-report",
      "/analytics",
      "/error-analysis",
    ],
    excludes: [],
  },
  account: {
    paths: [
      "/account",
      "/profile",
      "/books",
      "/folders",
      "/wallet",
      "/ai-hub",
      "/notifications",
      "/notification-settings",
      "/security-settings",
      "/subscription",
      "/pricing",
      "/faq",
      "/support",
      "/guide",
      "/usage-guide",
      "/how-it-works",
      "/platform-guide",
      "/install",
    ],
    excludes: [],
  },
};

function normalizePath(path) {
  return path.split("?")[0].replace(/\/+$/, "") || "/";
}

function matchesPath(path, prefix) {
  const current = normalizePath(path);
  return prefix === "/" ? current === "/" : current === prefix || current.startsWith(`${prefix}/`);
}

export function isStudentPrimaryActive(path, sectionId) {
  const section = primarySections[sectionId];
  if (!section) return false;
  if (section.excludes.some((prefix) => matchesPath(path, prefix))) return false;
  return section.paths.some((prefix) => matchesPath(path, prefix));
}

export function isStudentPathActive(path, href) {
  return matchesPath(path, href);
}
