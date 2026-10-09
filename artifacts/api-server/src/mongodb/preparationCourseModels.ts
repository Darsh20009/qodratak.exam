import mongoose, { Schema } from 'mongoose';
// A separate additive collection; no existing students, questions or progress are migrated.
const preparationCourseSchema = new Schema({
  studentId: { type: String, required: true, unique: true },
  course: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });
export const PreparationCourse = mongoose.models.PreparationCourse || mongoose.model('PreparationCourse', preparationCourseSchema);
