import mongoose, { Document, Schema } from 'mongoose';
import type {
  LearningMappingStatus,
  LearningProgram,
  LearningSourceType,
} from '../learning/contentMap';

export type LearningNodeType =
  | 'program'
  | 'subject'
  | 'topic'
  | 'skill'
  | 'subSkill'
  | 'concept';

export type LearningNodeStatus = 'draft' | 'active' | 'needs_review' | 'archived';

export interface ILearningContentNode extends Document {
  code: string;
  nodeType: LearningNodeType;
  program: LearningProgram;
  parentCode?: string;
  title: string;
  slug: string;
  status: LearningNodeStatus;
  sourceLabels: string[];
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
    nodeType: {
      type: String,
      enum: ['program', 'subject', 'topic', 'skill', 'subSkill', 'concept'],
      required: true,
      index: true,
    },
    program: { type: String, enum: ['qudrat', 'tahsili'], required: true, index: true },
    parentCode: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ['draft', 'active', 'needs_review', 'archived'],
      default: 'draft',
      index: true,
    },
    sourceLabels: { type: [String], default: [] },
    prerequisiteCodes: { type: [String], default: [] },
    metadata: {
      estimatedTimeMinutes: { type: Number, min: 0 },
      notes: { type: String, maxlength: 2000 },
    },
  },
  { timestamps: true },
);

learningContentNodeSchema.index({ program: 1, nodeType: 1, parentCode: 1, status: 1 });

export interface IQuestionLearningMap extends Document {
  sourceType: LearningSourceType;
  sourceKey: string;
  questionObjectId?: mongoose.Types.ObjectId;
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
  reviewReasons: string[];
  evidence: Array<{
    field: string;
    value: string;
    confidence: 'explicit' | 'controlled' | 'candidate';
  }>;
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
