import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { User, TestResult, ExamBooking } from '../mongodb/models';
import { ExamResultWhatsAppDelivery, ExamResultWhatsAppWorker } from '../mongodb/examResultNotificationModels';
import { sendWhatsAppText } from './whatsappService';
import { examResultMessage, examResultSummary, normalizeResultPhone, type ExamResultSummary } from './examResultMessage';
import { reviewExamBooking } from './aiExamReview';

type SourceType = 'test_result' | 'booking' | 'practice';
let timer: NodeJS.Timeout | undefined;
let working = false;

export async function enqueueExamResultNotification(
  sourceType: SourceType, sourceId: string, studentId: string,
  summary?: ExamResultSummary, availableAt = new Date(), eventId = sourceId,
) {
  if (!sourceId || !studentId) return;
  const key = `${studentId}:${sourceType}:${eventId}`;
  try {
    await ExamResultWhatsAppDelivery.updateOne({ key }, {
      $setOnInsert: { key, sourceType, sourceId, studentId, summary, availableAt, state: 'pending', attempts: 0 },
    }, { upsert: true });
  } catch (error: any) {
    // Simultaneous retries may lose the unique-key race; an existing job is sufficient.
    if (error?.code !== 11000) throw error;
  }
}

export async function enqueueSavedTestResult(result: any) {
  // Imports of historical results are not permission to message past students.
  if (result.completedAt && new Date(result.completedAt).getTime() < Date.now() - 86_400_000) return;
  await enqueueExamResultNotification('test_result', String(result._id), String(result.userId),
    undefined, new Date(), result.resultNotificationKey || String(result._id));
}

export async function enqueueBookedExamResult(booking: any) {
  if (!booking?._id || !booking.userId || booking.status !== 'completed') return;
  const visible = booking.resultVisibleAt ? new Date(booking.resultVisibleAt) : new Date();
  if (!Number.isFinite(visible.getTime())) return;
  await enqueueExamResultNotification('booking', String(booking._id), String(booking.userId), undefined, visible);
}

export async function enqueuePracticeResult(studentId: string, attemptId: string, result: any, title: string) {
  const summary = examResultSummary({ ...result, title });
  if (summary) await enqueueExamResultNotification('practice', attemptId, studentId, summary);
}

/** Catch enqueue failures after saving grades, without a bulk backfill of old results. */
async function discoverNewResults() {
  const rolloutAt = new Date();
  const state: any = await ExamResultWhatsAppWorker.findOneAndUpdate({ _id: 'results' },
    { $setOnInsert: { rolloutAt } }, { upsert: true, returnDocument: 'after' }).lean();
  const initialId = mongoose.Types.ObjectId.createFromTime(Math.floor(new Date(state.rolloutAt).getTime() / 1000));
  const results = await TestResult.find({ _id: { $gt: state.testCursor || initialId } })
    .sort({ _id: 1 }).limit(100).lean();
  for (const result of results) await enqueueSavedTestResult(result);
  if (results.length) await ExamResultWhatsAppWorker.updateOne({ _id: 'results' },
    { $set: { testCursor: results.at(-1)!._id } });
  // Recheck newly completed bookings, including ones booked before this release.
  const bookings = await ExamBooking.find({ status: 'completed', completedAt: { $gte: state.rolloutAt } })
    .sort({ completedAt: -1 }).limit(100).lean();
  for (const booking of bookings) await enqueueBookedExamResult(booking);
}

export async function processExamResultNotifications() {
  if (working || mongoose.connection.readyState !== 1) return;
  working = true;
  try {
    await discoverNewResults().catch(() => console.warn('[Exam result WhatsApp] discovery will be retried'));
    for (let processed = 0; processed < 4; processed++) {
      const now = new Date();
      const job: any = await ExamResultWhatsAppDelivery.findOneAndUpdate({
        availableAt: { $lte: now },
        $or: [{ state: 'pending' }, { state: 'sending', leaseUntil: { $lte: now } }],
      }, { $set: { state: 'sending', leaseUntil: new Date(now.getTime() + 5 * 60_000), leaseToken: randomUUID() },
        $inc: { attempts: 1 } },
      { sort: { availableAt: 1, _id: 1 }, returnDocument: 'after' }).lean();
      if (!job) break;
      await deliverClaimedExamResult(job);
    }
  } catch (error) {
    console.error('[Exam result WhatsApp] worker failed', error instanceof Error ? error.name : 'unknown');
  } finally { working = false; }
}

