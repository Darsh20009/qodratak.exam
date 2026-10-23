export type WorkflowStage = "foundation" | "skills" | "banks" | "simulation";
export type WorkflowStageStatus =
  | "NOT_ASSESSED"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NEEDS_REVIEW";

export interface StudentWorkflowEvidence {
  foundationAvailableCount: number;
  foundationCompletedCount: number;
  foundationEvidenceLoaded: boolean;
  diagnosticComplete: boolean;
  testTypeEvidence: Array<{
    program: "qudrat" | "tahsili";
    testType: string;
    tests: number;
  }>;
}

export type StudentWorkflowStatuses = Record<WorkflowStage, WorkflowStageStatus>;

const SECTION_TEST_TYPES = new Set([
  "verbal",
  "quantitative",
  "free-verbal",
  "free-quantitative",
  "advanced-verbal",
  "advanced-quantitative",
]);

export function resolveStudentWorkflowStatuses(
  evidence: StudentWorkflowEvidence,
): StudentWorkflowStatuses {
  const foundationAvailable = Math.max(0, Math.floor(evidence.foundationAvailableCount || 0));
  const foundationCompleted = Math.max(0, Math.floor(evidence.foundationCompletedCount || 0));
  const hasFoundationEvidence = evidence.foundationEvidenceLoaded && foundationAvailable > 0;
  const foundation: WorkflowStageStatus = !hasFoundationEvidence
    ? "NOT_ASSESSED"
    : foundationCompleted <= 0
      ? "NOT_STARTED"
      : foundationCompleted >= foundationAvailable
        ? "COMPLETED"
        : "IN_PROGRESS";

  const qudratTests = evidence.testTypeEvidence.filter((item) => item.program === "qudrat");
  const submittedQudratTests = qudratTests.reduce((sum, item) => sum + Math.max(0, Number(item.tests) || 0), 0);
  const submittedSectionTests = qudratTests
    .filter((item) => SECTION_TEST_TYPES.has(String(item.testType || "").trim().toLowerCase()))
    .reduce((sum, item) => sum + Math.max(0, Number(item.tests) || 0), 0);
  const submittedSimulations = qudratTests
    .filter((item) => ["qiyas", "simulation", "mock"].includes(String(item.testType || "").trim().toLowerCase()))
    .reduce((sum, item) => sum + Math.max(0, Number(item.tests) || 0), 0);
  const notAssessedOrStarted = evidence.diagnosticComplete ? "NOT_STARTED" : "NOT_ASSESSED";

  return {
    foundation,
    skills: submittedQudratTests > 0 ? "IN_PROGRESS" : notAssessedOrStarted,
    banks: submittedSectionTests > 0 ? "IN_PROGRESS" : notAssessedOrStarted,
    simulation: submittedSimulations > 0 ? "COMPLETED" : notAssessedOrStarted,
  };
}

export function currentWorkflowStage(statuses: StudentWorkflowStatuses): WorkflowStage {
  return (["foundation", "skills", "banks", "simulation"] as const)
    .find((stage) => statuses[stage] !== "COMPLETED") || "simulation";
}
