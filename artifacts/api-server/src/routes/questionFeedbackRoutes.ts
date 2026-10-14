import type { Express, Request, RequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { Question, QuestionReport, User } from "../mongodb/models";
import { ContributionCounter, QuestionContribution } from "../mongodb/questionContributionModels";
import { transactionalWhatsApp } from "../services/transactionalWhatsApp";
import { fetchR2VerbalObject, isR2Configured, writeR2Object } from "../services/qudratVerbalBookFilesService";
import { InstitutionError } from "../services/institutionService";

const adminPhone = "966532441566"; // Recipient explicitly requested by the platform owner.
const route = (fn: (req: Request, res: any) => Promise<any>): RequestHandler => (req, res) => {
  void fn(req, res).catch(error => {
    if (error instanceof InstitutionError) return res.status(error.status).json({ message: error.message });
    req.log?.error({ errorName: error?.name }, "Question feedback failed");
    res.status(503).json({ message: "تعذر إكمال العملية؛ احتفظ بالبيانات وأعد المحاولة" });
  });
};
async function student(req: Request) {
  const id = String((req.session as any)?.userId || "");
  if (!mongoose.isValidObjectId(id)) throw new InstitutionError("سجل الدخول أولًا", 401);
  const user = await User.findById(id);
  if (!user || user.role !== "student") throw new InstitutionError("هذه المساهمة مخصصة لحسابات الطلاب", 403);
  return user;
}
const clean = (value: unknown, max: number, required = false) => {
  if (typeof value !== "string" || value.length > max || (required && !value.trim()))
    throw new InstitutionError("تحقق من النصوص المدخلة وحدودها");
  return value.trim();
};
export function validateContribution(input: any, approval = false) {
  if (!input || !["quantitative", "verbal"].includes(input.category) ||
      !Array.isArray(input.options) || input.options.length < 2 || input.options.length > 6)
    throw new InstitutionError("اختر كمي أو لفظي وأدخل من خيارين إلى ستة خيارات");
  const options = input.options.map((value: any) => clean(value, 1500, true));
  if (new Set(options).size !== options.length) throw new InstitutionError("الخيارات يجب أن تكون مختلفة");
  const index = approval ? input.correctOptionIndex : input.selectedOptionIndex;
  if (!Number.isInteger(index) || index < 0 || index >= options.length)
    throw new InstitutionError(approval ? "حدد الإجابة الصحيحة بعد المراجعة" : "حدد الإجابة التي اخترتها");
  const data: any = {
    questionText: clean(input.questionText, 8000, true), category: input.category, options,
    subcategory: clean(input.subcategory ?? "", 150), notes: clean(input.notes ?? "", 4000),
  };
  if (!approval) data.selectedOptionIndex = index;
  else {
    if (!["beginner", "intermediate", "advanced"].includes(input.difficulty) ||
        !Number.isInteger(input.section) || input.section < 1 || input.section > 10000)
      throw new InstitutionError("حدد الصعوبة ورقم البنك الصحيح");
    data.correctOptionIndex = index; data.difficulty = input.difficulty; data.section = input.section;
    data.explanation = clean(input.explanation, 16000, true);
    data.imageUrl = clean(input.imageUrl ?? "", 2000);
    if (data.imageUrl && !/^https:\/\/[^\s]+$|^\/(?!\/)[^\s]+$/.test(data.imageUrl))
      throw new InstitutionError("ارفع الصورة أو أدخل رابطًا دائمًا وآمنًا لها");
  }
  return data;
}
async function notify(text: string, settled?: (status: "sent" | "failed") => Promise<unknown>) {
  return transactionalWhatsApp(adminPhone, text, "admin_question_feedback", settled);
}
export function contributionDto(row: any, studentName?: string) {
  return { id: String(row._id), questionText: row.questionText, category: row.category,
    subcategory: row.subcategory, options: row.options, selectedOptionIndex: row.selectedOptionIndex,
    notes: row.notes, status: row.status, submittedAt: row.submittedAt, studentName: studentName || "طالب",
    adminNote: row.adminNote, publishedQuestionId: row.publishedQuestionId, notificationStatus: row.notificationStatus };
}
async function nextQuestionNumber() {
  if (!await ContributionCounter.exists({ _id: "question-number" })) {
    const largest = await Question.findOne().sort({ questionId: -1 }).select("questionId").lean();
    try { await ContributionCounter.create({ _id: "question-number", sequence: Math.max(1e15, largest?.questionId || 0) }); }
    catch (error: any) { if (error.code !== 11000) throw error; }
  }
  const counter = await ContributionCounter.findOneAndUpdate({ _id: "question-number" }, { $inc: { sequence: 1 } }, { new: true });
  if (!Number.isSafeInteger(counter.sequence)) throw new InstitutionError("تعذر تخصيص رقم السؤال", 503);
  return counter.sequence;
}
export function registerQuestionFeedbackRoutes(app: Express, requireAdmin: RequestHandler) {
  app.post("/api/student/question-contributions", route(async (req, res) => {
    const user = await student(req);
    const input = validateContribution(req.body);
    if (await QuestionContribution.countDocuments({ studentId: user._id, submittedAt: { $gte: new Date(Date.now() - 86400_000) } }) >= 10)
      throw new InstitutionError("وصلت إلى حد المشاركة اليومي؛ أعد المحاولة غدًا", 429);
    const row = await QuestionContribution.create({ ...input, studentId: user._id, notificationStatus: "queued" });
    const notificationStatus = await notify(`سؤال جديد بانتظار مراجعتك في قدراتك\nالمرجع: ${row._id}\nالنوع: ${input.category === "quantitative" ? "كمي" : "لفظي"}\n${input.questionText.slice(0, 500)}\nراجع السؤال والخيارات من لوحة الإدارة؛ إجابة الطالب ليست مفتاح حل معتمدًا.`,
      status => QuestionContribution.updateOne({ _id: row._id }, { $set: { notificationStatus: status } }));
    await QuestionContribution.updateOne({ _id: row._id, notificationStatus: "queued" }, { $set: { notificationStatus } });
    res.status(201).json({ success: true, id: String(row._id), status: "pending", notificationStatus });
  }));
  app.get("/api/admin/question-contributions", requireAdmin, route(async (req, res) => {
    const status = String(req.query.status || "pending");
    if (!["pending", "approved", "rejected"].includes(status)) throw new InstitutionError("فلتر غير صالح");
    const rows = await QuestionContribution.find({ status }).sort({ submittedAt: -1 }).limit(100).lean();
    const users = await User.find({ _id: { $in: rows.map((r: any) => r.studentId) } }).select("fullName").lean();
    const names = new Map(users.map(u => [String(u._id), u.fullName]));
    res.json({ contributions: rows.map((r: any) => contributionDto(r, names.get(String(r.studentId)))) });
  }));
  app.post("/api/admin/question-contributions/:id/approve", requireAdmin, route(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new InstitutionError("المساهمة غير موجودة", 404);
    const input = validateContribution(req.body, true);
    const questionId = await nextQuestionNumber();
    const actor = (req as any).admin;
    const actorId = String(actor?._id || actor?.adminId || (req.session as any)?.adminId || "");
    const session = await mongoose.startSession();
    let updated: any;
    try { await session.withTransaction(async () => {
      updated = await QuestionContribution.findOneAndUpdate({ _id: req.params.id, status: "pending" }, { $set: {
        status: "approved", reviewedAt: new Date(), reviewedBy: actorId,
        adminNote: clean(req.body.adminNote ?? "", 4000), publishedQuestionId: questionId,
      } }, { new: true, session });
      if (!updated) throw new InstitutionError("سبق اتخاذ قرار في هذه المساهمة", 409);
      const [question] = await Question.create([{
        questionId, category: input.category, subcategory: input.subcategory || "عام",
        text: input.questionText, options: input.options, correctOptionIndex: input.correctOptionIndex,
        difficulty: input.difficulty, section: input.section, explanation: input.explanation,
        ...(input.imageUrl ? { imageUrl: input.imageUrl, imageUrls: [input.imageUrl] } : {}),
        answerStatus: "approved", source: { type: "manual", questionId: String(updated._id) },
      }], { session });
      updated.publishedMongoId = question._id; await updated.save({ session });
    }); } finally { await session.endSession(); }
    res.json({ success: true, questionId, contribution: contributionDto(updated) });
  }));
  app.post("/api/admin/question-contributions/:id/reject", requireAdmin, route(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new InstitutionError("المساهمة غير موجودة", 404);
    const row = await QuestionContribution.findOneAndUpdate({ _id: req.params.id, status: "pending" }, { $set: {
      status: "rejected", reviewedAt: new Date(), adminNote: clean(req.body.adminNote, 4000, true),
      reviewedBy: String((req as any).admin?._id || (req.session as any)?.adminId || ""),
    } }, { new: true });
    if (!row) throw new InstitutionError("سبق اتخاذ قرار في هذه المساهمة", 409);
    res.json({ success: true });
  }));
  // Register before the old route: manual review replaces automatic AI expenditure.
  app.post("/api/questions/report", route(async (req, res) => {
    const user = await student(req);
    const id = req.body.sourceQuestionId || req.body.questionId;
    if (!["string", "number"].includes(typeof id) || !String(id).trim() || String(id).length > 150 ||
        !["wrong_answer", "typo", "unclear", "missing_image", "other"].includes(req.body.reportType))
      throw new InstitutionError("بيانات البلاغ غير صحيحة");
    const description = clean(req.body.description, 4000, true);
    if (await QuestionReport.countDocuments({ reportedBy: String(user._id), createdAt: { $gte: new Date(Date.now() - 86400_000) } }) >= 30)
      throw new InstitutionError("وصلت إلى حد البلاغات اليومي", 429);
    const report = await QuestionReport.create({
      questionId: id, questionText: clean(req.body.questionText ?? "", 8000) || `سؤال مصوّر (${id})`,
      sourceType: clean(req.body.sourceType ?? "", 80), sourceQuestionId: String(id),
      reportType: req.body.reportType, description, reportedBy: String(user._id),
      reportedByUsername: user.username, status: "pending",
    });
    const notificationStatus = await notify(`بلاغ خطأ في سؤال — قدراتك\nالمرجع: ${report._id}\nالسؤال: ${id}\nنوع البلاغ: ${report.reportType}\nراجع تفاصيله في لوحة الإدارة.`);
    res.status(201).json({ success: true, id: String(report._id), notificationStatus });
  }));
  const file = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
  app.post("/api/admin/question-contributions/image", requireAdmin, (req, res, next) => {
    file.single("file")(req, res, error => error ? res.status(400).json({ message: "ارفع صورة واحدة حتى ٥ ميجابايت" }) : next());
  }, route(async (req, res) => {
    if (!req.file) throw new InstitutionError("اختر صورة");
    const bytes = req.file.buffer;
    const extension = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "jpg"
      : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" ? "webp" : null;
    if (!extension) throw new InstitutionError("استخدم صورة PNG أو JPEG أو WebP");
    if (!isR2Configured()) throw new InstitutionError("التخزين الدائم للصور غير مهيأ؛ لم تُحفظ الصورة محليًا", 503);
    const key = `${randomUUID()}.${extension}`;
    await writeR2Object(`question-contributions/${key}`, bytes);
    res.status(201).json({ imageUrl: `/api/question-contribution-images/${key}` });
  }));
  app.get("/api/question-contribution-images/:key", route(async (req, res) => {
    const key = String(req.params.key);
    if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(key)) throw new InstitutionError("الصورة غير موجودة", 404);
    const response = await fetchR2VerbalObject(`question-contributions/${key}`);
    if (!response.ok) throw new InstitutionError("الصورة غير موجودة", 404);
    res.set({ "Content-Type": key.endsWith(".jpg") ? "image/jpeg" : key.endsWith(".png") ? "image/png" : "image/webp",
      "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=86400" }).send(Buffer.from(await response.arrayBuffer()));
  }));
}