/** Injectable transport allows verification without sending real student messages. */
export async function deliverClaimedExamResult(job: any, send = sendWhatsAppText) {
    const ownsLease = { _id: job._id, state: 'sending', leaseToken: job.leaseToken };
    const heartbeat = setInterval(() => {
      void ExamResultWhatsAppDelivery.updateOne(ownsLease,
        { $set: { leaseUntil: new Date(Date.now() + 5 * 60_000) } })
        .catch(() => console.warn('[Exam result WhatsApp] lease renewal failed'));
    }, 60_000);
    heartbeat.unref();
    try {
      let summary = job.summary as ExamResultSummary | undefined;
      if (job.sourceType !== 'practice') {
        const filter = { _id: job.sourceId, userId: job.studentId };
        let result: any = job.sourceType === 'booking'
          ? await ExamBooking.findOne(filter).lean() : await TestResult.findOne(filter).lean();
        if (!result) throw new Error('RESULT_NOT_FOUND');
        if (job.sourceType === 'booking') {
          const visibleAt = result.resultVisibleAt ? new Date(result.resultVisibleAt).getTime() : 0;
          if (result.status !== 'completed' || !Number.isFinite(visibleAt)) throw new Error('RESULT_NOT_READY');
          // Read the current corrected record, never the stale pre-review booking snapshot.
          if (visibleAt > Date.now()) {
            await ExamResultWhatsAppDelivery.updateOne(ownsLease, {
              $set: { state: 'pending', availableAt: new Date(Math.max(visibleAt, Date.now() + 30_000)) },
              $inc: { attempts: -1 }, $unset: { leaseUntil: 1, leaseToken: 1 },
            });
            return;
          }
          if (!result.aiReviewDone) {
            // The legacy "AI review" is a pure stored-answer grader. Recover final
            // scores after a restart without AI or publishing before resultVisibleAt.
            let corrected;
            try { corrected = await reviewExamBooking(result); }
            catch { throw new Error('RESULT_NOT_READY'); }
            await ExamBooking.updateOne({ ...filter, status: 'completed', aiReviewDone: { $ne: true } }, { $set: {
              sectionResults: corrected.correctedSectionResults,
              totalScore: corrected.correctedTotalScore,
              verbalScore: corrected.correctedVerbalScore, quantScore: corrected.correctedQuantScore,
              totalScoreOutOf100: corrected.correctedTotalScoreOutOf100,
              verbalPercent: corrected.correctedVerbalPercent, quantPercent: corrected.correctedQuantPercent,
              correctAnswers: corrected.correctedCorrectAnswers,
              wrongAnswers: corrected.correctedWrongAnswers, skippedAnswers: corrected.correctedSkippedAnswers,
            } });
            // Do not flip aiReviewDone: that flag also gates the existing email
            // pipeline. Notifications must not silently suppress result emails.
            result = await ExamBooking.findOne(filter).lean();
            if (!result || result.status !== 'completed' ||
              (result.resultVisibleAt && new Date(result.resultVisibleAt).getTime() > Date.now())) {
              throw new Error('RESULT_NOT_READY');
            }
          }
        }
        summary = examResultSummary(result, job.sourceType === 'booking') || undefined;
      }
      if (!summary) throw new Error('RESULT_NOT_READY');
      const user: any = mongoose.isValidObjectId(job.studentId)
        ? await User.findById(job.studentId).select('role phone whatsappPhone notifWhatsApp').lean()
        : await User.findOne({ legacyId: job.studentId }).select('role phone whatsappPhone notifWhatsApp').lean();
      if (!user) throw new Error('STUDENT_NOT_FOUND');
      if (user.notifWhatsApp === false || user.role !== 'student') {
        await ExamResultWhatsAppDelivery.updateOne(ownsLease,
          { $set: { state: 'skipped', lastError: 'NOTIFICATIONS_DISABLED' }, $unset: { leaseUntil: 1, leaseToken: 1 } });
        return;
      }
      const phone = normalizeResultPhone(user.whatsappPhone || user.phone);
      if (!phone) throw new Error('MISSING_PHONE');
      await send(phone, examResultMessage(summary), 'customer_exam_result');
      await ExamResultWhatsAppDelivery.updateOne(ownsLease,
        { $set: { state: 'sent', sentAt: new Date(), lastError: '' }, $unset: { leaseUntil: 1, leaseToken: 1 } });
    } catch (error: any) {
      const known = ['RESULT_NOT_FOUND', 'RESULT_NOT_READY', 'STUDENT_NOT_FOUND', 'MISSING_PHONE'];
      const reason = known.includes(error?.message) ? error.message : 'WHATSAPP_DELIVERY_FAILED';
      await ExamResultWhatsAppDelivery.updateOne(ownsLease, {
        $set: { state: job.attempts >= 8 ? 'failed' : 'pending', lastError: reason,
          availableAt: new Date(Date.now() + Math.min(3_600_000, 30_000 * 2 ** job.attempts)) },
        $unset: { leaseUntil: 1, leaseToken: 1 },
      });
      console.warn('[Exam result WhatsApp] delivery deferred:', reason);
    }
    finally { clearInterval(heartbeat); }
}

export function startExamResultNotificationWorker() {
  if (timer) return;
  void processExamResultNotifications();
  timer = setInterval(() => void processExamResultNotifications(), 15_000);
  timer.unref();
}
