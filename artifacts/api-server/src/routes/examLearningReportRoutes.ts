import type { Express, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { SaveStudentExamReportBody, PrepareExamQuestionExplanationBody } from '@workspace/api-zod';
import { ExamLearningReport } from '../mongodb/examReportModels';
import { cachedQuestionExplanation, resolveReportQuestion } from '../services/cachedQuestionExplanation';
import { speedAdvice, timingAnalysis } from '../services/examReportMath';

const inputSchema = SaveStudentExamReportBody;
export function registerExamLearningReportRoutes(app: Express, studentOnly: RequestHandler[]) {
  app.get('/api/student/exam-reports', ...studentOnly, async (req, res) => {
    try {
      const studentId = String((req.session as any).userId);
      const before = req.query.before;
      if (before !== undefined && (typeof before !== 'string' || !/^[a-fA-F0-9]{24}$/.test(before))) {
        return res.status(400).json({ error: 'مؤشر التقارير غير صالح.' });
      }
      const [rows, totalCount] = await Promise.all([
        ExamLearningReport.find({ studentId, ...(before ? { _id: { $lt: new mongoose.Types.ObjectId(before) } } : {}) }).sort({ _id: -1 }).limit(31).lean(),
        ExamLearningReport.countDocuments({ studentId }),
      ]);
      const reports = rows.slice(0, 30);
      res.json({ reports, totalCount, nextCursor: rows.length > 30 ? String(reports[29]._id) : null });
    } catch { res.status(503).json({ error: 'تعذر تحميل التقارير.' }); }
  });
  app.post('/api/student/exam-reports', ...studentOnly, async (req, res) => {
    const parsed = inputSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'بيانات التقرير غير صالحة.' });
    const input = parsed.data;
    if (input.questions.some((q) => q.selectedOptionIndex !== null && !Number.isInteger(q.selectedOptionIndex))) return res.status(400).json({ error: 'خيار غير صالح.' });
    if (new Set(input.questions.map((q) => q.id)).size !== input.questions.length) return res.status(400).json({ error: 'أسئلة مكررة في التقرير.' });
    const studentId = String((req.session as any).userId);
    try {
      const previous = await ExamLearningReport.find({ studentId, runId: { $ne: input.runId } }).sort({ createdAt: -1 }).limit(20).lean() as any[];
      const timing = timingAnalysis(input.questions.map((q) => q.seconds));
      const questions: any[] = [];
      // Bounded batches avoid overwhelming MongoDB on long exams.
      for (let offset = 0; offset < input.questions.length; offset += 8) {
        questions.push(...await Promise.all(input.questions.slice(offset, offset + 8).map(async (item) => {
          const resolved = await resolveReportQuestion(studentId, item);
          const q: any = resolved?.question;
          const category = String(q?.category || q?.subject || item.category || 'عام');
          const subcategory = String(q?.subcategory || item.subcategory || 'عام');
          const pastSeconds = previous.flatMap((r) => r.questions.filter((x: any) => x.category === category && x.seconds > 0).map((x: any) => x.seconds));
          const sameTest = input.questions.filter((x) => (x.category || 'عام') === (item.category || 'عام')).map((x) => x.seconds);
          const baseline = timingAnalysis(pastSeconds.length >= 5 ? pastSeconds : sameTest);
          const proofMatches = resolved && item.selectedOptionIndex !== null && Number(resolved.proof.selectedAnswer) === item.selectedOptionIndex;
          const explanation = resolved ? await cachedQuestionExplanation(studentId, item, false) : null;
          return {
            ...item, category, subcategory, seconds: Math.round(item.seconds * 10) / 10,
            sourceQuestionId: resolved?.questionId,
            imageUrl: q?.imageUrl || '', imageUrls: q?.imageUrls || [],
            passageText: q?.source?.passageText || '',
            isCorrect: proofMatches ? Boolean(resolved.proof.isCorrect) : null,
            correctOptionIndex: proofMatches ? q.correctOptionIndex : null,
            explanation: proofMatches ? explanation?.explanation || '' : '',
            explanationStatus: proofMatches ? explanation?.status || 'missing' : 'unverified',
            speedTip: explanation?.tip || speedAdvice(category, subcategory),
            baselineSeconds: baseline.measuredQuestions >= 5 ? baseline.medianSeconds : null,
            baselineSource: pastSeconds.length >= 5 ? 'student_history' : 'this_exam',
            isSlow: baseline.slowThresholdSeconds !== null && item.seconds > baseline.slowThresholdSeconds,
          };
        })));
      }
      const existing: any = await ExamLearningReport.findOne({ studentId, runId: input.runId }).lean();
      let report: any = existing || await ExamLearningReport.findOneAndUpdate({ studentId, runId: input.runId },
        { $setOnInsert: { title: input.title, questions, timing } }, { upsert: true, returnDocument: 'after' }).lean();
      if (existing) {
        const corrected = existing.questions.map((old: any) => {
          const newQuestion = questions.find((q) => q.id === old.id && q.selectedOptionIndex === old.selectedOptionIndex);
          return old.isCorrect === null && newQuestion?.isCorrect !== null && newQuestion ? {
            ...newQuestion, seconds: old.seconds, baselineSeconds: old.baselineSeconds, baselineSource: old.baselineSource, isSlow: old.isSlow,
          } : old;
        });
        report = await ExamLearningReport.findOneAndUpdate({ studentId, runId: input.runId }, { $set: { questions: corrected } }, { returnDocument: 'after' }).lean();
      }
      const needed = report.questions.filter((q: any) => q.sourceQuestionId && q.isCorrect !== null &&
        (q.isCorrect === false || q.isSlow) && !q.explanation).slice(0, 2);
      const claimed = needed.length ? await ExamLearningReport.findOneAndUpdate({ studentId, runId: input.runId, generationQueued: { $ne: true } },
        { $set: { generationQueued: true } }) : null;
      if (claimed) {
        // Background work is optional: a provider failure never blocks the exam/report.
        void (async () => {
          for (const q of needed) {
            try {
              const generated = await cachedQuestionExplanation(studentId, { ...q, questionId: q.sourceQuestionId }, true);
              await ExamLearningReport.updateOne({ studentId, runId: input.runId },
                { $set: { 'questions.$[q].explanation': generated.explanation, 'questions.$[q].explanationStatus': generated.status,
                  'questions.$[q].speedTip': generated.tip || q.speedTip } },
                { arrayFilters: [{ 'q.sourceQuestionId': q.sourceQuestionId }] });
            } catch {
              await ExamLearningReport.updateOne({ studentId, runId: input.runId },
                { $set: { 'questions.$[q].explanationStatus': 'unavailable' } },
                { arrayFilters: [{ 'q.sourceQuestionId': q.sourceQuestionId }] }).catch(() => {});
            }
          }
        })();
      }
      res.json({ report });
    } catch { res.status(503).json({ error: 'تعذر حفظ التقرير؛ يمكنك إعادة المحاولة دون تكراره.' }); }
  });
  app.post('/api/student/exam-explanation', ...studentOnly, async (req, res) => {
    const parsed = PrepareExamQuestionExplanationBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'معرّف السؤال مطلوب.' });
    const studentId = String((req.session as any).userId);
    // An explicit user request plus a small session budget; report calculation never calls AI.
    const now = Date.now();
    const budget = (req.session as any).explanationBudget;
    const used = budget && now - budget.since < 3600000 ? budget.used : 0;
    try {
      const report: any = await ExamLearningReport.findOne({ studentId, 'questions.sourceQuestionId': parsed.data.questionId }).sort({ createdAt: -1 }).lean();
      const question = report?.questions.find((q: any) => q.sourceQuestionId === parsed.data.questionId);
      if (!question) return res.status(403).json({ error: 'الشرح متاح لأسئلة تقريرك بعد تصحيح الاختبار.' });
      const context = { ...question, questionId: parsed.data.questionId };
      let result = await cachedQuestionExplanation(studentId, context, false);
      if (result.status === 'missing') {
        if (used >= 5) return res.status(429).json({ error: 'تم بلوغ حد إنشاء الشروح؛ الشروح المحفوظة متاحة دون استهلاك جديد.' });
        (req.session as any).explanationBudget = { since: budget?.since && now - budget.since < 3600000 ? budget.since : now, used: used + 1 };
        result = await cachedQuestionExplanation(studentId, context, true);
      }
      if (result.explanation) {
        await ExamLearningReport.updateMany({ studentId, 'questions.sourceQuestionId': parsed.data.questionId },
          { $set: { 'questions.$[q].explanation': result.explanation, 'questions.$[q].explanationStatus': result.status,
            'questions.$[q].speedTip': result.tip || question.speedTip } },
          { arrayFilters: [{ 'q.sourceQuestionId': parsed.data.questionId, 'q.text': question.text, 'q.options': question.options }] });
      }
      if (result.status === 'budget_exceeded') return res.status(429).json({ error: 'تم بلوغ حد إنشاء الشروح؛ الشروح المحفوظة متاحة.' });
      res.json(result);
    } catch { res.status(503).json({ error: 'تعذر تجهيز الشرح. التقرير والتدريب لا يتوقفان.' }); }
  });
}
