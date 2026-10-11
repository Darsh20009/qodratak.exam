import type { Express, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { FoundationContent, Question } from '../mongodb/models';
import { buildQuestionVideoClip, computerBankQuestionIdentity } from '../services/questionVideoClip';

export function registerQuestionVideoRoutes(app: Express, middleware: RequestHandler[]) {
  app.get('/api/student/question-video/:questionId', ...middleware, async (req, res) => {
    try {
      const id = String(req.params.questionId);
      const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id }
        : /^\d+$/.test(id) ? { questionId: Number(id) } : null;
      if (!filter) return res.status(400).json({ message: 'معرف السؤال غير صالح.' });
      const question = await Question.findOne(filter).select('category source').lean();
      if (!question || question.category !== 'quantitative') {
        return res.json({ available: false, reason: 'unmapped_question' });
      }
      const identity = computerBankQuestionIdentity(question.source?.questionId);
      if (!identity) return res.json({ available: false, reason: 'unmapped_question' });
      const lesson = await FoundationContent.findOne({
        published: true, subjectId: 'subject.qudrat.quantitative',
        title: `بنك الكمي المحوسب ${identity.bankNumber}`,
        'quiz.questionIds': String(question._id),
      }).select('title videoUrl').lean();
      const output = buildQuestionVideoClip(question.source || {}, lesson?.videoUrl || '');
      return res.json({ ...output, title: lesson?.title });
    } catch (error) {
      req.log.error({ err: error }, 'Question video lookup failed');
      return res.status(500).json({ message: 'تعذر تحميل مقطع شرح السؤال.' });
    }
  });
}
