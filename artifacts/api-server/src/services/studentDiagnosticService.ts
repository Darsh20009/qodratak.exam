import {
  StudentLearningProfile,
  TestResult,
  type LearningDataConfidence,
} from '../mongodb/models';
import {
  LearningAttempt,
  LearningErrorEvidence,
  LearningSession,
  StudentMastery,
  type LearningErrorConfidence,
} from '../mongodb/learningProfileModels';
import { listApprovedMasteryNodes } from './masteryService';

export type DiagnosticState = 'NEW' | 'RETURNING' | 'ACTIVE' | 'INSUFFICIENT_DATA';
export type DiagnosticMode = 'NONE' | 'FULL' | 'RECOVERY' | 'TARGETED';
export type DiagnosticScopeType = 'PROGRAM' | 'SUBJECT' | 'TAXONOMY_NODE';
export type DiagnosticReasonCode =
  | 'NO_LEARNING_DATA'
  | 'INSUFFICIENT_EVIDENCE'
  | 'STALE_EVIDENCE'
  | 'LOW_TAXONOMY_COVERAGE'
  | 'LOW_MASTERY_CONFIDENCE'
  | 'RETURNED_AFTER_GAP'
  | 'SUFFICIENT_RECENT_DATA';

export const DIAGNOSTIC_CALCULATION_VERSION = 'phase-08-v1';
export const RECENT_ACTIVITY_DAYS = 30;
export const MIN_ACTIVE_ANSWERED_EVIDENCE = 6;
export const MIN_ACTIVE_RECENT_EVIDENCE = 3;
export const MIN_SUBJECT_EVIDENCE = 3;

export interface DiagnosticScope {
  type: DiagnosticScopeType;
  taxonomyNodeId: string;
  programId: string;
  subjectId?: string;
  reasonCodes: DiagnosticReasonCode[];
}

export interface DiagnosticSignals {
  answeredEvidenceCount: number;
  recentAnsweredEvidenceCount: number;
  errorEvidenceCount: number;
  recentErrorEvidenceCount: number;
  subjectsCovered: number;
  approvedTaxonomyCoverage: number;
  eligibleSubjectCount: number;
  masteryConfidence: LearningErrorConfidence;
  masteryRecordsCount: number;
  lastActivityAt?: Date;
  lastEvidenceAt?: Date;
  inactivityDays?: number;
  legacyDiagnosticPresent: boolean;
  lastProgramId?: string;
  lastSubjectId?: string;
}

export interface StudentDiagnosticDecision {
  studentId: string;
  diagnosticState: DiagnosticState;
  dataConfidence: LearningDataConfidence;
  diagnosticRequired: boolean;
  diagnosticMode: DiagnosticMode;
  scopes: DiagnosticScope[];
  reasonCodes: DiagnosticReasonCode[];
  signals: DiagnosticSignals;
  generatedAt: Date;
  calculationVersion: string;
}

export interface DiagnosticAttemptRecord {
  id?: string;
  programId: string;
  subjectId?: string;
  isAnswered: boolean;
  createdAt: Date | string;
}

export interface DiagnosticErrorEvidenceRecord {
  attemptId?: string;
  detectedAt: Date | string;
}

export interface DiagnosticMasteryRecord {
  taxonomyNodeId: string;
  programId: string;
  subjectId?: string;
  confidence: LearningErrorConfidence;
  evidenceCount?: number;
  lastAttemptAt?: Date | string;
  lastEvidenceAt?: Date | string;
}

export interface DiagnosticSessionRecord {
  programId: string;
  subjectId?: string;
  startedAt?: Date | string;
  endedAt?: Date | string;
  updatedAt?: Date | string;
}

export interface DiagnosticProfileRecord {
  program: string;
  status?: 'needs_diagnostic' | 'diagnostic_completed';
  lastActivityAt?: Date | string;
  lastDiagnosticAt?: Date | string;
}

export interface DiagnosticLegacyTestRecord {
  program: string;
  completedAt: Date | string;
}

export interface BuildDiagnosticDecisionInput {
  attempts: DiagnosticAttemptRecord[];
  errorEvidence?: DiagnosticErrorEvidenceRecord[];
  mastery?: DiagnosticMasteryRecord[];
  sessions?: DiagnosticSessionRecord[];
  legacyProfiles?: DiagnosticProfileRecord[];
  legacyTests?: DiagnosticLegacyTestRecord[];
  requestedProgramId?: string;
  now?: Date;
}

interface ApprovedNode {
  code: string;
  type: 'PROGRAM' | 'SUBJECT';
  programId: string;
  subjectId?: string;
}

