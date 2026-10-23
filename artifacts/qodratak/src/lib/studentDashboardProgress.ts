export type StudentDashboardProgram = "qudrat" | "tahsili";

export type StudentDashboardEvidenceStatus =
  | "NOT_ASSESSED"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NEEDS_REVIEW";

export type StudentDashboardTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NEEDS_REVIEW";

export interface StudentDashboardStage {
  id: "foundation" | "training" | "simulation" | "analysis" | "remediation";
  title: string;
  status: StudentDashboardEvidenceStatus;
  detail: string;
  href: string;
  completedCount?: number;
  totalCount?: number;
}

export interface StudentDashboardTestEvidence {
  program: StudentDashboardProgram | "general";
  testType: string;
  tests: number;
}

export interface StudentDashboardSavedTest {
  id: string;
  title: string;
  program: StudentDashboardProgram | "general";
  score: number | null;
  date: string | null;
  totalQuestions?: number | null;
  weakAreas?: string[];
}

export interface StudentDashboardTrendPoint {
  id: string;
  title: string;
  date: string;
  percentage: number;
  totalQuestions?: number;
}

export interface StudentDashboardTask {
  id: string;
  title: string;
  reason: string;
  href: string;
  status: StudentDashboardTaskStatus;
  estimatedMinutes?: number;
}

export interface StudentDashboardProgressOverviewProps {
  metricsState: "loading" | "ready" | "unavailable";
  metrics: {
    studySeconds: number | null;
    completedTests: number | null;
    verifiedStudyDays: number | null;
    currentGoalStreak: number | null;
  };
  program: StudentDashboardProgram;
  onProgramChange: (program: StudentDashboardProgram) => void;
  stages: StudentDashboardStage[];
  tasks: StudentDashboardTask[];
  tasksState: "loading" | "ready" | "unavailable";
  trendState: "loading" | "error" | "empty" | "insufficient" | "ready";
  trendPoints: StudentDashboardTrendPoint[];
}

export interface StudentDashboardSessionEvidence {
  title: string;
  programId?: string;
  sessionReason?: string;
  state?: string;
  started: boolean;
  estimatedMinutes?: number;
  steps?: Array<{ stepType: string; status: string }>;
}

export interface StudentDashboardTaskCandidate {
  title: string;
  reason?: string;
  href: string;
  estimatedMinutes?: number;
  status?: string;
}

export interface StudentDashboardJourneyInput {
  program: StudentDashboardProgram;
  foundation: {
    loaded: boolean;
    total: number | null;
    completed: number | null;
  };
  testEvidence: StudentDashboardTestEvidence[];
  reviewTopics: string[];
  session?: StudentDashboardSessionEvidence | null;
  links: {
    foundation: string;
    training: string;
    simulation: string;
    analysis: string;
    remediation: string;
  };
}

const SIMULATION_TEST_TYPES = new Set(["qiyas", "paper_model", "standard"]);
const REMEDIATION_STEP_TYPES = new Set(["CORRECT", "SIMILAR"]);

function safeCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

