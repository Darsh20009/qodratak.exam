import mongoose from 'mongoose';
import {
  LearningAttempt,
  LearningErrorEvidence,
  StudentMastery,
  type ILearningAttempt,
  type IStudentMastery,
  type LearningAttemptSourceType,
  type LearningErrorType,
  type MasteryLevel,
  type LearningErrorConfidence,
} from '../mongodb/learningProfileModels';
import {
  CONTROLLED_TAXONOMY_NODES,
  type TaxonomyNodeType,
} from '../learning/taxonomyRegistry';

export const MASTERY_CALCULATION_VERSION = 'phase-07-v1';
const RECENCY_HALF_LIFE_DAYS = 30;
const PRIOR_WEIGHT = 2;
const MIN_SECONDS_PER_DAY = 86400;

const CONCEPT_ERROR_TYPES = new Set<LearningErrorType>([
  'CONCEPT_GAP',
  'MISUNDERSTANDING',
  'MEMORY_GAP',
  'PARTIAL_UNDERSTANDING',
]);

const PROCEDURAL_ERROR_TYPES = new Set<LearningErrorType>([
  'CALCULATION_ERROR',
  'RUSHED',
  'TIME_PRESSURE',
  'READING_ERROR',
  'CONFUSED_OPTIONS',
  'WRONG_STRATEGY',
  'FAILED_TO_IDENTIFY_RELATION',
]);

export interface MasteryAttemptInput {
  id?: string;
  questionId: string;
  sourceIdentity: string;
  programId: string;
  subjectId?: string;
  sourceType?: LearningAttemptSourceType;
  isAnswered: boolean;
  isCorrect: boolean;
  responseTime?: number;
  createdAt: Date | string;
}

export interface MasteryErrorEvidenceInput {
  attemptId: string;
  errorType: LearningErrorType;
  confidence?: LearningErrorConfidence;
  detectedAt: Date | string;
}

export interface ApprovedMasteryNode {
  code: string;
  type: TaxonomyNodeType;
  programId: string;
  subjectId?: string;
  status: 'APPROVED';
}

export interface MasterySnapshot {
  taxonomyNodeId: string;
  taxonomyNodeType: TaxonomyNodeType;
  programId: string;
  subjectId?: string;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  evidenceCount: number;
  correctCount: number;
  wrongCount: number;
  lastAttemptAt?: Date;
  lastEvidenceAt?: Date;
  confidence: LearningErrorConfidence;
  calculation: {
    answeredEvidenceCount: number;
    distinctSourceCount: number;
    recentCorrectStreak: number;
    correctWeight: number;
    negativeWeight: number;
    conceptErrorCount: number;
    proceduralErrorCount: number;
    unknownErrorCount: number;
    recencyFactor: number;
  };
  calculationVersion: string;
}

export class MasteryError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_TAXONOMY_NODE' | 'INVALID_STUDENT',
  ) {
    super(message);
    this.name = 'MasteryError';
  }
}

const approvedMasteryNodes = new Map(
  CONTROLLED_TAXONOMY_NODES
    .filter((node) => node.status === 'APPROVED' && (node.type === 'PROGRAM' || node.type === 'SUBJECT'))
    .map((node) => [node.code, node]),
);

export function approvedMasteryNode(nodeId: string): ApprovedMasteryNode | null {
  const node = approvedMasteryNodes.get(String(nodeId).trim());
  if (!node) return null;
  return {
    code: node.code,
    type: node.type,
    programId: `program.${node.program}`,
    subjectId: node.type === 'SUBJECT' ? node.code : undefined,
    status: 'APPROVED',
  };
}

export function listApprovedMasteryNodes(): ApprovedMasteryNode[] {
  return [...approvedMasteryNodes.values()].map((node) => ({
    code: node.code,
    type: node.type,
    programId: `program.${node.program}`,
    subjectId: node.type === 'SUBJECT' ? node.code : undefined,
    status: 'APPROVED',
  }));
}

export function resolveMasteryNodeForAttempt(
  attempt: Pick<MasteryAttemptInput, 'programId' | 'subjectId'>,
): ApprovedMasteryNode | null {
  if (attempt.subjectId) {
    const subject = approvedMasteryNode(attempt.subjectId);
    return subject && subject.programId === attempt.programId ? subject : null;
  }
  return approvedMasteryNode(attempt.programId);
}