interface SubjectSummary {
  node: ApprovedNode;
  answeredCount: number;
  recentAnsweredCount: number;
  lastAttemptAt?: Date;
  mastery?: DiagnosticMasteryRecord;
}

export class StudentDiagnosticError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_STUDENT' | 'INVALID_PROGRAM',
  ) {
    super(message);
    this.name = 'StudentDiagnosticError';
  }
}

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

function daysSince(date: Date | undefined, now: Date): number | undefined {
  if (!date) return undefined;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

function normalizeProgramId(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim().replace(/^program\./, '');
  return normalized === 'qudrat' || normalized === 'tahsili'
    ? `program.${normalized}`
    : undefined;
}

export function normalizeDiagnosticProgram(value: unknown): string | undefined {
  return normalizeProgramId(value);
}

function approvedNodes(requestedProgramId?: string): ApprovedNode[] {
  return listApprovedMasteryNodes()
    .filter((node) => !requestedProgramId || node.programId === requestedProgramId)
    .map((node) => ({
      code: node.code,
      type: node.type as 'PROGRAM' | 'SUBJECT',
      programId: node.programId,
      subjectId: node.subjectId,
    }));
}

function masteryRank(confidence: LearningErrorConfidence): number {
  return confidence === 'HIGH' ? 3 : confidence === 'MEDIUM' ? 2 : 1;
}

function aggregateMasteryConfidence(
  records: DiagnosticMasteryRecord[],
  relevantNodes: ApprovedNode[],
): LearningErrorConfidence {
  const relevant = records.filter((record) =>
    relevantNodes.some((node) => node.code === record.taxonomyNodeId)
  );
  if (relevant.length === 0) return 'LOW';
  const strongest = Math.max(...relevant.map((record) => masteryRank(record.confidence)));
  return strongest >= 3 ? 'HIGH' : strongest === 2 ? 'MEDIUM' : 'LOW';
}

function dataConfidence(signals: {
  answeredEvidenceCount: number;
  recentAnsweredEvidenceCount: number;
  subjectsCovered: number;
  masteryConfidence: LearningErrorConfidence;
  approvedTaxonomyCoverage: number;
}): LearningDataConfidence {
  const dimensions = [
    signals.answeredEvidenceCount >= MIN_ACTIVE_ANSWERED_EVIDENCE,
    signals.recentAnsweredEvidenceCount >= MIN_ACTIVE_RECENT_EVIDENCE,
    signals.subjectsCovered > 0,
    signals.approvedTaxonomyCoverage > 0,
    signals.masteryConfidence !== 'LOW',
  ].filter(Boolean).length;

  if (
    dimensions >= 5 &&
    signals.answeredEvidenceCount >= 12 &&
    signals.recentAnsweredEvidenceCount >= 5
  ) return 'HIGH';
  if (dimensions >= 3) return 'MEDIUM';
  return 'LOW';
}

function deduplicateAttempts(attempts: DiagnosticAttemptRecord[]): DiagnosticAttemptRecord[] {
  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = attempt.id || [
      attempt.programId,
      attempt.subjectId || '',
      String(attempt.createdAt),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scopeForNode(
  node: ApprovedNode,
  reasonCodes: DiagnosticReasonCode[],
): DiagnosticScope {
  return {
    type: node.type,
    taxonomyNodeId: node.code,
    programId: node.programId,
    subjectId: node.subjectId,
    reasonCodes: [...new Set(reasonCodes)],
  };
}

function chooseNewScopes(nodes: ApprovedNode[]): DiagnosticScope[] {
  const programs = nodes.filter((node) => node.type === 'PROGRAM');
  return programs.map((node) => scopeForNode(node, ['NO_LEARNING_DATA']));
}

function chooseTargetedScopes(
  summaries: SubjectSummary[],
  nodes: ApprovedNode[],
): DiagnosticScope[] {
  const subjects = summaries
    .filter((summary) =>
      summary.answeredCount < MIN_SUBJECT_EVIDENCE ||
      summary.recentAnsweredCount < MIN_ACTIVE_RECENT_EVIDENCE
    )
    .sort((a, b) =>
      a.recentAnsweredCount - b.recentAnsweredCount ||
      a.answeredCount - b.answeredCount ||
      a.node.code.localeCompare(b.node.code)
    );

  const candidates = subjects.length > 0
    ? subjects
    : summaries
      .slice()
      .sort((a, b) =>
        a.recentAnsweredCount - b.recentAnsweredCount ||
        a.answeredCount - b.answeredCount ||
        a.node.code.localeCompare(b.node.code)
      )
      .slice(0, 1);

  if (candidates.length > 0) {
    return candidates.map((summary) => scopeForNode(summary.node, [
      'INSUFFICIENT_EVIDENCE',
      ...(summary.answeredCount === 0 ? ['LOW_TAXONOMY_COVERAGE' as const] : []),
    ]));
  }

  return nodes
    .filter((node) => node.type === 'PROGRAM')
    .map((node) => scopeForNode(node, ['INSUFFICIENT_EVIDENCE']));
}

function chooseRecoveryScopes(
  summaries: SubjectSummary[],
  nodes: ApprovedNode[],
): DiagnosticScope[] {
  const stale = summaries
    .filter((summary) => summary.answeredCount > 0)
    .sort((a, b) =>
      (a.lastAttemptAt?.getTime() || 0) - (b.lastAttemptAt?.getTime() || 0) ||
      a.node.code.localeCompare(b.node.code)
    );
  if (stale.length > 0) {
    return stale.map((summary) => scopeForNode(summary.node, [
      'RETURNED_AFTER_GAP',
      'STALE_EVIDENCE',
    ]));
  }
  return nodes
    .filter((node) => node.type === 'PROGRAM')
    .map((node) => scopeForNode(node, ['RETURNED_AFTER_GAP', 'STALE_EVIDENCE']));
}

export function buildDiagnosticDecision(
  studentId: string,
  input: BuildDiagnosticDecisionInput,
): StudentDiagnosticDecision {
  if (!String(studentId || '').trim()) {
    throw new StudentDiagnosticError('studentId غير صالح', 'INVALID_STUDENT');
  }
  const now = input.now || new Date();
  const requestedProgramId = input.requestedProgramId
    ? normalizeProgramId(input.requestedProgramId)
    : undefined;
  if (input.requestedProgramId && !requestedProgramId) {
    throw new StudentDiagnosticError('البرنامج غير صالح', 'INVALID_PROGRAM');
  }

  const nodes = approvedNodes(requestedProgramId);
  const relevantSubjects = nodes.filter((node) => node.type === 'SUBJECT');
  const attempts = deduplicateAttempts(input.attempts)
    .filter((attempt) => !requestedProgramId || attempt.programId === requestedProgramId);
  const answeredAttempts = attempts.filter((attempt) => attempt.isAnswered);
  const recentCutoff = now.getTime() - RECENT_ACTIVITY_DAYS * 86400000;
  const recentAnsweredAttempts = answeredAttempts.filter((attempt) =>
    (asDate(attempt.createdAt)?.getTime() || 0) >= recentCutoff
  );
  const attemptIds = new Set(attempts.map((attempt) => attempt.id).filter(Boolean));
  const errorEvidence = (input.errorEvidence || []).filter((evidence) =>
    !requestedProgramId || !evidence.attemptId || attemptIds.has(evidence.attemptId)
  );
  const recentErrorEvidence = errorEvidence.filter((evidence) =>
    (asDate(evidence.detectedAt)?.getTime() || 0) >= recentCutoff
  );
  const mastery = (input.mastery || []).filter((record) =>
    !requestedProgramId || record.programId === requestedProgramId
  );
  const subjectsCovered = new Set(
    answeredAttempts
      .map((attempt) => attempt.subjectId)
      .filter((subjectId) => relevantSubjects.some((node) => node.code === subjectId)),
  ).size;
  const approvedTaxonomyCoverage = new Set(
    answeredAttempts
      .map((attempt) => attempt.subjectId || attempt.programId)
      .filter((nodeId) => nodes.some((node) => node.code === nodeId)),
  ).size;
  const summaries: SubjectSummary[] = relevantSubjects.map((node) => {
    const nodeAttempts = answeredAttempts.filter((attempt) => attempt.subjectId === node.code);
    const nodeRecentAttempts = recentAnsweredAttempts.filter((attempt) => attempt.subjectId === node.code);
    return {
      node,
      answeredCount: nodeAttempts.length,
      recentAnsweredCount: nodeRecentAttempts.length,
      lastAttemptAt: latestDate(nodeAttempts.map((attempt) => attempt.createdAt)),
      mastery: mastery.find((record) => record.taxonomyNodeId === node.code),
    };
  });
  const masteryConfidence = aggregateMasteryConfidence(mastery, nodes);
  const legacyProfiles = (input.legacyProfiles || []).filter((profile) =>
    !requestedProgramId || normalizeProgramId(profile.program) === requestedProgramId
  );
  const legacyTests = (input.legacyTests || []).filter((test) =>
    !requestedProgramId || normalizeProgramId(test.program) === requestedProgramId
  );
  const lastActivityAt = latestDate([
    ...attempts.map((attempt) => attempt.createdAt),
    ...errorEvidence.map((evidence) => evidence.detectedAt),
    ...mastery.flatMap((record) => [record.lastAttemptAt, record.lastEvidenceAt]),
    ...(input.sessions || []).flatMap((session) => [
      session.startedAt,
      session.endedAt,
      session.updatedAt,
    ]),
    ...legacyProfiles.flatMap((profile) => [
      profile.lastActivityAt,
      profile.lastDiagnosticAt,
    ]),
    ...legacyTests.map((test) => test.completedAt),
  ]);
  const lastEvidenceAt = latestDate([
    ...answeredAttempts.map((attempt) => attempt.createdAt),
    ...errorEvidence.map((evidence) => evidence.detectedAt),
    ...mastery.map((record) => record.lastEvidenceAt),
  ]);
  const inactivityDays = daysSince(lastActivityAt, now);
  const legacyDiagnosticPresent = legacyProfiles.some((profile) =>
    profile.status === 'diagnostic_completed' || Boolean(profile.lastDiagnosticAt)
  );
  const hasAnyData = attempts.length > 0 ||
    errorEvidence.length > 0 ||
    mastery.length > 0 ||
    legacyDiagnosticPresent ||
    legacyTests.length > 0 ||
    (input.sessions || []).length > 0;
  const stale = Boolean(inactivityDays !== undefined && inactivityDays > RECENT_ACTIVITY_DAYS);
  const enoughRecentEvidence = recentAnsweredAttempts.length >= MIN_ACTIVE_RECENT_EVIDENCE;
  const enoughEvidence = answeredAttempts.length >= MIN_ACTIVE_ANSWERED_EVIDENCE;
  const sufficientCoverage = relevantSubjects.length > 0
    ? subjectsCovered >= relevantSubjects.length
    : approvedTaxonomyCoverage > 0;
  const sufficientlyTrusted = masteryConfidence !== 'LOW';
  const active = enoughEvidence &&
    enoughRecentEvidence &&
    sufficientCoverage &&
    sufficientlyTrusted &&
    !stale;
  const state: DiagnosticState = !hasAnyData
    ? 'NEW'
    : stale
      ? 'RETURNING'
      : active
        ? 'ACTIVE'
        : 'INSUFFICIENT_DATA';
  const reasons: DiagnosticReasonCode[] = [];
  if (state === 'NEW') {
    reasons.push('NO_LEARNING_DATA');
  } else if (state === 'ACTIVE') {
    reasons.push('SUFFICIENT_RECENT_DATA');
  } else {
    if (!enoughEvidence || !enoughRecentEvidence) reasons.push('INSUFFICIENT_EVIDENCE');
    if (!sufficientCoverage) reasons.push('LOW_TAXONOMY_COVERAGE');
    if (!sufficientlyTrusted) reasons.push('LOW_MASTERY_CONFIDENCE');
    if (state === 'RETURNING') reasons.push('RETURNED_AFTER_GAP', 'STALE_EVIDENCE');
  }

  const scopes = state === 'NEW'
    ? chooseNewScopes(nodes)
    : state === 'RETURNING'
      ? chooseRecoveryScopes(summaries, nodes)
      : state === 'INSUFFICIENT_DATA'
        ? chooseTargetedScopes(summaries, nodes)
        : [];
  const confidenceDimensions = {
    answeredEvidenceCount: answeredAttempts.length,
    recentAnsweredEvidenceCount: recentAnsweredAttempts.length,
    subjectsCovered,
    masteryConfidence,
    approvedTaxonomyCoverage,
  };

  return {
    studentId,
    diagnosticState: state,
    dataConfidence: dataConfidence(confidenceDimensions),
    diagnosticRequired: state !== 'ACTIVE',
    diagnosticMode: state === 'NEW'
      ? 'FULL'
      : state === 'RETURNING'
        ? 'RECOVERY'
        : state === 'INSUFFICIENT_DATA'
          ? 'TARGETED'
          : 'NONE',
    scopes,
    reasonCodes: [...new Set(reasons)],
    signals: {
      answeredEvidenceCount: answeredAttempts.length,
      recentAnsweredEvidenceCount: recentAnsweredAttempts.length,
      errorEvidenceCount: errorEvidence.length,
      recentErrorEvidenceCount: recentErrorEvidence.length,
      subjectsCovered,
      approvedTaxonomyCoverage,
      eligibleSubjectCount: relevantSubjects.length,
      masteryConfidence,
      masteryRecordsCount: mastery.length,
      lastActivityAt,
      lastEvidenceAt,
      inactivityDays,
      legacyDiagnosticPresent,
      lastProgramId: attempts
        .slice()
        .sort((a, b) => (asDate(b.createdAt)?.getTime() || 0) - (asDate(a.createdAt)?.getTime() || 0))[0]?.programId,
      lastSubjectId: attempts
        .slice()
        .sort((a, b) => (asDate(b.createdAt)?.getTime() || 0) - (asDate(a.createdAt)?.getTime() || 0))[0]?.subjectId,
    },
    generatedAt: now,
    calculationVersion: DIAGNOSTIC_CALCULATION_VERSION,
  };
}

function attemptRecord(attempt: any): DiagnosticAttemptRecord {
  return {
    id: attempt?._id ? String(attempt._id) : undefined,
    programId: String(attempt?.programId || ''),
    subjectId: attempt?.subjectId ? String(attempt.subjectId) : undefined,
    isAnswered: Boolean(attempt?.isAnswered),
    createdAt: attempt?.createdAt,
  };
}

export async function getStudentDiagnosticDecision(
  studentId: string,
  requestedProgramId?: string,
): Promise<StudentDiagnosticDecision> {
  if (!String(studentId || '').trim()) {
    throw new StudentDiagnosticError('studentId غير صالح', 'INVALID_STUDENT');
  }
  const normalizedProgramId = requestedProgramId
    ? normalizeProgramId(requestedProgramId)
    : undefined;
  if (requestedProgramId && !normalizedProgramId) {
    throw new StudentDiagnosticError('البرنامج غير صالح', 'INVALID_PROGRAM');
  }

  const [attempts, errorEvidence, mastery, sessions, profiles, legacyResults] = await Promise.all([
    LearningAttempt.find({ studentId }).select('_id programId subjectId isAnswered createdAt').lean(),
    LearningErrorEvidence.find({ studentId }).select('attemptId detectedAt').lean(),
    StudentMastery.find({ studentId }).select('taxonomyNodeId programId subjectId confidence evidenceCount lastAttemptAt lastEvidenceAt').lean(),
    LearningSession.find({ studentId }).select('programId subjectId startedAt endedAt updatedAt').lean(),
    StudentLearningProfile.find({
      $or: [{ userId: studentId }, { studentId }],
    }).select('program status lastActivityAt lastDiagnosticAt').lean(),
    TestResult.find({ userId: studentId }).select('program completedAt').lean(),
  ]);

  return buildDiagnosticDecision(studentId, {
    attempts: attempts.map(attemptRecord),
    errorEvidence: errorEvidence.map((evidence: any) => ({
      attemptId: evidence.attemptId ? String(evidence.attemptId) : undefined,
      detectedAt: evidence.detectedAt,
    })),
    mastery: mastery.map((record: any) => ({
      taxonomyNodeId: String(record.taxonomyNodeId),
      programId: String(record.programId),
      subjectId: record.subjectId ? String(record.subjectId) : undefined,
      confidence: record.confidence,
      evidenceCount: record.evidenceCount,
      lastAttemptAt: record.lastAttemptAt,
      lastEvidenceAt: record.lastEvidenceAt,
    })),
    sessions: sessions.map((session: any) => ({
      programId: String(session.programId),
      subjectId: session.subjectId ? String(session.subjectId) : undefined,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      updatedAt: session.updatedAt,
    })),
    legacyProfiles: profiles.map((profile: any) => ({
      program: String(profile.program),
      status: profile.status,
      lastActivityAt: profile.lastActivityAt,
      lastDiagnosticAt: profile.lastDiagnosticAt,
    })),
    legacyTests: legacyResults.map((result: any) => ({
      program: String(result.program || 'general'),
      completedAt: result.completedAt,
    })),
    requestedProgramId: normalizedProgramId,
  });
}

export function publicStudentDiagnosticDecision(decision: StudentDiagnosticDecision) {
  return {
    studentId: decision.studentId,
    diagnosticState: decision.diagnosticState,
    dataConfidence: decision.dataConfidence,
    diagnosticRequired: decision.diagnosticRequired,
    diagnosticMode: decision.diagnosticMode,
    scopes: decision.scopes,
    reasonCodes: decision.reasonCodes,
    signals: decision.signals,
    generatedAt: decision.generatedAt,
    calculationVersion: decision.calculationVersion,
  };
}