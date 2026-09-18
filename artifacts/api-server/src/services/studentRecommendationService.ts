import { createHash } from 'node:crypto';
import {
  LearningAttempt,
  LearningErrorEvidence,
  StudentMastery,
  type LearningErrorType,
  type LearningErrorConfidence,
  type MasteryLevel,
} from '../mongodb/learningProfileModels';
import {
  type DiagnosticScope,
  type StudentDiagnosticDecision,
  getStudentDiagnosticDecision,
  normalizeDiagnosticProgram,
} from './studentDiagnosticService';
import { listApprovedMasteryNodes } from './masteryService';

export type LearningRecommendationType =
  | 'LEARN'
  | 'PRACTICE'
  | 'REVIEW'
  | 'RECOVERY_CHECK'
  | 'DIAGNOSTIC'
  | 'MASTERY_CHECK';
export type RecommendationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecommendationLifecycleStatus = 'active' | 'completed' | 'dismissed' | 'expired';

export type RecommendationReasonCode =
  | 'DIAGNOSTIC_REQUIRED'
  | 'LOW_DATA_CONFIDENCE'
  | 'REPEATED_CONCEPT_ERRORS'
  | 'REPEATED_MISUNDERSTANDING'
  | 'PROCEDURAL_ERROR_PATTERN'
  | 'LOW_MASTERY'
  | 'RECENT_EVIDENCE'
  | 'STALE_EVIDENCE'
  | 'RETURNED_AFTER_GAP'
  | 'NEAR_MASTERY_LOW_CONFIDENCE'
  | 'UNKNOWN_EVIDENCE_ONLY';

export const RECOMMENDATION_CALCULATION_VERSION = 'phase-09-v1';
export const RECOMMENDATION_RECENT_DAYS = 30;
export const RECOMMENDATION_EXPIRY_DAYS = 7;

export interface RecommendationPriorityFactors {
  base: number;
  masteryWeakness: number;
  repeatedError: number;
  recency: number;
  uncertainty: number;
}

export interface RecommendationEvidence {
  answeredEvidenceCount: number;
  recentAnsweredEvidenceCount: number;
  errorEvidenceCount: number;
  recentErrorEvidenceCount: number;
  trustworthyErrorCount: number;
  errorTypes: LearningErrorType[];
  masteryScore?: number;
  masteryLevel?: MasteryLevel;
  masteryEvidenceCount?: number;
  masteryConfidence?: LearningErrorConfidence;
  lastEvidenceAt?: Date;
  diagnosticState: StudentDiagnosticDecision['diagnosticState'];
  dataConfidence: StudentDiagnosticDecision['dataConfidence'];
}

export interface LearningRecommendation {
  recommendationId: string;
  studentId: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  recommendationType: LearningRecommendationType;
  priority: number;
  priorityFactors: RecommendationPriorityFactors;
  reasonCodes: RecommendationReasonCode[];
  evidence: RecommendationEvidence;
  confidence: RecommendationConfidence;
  status: RecommendationLifecycleStatus;
  generatedAt: Date;
  expiresAt: Date;
  calculationVersion: string;
}

export interface RecommendationAttemptRecord {
  id?: string;
  programId: string;
  subjectId?: string;
  isAnswered: boolean;
  isCorrect: boolean;
  createdAt: Date | string;
}

export interface RecommendationErrorRecord {
  attemptId?: string;
  programId: string;
  subjectId?: string;
  errorType: LearningErrorType;
  confidence: LearningErrorConfidence;
  detectedAt: Date | string;
}

export interface RecommendationMasteryRecord {
  taxonomyNodeId: string;
  taxonomyNodeType?: string;
  programId: string;
  subjectId?: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  evidenceCount: number;
  confidence: LearningErrorConfidence;
  lastAttemptAt?: Date | string;
  lastEvidenceAt?: Date | string;
}

export interface BuildRecommendationsInput {
  diagnostic: StudentDiagnosticDecision;
  attempts: RecommendationAttemptRecord[];
  errorEvidence?: RecommendationErrorRecord[];
  mastery?: RecommendationMasteryRecord[];
  requestedProgramId?: string;
  now?: Date;
}

