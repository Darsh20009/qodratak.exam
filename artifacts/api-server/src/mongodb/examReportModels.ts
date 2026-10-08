import mongoose, { Schema } from 'mongoose';

const reportSchema = new Schema({
  studentId: { type: String, required: true },
  runId: { type: String, required: true },
  title: { type: String, required: true },
  questions: { type: [Schema.Types.Mixed], required: true },
  timing: { type: Schema.Types.Mixed, required: true },
  generationQueued: { type: Boolean, default: false },
}, { timestamps: true });
reportSchema.index({ studentId: 1, runId: 1 }, { unique: true });
reportSchema.index({ studentId: 1, createdAt: -1 });
export const ExamLearningReport = mongoose.models.ExamLearningReport || mongoose.model('ExamLearningReport', reportSchema);

const explanationSchema = new Schema({
  fingerprint: { type: String, required: true, unique: true },
  explanation: { type: String, required: true },
  tip: { type: String, required: true },
  status: { type: String, enum: ['generated'], default: 'generated' },
}, { timestamps: true });
export const QuestionExplanationCache = mongoose.models.QuestionExplanationCache || mongoose.model('QuestionExplanationCache', explanationSchema);
const usageSchema = new Schema({
  studentId: { type: String, required: true },
  bucket: { type: Number, required: true },
  used: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});
usageSchema.index({ studentId: 1, bucket: 1 }, { unique: true });
usageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const ExplanationGenerationUsage = mongoose.models.ExplanationGenerationUsage || mongoose.model('ExplanationGenerationUsage', usageSchema);