function dateValue(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

export function recencyWeight(createdAt: Date | string, now: Date): number {
  const date = dateValue(createdAt);
  if (!date) return 0.25;
  const ageDays = Math.max(0, now.getTime() - date.getTime()) / MIN_SECONDS_PER_DAY / 1000;
  const decayed = Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
  return Math.max(0.25, Math.round(decayed * 10000) / 10000);
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function errorEffect(
  attemptId: string,
  evidenceByAttempt: Map<string, MasteryErrorEvidenceInput[]>,
): { effect: number; kind: 'concept' | 'procedural' | 'unknown' } {
  const evidence = evidenceByAttempt.get(attemptId) || [];
  if (evidence.some((item) => CONCEPT_ERROR_TYPES.has(item.errorType))) {
    return { effect: 1, kind: 'concept' };
  }
  if (evidence.some((item) => PROCEDURAL_ERROR_TYPES.has(item.errorType))) {
    return { effect: 0.35, kind: 'procedural' };
  }
  return { effect: 0.5, kind: 'unknown' };
}

function masteryLevel(
  evidenceCount: number,
  masteryScore: number,
  recentCorrectStreak: number,
): MasteryLevel {
  if (evidenceCount === 0) return 'UNKNOWN';
  if (
    evidenceCount >= 8 &&
    masteryScore >= 85 &&
    recentCorrectStreak >= 3
  ) return 'MASTERED';
  if (evidenceCount >= 5 && masteryScore >= 70) return 'PROFICIENT';
  if (evidenceCount >= 3 && masteryScore >= 50) return 'DEVELOPING';
  return 'EMERGING';
}

function masteryConfidence(
  evidenceCount: number,
  distinctSourceCount: number,
): LearningErrorConfidence {
  if (evidenceCount >= 8 && distinctSourceCount >= 3) return 'HIGH';
  if (evidenceCount >= 3) return 'MEDIUM';
  return 'LOW';
}

function uniqueAttempts(attempts: MasteryAttemptInput[]): MasteryAttemptInput[] {
  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = attempt.id || [
      attempt.sourceIdentity,
      attempt.questionId,
      String(attempt.createdAt),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function calculateMasterySnapshot(
  node: ApprovedMasteryNode,
  attempts: MasteryAttemptInput[],
  errorEvidence: MasteryErrorEvidenceInput[],
  now: Date = new Date(),
): MasterySnapshot | null {
  const registeredNode = approvedMasteryNode(node.code);
  if (
    node.status !== 'APPROVED' ||
    !registeredNode ||
    registeredNode.type !== node.type ||
    registeredNode.programId !== node.programId ||
    registeredNode.subjectId !== node.subjectId
  ) return null;

  const nodeAttempts = uniqueAttempts(attempts).filter((attempt) =>
    resolveMasteryNodeForAttempt(attempt)?.code === node.code
  );
  const evidenceByAttempt = new Map<string, MasteryErrorEvidenceInput[]>();
  for (const evidence of errorEvidence) {
    const existing = evidenceByAttempt.get(evidence.attemptId) || [];
    existing.push(evidence);
    evidenceByAttempt.set(evidence.attemptId, existing);
  }

  const orderedAttempts = [...nodeAttempts].sort((a, b) =>
    (dateValue(b.createdAt)?.getTime() || 0) - (dateValue(a.createdAt)?.getTime() || 0)
  );
  const answered = orderedAttempts.filter((attempt) => attempt.isAnswered);
  const correct = answered.filter((attempt) => attempt.isCorrect);
  const wrong = answered.filter((attempt) => !attempt.isCorrect);
  const distinctSourceCount = new Set(answered.map((attempt) => attempt.sourceIdentity)).size;
  const recentCorrectStreak = orderedAttempts.reduce((streak, attempt) => {
    if (!attempt.isAnswered) return streak;
    if (!attempt.isCorrect) return streak;
    return streak + 1;
  }, 0);

  let correctWeight = 0;
  let negativeWeight = 0;
  let conceptErrorCount = 0;
  let proceduralErrorCount = 0;
  let unknownErrorCount = 0;
  let totalRecencyWeight = 0;

  for (const attempt of answered) {
    const weight = recencyWeight(attempt.createdAt, now);
    totalRecencyWeight += weight;
    if (attempt.isCorrect) {
      correctWeight += weight;
      continue;
    }
    const effect = errorEffect(attempt.id || '', evidenceByAttempt);
    negativeWeight += weight * effect.effect;
    if (effect.kind === 'concept') conceptErrorCount += 1;
    else if (effect.kind === 'procedural') proceduralErrorCount += 1;
    else unknownErrorCount += 1;
  }

  const totalSignalWeight = correctWeight + negativeWeight;
  const masteryScore = answered.length === 0
    ? 0
    : round(clamp(
      50 + (50 * (correctWeight - negativeWeight) / (totalSignalWeight + PRIOR_WEIGHT)),
      0,
      100,
    ));
  const lastAttemptAt = orderedAttempts
    .map((attempt) => dateValue(attempt.createdAt))
    .find((date): date is Date => Boolean(date));
  const nodeAttemptIds = new Set(nodeAttempts.map((attempt) => attempt.id || ''));
  const lastEvidenceAt = errorEvidence
    .filter((evidence) => nodeAttemptIds.has(evidence.attemptId))
    .map((evidence) => dateValue(evidence.detectedAt))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const confidence = masteryConfidence(answered.length, distinctSourceCount);

  return {
    taxonomyNodeId: node.code,
    taxonomyNodeType: node.type,
    programId: node.programId,
    subjectId: node.subjectId,
    masteryScore,
    masteryLevel: masteryLevel(answered.length, masteryScore, recentCorrectStreak),
    evidenceCount: answered.length,
    correctCount: correct.length,
    wrongCount: wrong.length,
    lastAttemptAt,
    lastEvidenceAt,
    confidence,
    calculation: {
      answeredEvidenceCount: answered.length,
      distinctSourceCount,
      recentCorrectStreak,
      correctWeight: round(correctWeight),
      negativeWeight: round(negativeWeight),
      conceptErrorCount,
      proceduralErrorCount,
      unknownErrorCount,
      recencyFactor: answered.length > 0 ? round(totalRecencyWeight / answered.length) : 0,
    },
    calculationVersion: MASTERY_CALCULATION_VERSION,
  };
}

function attemptInput(attempt: any): MasteryAttemptInput {
  return {
    id: attempt?._id ? String(attempt._id) : undefined,
    questionId: String(attempt?.questionId || ''),
    sourceIdentity: String(attempt?.sourceIdentity || ''),
    programId: String(attempt?.programId || ''),
    subjectId: attempt?.subjectId ? String(attempt.subjectId) : undefined,
    sourceType: attempt?.sourceType,
    isAnswered: Boolean(attempt?.isAnswered),
    isCorrect: Boolean(attempt?.isCorrect),
    responseTime: Number(attempt?.responseTime || 0),
    createdAt: attempt?.createdAt,
  };
}

function evidenceInput(evidence: any): MasteryErrorEvidenceInput {
  return {
    attemptId: String(evidence?.attemptId || ''),
    errorType: evidence?.errorType || 'UNKNOWN',
    confidence: evidence?.confidence,
    detectedAt: evidence?.detectedAt,
  };
}

export async function recalculateStudentMastery(
  studentId: string,
  taxonomyNodeId?: string,
): Promise<IStudentMastery[]> {
  if (!String(studentId || '').trim()) {
    throw new MasteryError('studentId غير صالح', 'INVALID_STUDENT');
  }
  if (taxonomyNodeId && !approvedMasteryNode(taxonomyNodeId)) {
    throw new MasteryError('عقدة mastery غير معتمدة', 'INVALID_TAXONOMY_NODE');
  }

  const [attemptDocs, evidenceDocs] = await Promise.all([
    LearningAttempt.find({ studentId }).lean(),
    LearningErrorEvidence.find({ studentId }).lean(),
  ]);
  const attempts = attemptDocs.map(attemptInput);
  const evidence = evidenceDocs.map(evidenceInput);
  const nodes = taxonomyNodeId
    ? [approvedMasteryNode(taxonomyNodeId)!]
    : listApprovedMasteryNodes();
  const snapshots: MasterySnapshot[] = [];

  for (const node of nodes) {
    const snapshot = calculateMasterySnapshot(node, attempts, evidence);
    if (!snapshot || snapshot.evidenceCount === 0) continue;
    snapshots.push(snapshot);
    await StudentMastery.findOneAndUpdate(
      { studentId, taxonomyNodeId: snapshot.taxonomyNodeId },
      { $set: { studentId, ...snapshot } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  if (taxonomyNodeId) {
    return StudentMastery.find({ studentId, taxonomyNodeId }).sort({ taxonomyNodeId: 1 }).lean() as any;
  }
  return StudentMastery.find({ studentId }).sort({ taxonomyNodeId: 1 }).lean() as any;
}

export async function recalculateMasteryForAttempt(studentId: string, attemptId: string) {
  if (!mongoose.Types.ObjectId.isValid(attemptId)) return null;
  const attempt = await LearningAttempt.findOne({ _id: attemptId, studentId }).lean();
  if (!attempt) return null;
  const node = resolveMasteryNodeForAttempt(attemptInput(attempt));
  if (!node) return null;
  const results = await recalculateStudentMastery(studentId, node.code);
  return results[0] || null;
}

export function publicStudentMastery(mastery: any) {
  return {
    id: mastery?._id ? String(mastery._id) : undefined,
    studentId: mastery?.studentId,
    programId: mastery?.programId,
    subjectId: mastery?.subjectId,
    taxonomyNodeId: mastery?.taxonomyNodeId,
    taxonomyNodeType: mastery?.taxonomyNodeType,
    masteryScore: mastery?.masteryScore,
    masteryLevel: mastery?.masteryLevel,
    evidenceCount: mastery?.evidenceCount,
    correctCount: mastery?.correctCount,
    wrongCount: mastery?.wrongCount,
    lastAttemptAt: mastery?.lastAttemptAt,
    lastEvidenceAt: mastery?.lastEvidenceAt,
    confidence: mastery?.confidence,
    calculation: mastery?.calculation,
    calculationVersion: mastery?.calculationVersion,
    updatedAt: mastery?.updatedAt,
  };
}