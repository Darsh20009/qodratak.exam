import type { Express, RequestHandler } from 'express';
import crypto from 'node:crypto';
import { CreateStudentCourseBody, StartStudentCoursePracticeBody } from '@workspace/api-zod';
import { FoundationContent, Question, StudentLearningProfile, User } from '../mongodb/models';
import { ExamLearningReport } from '../mongodb/examReportModels';
import { PreparationCourse } from '../mongodb/preparationCourseModels';
import { buildPreparationCourse, classifyCourseLevel, publicCourse, recentCourseReports, riyadhDay, validateCourseInput } from '../services/preparationCourseService';
import { observedIdeas, isReadingQuestion } from '../services/questionIdeas';

async function courseState(studentId: string) {
  const [saved, reports, profile] = await Promise.all([
    PreparationCourse.findOne({ studentId }).lean() as Promise<any>,
    ExamLearningReport.find({ studentId }).sort({ createdAt: -1 }).limit(30).lean(),
    StudentLearningProfile.findOne({ userId: studentId, program: 'qudrat' }).lean(),
  ]);
  let course = publicCourse(saved?.course);
  const assessment = classifyCourseLevel(profile, reports);
  if (course && course.level !== 'unassessed' && assessment.level === 'unassessed') {
    // A read-only projection gates old saved plans without deleting their progress.
    course = { ...course, level: 'unassessed', levelReason: assessment.reason,
      assessmentRequiredAfter: assessment.assessmentRequiredAfter || new Date().toISOString(),
      days: course.days.map((day: any, index: number) => ({ ...day, title: 'أعد التقييم لتحديث الخطة', tasks: index ? [] : [{
        id: `${course.id}:reassessment`, kind: 'diagnostic', title: 'تقييم عودة من مستواك الحالي',
        reason: assessment.reason, href: '/foundation?program=qudrat&reassess=1',
        minutes: 25, questionCount: 0, category: 'mixed', status: 'pending', completionSource: 'pending',
      }] })) };
  }
  return { course, ideas: observedIdeas(recentCourseReports(reports)) };
}
async function assessmentIsCurrent(studentId: string, course: any) {
  const [profile, reports] = await Promise.all([
    StudentLearningProfile.findOne({ userId: studentId, program: 'qudrat' }).lean(),
    ExamLearningReport.find({ studentId }).sort({ createdAt: -1 }).limit(30).lean(),
  ]);
  if (classifyCourseLevel(profile, reports).level === 'unassessed') return false;
  if (course.assessmentRequiredAfter) return new Date(profile?.lastDiagnosticAt || 0).getTime() > new Date(course.assessmentRequiredAfter).getTime();
  return true;
}
function locateTask(course: any, id: string) {
  for (let d = 0; d < course.days.length; d++) {
    const t = course.days[d].tasks.findIndex((task: any) => task.id === id);
    if (t >= 0) return { task: course.days[d].tasks[t], date: course.days[d].date, d, t };
  }
  return null;
}
export async function recordCoursePracticeCompletion(studentId: string, courseTaskId: string, attemptCreatedAt: number) {
  const saved: any = await PreparationCourse.findOne({ studentId }).lean();
  const found = saved && locateTask(saved.course, courseTaskId);
  if (!found || !['practice', 'simulation'].includes(found.task.kind) ||
    attemptCreatedAt < new Date(saved.createdAt).getTime()) return;
  await PreparationCourse.updateOne({ studentId, 'course.id': saved.course.id }, {
    $set: {
      [`course.days.${found.d}.tasks.${found.t}.status`]: 'completed',
      [`course.days.${found.d}.tasks.${found.t}.completionSource`]: 'test_report',
      [`course.days.${found.d}.tasks.${found.t}.completedAt`]: new Date(),
    },
  });
}
export function registerPreparationCourseRoutes(app: Express, studentOnly: RequestHandler[]) {
  app.get('/api/student/course', ...studentOnly, async (req, res) => {
    try { res.json(await courseState(String((req.session as any).userId))); }
    catch (error) { req.log.error({ err: error }, 'Unable to load preparation course'); res.status(503).json({ error: 'تعذر تحميل دورتك. حاول مجددًا.' }); }
  });
  app.post('/api/student/course', ...studentOnly, async (req, res) => {
    const parsed = CreateStudentCourseBody.safeParse(req.body);
    const validation = parsed.success && validateCourseInput(parsed.data);
    if (!parsed.success || validation) return res.status(400).json({ error: validation || 'بيانات الدورة غير صالحة.' });
    const studentId = String((req.session as any).userId);
    try {
      const [profile, reports, bank, lessons] = await Promise.all([
        StudentLearningProfile.findOne({ userId: studentId, program: 'qudrat' }).lean(),
        ExamLearningReport.find({ studentId }).sort({ createdAt: -1 }).limit(30).lean(),
        Question.find({ answerStatus: 'approved', category: { $in: ['verbal', 'quantitative'] } })
          .select('_id category subcategory text options correctOptionIndex answerStatus difficulty source.subcategory source.section').lean(),
        FoundationContent.find({ program: 'qudrat', published: true }).sort({ order: 1 }).select('_id title subjectId durationMinutes sections videoUrl').lean(),
      ]);
      const course = buildPreparationCourse(parsed.data, profile, reports, bank, lessons);
      const student = await User.findByIdAndUpdate(studentId, { $set: { targetExamDate: new Date(`${parsed.data.examDate}T00:00:00+03:00`) } });
      if (!student) return res.status(404).json({ error: 'حساب الطالب غير موجود.' });
      await PreparationCourse.findOneAndUpdate({ studentId }, { $set: { course, createdAt: new Date() } }, { upsert: true });
      return res.json({ course: publicCourse(course), ideas: observedIdeas(recentCourseReports(reports)) });
    } catch (error) {
      req.log.error({ err: error }, 'Unable to create preparation course');
      return res.status(503).json({ error: 'تعذر حفظ الدورة. خطتك السابقة لم تُحذف.' });
    }
  });
  app.post('/api/student/course/tasks/:taskId/complete', ...studentOnly, async (req, res) => {
    const studentId = String((req.session as any).userId);
    try {
      const saved: any = await PreparationCourse.findOne({ studentId }).lean();
      const found = saved && locateTask(saved.course, String(req.params.taskId));
      if (!found) return res.status(404).json({ error: 'المهمة غير موجودة في دورتك الحالية.' });
      if (found.date > riyadhDay()) return res.status(409).json({ error: 'هذه المهمة ليوم لاحق؛ أكمل مهام اليوم أولًا.' });
      if (found.task.status === 'completed') return res.json(await courseState(studentId));
      if (['practice', 'simulation'].includes(found.task.kind)) return res.status(409).json({ error: 'أكمل تدريب هذه المهمة وأرسله للتصحيح؛ الإنجاز يُسجّل من الإجابات الفعلية وليس بالضغط على الزر.' });
      if (found.task.kind === 'diagnostic') {
        const assessed = await assessmentIsCurrent(studentId, saved.course);
        if (!assessed) return res.status(409).json({ error: 'أكمل تقييم البداية أولًا.' });
      }
      if (found.task.kind !== 'diagnostic' && !await assessmentIsCurrent(studentId, saved.course)) {
        return res.status(409).json({ error: 'نتيجة البداية تحتاج تحديثًا. أكمل تقييم العودة قبل متابعة هذه الخطة.' });
      }
      if (found.task.kind === 'review') {
        const practice = locateTask(saved.course, found.task.practiceTaskId);
        if (!practice || practice.task.status !== 'completed') return res.status(409).json({ error: 'أكمل تدريب هذا اليوم أولًا ليكون هناك نتيجة تراجعها.' });
      }
      const completionSource = found.task.kind === 'diagnostic' ? 'assessment' : 'self_reported';
      await PreparationCourse.updateOne({ studentId, 'course.id': saved.course.id }, {
        $set: {
          [`course.days.${found.d}.tasks.${found.t}.status`]: 'completed',
          [`course.days.${found.d}.tasks.${found.t}.completionSource`]: completionSource,
          [`course.days.${found.d}.tasks.${found.t}.completedAt`]: new Date(),
        },
      });
      return res.json(await courseState(studentId));
    } catch (error) { req.log.error({ err: error }, 'Unable to complete course task'); return res.status(503).json({ error: 'تعذر تسجيل الإنجاز. أعد المحاولة.' }); }
  });
  app.post('/api/student/course/practice', ...studentOnly, async (req, res) => {
    const parsed = StartStudentCoursePracticeBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'اختر مهمة تدريب من دورتك.' });
    const studentId = String((req.session as any).userId);
    try {
      const saved: any = await PreparationCourse.findOne({ studentId }).lean();
      const found = saved && locateTask(saved.course, parsed.data.taskId);
      if (!found || !['practice', 'simulation'].includes(found.task.kind)) return res.status(404).json({ error: 'تدريب المهمة غير موجود.' });
      if (found.date > riyadhDay()) return res.status(409).json({ error: 'هذا التدريب مجدول ليوم لاحق.' });
      if (saved.course.level === 'unassessed') return res.status(409).json({ error: 'أكمل تقييم البداية ثم حدّث دورتك حتى نختار التدريب من مستواك.' });
      if (!await assessmentIsCurrent(studentId, saved.course)) return res.status(409).json({ error: 'نتيجتك السابقة تحتاج تحديثًا. أكمل تقييم العودة ثم حدّث الدورة.' });
      const sessions = (req.session as any).remedialPracticeAttempts || {};
      for (const [id, value] of Object.entries(sessions) as Array<[string, any]>) if (Date.now() - value.createdAt > 7200000) delete sessions[id];
      const existing = (Object.entries(sessions) as Array<[string, any]>).find(([, value]) => value.courseTaskId === found.task.id && value.studentId === studentId && !value.result);
      if (!existing && Object.keys(sessions).length >= 5) return res.status(429).json({ error: 'أكمل أحد تدريباتك الحالية أولًا.' });
      const bank: any[] = await Question.find({ _id: { $in: found.task.questionIds }, answerStatus: 'approved' }).lean();
      const byId = new Map(bank.map((q) => [String(q._id), q]));
      const questions = existing ? existing[1].questions : found.task.questionIds.map((id: string) => byId.get(id)).filter((q: any) =>
        q && Number.isInteger(q.correctOptionIndex) && q.correctOptionIndex >= 0 && q.correctOptionIndex < q.options.length
      ).map((q: any) => ({ ...q, id: String(q._id), sourceType: 'mongo_question' }));
      if (questions.length !== found.task.questionIds.length) return res.status(409).json({ error: 'بعض أسئلة الخطة لم تعد معتمدة. حدّث الدورة لاختيار أسئلة صالحة.' });
      const attemptId = existing?.[0] || crypto.randomUUID();
      if (!existing) sessions[attemptId] = { studentId, createdAt: Date.now(), questions, courseTaskId: found.task.id };
      (req.session as any).remedialPracticeAttempts = sessions;
      await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
      return res.json({ attemptId, questions: questions.map((q: any) => ({
        id: q.id, text: q.text, options: q.options, category: q.category, subcategory: q.subcategory,
        imageUrl: q.imageUrl || '', imageUrls: q.imageUrls || [], passageText: isReadingQuestion(q) ? q.source?.passageText || '' : '',
      })) });
    } catch (error) { req.log.error({ err: error }, 'Unable to start course practice'); return res.status(503).json({ error: 'تعذر تجهيز تدريب اليوم؛ لا نستخدم أسئلة بديلة غير معتمدة.' }); }
  });
}