export interface StudentRecommendationsResult {
  studentId: string;
  recommendations: LearningRecommendation[];
  diagnostic: StudentDiagnosticDecision;
  generatedAt: Date;
  calculationVersion: string;
}

interface ApprovedRecommendationNode {
  code: string;
  type: 'PROGRAM' | 'SUBJECT';
  programId: string;
  subjectId?: string;
}

interface ScopeEvidence {
  node: ApprovedRecommendationNode;
  attempts: RecommendationAttemptRecord[];
  errors: RecommendationErrorRecord[];
  mastery?: RecommendationMasteryRecord;
  recentAttempts: RecommendationAttemptRecord[];
  recentErrors: RecommendationErrorRecord[];
  trustworthyErrors: RecommendationErrorRecord[];
  lastEvidenceAt?: Date;
}

interface RecommendationCandidate {
  type: LearningRecommendationType;
  scope: ApprovedRecommendationNode;
  reasonCodes: RecommendationReasonCode[];
  evidence: RecommendationEvidence;
  priorityFactors: RecommendationPriorityFactors;
  confidence: RecommendationConfidence;
  expiresInDays: number;
}

const CONCEPT_ERROR_TYPES = new Set<LearningErrorType>([
  'CONCEPT_GAP',
  'MISUNDERSTANDING',
  'MEMORY_GAP',
  'PARTIAL_UNDERSTANDING',
]);

const PROCEDURAL_ERROR_TYPES = new Set<LearningErrorType>([
  'CALCULATION_ERROR',
  'READING_ERROR',
  'WRONG_STRATEGY',
  'RUSHED',
  'TIME_PRESSURE',
  'CONFUSED_OPTIONS',
  'FAILED_TO_IDENTIFY_RELATION',
]);

function asDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function latestDate(values: Array<Date | string | undefined>): Date | undefined {
  return values
    .map(asDate)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => b.getTime() - a.getTime())[0];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function confidenceRank(confidence: RecommendationConfidence): number {
  return confidence === 'HIGH' ? 3 : confidence === 'MEDIUM' ? 2 : 1;
}

function normalizeRequestedProgram(value: string | undefined): string | undefined {
  return value ? normalizeDiagnosticProgram(value) : undefined;
}

function approvedNodes(requestedProgramId?: string): ApprovedRecommendationNode[] {
  return listApprovedMasteryNodes()
    .filter((node) => !requestedProgramId || node.programId === requestedProgramId)
    .filter((node) => node.type === 'PROGRAM' || node.type === 'SUBJECT')
    .map((node) => ({
      code: node.code,
      type: node.type as 'PROGRAM' | 'SUBJECT',
      programId: node.programId,
      subjectId: node.subjectId,
    }));
}

function scopeFromDiagnostic(
  scope: DiagnosticScope,
  nodes: ApprovedRecommendationNode[],
): ApprovedRecommendationNode | undefined {
  return nodes.find((node) => node.code === scope.taxonomyNodeId);
}

