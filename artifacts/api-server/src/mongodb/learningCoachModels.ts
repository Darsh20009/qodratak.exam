import mongoose, { Schema, type Document } from "mongoose";

export type AdaptiveTestCategory = "verbal" | "quantitative" | "mixed";

export interface IStudentDailyAdaptiveTest extends Document {
  studentId: string;
  dayKey: string;
  category: AdaptiveTestCategory;
  focusSubcategory?: string;
  questionIds: string[];
  state: "ready" | "completed";
  answers: Array<{
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
    tailoredFeedback?: string;
  }>;
  score?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const adaptiveAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    selectedIndex: { type: Number, required: true },
    correctIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, default: "" },
    tailoredFeedback: { type: String, default: "" },
  },
  { _id: false },
);

const studentDailyAdaptiveTestSchema = new Schema<IStudentDailyAdaptiveTest>(
  {
    studentId: { type: String, required: true },
    dayKey: { type: String, required: true },
    category: {
      type: String,
      enum: ["verbal", "quantitative", "mixed"],
      required: true,
    },
    focusSubcategory: { type: String },
    questionIds: { type: [String], required: true },
    state: { type: String, enum: ["ready", "completed"], default: "ready" },
    answers: { type: [adaptiveAnswerSchema], default: [] },
    score: { type: Number },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

studentDailyAdaptiveTestSchema.index(
  { studentId: 1, dayKey: 1 },
  { unique: true },
);

export const StudentDailyAdaptiveTest =
  mongoose.models["StudentDailyAdaptiveTest"] ||
  mongoose.model<IStudentDailyAdaptiveTest>(
    "StudentDailyAdaptiveTest",
    studentDailyAdaptiveTestSchema,
  );

export interface IStudentLearningCoachCache extends Document {
  studentId: string;
  fingerprint: string;
  report: Record<string, unknown>;
  generatedAt: Date;
  updatedAt: Date;
}

const studentLearningCoachCacheSchema =
  new Schema<IStudentLearningCoachCache>(
    {
      studentId: { type: String, required: true, unique: true },
      fingerprint: { type: String, required: true },
      report: { type: Schema.Types.Mixed, required: true },
      generatedAt: { type: Date, required: true },
    },
    { timestamps: true },
  );

export const StudentLearningCoachCache =
  mongoose.models["StudentLearningCoachCache"] ||
  mongoose.model<IStudentLearningCoachCache>(
    "StudentLearningCoachCache",
    studentLearningCoachCacheSchema,
  );
