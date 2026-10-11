import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  key: { type: String, required: true, unique: true },
  studentId: { type: String, required: true },
  sourceType: { type: String, enum: ['test_result', 'booking', 'practice'], required: true },
  sourceId: { type: String, required: true },
  summary: { type: Schema.Types.Mixed },
  state: { type: String, enum: ['pending', 'sending', 'sent', 'skipped', 'failed'], default: 'pending' },
  availableAt: { type: Date, required: true },
  leaseUntil: { type: Date },
  leaseToken: { type: String },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date },
  lastError: { type: String },
}, { timestamps: true });
schema.index({ state: 1, availableAt: 1 });
export const ExamResultWhatsAppDelivery = mongoose.models.ExamResultWhatsAppDelivery
  || mongoose.model('ExamResultWhatsAppDelivery', schema);

const workerSchema = new Schema({
  _id: { type: String },
  rolloutAt: { type: Date, required: true },
  testCursor: { type: Schema.Types.ObjectId },
});
export const ExamResultWhatsAppWorker = mongoose.models.ExamResultWhatsAppWorker
  || mongoose.model('ExamResultWhatsAppWorker', workerSchema);
