import mongoose, { Document, Schema } from 'mongoose';

export type LearningAttemptSourceType =
  | 'mongo_question'
  | 'mongo_tahsili_question'
  | 'postgres_question'
  | 'legacy_json'
  | 'unknown';

export const LEARNING_ERROR_TYPES = [
  'CONCEPT_GAP',
  'CALCULATION_ERROR',
  'READING_ERROR',
  'MISUNDERSTANDING',
  'WRONG_STRATEGY',
  'RUSHED',
  'GUESS',
  'CONFUSED_OPTIONS',
  'FAILED_TO_IDENTIFY_RELATION',
  'MEMORY_GAP',
  'PARTIAL_UNDERSTANDING',
  'TIME_PRESSURE',
  'UNKNOWN',
] as const;

export type LearningErrorType = typeof LEARNING_ERROR_TYPES[number];
export type LearningErrorConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type LearningErrorEvidenceSignal =
  | 'wrong_answer'
  | 'response_time'
  | 'question_metadata'
  | 'self_report'
  | 'attempt_outcome';

export interface ILearningErrorEvidenceSignal {
  type: LearningErrorEvidenceSignal;
  value?: string | number | boolean | null;
  detail?: string;
}

export interface ILearningAttempt extends Document {
  studentId: string;
  questionId: string;
  sourceType: LearningAttemptSourceType;
  sourceKey?: string;
  sourceIdentity: string;
  programId: string;
  subjectId?: string;
  sessionId?: mongoose.Types.ObjectId;
  selectedAnswer?: string | number | null;
  correctAnswer?: string | number | null;
  isAnswered: boolean;
  isCorrect: boolean;
  responseTime: number;
  attemptNumber: number;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const learningAttemptSchema = new Schema<ILearningAttempt>({
  studentId: { type: String, required: true, index: true },
  questionId: { type: String, required: true, trim: true, index: true },
  sourceType: {
    type: String,
    enum: ['mongo_question', 'mongo_tahsili_question', 'postgres_question', 'legacy_json', 'unknown'],
    default: 'unknown',
    index: true,
  },
  sourceKey: { type: String, trim: true },
  sourceIdentity: { type: String, required: true, index: true },
  programId: { type: String, required: true, trim: true, index: true },
  subjectId: { type: String, trim: true, index: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'LearningSession', index: true },
  selectedAnswer: { type: Schema.Types.Mixed },
  correctAnswer: { type: Schema.Types.Mixed },
  isAnswered: { type: Boolean, required: true, default: true },
  isCorrect: { type: Boolean, required: true, default: false },
  responseTime: { type: Number, required: true, min: 0, max: 86400, default: 0 },
  attemptNumber: { type: Number, required: true, min: 1, default: 1 },
  idempotencyKey: { type: String, trim: true, maxlength: 160 },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

learningAttemptSchema.index({ studentId: 1, createdAt: -1 });
learningAttemptSchema.index({ studentId: 1, sourceIdentity: 1, createdAt: -1 });
learningAttemptSchema.index({ studentId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export interface ILearningAttemptSequence extends Document {
  studentId: string;
  sourceIdentity: string;
  nextAttemptNumber: number;
}

const learningAttemptSequenceSchema = new Schema<ILearningAttemptSequence>({
  studentId: { type: String, required: true },
  sourceIdentity: { type: String, required: true },
  nextAttemptNumber: { type: Number, required: true, min: 0, default: 0 },
});

learningAttemptSequenceSchema.index({ studentId: 1, sourceIdentity: 1 }, { unique: true });

export interface ILearningSession extends Document {
  studentId: string;
  programId: string;
  subjectId?: string;
  status: 'active' | 'completed' | 'abandoned';
  sessionState: 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  questionsAttempted: number;
  questionsCorrect: number;
  questionsWrong: number;
  idempotencyKey?: string;
  dailyKey?: string;
  planId?: string;
  recommendationId?: string;
  recommendationType?: string;
  title?: string;
  estimatedMinutes?: number;
  sessionReason?: string;
  planConfidence?: 'LOW' | 'MEDIUM' | 'HIGH';
  planStatus?: 'READY' | 'CONTENT_UNAVAILABLE' | 'DIAGNOSTIC_REQUIRED' | 'NO_RECOMMENDATION';
  planSnapshot?: Record<string, unknown>;
  currentStepIndex: number;
  progress: number;
  stepProgress?: Array<{
    stepId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'UNAVAILABLE';
    completedAt?: Date;
    durationSeconds?: number;
    attemptIds?: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const learningSessionSchema = new Schema<ILearningSession>({
  studentId: { type: String, required: true, index: true },
  programId: { type: String, required: true, trim: true, index: true },
  subjectId: { type: String, trim: true, index: true },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active', index: true },
  sessionState: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED'],
    default: 'IN_PROGRESS',
    index: true,
  },
  startedAt: { type: Date, default: Date.now, index: true },
  endedAt: { type: Date },
  duration: { type: Number, default: 0, min: 0 },
  questionsAttempted: { type: Number, default: 0, min: 0 },
  questionsCorrect: { type: Number, default: 0, min: 0 },
  questionsWrong: { type: Number, default: 0, min: 0 },
  idempotencyKey: { type: String, trim: true, maxlength: 160 },
  dailyKey: { type: String, trim: true, maxlength: 160, index: true },
  planId: { type: String, trim: true, maxlength: 160 },
  recommendationId: { type: String, trim: true, maxlength: 160 },
  recommendationType: { type: String, trim: true, maxlength: 40 },
  title: { type: String, trim: true, maxlength: 200 },
  estimatedMinutes: { type: Number, min: 1, max: 60 },
  sessionReason: { type: String, trim: true, maxlength: 500 },
  planConfidence: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
  planStatus: {
    type: String,
    enum: ['READY', 'CONTENT_UNAVAILABLE', 'DIAGNOSTIC_REQUIRED', 'NO_RECOMMENDATION'],
  },
  planSnapshot: { type: Schema.Types.Mixed },
  currentStepIndex: { type: Number, min: 0, default: 0 },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  stepProgress: [{
    stepId: { type: String, required: true },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'UNAVAILABLE'],
      required: true,
    },
    completedAt: { type: Date },
    durationSeconds: { type: Number, min: 0 },
    attemptIds: [{ type: String }],
  }],
}, { timestamps: true });

learningSessionSchema.index({ studentId: 1, startedAt: -1 });
learningSessionSchema.index({ studentId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
learningSessionSchema.index({ studentId: 1, dailyKey: 1 });

export const LearningAttempt = mongoose.models['LearningAttempt']
  ? mongoose.model<ILearningAttempt>('LearningAttempt')
  : mongoose.model<ILearningAttempt>('LearningAttempt', learningAttemptSchema);

export const LearningSession = mongoose.models['LearningSession']
  ? mongoose.model<ILearningSession>('LearningSession')
  : mongoose.model<ILearningSession>('LearningSession', learningSessionSchema);

export const LearningAttemptSequence = mongoose.models['LearningAttemptSequence']
  ? mongoose.model<ILearningAttemptSequence>('LearningAttemptSequence')
  : mongoose.model<ILearningAttemptSequence>('LearningAttemptSequence', learningAttemptSequenceSchema);

export interface ILearningErrorEvidence extends Document {
  studentId: string;
  attemptId: mongoose.Types.ObjectId;
  questionId: string;
  sourceType: LearningAttemptSourceType;
  sourceKey?: string;
  sourceIdentity: string;
  programId: string;
  subjectId?: string;
  errorType: LearningErrorType;
  confidence: LearningErrorConfidence;
  evidence: ILearningErrorEvidenceSignal[];
  inferenceRule: string;
  selfReport?: string;
  observed: {
    isAnswered: boolean;
    isCorrect: boolean;
    responseTime: number;
    selectedAnswer?: string | number | null;
    questionMetadata?: {
      category?: string;
      subcategory?: string;
      difficulty?: string;
      topic?: string;
      hasExplanation?: boolean;
    };
  };
  detectedAt: Date;
  idempotencyKey?: string;
}

const learningErrorEvidenceSignalSchema = new Schema<ILearningErrorEvidenceSignal>({
  type: {
    type: String,
    enum: ['wrong_answer', 'response_time', 'question_metadata', 'self_report', 'attempt_outcome'],
    required: true,
  },
  value: { type: Schema.Types.Mixed },
  detail: { type: String, trim: true, maxlength: 500 },
}, { _id: false });

const learningErrorEvidenceSchema = new Schema<ILearningErrorEvidence>({
  studentId: { type: String, required: true, index: true },
  attemptId: { type: Schema.Types.ObjectId, ref: 'LearningAttempt', required: true, index: true },
  questionId: { type: String, required: true, trim: true, index: true },
  sourceType: {
    type: String,
    enum: ['mongo_question', 'mongo_tahsili_question', 'postgres_question', 'legacy_json', 'unknown'],
    required: true,
    index: true,
  },
  sourceKey: { type: String, trim: true },
  sourceIdentity: { type: String, required: true, index: true },
  programId: { type: String, required: true, trim: true, index: true },
  subjectId: { type: String, trim: true, index: true },
  errorType: { type: String, enum: LEARNING_ERROR_TYPES, required: true, index: true },
  confidence: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  evidence: { type: [learningErrorEvidenceSignalSchema], required: true, default: [] },
  inferenceRule: { type: String, required: true, trim: true, maxlength: 120 },
  selfReport: { type: String, trim: true, maxlength: 80 },
  observed: {
    isAnswered: { type: Boolean, required: true },
    isCorrect: { type: Boolean, required: true },
    responseTime: { type: Number, required: true, min: 0, max: 86400 },
    selectedAnswer: { type: Schema.Types.Mixed },
    questionMetadata: { type: Schema.Types.Mixed },
  },
  detectedAt: { type: Date, default: Date.now, index: true },
  idempotencyKey: { type: String, trim: true, maxlength: 160 },
});

learningErrorEvidenceSchema.index({ studentId: 1, detectedAt: -1 });
learningErrorEvidenceSchema.index({ studentId: 1, attemptId: 1, detectedAt: -1 });
learningErrorEvidenceSchema.index({ studentId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const LearningErrorEvidence = mongoose.models['LearningErrorEvidence']
  ? mongoose.model<ILearningErrorEvidence>('LearningErrorEvidence')
  : mongoose.model<ILearningErrorEvidence>('LearningErrorEvidence', learningErrorEvidenceSchema);

export type MasteryLevel = 'UNKNOWN' | 'EMERGING' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';

export interface IMasteryCalculation {
  answeredEvidenceCount: number;
  distinctSourceCount: number;
  recentCorrectStreak: number;
  correctWeight: number;
  negativeWeight: number;
  conceptErrorCount: number;
  proceduralErrorCount: number;
  unknownErrorCount: number;
  recencyFactor: number;
}

export interface IStudentMastery extends Document {
  studentId: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId: string;
  taxonomyNodeType: 'PROGRAM' | 'SUBJECT' | 'TOPIC' | 'SKILL' | 'SUBSKILL' | 'CONCEPT';
  masteryScore: number;
  masteryLevel: MasteryLevel;
  evidenceCount: number;
  correctCount: number;
  wrongCount: number;
  lastAttemptAt?: Date;
  lastEvidenceAt?: Date;
  confidence: LearningErrorConfidence;
  calculation: IMasteryCalculation;
  calculationVersion: string;
  updatedAt: Date;
  createdAt: Date;
}

const masteryCalculationSchema = new Schema<IMasteryCalculation>({
  answeredEvidenceCount: { type: Number, required: true, min: 0 },
  distinctSourceCount: { type: Number, required: true, min: 0 },
  recentCorrectStreak: { type: Number, required: true, min: 0 },
  correctWeight: { type: Number, required: true, min: 0 },
  negativeWeight: { type: Number, required: true, min: 0 },
  conceptErrorCount: { type: Number, required: true, min: 0 },
  proceduralErrorCount: { type: Number, required: true, min: 0 },
  unknownErrorCount: { type: Number, required: true, min: 0 },
  recencyFactor: { type: Number, required: true, min: 0, max: 1 },
}, { _id: false });

const studentMasterySchema = new Schema<IStudentMastery>({
  studentId: { type: String, required: true, index: true },
  programId: { type: String, required: true, trim: true, index: true },
  subjectId: { type: String, trim: true, index: true },
  taxonomyNodeId: { type: String, required: true, trim: true, index: true },
  taxonomyNodeType: {
    type: String,
    enum: ['PROGRAM', 'SUBJECT', 'TOPIC', 'SKILL', 'SUBSKILL', 'CONCEPT'],
    required: true,
  },
  masteryScore: { type: Number, required: true, min: 0, max: 100 },
  masteryLevel: {
    type: String,
    enum: ['UNKNOWN', 'EMERGING', 'DEVELOPING', 'PROFICIENT', 'MASTERED'],
    required: true,
    index: true,
  },
  evidenceCount: { type: Number, required: true, min: 0 },
  correctCount: { type: Number, required: true, min: 0 },
  wrongCount: { type: Number, required: true, min: 0 },
  lastAttemptAt: { type: Date },
  lastEvidenceAt: { type: Date },
  confidence: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
  calculation: { type: masteryCalculationSchema, required: true },
  calculationVersion: { type: String, required: true, default: 'phase-07-v1' },
}, { timestamps: true });

studentMasterySchema.index({ studentId: 1, taxonomyNodeId: 1 }, { unique: true });
studentMasterySchema.index({ studentId: 1, programId: 1, subjectId: 1 });

export const StudentMastery = mongoose.models['StudentMastery']
  ? mongoose.model<IStudentMastery>('StudentMastery')
  : mongoose.model<IStudentMastery>('StudentMastery', studentMasterySchema);