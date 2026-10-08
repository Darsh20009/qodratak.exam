import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import express from 'express';
import { once } from 'node:events';
import { connectToMongoDB, disconnectFromMongoDB } from '../src/mongodb/connection.ts';
import { Question, User, StudentLearningProfile } from '../src/mongodb/models.ts';
import { LearningAttempt, LearningAttemptSequence, LearningErrorEvidence } from '../src/mongodb/learningProfileModels.ts';
import { ExamLearningReport } from '../src/mongodb/examReportModels.ts';
import { registerExamLearningReportRoutes } from '../src/routes/examLearningReportRoutes.ts';
import { registerRemedialPracticeRoutes } from '../src/routes/remedialPracticeRoutes.ts';

test('reports are private, source-verified, idempotent and lead to masked, server-corrected practice',
  { skip: !process.env.MONGODB_URI }, async () => {
    const marker = `report-test-${crypto.randomUUID()}`;
    const studentId = new (await import('mongoose')).default.Types.ObjectId().toString();
    const otherId = new (await import('mongoose')).default.Types.ObjectId().toString();
    let server: ReturnType<ReturnType<typeof express>['listen']> | undefined;
    const ids: string[] = [];
    try {
      await connectToMongoDB();
      await User.create({ _id: studentId, username: marker, email: `${marker}@example.test`, password: 'test-only-unused-hash', fullName: 'Report fixture', role: 'student', isActive: true });
      const baseId = Math.floor(Date.now() % 1000000000);
      const bank = await Question.insertMany(Array.from({ length: 8 }, (_, index) => ({
        questionId: baseId + index, text: `${marker} سؤال ${index}`,
        options: ['خيار صحيح', 'خيار خطأ', 'ج', 'د'], correctOptionIndex: 0,
        answerStatus: 'approved', category: 'quantitative', subcategory: marker,
        difficulty: 'beginner', explanation: 'شرح معتمد محفوظ للاختبار، لا يستدعي مزود الذكاء الاصطناعي.',
      })));
      ids.push(...bank.map((q) => String(q._id)));
      await LearningAttempt.insertMany(bank.slice(0, 5).map((q, i) => ({
        studentId, questionId: String(q._id), sourceType: 'mongo_question', sourceKey: marker,
        sourceIdentity: `mongo_question:${marker}:${q._id}`, programId: 'program.qudrat',
        selectedAnswer: i < 2 ? 1 : 0, correctAnswer: 0, isAnswered: true, isCorrect: i >= 2,
        responseTime: 20, attemptNumber: 1, idempotencyKey: `${marker}:${i}`,
      })));
      const app = express();
      app.use(express.json());
      const sessions: Record<string, any> = {};
      const guard: express.RequestHandler = (req, res, next) => {
        const id = req.header('x-test-student');
        if (!id || ![studentId, otherId].includes(id)) return void res.status(401).json({ error: 'Unauthenticated' });
        sessions[id] ||= { userId: id, save: (callback: (error?: Error) => void) => callback() };
        (req as any).session = sessions[id];
        next();
      };
      registerExamLearningReportRoutes(app, [guard]);
      registerRemedialPracticeRoutes(app, [guard]);
      server = app.listen(0);
      await once(server, 'listening');
      const address = server.address() as { port: number };
      const request = async (path: string, body?: unknown, owner = studentId) => {
        const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
          method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', 'x-test-student': owner },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return { status: response.status, body: await response.json() as any };
      };
      const payload = { runId: marker, title: 'تقرير تجريبي', questions: bank.slice(0, 5).map((q, i) => ({
        id: String(q._id), text: q.text, options: q.options, selectedOptionIndex: i < 2 ? 1 : 0,
        seconds: i === 4 ? 150 : 20, category: 'quantitative', subcategory: marker,
      })) };
      const saved = await request('/api/student/exam-reports', payload);
      assert.equal(saved.status, 200);
      assert.equal(saved.body.report.questions.filter((q: any) => q.isCorrect === false).length, 2);
      assert.equal(saved.body.report.questions[4].isSlow, true);
      assert.equal(saved.body.report.questions[0].explanationStatus, 'approved');
      const duplicate = await request('/api/student/exam-reports', { ...payload, title: 'tampered' });
      assert.equal(duplicate.body.report.title, payload.title);
      assert.equal(await ExamLearningReport.countDocuments({ studentId, runId: marker }), 1);
      assert.equal((await request('/api/student/exam-reports', undefined, otherId)).body.reports.length, 0);
      const unauthorized = await request('/api/student/exam-reports', { ...payload, runId: `${marker}-other` }, otherId);
      assert.equal(unauthorized.body.report.questions[0].isCorrect, null);
      assert.equal(unauthorized.body.report.questions[0].correctOptionIndex, null);
      const practice = await request('/api/student/exam-reports/practice', { runId: marker });
      assert.equal(practice.status, 200);
      assert.ok(practice.body.questions.length > 0);
      assert.ok(practice.body.questions.every((q: any) => !('correctOptionIndex' in q)));
      const submitted = await request('/api/student/exam-reports/practice/submit', {
        attemptId: practice.body.attemptId,
        answers: practice.body.questions.map((q: any) => ({ questionId: q.id, selectedOptionIndex: 0, responseTime: 35 })),
      });
      assert.equal(submitted.status, 200);
      assert.equal(submitted.body.correctAnswers, submitted.body.totalQuestions);
      assert.equal(await LearningAttempt.countDocuments({ studentId, sourceKey: `remedial:${practice.body.attemptId}`, responseTime: 35 }), practice.body.questions.length);
      assert.equal((await request('/api/student/exam-reports/practice/submit', {
        attemptId: practice.body.attemptId, answers: [],
      }, otherId)).status, 410);
      assert.equal((await request('/api/student/exam-reports', { ...payload, runId: `${marker}-duplicates`, questions: [payload.questions[0], payload.questions[0]] })).status, 400);
      await ExamLearningReport.insertMany(Array.from({ length: 31 }, (_, index) => ({
        studentId,
        runId: `${marker}-page-${index}`,
        title: 'Pagination fixture',
        questions: saved.body.report.questions,
        timing: saved.body.report.timing,
        generationQueued: true,
      })));
      const firstPage = await request('/api/student/exam-reports');
      assert.equal(firstPage.body.totalCount, 32);
      assert.equal(firstPage.body.reports.length, 30);
      assert.ok(firstPage.body.nextCursor);
      const lastPage = await request(`/api/student/exam-reports?before=${firstPage.body.nextCursor}`);
      assert.equal(lastPage.body.reports.length, 2);
      assert.equal(lastPage.body.nextCursor, null);
      const allRunIds = [...firstPage.body.reports, ...lastPage.body.reports].map((report: any) => report.runId);
      assert.equal(new Set(allRunIds).size, 32);
      assert.ok(allRunIds.includes(marker));
      assert.equal((await request('/api/student/exam-reports?before=invalid')).status, 400);
      assert.equal((await request(`/api/student/exam-reports?before=${firstPage.body.nextCursor}`, undefined, otherId)).body.reports.some((report: any) => report.runId === marker), false);
    } finally {
      if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
      await Promise.all([
        User.deleteMany({ _id: { $in: [studentId, otherId] } }),
        Question.deleteMany({ _id: { $in: ids } }),
        ...[LearningAttempt, LearningAttemptSequence, LearningErrorEvidence, StudentLearningProfile, ExamLearningReport].map((model: any) => model.deleteMany({ studentId: { $in: [studentId, otherId] } })),
      ]);
      await disconnectFromMongoDB();
    }
  });
