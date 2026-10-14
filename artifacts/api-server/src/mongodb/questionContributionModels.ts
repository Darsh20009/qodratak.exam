import mongoose, { Schema } from "mongoose";
const schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  questionText: { type: String, required: true },
  category: { type: String, enum: ["quantitative", "verbal"], required: true },
  subcategory: String,
  options: { type: [String], required: true },
  selectedOptionIndex: { type: Number, required: true },
  notes: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  submittedAt: { type: Date, default: Date.now },
  adminNote: String, reviewedBy: String, reviewedAt: Date,
  publishedQuestionId: Number, publishedMongoId: Schema.Types.ObjectId,
  notificationStatus: String,
});
export const QuestionContribution = mongoose.models.QuestionContribution || mongoose.model("QuestionContribution", schema);
const counter = new Schema({ _id: String, sequence: Number });
export const ContributionCounter = mongoose.models.ContributionCounter || mongoose.model("ContributionCounter", counter);
