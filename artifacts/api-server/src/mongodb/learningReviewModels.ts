import mongoose, { Document, Schema } from 'mongoose';

export type LearningReviewSourceType = 'CONTENT' | 'QUESTION' | 'TAXONOMY_SCOPE';
export type LearningReviewState = 'NEW' | 'LEARNING' | 'REVIEW_DUE' | 'STABLE' | 'SUSPENDED';
export type LearningRetentionConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type LearningReviewFailureKind = 'CONCEPT' | 'PROCEDURAL' | 'UNKNOWN';
export type LearningReviewReasonCode =
  | 'FIRST_REVIEW'
  | 'REVIEW_DUE'
  | 'OVERDUE'
  | 'RECENT_FAILURE'
  | 'CONCEPT_ERROR'
  | 'LOW_RETENTION_CONFIDENCE'
  | 'POST_MASTERY_CHECK';

export interface ILearningReviewItem extends Document {
  studentId: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  taxonomyNodeType?: 'PROGRAM' | 'SUBJECT' | 'TOPIC' | 'SKILL' | 'SUBSKILL' | 'CONCEPT';
  sourceType: LearningReviewSourceType;
  sourceId: string;
  sourceIdentity: string;
  lastReviewedAt?: Date;
  lastSuccessfulReviewAt?: Date;
  lastFailedAt?: Date;
  reviewCount: number;
  successfulReviewCount: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  nextReviewAt: Date;
  intervalDays: number;
  retentionConfidence: LearningRetentionConfidence;
  priority: number;
  state: LearningReviewState;
  reasonCodes: LearningReviewReasonCode[];
  lastFailureKind?: LearningReviewFailureKind;
  masteryLevel?: 'UNKNOWN' | 'EMERGING' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';
  createdAt: Date;
  updatedAt: Date;
}

const learningReviewItemSchema = new Schema<ILearningReviewItem>({
  studentId: { type: String, required: true, trim: true, index: true },
  programId: { type: String, required: true, trim: true, index: true },
  subjectId: { type: String, trim: true, index: true },
  taxonomyNodeId: { type: String, trim: true, index: true },
  taxonomyNodeType: {
    type: String,
    enum: ['PROGRAM', 'SUBJECT', 'TOPIC', 'SKILL', 'SUBSKILL', 'CONCEPT'],
  },
  sourceType: {
    type: String,
    enum: ['CONTENT', 'QUESTION', 'TAXONOMY_SCOPE'],
    required: true,
    index: true,
  },
  sourceId: { type: String, required: true, trim: true },
  sourceIdentity: { type: String, required: true, trim: true },
  lastReviewedAt: { type: Date },
  lastSuccessfulReviewAt: { type: Date },
  lastFailedAt: { type: Date },
  reviewCount: { type: Number, required: true, min: 0, default: 0 },
  successfulReviewCount: { type: Number, required: true, min: 0, default: 0 },
  consecutiveSuccesses: { type: Number, required: true, min: 0, default: 0 },
  consecutiveFailures: { type: Number, required: true, min: 0, default: 0 },
  nextReviewAt: { type: Date, required: true, index: true },
  intervalDays: { type: Number, required: true, min: 1, max: 365, default: 1 },
  retentionConfidence: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: true,
    default: 'LOW',
    index: true,
  },
  priority: { type: Number, required: true, min: 0, max: 100, index: true },
  state: {
    type: String,
    enum: ['NEW', 'LEARNING', 'REVIEW_DUE', 'STABLE', 'SUSPENDED'],
    required: true,
    default: 'NEW',
    index: true,
  },
  reasonCodes: {
    type: [String],
    enum: [
      'FIRST_REVIEW',
      'REVIEW_DUE',
      'OVERDUE',
      'RECENT_FAILURE',
      'CONCEPT_ERROR',
      'LOW_RETENTION_CONFIDENCE',
      'POST_MASTERY_CHECK',
    ],
    default: [],
  },
  lastFailureKind: { type: String, enum: ['CONCEPT', 'PROCEDURAL', 'UNKNOWN'] },
  masteryLevel: {
    type: String,
    enum: ['UNKNOWN', 'EMERGING', 'DEVELOPING', 'PROFICIENT', 'MASTERED'],
  },
}, { timestamps: true });

learningReviewItemSchema.index({ studentId: 1, sourceIdentity: 1 }, { unique: true });
learningReviewItemSchema.index({ studentId: 1, nextReviewAt: 1, state: 1, priority: -1 });
learningReviewItemSchema.index({ studentId: 1, programId: 1, subjectId: 1, nextReviewAt: 1 });

export const LearningReviewItem = mongoose.models['LearningReviewItem']
  ? mongoose.model<ILearningReviewItem>('LearningReviewItem')
  : mongoose.model<ILearningReviewItem>('LearningReviewItem', learningReviewItemSchema);