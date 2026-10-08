import type { Express, RequestHandler } from 'express';
import crypto from 'node:crypto';
import { StartRemedialPracticeBody, SubmitRemedialPracticeBody } from '@workspace/api-zod';
import { ExamLearningReport } from '../mongodb/examReportModels';
import { Question, TahsiliQuestion } from '../mongodb/models';
import { recordVerifiedLearningAttempt } from '../services/learningProfileService';

const subjectIds: Record<string, string> = { 'رياضيات': 'math', 'فيزياء': 'physics', 'كيمياء': 'chemistry', 'أحياء': 'biology', 'علم الأرض': 'environment' };
export function registerRemedialPracticeRoutes(app: Express, studentOnly: RequestHandler[]) {
  app.post('/api/student/exam-reports/practice', ...studentOnly, async (req, res) => {
    const parsed = StartRemedialPracticeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'التقرير مطلوب.' });
    const studentId = String((req.session as any).userId);
    try {
      const report: any = await ExamLearningReport.findOne({ studentId, runId: parsed.data.runId }).lean();
      if (!report) return res.status(404).json({ error: 'التقرير غير موجود.' });
      const needs = report.questions.filter((q: any) => q.isCorrect === false || q.isSlow);
      if (!needs.length) return res.status(409).json({ error: 'لم يرصد التقرير مجالًا يحتاج تدريبًا علاجيًا.' });
      const conditions = needs.map((q: any) => ({ ...(q.subcategory ? { subcategory: q.subcategory } : {}), category: q.category }));
      const tahsiliConditions = needs.filter((q: any) => subjectIds[q.category?.replace(/^ال/, '')]).map((q: any) =>
        ({ ...(q.subcategory ? { subcategory: q.subcategory } : {}), subject: q.category.replace(/^ال/, '') }));
      const bank: any[] = await Question.aggregate([
        { $match: { answerStatus: 'approved', $or: conditions } }, { $sample: { size: 10 } },
      ]);
      const tahsili: any[] = tahsiliConditions.length ? await TahsiliQuestion.aggregate([
        { $match: { answerConfidence: 'verified', $or: tahsiliConditions } }, { $sample: { size: 10 } },
      ]) : [];
      const seen = new Set(report.questions.map((q: any) => q.sourceQuestionId));
      const weights = new Map<string, number>();
      for (const q of needs) {
        const key = `${q.category}|${q.subcategory || ''}`;
        weights.set(key, (weights.get(key) || 0) + (q.isCorrect === false ? 2 : 1));
      }
      const candidates = [...bank.map((q) => ({ ...q, sourceType: 'mongo_question', id: String(q._id) })),
        ...tahsili.map((q) => ({ ...q, sourceType: 'mongo_tahsili_question', id: String(q.questionId) }))];
      const valid = candidates.filter((q) => Array.isArray(q.options) && Number.isInteger(q.correctOptionIndex) && q.correctOptionIndex >= 0 && q.correctOptionIndex < q.options.length);
      valid.sort((a, b) => (weights.get(`${b.category || b.subject}|${b.subcategory || ''}`) || 0) -
        (weights.get(`${a.category || a.subject}|${a.subcategory || ''}`) || 0) || Number(seen.has(a.id)) - Number(seen.has(b.id)));
      const questions = valid.slice(0, 8);
      if (!questions.length) return res.status(409).json({ error: 'لا توجد أسئلة معتمدة إضافية في مجالات أخطائك بعد.' });
      const attemptId = crypto.randomUUID();
      const sessions = (req.session as any).remedialPracticeAttempts || {};
      for (const [id, value] of Object.entries(sessions) as Array<[string, any]>) if (Date.now() - value.createdAt > 7200000) delete sessions[id];
      if (Object.keys(sessions).length >= 5) return res.status(429).json({ error: 'أكمل أحد تدريباتك الحالية أولًا.' });
      sessions[attemptId] = { studentId, createdAt: Date.now(), questions };
      (req.session as any).remedialPracticeAttempts = sessions;
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      return res.json({ attemptId, questions: questions.map((q) => ({
        id: q.id, text: q.text, options: q.options, category: q.category || q.subject, subcategory: q.subcategory,
        imageUrl: q.imageUrl || '', imageUrls: q.imageUrls || [],
        passageText: q.source?.passageText || '',
      })) });
    } catch { return res.status(503).json({ error: 'تعذر بدء التدريب.' }); }
  });
  app.post('/api/student/exam-reports/practice/submit', ...studentOnly, async (req, res) => {
    const parsed = SubmitRemedialPracticeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'إجابات غير صالحة.' });
    if (parsed.data.answers.some((a) => a.selectedOptionIndex !== null && !Number.isInteger(a.selectedOptionIndex))) return res.status(400).json({ error: 'خيار غير صالح.' });
    const studentId = String((req.session as any).userId);
    const attempt = (req.session as any).remedialPracticeAttempts?.[parsed.data.attemptId];
    if (!attempt || attempt.studentId !== studentId || Date.now() - attempt.createdAt > 7200000) return res.status(410).json({ error: 'انتهت جلسة التدريب.' });
    if (attempt.result) return res.json(attempt.result);
    const selected = new Map(parsed.data.answers.map((a) => [a.questionId, a]));
    if (selected.size !== parsed.data.answers.length || selected.size !== attempt.questions.length || attempt.questions.some((q: any) => !selected.has(q.id))) return res.status(400).json({ error: 'الإجابات لا تطابق جلسة التدريب.' });
    try {
      const questions: any[] = [];
      for (const q of attempt.questions) {
        const answer = selected.get(q.id)!;
        if (answer.selectedOptionIndex !== null && answer.selectedOptionIndex >= q.options.length) return res.status(400).json({ error: 'خيار غير موجود.' });
        if (answer.selectedOptionIndex !== null) {
          await recordVerifiedLearningAttempt(studentId, {
            questionId: q.id, sourceType: q.sourceType, sourceKey: `remedial:${parsed.data.attemptId}`,
            programId: q.sourceType === 'mongo_question' ? 'program.qudrat' : 'program.tahsili',
            subjectId: q.sourceType === 'mongo_question' ? `subject.qudrat.${q.category}` : `subject.tahsili.${subjectIds[q.subject]}`,
            selectedAnswer: answer.selectedOptionIndex, responseTime: answer.responseTime || 0,
            idempotencyKey: `remedial:${parsed.data.attemptId}:${q.id}`,
            metadata: { flow: 'remedial-practice', category: q.category || q.subject, subcategory: q.subcategory, difficulty: q.difficulty },
          }, { correctOptionIndex: q.correctOptionIndex, optionsCount: q.options.length });
        }
        questions.push({ id: q.id, correctOptionIndex: q.correctOptionIndex, isCorrect: answer.selectedOptionIndex === q.correctOptionIndex, explanation: q.explanation || '' });
      }
      attempt.result = { totalQuestions: questions.length, correctAnswers: questions.filter((q) => q.isCorrect).length, questions };
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      return res.json(attempt.result);
    } catch { return res.status(503).json({ error: 'تعذر حفظ التدريب؛ أعد المحاولة.' }); }
  });
}
