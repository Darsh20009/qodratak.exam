import type { Express, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import { FoundationContent, Question } from '../mongodb/models';
import { AdminVideoAsset } from '../mongodb/adminVideoLibraryModels';
import { ensureStudentAccountTrial } from '../middleware/studentTrialAccess';
import {
  buildQuestionVideoClip,
  computerBankQuestionIdentity,
  COMPUTER_BANK_VIDEO_LIBRARY_REFERENCES,
} from '../services/questionVideoClip';
import { fetchR2VerbalObject } from '../services/qudratVerbalBookFilesService';

async function hasActiveStudentAccess(req: Parameters<RequestHandler>[0]) {
  const session = req.session as any;
  const access = await ensureStudentAccountTrial(session?.userId, session?.userEmail);
  return Boolean(access?.active);
}

export function registerQuestionVideoRoutes(
  app: Express,
  middleware: RequestHandler[],
  studentAccessCheck: (req: Parameters<RequestHandler>[0]) => Promise<boolean> = hasActiveStudentAccess,
) {
  app.get('/api/learning/computerized/quantitative/computer-bank-:bankNumber.mp4', ...middleware, async (req, res) => {
    const bankNumber = Number(req.params.bankNumber);
    if (!Number.isInteger(bankNumber) || bankNumber < 51 || bankNumber > 90) {
      res.status(404).json({ message: 'فيديو البنك غير موجود.' });
      return;
    }

    try {
      if (!await studentAccessCheck(req)) {
        res.status(403).json({ message: 'يلزم اشتراك أو تجربة نشطة لمشاهدة شرح السؤال.' });
        return;
      }
      const filename = `computer-bank-${bankNumber}.mp4`;
      const videoReference = COMPUTER_BANK_VIDEO_LIBRARY_REFERENCES[bankNumber];
      const libraryAsset = videoReference
        ? await AdminVideoAsset.findOne({ videoNumber: videoReference })
          .select('objectKey contentType')
          .lean()
        : null;
      if (videoReference && !libraryAsset) {
        res.status(404).json({ message: `الفيديو المرجعي رقم ${videoReference} للبنك غير موجود.` });
        return;
      }
      const upstream = await fetchR2VerbalObject(
        libraryAsset?.objectKey || `foundation/quantitative/computer-banks/${filename}`,
        {
          method: req.method === 'HEAD' ? 'HEAD' : 'GET',
          range: typeof req.headers.range === 'string' ? req.headers.range : undefined,
        },
      );
      if (!upstream.ok && upstream.status !== 206) {
        await upstream.body?.cancel();
        res.status(upstream.status === 404 ? 404 : 502)
          .json({ message: 'تعذر تحميل فيديو البنك.' });
        return;
      }
      res.status(upstream.status);
      res.setHeader('Content-Type', libraryAsset?.contentType || 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      for (const headerName of ['content-length', 'content-range', 'etag']) {
        const value = upstream.headers.get(headerName);
        if (value) res.setHeader(headerName, value);
      }
      if (req.method === 'HEAD' || !upstream.body) {
        await upstream.body?.cancel();
        res.end();
        return;
      }
      Readable.fromWeb(upstream.body as any).pipe(res);
    } catch (error) {
      req.log.error({ err: error, bankNumber }, 'Failed to stream quantitative computer bank video');
      res.status(503).json({ message: 'تعذر تحميل فيديو البنك حاليًا.' });
    }
  });

  app.get('/api/student/question-video/:questionId', ...middleware, async (req, res) => {
    try {
      if (!await studentAccessCheck(req)) {
        return res.status(403).json({
          available: false,
          reason: 'subscription_required',
          message: 'يلزم اشتراك أو تجربة نشطة لمشاهدة شرح السؤال.',
        });
      }
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
      const videoReference = COMPUTER_BANK_VIDEO_LIBRARY_REFERENCES[identity.bankNumber];
      if (videoReference && !await AdminVideoAsset.exists({ videoNumber: videoReference })) {
        return res.json({
          available: false,
          reason: 'video_unavailable',
          videoReference,
          ...identity,
        });
      }
      const lesson = await FoundationContent.findOne({
        published: true, subjectId: 'subject.qudrat.quantitative',
        title: `بنك الكمي المحوسب ${identity.bankNumber}`,
        'quiz.questionIds': String(question._id),
      }).select('title questionSolutionVideoUrl').lean();
      const videoUrl = lesson?.questionSolutionVideoUrl ||
        `/api/learning/computerized/quantitative/computer-bank-${String(identity.bankNumber).padStart(2, '0')}.mp4`;
      const output = buildQuestionVideoClip(question.source || {}, videoUrl);
      return res.json({ ...output, title: lesson?.title });
    } catch (error) {
      req.log.error({ err: error }, 'Question video lookup failed');
      return res.status(500).json({ message: 'تعذر تحميل مقطع شرح السؤال.' });
    }
  });
}
