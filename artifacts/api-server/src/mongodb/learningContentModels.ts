import mongoose, { Document, Schema } from 'mongoose';
import type {
  LearningMappingStatus,
  LearningProgram,
  LearningSourceType,
} from '../learning/contentMap';
import type {
  MappingConfidence,
  TaxonomyEvidence,
  TaxonomyNodeStatus,
  TaxonomyNodeType,
} from '../learning/taxonomyRegistry';

export type LearningNodeType = TaxonomyNodeType;
export type LearningNodeStatus = TaxonomyNodeStatus;

export type LearningContentProgressState =
  | 'NOT_STARTED'
  | 'READING'
  | 'COMPLETED'
  | 'PRACTICE_COMPLETED';

export type LearningContentAnnotationType =
  | 'HIGHLIGHT'
  | 'UNDERLINE'
  | 'DRAWING'
  | 'NOTE';

export interface ILearningContentPracticeReference {
  questionId: string;
  sourceType: 'mongo_question' | 'mongo_tahsili_question';
  sourceKey: string;
  answeredAt?: Date;
}

export interface ILearningContentAnnotation extends Document {
  studentId: string;
  contentId: mongoose.Types.ObjectId;
  contentVersion: number;
  sectionId?: string;
  type: LearningContentAnnotationType;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILearningContentProgress extends Document {
  studentId: string;
  contentId: mongoose.Types.ObjectId;
  contentVersion: number;
  currentSectionId?: string;
  progress: number;
  state: LearningContentProgressState;
  startedAt?: Date;
  lastReadAt?: Date;
  completedAt?: Date;
  practiceCompletedAt?: Date;
  pendingPractice?: ILearningContentPracticeReference;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILearningContentNode extends Document {
  code: string;
  name: string;
  nameAr: string;
  type: LearningNodeType;
  program: LearningProgram;
  subject?: string;
  parentId?: string;
  status: LearningNodeStatus;
  source: string;
  evidence: TaxonomyEvidence[];
  aliases: string[];
  reviewedBy?: string;
  reviewedAt?: Date;
  // Legacy aliases remain optional so Phase 02 callers can be migrated safely.
  nodeType?: string;
  parentCode?: string;
  title?: string;
  slug?: string;
  sourceLabels?: string[];
  prerequisiteCodes: string[];
  metadata?: {
    estimatedTimeMinutes?: number;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const learningContentNodeSchema = new Schema<ILearningContentNode>(
  {
    code: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    nameAr: { type: String, required: true, trim: true, maxlength: 200 },
    type: {
      type: String,
      enum: ['PROGRAM', 'SUBJECT', 'TOPIC', 'SKILL', 'SUBSKILL', 'CONCEPT'],
      required: true,
      index: true,
    },
    program: { type: String, enum: ['qudrat', 'tahsili'], required: true, index: true },
    parentId: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: ['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED'],
      default: 'REVIEW',
      index: true,
    },
    subject: { type: String, trim: true, index: true },
    source: { type: String, required: true, trim: true },
    evidence: {
      type: [
        {
          source: { type: String, required: true, trim: true },
          evidence: { type: String, required: true, trim: true },
          confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
        },
      ],
      default: [],
    },
    aliases: { type: [String], default: [] },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    // Deprecated Phase 02 aliases. New writes should use the canonical fields above.
    nodeType: { type: String },
    parentCode: { type: String, trim: true, index: true },
    title: { type: String, trim: true, maxlength: 200 },
    slug: { type: String, trim: true, maxlength: 200 },
    sourceLabels: { type: [String], default: [] },
    prerequisiteCodes: { type: [String], default: [] },
    metadata: {
      estimatedTimeMinutes: { type: Number, min: 0 },
      notes: { type: String, maxlength: 2000 },
    },
  },
  { timestamps: true },
);

const learningContentPracticeReferenceSchema = new Schema<ILearningContentPracticeReference>({
  questionId: { type: String, required: true, trim: true },
  sourceType: {
    type: String,
    enum: ['mongo_question', 'mongo_tahsili_question'],
    required: true,
  },
  sourceKey: { type: String, required: true, trim: true },
  answeredAt: { type: Date },
}, { _id: false });

const learningContentAnnotationSchema = new Schema<ILearningContentAnnotation>({
  studentId: { type: String, required: true, index: true },
  contentId: { type: Schema.Types.ObjectId, ref: 'FoundationContent', required: true, index: true },
  contentVersion: { type: Number, required: true, min: 1, index: true },
  sectionId: { type: String, trim: true, maxlength: 200 },
  type: {
    type: String,
    enum: ['HIGHLIGHT', 'UNDERLINE', 'DRAWING', 'NOTE'],
    required: true,
    index: true,
  },
  data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

learningContentAnnotationSchema.index({ studentId: 1, contentId: 1, contentVersion: 1, updatedAt: -1 });
learningContentAnnotationSchema.index({ studentId: 1, contentId: 1, type: 1 });

const learningContentProgressSchema = new Schema<ILearningContentProgress>({
  studentId: { type: String, required: true, index: true },
  contentId: { type: Schema.Types.ObjectId, ref: 'FoundationContent', required: true, index: true },
  contentVersion: { type: Number, required: true, min: 1 },
  currentSectionId: { type: String, trim: true },
  progress: { type: Number, required: true, min: 0, max: 100, default: 0 },
  state: {
    type: String,
    enum: ['NOT_STARTED', 'READING', 'COMPLETED', 'PRACTICE_COMPLETED'],
    required: true,
    default: 'NOT_STARTED',
  },
  startedAt: { type: Date },
  lastReadAt: { type: Date },
  completedAt: { type: Date },
  practiceCompletedAt: { type: Date },
  pendingPractice: { type: learningContentPracticeReferenceSchema },
}, { timestamps: true });

learningContentProgressSchema.index({ studentId: 1, contentId: 1 }, { unique: true });
learningContentProgressSchema.index({ studentId: 1, updatedAt: -1 });

learningContentNodeSchema.index({ program: 1, type: 1, parentId: 1, status: 1 });
learningContentNodeSchema.index({ program: 1, subject: 1, status: 1 });

export interface IQuestionLearningMap extends Document {
  sourceType: LearningSourceType;
  sourceKey: string;
  questionObjectId?: mongoose.Types.ObjectId;
  questionId?: number | string;
  taxonomy: {
    program?: LearningProgram;
    subject?: string;
    topic?: string;
    skill?: string;
    subSkill?: string;
    concept?: string;
  };
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  status: LearningMappingStatus;
  reviewStatus: TaxonomyNodeStatus;
  confidence: MappingConfidence;
  reviewReasons: string[];
  evidence: TaxonomyEvidence[];
  mappingVersion: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const questionLearningMapSchema = new Schema<IQuestionLearningMap>(
  {
    sourceType: {
      type: String,
      enum: ['mongo_question', 'mongo_tahsili_question', 'postgres_question', 'legacy_json'],
      required: true,
      index: true,
    },
    sourceKey: { type: String, required: true, trim: true },
    questionObjectId: { type: Schema.Types.ObjectId, ref: 'Question', index: true },
    questionId: { type: Schema.Types.Mixed, index: true },
    taxonomy: {
      program: { type: String, enum: ['qudrat', 'tahsili'] },
      subject: { type: String, trim: true },
      topic: { type: String, trim: true },
      skill: { type: String, trim: true },
      subSkill: { type: String, trim: true },
      concept: { type: String, trim: true },
    },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    prerequisites: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['mapped', 'needs_review', 'unmapped'],
      required: true,
      default: 'unmapped',
      index: true,
    },
    reviewStatus: {
      type: String,
      enum: ['DRAFT', 'REVIEW', 'APPROVED', 'REJECTED'],
      required: true,
      default: 'REVIEW',
      index: true,
    },
    confidence: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      required: true,
      default: 'LOW',
    },
    reviewReasons: { type: [String], default: [] },
    evidence: {
      type: [
        {
          field: { type: String, required: true },
          value: { type: String, required: true },
          confidence: { type: String, enum: ['explicit', 'controlled', 'candidate'], required: true },
        },
      ],
      default: [],
    },
    mappingVersion: { type: String, required: true, index: true },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

questionLearningMapSchema.index({ sourceType: 1, sourceKey: 1 }, { unique: true });
questionLearningMapSchema.index({ 'taxonomy.program': 1, 'taxonomy.subject': 1, status: 1 });

export const LearningContentNode = mongoose.models['LearningContentNode']
  ? mongoose.model<ILearningContentNode>('LearningContentNode')
  : mongoose.model<ILearningContentNode>('LearningContentNode', learningContentNodeSchema);

export const QuestionLearningMap = mongoose.models['QuestionLearningMap']
  ? mongoose.model<IQuestionLearningMap>('QuestionLearningMap')
  : mongoose.model<IQuestionLearningMap>('QuestionLearningMap', questionLearningMapSchema);

export const LearningContentProgress = mongoose.models['LearningContentProgress']
  ? mongoose.model<ILearningContentProgress>('LearningContentProgress')
  : mongoose.model<ILearningContentProgress>('LearningContentProgress', learningContentProgressSchema);

export const LearningContentAnnotation = mongoose.models['LearningContentAnnotation']
  ? mongoose.model<ILearningContentAnnotation>('LearningContentAnnotation')
  : mongoose.model<ILearningContentAnnotation>('LearningContentAnnotation', learningContentAnnotationSchema);
