import assert from 'node:assert/strict';
import test from 'node:test';
import { examResultSummary, examResultMessage, normalizeResultPhone } from '../src/services/examResultMessage';
import { deliverClaimedExamResult, enqueueExamResultNotification } from '../src/services/examResultNotifications';
import { ExamResultWhatsAppDelivery } from '../src/mongodb/examResultNotificationModels';
import { User, TestResult, ExamBooking } from '../src/mongodb/models';

test('results use correct-answer counts rather than a percentage stored in the score field', () => {
  const summary = examResultSummary({ totalQuestions: 48, correctAnswers: 36, score: 75, testType: 'quantitative' });
  assert.ok(summary);
  assert.equal(summary.percentage, 75);
  assert.match(examResultMessage(summary), /36 من 48/);
  assert.match(examResultMessage(summary), /نتائجي/);
  assert.equal(examResultSummary({ totalQuestions: 48, correctAnswers: 49 }), null);
  assert.equal(examResultSummary({ totalQuestions: 0, correctAnswers: 0 }), null);
  assert.equal(examResultSummary({ totalQuestions: 48 }), null);
  assert.equal(normalizeResultPhone('0500000000'), '966500000000');
  assert.equal(normalizeResultPhone('+966 50 000 0000'), '966500000000');
  assert.equal(normalizeResultPhone('not-a-phone'), '');
});

test('delivery, retry, opt-out and release policies are checked without real WhatsApp sends or database writes', async () => {
  const original = {
    update: ExamResultWhatsAppDelivery.updateOne, user: User.findById,
    result: TestResult.findOne, booking: ExamBooking.findOne, bookingUpdate: ExamBooking.updateOne,
  };
  const studentId = '0123456789abcdef01234567';
  const updates: any[] = [];
  const sent: any[] = [];
  const inserted = new Map<string, any>();
  let user: any = { role: 'student', phone: '0500000000', notifWhatsApp: true };
  let result: any = { totalQuestions: 48, correctAnswers: 36, testType: 'quantitative' };
  let booking: any;
  const query = (value: unknown): any => ({ select() { return this; }, lean: async () => value });
  (ExamResultWhatsAppDelivery as any).updateOne = async (filter: any, update: any) => {
    updates.push({ filter, update });
    if (update.$setOnInsert && !inserted.has(filter.key)) inserted.set(filter.key, update.$setOnInsert);
    return { acknowledged: true, modifiedCount: 1 };
  };
  (User as any).findById = (id: string) => { assert.equal(id, studentId); return query(user); };
  (TestResult as any).findOne = (filter: any) => { assert.equal(filter.userId, studentId); return query(result); };
  (ExamBooking as any).findOne = (filter: any) => { assert.equal(filter.userId, studentId); return query(booking); };
  (ExamBooking as any).updateOne = async (_filter: any, update: any) => {
    assert.equal(update.$set.aiReviewDone, undefined, 'notification recovery must not suppress the email pipeline');
    Object.assign(booking, update.$set);
    return { matchedCount: 1 };
  };
  const job = { _id: 'fixture-job', studentId, sourceId: 'fixture-result', sourceType: 'test_result', leaseToken: 'fixture-lease', attempts: 1 };
  const send = async (phone: string, text: string, kind?: string) => { sent.push({ phone, text, kind }); };
  try {
    await enqueueExamResultNotification('test_result', job.sourceId, studentId);
    await enqueueExamResultNotification('test_result', job.sourceId, studentId);
    assert.equal(inserted.size, 1, 'a saved result has one persistent delivery key');
    await enqueueExamResultNotification('test_result', 'retry-result-a', studentId, undefined, new Date(), 'same-foundation-attempt');
    await enqueueExamResultNotification('test_result', 'retry-result-b', studentId, undefined, new Date(), 'same-foundation-attempt');
    assert.equal(inserted.size, 2, 'repeated foundation submissions keep a single notification even with distinct saved IDs');
    await deliverClaimedExamResult(job, send as any);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].kind, 'customer_exam_result');
    assert.equal(sent[0].phone, '966500000000');
    assert.equal(updates.at(-1).update.$set.state, 'sent');
    assert.equal(updates.at(-1).filter.leaseToken, job.leaseToken);

    user.notifWhatsApp = false;
    await deliverClaimedExamResult(job, send as any);
    assert.equal(sent.length, 1);
    assert.equal(updates.at(-1).update.$set.state, 'skipped');
    user.notifWhatsApp = true;
    user.phone = '';
    await deliverClaimedExamResult(job, send as any);
    assert.equal(sent.length, 1);
    assert.equal(updates.at(-1).update.$set.lastError, 'MISSING_PHONE');

    user.phone = '0500000000';
    await deliverClaimedExamResult(job, async () => { throw new Error('transport offline'); });
    assert.equal(updates.at(-1).update.$set.state, 'pending');
    assert.ok(updates.at(-1).update.$set.availableAt.getTime() > Date.now());
    await deliverClaimedExamResult({ ...job, attempts: 8 }, async () => { throw new Error('offline'); });
    assert.equal(updates.at(-1).update.$set.state, 'failed');

    booking = { status: 'completed', resultVisibleAt: new Date(Date.now() + 60_000),
      totalQuestions: 100, correctAnswers: 80, totalScoreOutOf100: 80, aiReviewDone: true };
    await deliverClaimedExamResult({ ...job, sourceType: 'booking' }, send as any);
    assert.equal(sent.length, 1, 'scheduled results are not sent before their release');
    assert.equal(updates.at(-1).update.$set.state, 'pending');
    booking.resultVisibleAt = new Date(Date.now() - 1000);
    booking.totalScoreOutOf100 = 84;
    await deliverClaimedExamResult({ ...job, sourceType: 'booking', summary: { percentage: 10 } }, send as any);
    assert.equal(sent.length, 2);
    assert.match(sent[1].text, /84\/100/, 'use the current booking, not a stale job snapshot');

    booking = { status: 'completed', resultVisibleAt: new Date(Date.now() - 1000),
      totalQuestions: 2, correctAnswers: 0, totalScoreOutOf100: 0, aiReviewDone: false,
      sectionResults: [{ sectionIndex: 1, questions: [
        { questionId: 'trusted-question-1', correctAnswer: '1', studentAnswer: '1', category: 'quantitative' },
        { questionId: 'trusted-question-2', correctAnswer: '2', studentAnswer: '0', category: 'quantitative' },
      ] }],
    };
    await deliverClaimedExamResult({ ...job, sourceType: 'booking' }, send as any);
    assert.equal(sent.length, 3);
    assert.match(sent[2].text, /50\/100/, 'a lost in-memory review timer is recovered from stored keys, not AI');
    assert.equal(booking.correctAnswers, 1);
    assert.equal(booking.aiReviewDone, false);

    result = null;
    await deliverClaimedExamResult(job, send as any);
    assert.equal(sent.length, 3, 'a missing or unowned result must not send');
  } finally {
    ExamResultWhatsAppDelivery.updateOne = original.update;
    User.findById = original.user;
    TestResult.findOne = original.result;
    ExamBooking.findOne = original.booking;
    ExamBooking.updateOne = original.bookingUpdate;
  }
});