function normalizeStatus(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

function evidenceCount(
  entries: StudentDashboardTestEvidence[],
  program: StudentDashboardProgram,
  predicate: (testType: string) => boolean,
): number {
  return entries.reduce((sum, entry) => {
    if (entry.program !== program || !predicate(String(entry.testType || "").toLowerCase())) return sum;
    return sum + safeCount(entry.tests);
  }, 0);
}

export function buildStudentDashboardJourney(
  input: StudentDashboardJourneyInput,
): StudentDashboardStage[] {
  const trainingCount = evidenceCount(
    input.testEvidence,
    input.program,
    (type) => !SIMULATION_TEST_TYPES.has(type),
  );
  const simulationCount = evidenceCount(
    input.testEvidence,
    input.program,
    (type) => SIMULATION_TEST_TYPES.has(type),
  );
  const savedTestCount = evidenceCount(input.testEvidence, input.program, () => true);
  const topics = [...new Set(input.reviewTopics.map((topic) => topic.trim()).filter(Boolean))];

  const total = input.foundation.total === null ? null : safeCount(input.foundation.total);
  const completed = input.foundation.completed === null ? null : safeCount(input.foundation.completed);
  let foundationStatus: StudentDashboardEvidenceStatus = "NOT_ASSESSED";
  let foundationDetail = "بيانات إنجاز الدروس غير متاحة الآن.";
  if (input.foundation.loaded && total !== null && completed !== null) {
    if (total === 0) {
      foundationDetail = "لا توجد دروس منشورة لهذا المسار بعد.";
    } else if (completed >= total) {
      foundationStatus = "COMPLETED";
      foundationDetail = `أكملت ${total} من ${total} درسًا منشورًا.`;
    } else if (completed > 0) {
      foundationStatus = "IN_PROGRESS";
      foundationDetail = `أكملت ${completed} من ${total} درسًا منشورًا.`;
    } else {
      foundationStatus = "NOT_STARTED";
      foundationDetail = `لم يبدأ بعد — 0 من ${total} درسًا مكتملًا.`;
    }
  }

  const sessionPrograms = String(input.session?.programId || "").toLowerCase().split(/[.:]/);
  const sessionMatchesProgram = sessionPrograms.includes(input.program);
  const remediationSteps = sessionMatchesProgram
    ? (input.session?.steps || []).filter((step) =>
        REMEDIATION_STEP_TYPES.has(String(step.stepType || "").toUpperCase()),
      )
    : [];
  const completedRemediationSteps = remediationSteps.filter(
    (step) => normalizeStatus(step.status) === "COMPLETED",
  ).length;
  const remediationStatus: StudentDashboardEvidenceStatus = remediationSteps.length > 0
    ? "IN_PROGRESS"
    : topics.length > 0 ? "NOT_STARTED" : "NOT_ASSESSED";

  const trainingStatus: StudentDashboardEvidenceStatus = trainingCount > 0
    ? "IN_PROGRESS"
    : total !== null && total > 0
      ? "NOT_STARTED"
      : "NOT_ASSESSED";
  const simulationStatus: StudentDashboardEvidenceStatus = simulationCount > 0
    ? "IN_PROGRESS"
    : trainingCount > 0
      ? "NOT_STARTED"
      : "NOT_ASSESSED";
  const analysisStatus: StudentDashboardEvidenceStatus = topics.length > 0
    ? "NEEDS_REVIEW"
    : savedTestCount > 0
      ? "NOT_STARTED"
      : "NOT_ASSESSED";

  return [
    {
      id: "foundation",
      title: "التأسيس",
      status: foundationStatus,
      detail: foundationDetail,
      href: input.links.foundation,
      ...(total !== null && completed !== null ? { completedCount: Math.min(completed, total), totalCount: total } : {}),
    },
    {
      id: "training",
      title: "التدريب",
      status: trainingStatus,
      detail: trainingCount > 0
        ? `${trainingCount} نتيجة تدريب محفوظة في هذا المسار.`
        : "لا توجد نتيجة تدريب محفوظة لهذا المسار بعد.",
      href: input.links.training,
    },
    {
      id: "simulation",
      title: "الاختبار المحاكي",
      status: simulationStatus,
      detail: simulationCount > 0
        ? `${simulationCount} نتيجة محاكاة محفوظة في هذا المسار.`
        : "لا توجد نتيجة محاكاة محفوظة لهذا المسار بعد.",
      href: input.links.simulation,
    },
    {
      id: "analysis",
      title: "تحليل النتائج",
      status: analysisStatus,
      detail: topics.length > 0
        ? `${topics.length} موضوعًا مسجلًا للمراجعة من نتائج هذا المسار.`
        : savedTestCount > 0
          ? "لم تُسجل موضوعات للمراجعة في النتائج المعروضة لهذا المسار."
          : "سيظهر التحليل بعد حفظ أول نتيجة في هذا المسار.",
      href: input.links.analysis,
    },
    {
      id: "remediation",
      title: "المعالجة والتحسين",
      status: remediationStatus,
      detail: remediationSteps.length > 0
        ? `أنجزت ${completedRemediationSteps} من ${remediationSteps.length} خطوة تصحيحية في الجلسة الحالية.`
        : topics.length > 0
          ? "لديك موضوعات للمراجعة، ولم تُسجل خطوة تصحيحية مكتملة بعد."
          : "ستظهر هنا خطوات التصحيح بعد تسجيلها في جلسة تعلم.",
      href: input.links.remediation,
    },
  ];
}

function taskStatus(value: unknown): StudentDashboardTaskStatus {
  const status = normalizeStatus(value);
  if (status === "COMPLETED" || status === "COMPLETE") return "COMPLETED";
  if (status === "IN_PROGRESS" || status === "STARTED" || status === "ACTIVE") return "IN_PROGRESS";
  if (status === "NEEDS_REVIEW") return "NEEDS_REVIEW";
  return "PENDING";
}

export function buildStudentDashboardTasks(input: {
  diagnosticRequired: boolean;
  diagnosticTitle?: string;
  diagnosticHref: string;
  session?: StudentDashboardSessionEvidence | null;
  sessionHref: string;
  recommendation?: StudentDashboardTaskCandidate | null;
  scheduledTask?: StudentDashboardTaskCandidate | null;
  review?: {
    topics: string[];
    testTitle?: string;
    href: string;
  } | null;
}): StudentDashboardTask[] {
  const candidates: StudentDashboardTask[] = [];
  if (input.diagnosticRequired) {
    candidates.push({
      id: "placement",
      title: input.diagnosticTitle || "ابدأ تقييم البداية",
      reason: "لا يوجد تقييم بداية محفوظ لهذا المسار.",
      href: input.diagnosticHref,
      status: "PENDING",
    });
  } else if (input.session?.title) {
    const state = taskStatus(input.session.state);
    candidates.push({
      id: `session-${input.session.programId || "student"}`,
      title: input.session.title,
      reason: input.session.sessionReason?.trim()
        || "هذه الجلسة محفوظة ضمن خطة التعلم لهذا المسار.",
      href: input.sessionHref,
      status: input.session.started && state === "PENDING" ? "IN_PROGRESS" : state,
      ...(safeCount(input.session.estimatedMinutes) > 0
        ? { estimatedMinutes: safeCount(input.session.estimatedMinutes) }
        : {}),
    });
  } else if (input.recommendation?.title?.trim()) {
    candidates.push({
      id: "recommendation",
      title: input.recommendation.title.trim(),
      reason: input.recommendation.reason?.trim()
        || "اقتراح من محرك التعلم لهذا المسار.",
      href: input.recommendation.href,
      status: "PENDING",
      ...(safeCount(input.recommendation.estimatedMinutes) > 0
        ? { estimatedMinutes: safeCount(input.recommendation.estimatedMinutes) }
        : {}),
    });
  }

  if (input.scheduledTask?.title?.trim()) {
    candidates.push({
      id: "scheduled",
      title: input.scheduledTask.title.trim(),
      reason: input.scheduledTask.reason?.trim()
        || "موعدها اليوم وفق خطة الدراسة المحفوظة.",
      href: input.scheduledTask.href,
      status: taskStatus(input.scheduledTask.status),
      ...(safeCount(input.scheduledTask.estimatedMinutes) > 0
        ? { estimatedMinutes: safeCount(input.scheduledTask.estimatedMinutes) }
        : {}),
    });
  }

  const reviewTopics = [...new Set((input.review?.topics || []).map((topic) => topic.trim()).filter(Boolean))];
  if (reviewTopics.length > 0 && input.review?.href) {
    const firstTopic = reviewTopics[0];
    candidates.push({
      id: "review",
      title: `راجع ${firstTopic}`,
      reason: `ظهرت ${reviewTopics.length} منطقة للمراجعة في نتيجتك المحفوظة${input.review.testTitle ? ` «${input.review.testTitle}»` : ""}.`,
      href: input.review.href,
      status: "NEEDS_REVIEW",
    });
  }

  const seen = new Set<string>();
  return candidates.filter((task) => {
    if (!task.href.trim() || !task.title.trim()) return false;
    const key = `${task.title.trim().toLocaleLowerCase()}|${task.href.trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 3);
}

export function buildStudentDashboardTrend(
  tests: StudentDashboardSavedTest[],
  program: StudentDashboardProgram,
): StudentDashboardTrendPoint[] {
  return tests
    .filter((test) => {
      const score = test.score === null ? Number.NaN : Number(test.score);
      const timestamp = test.date ? Date.parse(test.date) : Number.NaN;
      return test.program === program
        && Number.isFinite(score)
        && score >= 0
        && score <= 100
        && Number.isFinite(timestamp);
    })
    .map((test) => ({
      id: test.id,
      title: test.title,
      date: new Date(test.date as string).toISOString(),
      percentage: Number(test.score),
      ...(safeCount(test.totalQuestions) > 0 ? { totalQuestions: safeCount(test.totalQuestions) } : {}),
    }))
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date))
    .slice(-12);
}