function deduplicateById<T extends { id?: string; createdAt: Date | string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = record.id || `${String(record.createdAt)}|${JSON.stringify(record)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function subjectMatches(
  record: { programId: string; subjectId?: string },
  node: ApprovedRecommendationNode,
): boolean {
  if (record.programId !== node.programId) return false;
  return node.type === 'PROGRAM' || record.subjectId === node.subjectId;
}

function isRecent(value: Date | string | undefined, now: Date): boolean {
  const date = asDate(value);
  return Boolean(date && now.getTime() - date.getTime() <= RECOMMENDATION_RECENT_DAYS * 86400000);
}

function errorConfidenceIsTrustworthy(confidence: LearningErrorConfidence): boolean {
  return confidence === 'MEDIUM' || confidence === 'HIGH';
}

function priorityBase(type: LearningRecommendationType): number {
  return {
    DIAGNOSTIC: 86,
    RECOVERY_CHECK: 78,
    LEARN: 70,
    PRACTICE: 60,
    REVIEW: 50,
    MASTERY_CHECK: 45,
  }[type];
}

function recommendationConfidence(
  mastery: RecommendationMasteryRecord | undefined,
  trustworthyErrors: RecommendationErrorRecord[],
  diagnosticConfidence: RecommendationConfidence,
): RecommendationConfidence {
  if (!mastery) return diagnosticConfidence;
  const highErrors = trustworthyErrors.filter((error) => error.confidence === 'HIGH').length;
  if (
    mastery.confidence === 'HIGH' &&
    (highErrors >= 2 || (trustworthyErrors.length === 0 && mastery.evidenceCount >= 8))
  ) return 'HIGH';
  if (mastery.confidence !== 'LOW' && trustworthyErrors.length >= 2) return 'MEDIUM';
  return 'LOW';
}

function createEvidence(scope: ScopeEvidence, diagnostic: StudentDiagnosticDecision): RecommendationEvidence {
  return {
    answeredEvidenceCount: scope.attempts.filter((attempt) => attempt.isAnswered).length,
    recentAnsweredEvidenceCount: scope.recentAttempts.filter((attempt) => attempt.isAnswered).length,
    errorEvidenceCount: scope.errors.length,
    recentErrorEvidenceCount: scope.recentErrors.length,
    trustworthyErrorCount: scope.trustworthyErrors.length,
    errorTypes: [...new Set(scope.trustworthyErrors.map((error) => error.errorType))].sort(),
    masteryScore: scope.mastery?.masteryScore,
    masteryLevel: scope.mastery?.masteryLevel,
    masteryEvidenceCount: scope.mastery?.evidenceCount,
    masteryConfidence: scope.mastery?.confidence,
    lastEvidenceAt: scope.lastEvidenceAt,
    diagnosticState: diagnostic.diagnosticState,
    dataConfidence: diagnostic.dataConfidence,
  };
}

function buildCandidate(
  type: LearningRecommendationType,
  scope: ScopeEvidence,
  diagnostic: StudentDiagnosticDecision,
  reasonCodes: RecommendationReasonCode[],
  now: Date,
  expiresInDays = RECOMMENDATION_EXPIRY_DAYS,
): RecommendationCandidate {
  const masteryScore = scope.mastery?.masteryScore;
  const masteryWeakness = masteryScore === undefined
    ? 0
    : Math.round(clamp((70 - masteryScore) / 3.5, 0, 20));
  const repeatedError = Math.round(clamp(scope.trustworthyErrors.length * 4, 0, 20));
  const recency = scope.recentAttempts.length > 0 || scope.recentErrors.length > 0 ? 10 : 0;
  const uncertainty = diagnostic.dataConfidence === 'LOW'
    ? 10
    : diagnostic.dataConfidence === 'MEDIUM'
      ? 5
      : 0;
  const priorityFactors = {
    base: priorityBase(type),
    masteryWeakness,
    repeatedError,
    recency,
    uncertainty,
  };
  const priority = Math.round(clamp(
    priorityFactors.base +
      priorityFactors.masteryWeakness +
      priorityFactors.repeatedError +
      priorityFactors.recency +
      priorityFactors.uncertainty,
    0,
    100,
  ));
  return {
    type,
    scope: scope.node,
    reasonCodes: [...new Set(reasonCodes)],
    evidence: createEvidence(scope, diagnostic),
    priorityFactors,
    confidence: recommendationConfidence(
      scope.mastery,
      scope.trustworthyErrors,
      diagnostic.dataConfidence,
    ),
    expiresInDays,
  };
}

function candidateForScope(
  scope: ScopeEvidence,
  diagnostic: StudentDiagnosticDecision,
  now: Date,
): RecommendationCandidate | undefined {
  const conceptErrors = scope.trustworthyErrors.filter((error) => CONCEPT_ERROR_TYPES.has(error.errorType));
  const proceduralErrors = scope.trustworthyErrors.filter((error) => PROCEDURAL_ERROR_TYPES.has(error.errorType));
  const unknownOnly = scope.errors.length > 0 && scope.trustworthyErrors.length === 0;
  const mastery = scope.mastery;
  const stale = Boolean(
    mastery?.lastAttemptAt &&
    !isRecent(mastery.lastAttemptAt, now),
  );
  const lowMastery = Boolean(
    mastery &&
    mastery.evidenceCount >= 3 &&
    (mastery.masteryLevel === 'EMERGING' || mastery.masteryScore < 50) &&
    (
      scope.trustworthyErrors.length >= 2 ||
      (mastery.confidence === 'HIGH' && mastery.evidenceCount >= 5)
    ),
  );
  const nearMastery = Boolean(
    mastery &&
    mastery.evidenceCount >= 3 &&
    mastery.masteryScore >= 70 &&
    mastery.masteryLevel !== 'MASTERED' &&
    mastery.confidence !== 'HIGH',
  );

  if (stale && mastery && mastery.evidenceCount >= 3) {
    const type = mastery.confidence === 'LOW' ? 'RECOVERY_CHECK' : 'REVIEW';
    return buildCandidate(type, scope, diagnostic, [
      mastery.confidence === 'LOW' ? 'LOW_DATA_CONFIDENCE' : 'STALE_EVIDENCE',
    ], now, type === 'RECOVERY_CHECK' ? 3 : RECOMMENDATION_EXPIRY_DAYS);
  }
  if (conceptErrors.length >= 2 || lowMastery) {
    const reasons: RecommendationReasonCode[] = [];
    if (conceptErrors.length >= 2) reasons.push('REPEATED_CONCEPT_ERRORS');
    if (conceptErrors.some((error) => error.errorType === 'MISUNDERSTANDING')) {
      reasons.push('REPEATED_MISUNDERSTANDING');
    }
    if (lowMastery) reasons.push('LOW_MASTERY');
    if (scope.recentAttempts.length > 0) reasons.push('RECENT_EVIDENCE');
    return buildCandidate('LEARN', scope, diagnostic, reasons, now);
  }
  if (proceduralErrors.length >= 2) {
    return buildCandidate('PRACTICE', scope, diagnostic, [
      'PROCEDURAL_ERROR_PATTERN',
      ...(scope.recentAttempts.length > 0 ? ['RECENT_EVIDENCE' as const] : []),
    ], now);
  }
  if (nearMastery) {
    return buildCandidate('MASTERY_CHECK', scope, diagnostic, [
      'NEAR_MASTERY_LOW_CONFIDENCE',
      ...(scope.recentAttempts.length > 0 ? ['RECENT_EVIDENCE' as const] : []),
    ], now);
  }
  if (unknownOnly) {
    return undefined;
  }
  return undefined;
}

function diagnosticCandidate(
  scope: ApprovedRecommendationNode,
  diagnostic: StudentDiagnosticDecision,
  now: Date,
): RecommendationCandidate {
  return buildCandidate(
    diagnostic.diagnosticState === 'RETURNING' ? 'RECOVERY_CHECK' : 'DIAGNOSTIC',
    {
      node: scope,
      attempts: [],
      errors: [],
      recentAttempts: [],
      recentErrors: [],
      trustworthyErrors: [],
      lastEvidenceAt: diagnostic.signals.lastEvidenceAt,
    },
    diagnostic,
    [
      'DIAGNOSTIC_REQUIRED',
      ...(diagnostic.dataConfidence === 'LOW' ? ['LOW_DATA_CONFIDENCE' as const] : []),
      ...(diagnostic.diagnosticState === 'RETURNING' ? ['RETURNED_AFTER_GAP' as const] : []),
    ],
    now,
    diagnostic.diagnosticState === 'RETURNING' ? 3 : 1,
  );
}

function buildIdentity(candidate: RecommendationCandidate, studentId: string): string {
  const fingerprint = JSON.stringify({
    version: RECOMMENDATION_CALCULATION_VERSION,
    studentId,
    type: candidate.type,
    programId: candidate.scope.programId,
    subjectId: candidate.scope.subjectId,
    taxonomyNodeId: candidate.scope.code,
    reasonCodes: candidate.reasonCodes,
    evidence: candidate.evidence,
  });
  return `learning-rec-${createHash('sha256').update(fingerprint).digest('hex').slice(0, 24)}`;
}

function materializeCandidate(
  candidate: RecommendationCandidate,
  studentId: string,
  generatedAt: Date,
): LearningRecommendation {
  const expiresAt = new Date(
    generatedAt.getTime() + candidate.expiresInDays * 86400000,
  );
  return {
    recommendationId: buildIdentity(candidate, studentId),
    studentId,
    programId: candidate.scope.programId,
    subjectId: candidate.scope.subjectId,
    taxonomyNodeId: candidate.scope.code,
    recommendationType: candidate.type,
    priority: Math.round(clamp(
      candidate.priorityFactors.base +
        candidate.priorityFactors.masteryWeakness +
        candidate.priorityFactors.repeatedError +
        candidate.priorityFactors.recency +
        candidate.priorityFactors.uncertainty,
      0,
      100,
    )),
    priorityFactors: candidate.priorityFactors,
    reasonCodes: candidate.reasonCodes,
    evidence: candidate.evidence,
    confidence: candidate.confidence,
    status: 'active',
    generatedAt,
    expiresAt,
    calculationVersion: RECOMMENDATION_CALCULATION_VERSION,
  };
}

function scopeEvidence(
  node: ApprovedRecommendationNode,
  attempts: RecommendationAttemptRecord[],
  errors: RecommendationErrorRecord[],
  mastery: RecommendationMasteryRecord[],
  now: Date,
): ScopeEvidence {
  const scopedAttempts = attempts.filter((attempt) => subjectMatches(attempt, node));
  const scopedAttemptIds = new Set(scopedAttempts.map((attempt) => attempt.id).filter(Boolean));
  const scopedErrors = errors.filter((error) =>
    subjectMatches(error, node) &&
    (!error.attemptId || scopedAttemptIds.has(error.attemptId)),
  );
  const scopedMastery = mastery.find((record) =>
    record.taxonomyNodeId === node.code &&
    record.programId === node.programId,
  );
  return {
    node,
    attempts: scopedAttempts,
    errors: scopedErrors,
    mastery: scopedMastery,
    recentAttempts: scopedAttempts.filter((attempt) => isRecent(attempt.createdAt, now)),
    recentErrors: scopedErrors.filter((error) => isRecent(error.detectedAt, now)),
    trustworthyErrors: scopedErrors.filter((error) => errorConfidenceIsTrustworthy(error.confidence)),
    lastEvidenceAt: latestDate([
      ...scopedAttempts.map((attempt) => attempt.createdAt),
      ...scopedErrors.map((error) => error.detectedAt),
      scopedMastery?.lastAttemptAt,
      scopedMastery?.lastEvidenceAt,
    ]),
  };
}

function deduplicateRecommendations(
  recommendations: LearningRecommendation[],
): LearningRecommendation[] {
  const byIdentity = new Map<string, LearningRecommendation>();
  for (const recommendation of recommendations) {
    const scopeKey = [
      recommendation.recommendationType,
      recommendation.programId,
      recommendation.subjectId || '',
      recommendation.taxonomyNodeId || '',
    ].join('|');
    const existing = byIdentity.get(scopeKey);
    if (!existing || recommendation.priority > existing.priority) {
      byIdentity.set(scopeKey, recommendation);
    }
  }
  return [...byIdentity.values()].sort((a, b) =>
    b.priority - a.priority ||
    a.programId.localeCompare(b.programId) ||
    (a.subjectId || '').localeCompare(b.subjectId || '') ||
    a.recommendationType.localeCompare(b.recommendationType),
  );
}

export function buildLearningRecommendations(
  studentId: string,
  input: BuildRecommendationsInput,
): StudentRecommendationsResult {
  if (!String(studentId || '').trim()) {
    throw new Error('studentId غير صالح');
  }
  const now = input.now || new Date();
  const requestedProgramId = normalizeRequestedProgram(input.requestedProgramId);
  const nodes = approvedNodes(requestedProgramId);
  const attempts = deduplicateById(input.attempts);
  const errors = input.errorEvidence || [];
  const mastery = (input.mastery || []).filter((record) =>
    nodes.some((node) => node.code === record.taxonomyNodeId),
  );
  const candidates: RecommendationCandidate[] = [];

  if (input.diagnostic.diagnosticRequired) {
    const diagnosticScopes = input.diagnostic.scopes
      .map((scope) => scopeFromDiagnostic(scope, nodes))
      .filter((scope): scope is ApprovedRecommendationNode => Boolean(scope));
    for (const scope of diagnosticScopes) {
      candidates.push(diagnosticCandidate(scope, input.diagnostic, now));
    }
  } else {
    for (const node of nodes) {
      const evidence = scopeEvidence(node, attempts, errors, mastery, now);
      const candidate = candidateForScope(evidence, input.diagnostic, now);
      if (candidate) candidates.push(candidate);
    }
  }

  const recommendations = deduplicateRecommendations(
    candidates.map((candidate) => materializeCandidate(candidate, studentId, now)),
  );
  return {
    studentId,
    recommendations,
    diagnostic: input.diagnostic,
    generatedAt: now,
    calculationVersion: RECOMMENDATION_CALCULATION_VERSION,
  };
}

function attemptRecord(attempt: any): RecommendationAttemptRecord {
  return {
    id: attempt?._id ? String(attempt._id) : undefined,
    programId: String(attempt?.programId || ''),
    subjectId: attempt?.subjectId ? String(attempt.subjectId) : undefined,
    isAnswered: Boolean(attempt?.isAnswered),
    isCorrect: Boolean(attempt?.isCorrect),
    createdAt: attempt?.createdAt,
  };
}

export async function getStudentRecommendations(
  studentId: string,
  requestedProgramId?: string,
): Promise<StudentRecommendationsResult> {
  const normalizedProgramId = normalizeRequestedProgram(requestedProgramId);
  if (requestedProgramId && !normalizedProgramId) {
    throw new Error('البرنامج غير صالح');
  }
  const [diagnostic, attempts, errorEvidence, mastery] = await Promise.all([
    getStudentDiagnosticDecision(studentId, normalizedProgramId),
    LearningAttempt.find({ studentId }).select('_id programId subjectId isAnswered isCorrect createdAt').lean(),
    LearningErrorEvidence.find({ studentId }).select('attemptId programId subjectId errorType confidence detectedAt').lean(),
    StudentMastery.find({ studentId }).select('taxonomyNodeId taxonomyNodeType programId subjectId masteryScore masteryLevel evidenceCount confidence lastAttemptAt lastEvidenceAt').lean(),
  ]);
  return buildLearningRecommendations(studentId, {
    diagnostic,
    requestedProgramId: normalizedProgramId,
    attempts: attempts.map(attemptRecord),
    errorEvidence: errorEvidence.map((evidence: any) => ({
      attemptId: evidence.attemptId ? String(evidence.attemptId) : undefined,
      programId: String(evidence.programId || ''),
      subjectId: evidence.subjectId ? String(evidence.subjectId) : undefined,
      errorType: evidence.errorType,
      confidence: evidence.confidence,
      detectedAt: evidence.detectedAt,
    })),
    mastery: mastery.map((record: any) => ({
      taxonomyNodeId: String(record.taxonomyNodeId),
      taxonomyNodeType: record.taxonomyNodeType,
      programId: String(record.programId || ''),
      subjectId: record.subjectId ? String(record.subjectId) : undefined,
      masteryScore: Number(record.masteryScore || 0),
      masteryLevel: record.masteryLevel,
      evidenceCount: Number(record.evidenceCount || 0),
      confidence: record.confidence,
      lastAttemptAt: record.lastAttemptAt,
      lastEvidenceAt: record.lastEvidenceAt,
    })),
  });
}

export function publicStudentRecommendations(result: StudentRecommendationsResult) {
  return {
    studentId: result.studentId,
    recommendations: result.recommendations,
    diagnostic: result.diagnostic,
    generatedAt: result.generatedAt,
    calculationVersion: result.calculationVersion,
  };
}