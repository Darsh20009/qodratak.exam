import mongoose, { Document, Schema } from 'mongoose';

export type LearningAttemptSourceType =
  | 'mongo_question'
  | 'mongo_tahsili_question'
  | 'postgres_question'
  | 'legacy_json'
  | 'unknown';

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
  startedAt: Date;
  endedAt?: Date;
  duration: number;
  questionsAttempted: number;
  questionsCorrect: number;
  questionsWrong: number;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const learningSessionSchema = new Schema<ILearningSession>({
  studentId: { type: String, required: true, index: true },
  programId: { type: String, required: true, trim: true, index: true },
  subjectId: { type: String, trim: true, index: true },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active', index: true },
  startedAt: { type: Date, default: Date.now, index: true },
  endedAt: { type: Date },
  duration: { type: Number, default: 0, min: 0 },
  questionsAttempted: { type: Number, default: 0, min: 0 },
  questionsCorrect: { type: Number, default: 0, min: 0 },
  questionsWrong: { type: Number, default: 0, min: 0 },
  idempotencyKey: { type: String, trim: true, maxlength: 160 },
}, { timestamps: true });

learningSessionSchema.index({ studentId: 1, startedAt: -1 });
learningSessionSchema.index({ studentId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const LearningAttempt = mongoose.models['LearningAttempt']
  ? mongoose.model<ILearningAttempt>('LearningAttempt')
  : mongoose.model<ILearningAttempt>('LearningAttempt', learningAttemptSchema);

export const LearningSession = mongoose.models['LearningSession']
  ? mongoose.model<ILearningSession>('LearningSession')
  : mongoose.model<ILearningSession>('LearningSession', learningSessionSchema);

export const LearningAttemptSequence = mongoose.models['LearningAttemptSequence']
  ? mongoose.model<ILearningAttemptSequence>('LearningAttemptSequence')
  : mongoose.model<ILearningAttemptSequence>('LearningAttemptSequence', learningAttemptSequenceSchema);