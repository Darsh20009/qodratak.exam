import fs from 'node:fs';
import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI is required');

const inputPath = process.env.COMPUTER_BANKS_INPUT
  || new URL('../../../.agents/outputs/quantitative-computer-banks/computer-banks.json', import.meta.url);
const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const dryRun = process.env.COMPUTER_BANKS_DRY_RUN === '1';
if (!Array.isArray(payload.banks) || payload.banks.length === 0) {
  throw new Error('Expected at least one quantitative computer bank');
}

const titleFor = (number) => `بنك الكمي المحوسب ${number}`;
const seenBankNumbers = new Set();
const plannedQuestionIds = new Map();
const seenSourceQuestionIds = new Set();
for (const bank of payload.banks) {
  if (!Number.isInteger(bank.number) || bank.number < 1 || bank.number > 50 || seenBankNumbers.has(bank.number)) {
    throw new Error(`Invalid or duplicate quantitative computer bank number: ${bank.number}`);
  }
  seenBankNumbers.add(bank.number);
  if (!Array.isArray(bank.questions) || bank.questions.length > 50) {
    throw new Error(`Invalid question list for quantitative computer bank ${bank.number}`);
  }
  if ([15, 23].includes(bank.number)
    && (bank.attachment || bank.pdf || bank.questions.length)) {
    throw new Error(`Quantitative computer bank ${bank.number} must be video-only`);
  }
  const seenQuestionNumbers = new Set();
  for (const question of bank.questions) {
    if (!Number.isInteger(question.questionNumber) || question.questionNumber < 1 || question.questionNumber > 50
      || seenQuestionNumbers.has(question.questionNumber)) {
      throw new Error(`Invalid or duplicate question number in quantitative computer bank ${bank.number}`);
    }
    seenQuestionNumbers.add(question.questionNumber);
    if (!Array.isArray(question.options) || question.options.length < 2
      || !Number.isInteger(question.correctOptionIndex)
      || question.correctOptionIndex < 0
      || question.correctOptionIndex >= question.options.length) {
      throw new Error(`Invalid answer options for quantitative computer bank ${bank.number}, question ${question.questionNumber}`);
    }
    const sourceQuestionId = `quantitative-computer-bank-${bank.number}-${question.questionNumber}`;
    const questionId = 500000 + bank.number * 100 + question.questionNumber;
    if (seenSourceQuestionIds.has(sourceQuestionId) || plannedQuestionIds.has(questionId)) {
      throw new Error(`Duplicate source or numeric question ID in quantitative computer bank ${bank.number}`);
    }
    seenSourceQuestionIds.add(sourceQuestionId);
    plannedQuestionIds.set(questionId, sourceQuestionId);
  }
}

await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
});

try {
  const questions = mongoose.connection.collection('questions');
  const foundationContent = mongoose.connection.collection('foundationcontents');
  const numericQuestionIds = [...plannedQuestionIds.keys()];
  const existingQuestions = await questions.find({
    questionId: { $in: numericQuestionIds },
  }).project({ questionId: 1, 'source.questionId': 1 }).toArray();
  const questionIdConflicts = existingQuestions.filter(
    (question) => plannedQuestionIds.get(question.questionId) !== question.source?.questionId,
  );
  if (questionIdConflicts.length) {
    throw new Error(
      `Refusing to overwrite unrelated question IDs: ${questionIdConflicts.map((question) => question.questionId).join(', ')}`,
    );
  }

  const plannedQuestionIdBySource = new Map(
    [...plannedQuestionIds.entries()].map(([questionId, sourceQuestionId]) => [
      sourceQuestionId,
      questionId,
    ]),
  );
  const existingSourceQuestions = await questions.find({
    'source.questionId': { $in: [...plannedQuestionIdBySource.keys()] },
  }).project({ _id: 1, questionId: 1, 'source.type': 1, 'source.questionId': 1 }).toArray();
  const existingSourceQuestionIds = new Set();
  for (const question of existingSourceQuestions) {
    const sourceQuestionId = question.source?.questionId;
    if (existingSourceQuestionIds.has(sourceQuestionId)) {
      throw new Error(`Refusing to import a duplicate source question: ${sourceQuestionId}`);
    }
    existingSourceQuestionIds.add(sourceQuestionId);
    if (question.source?.type !== 'generated'
      || plannedQuestionIdBySource.get(sourceQuestionId) !== question.questionId) {
      throw new Error(`Refusing to replace an unrelated source question: ${sourceQuestionId}`);
    }
  }
  const existingSourceQuestionById = new Map(
    existingSourceQuestions.map((question) => [question.source.questionId, question]),
  );

  const bankByTitle = new Map(payload.banks.map((bank) => [titleFor(bank.number), bank]));
  const existingLessons = await foundationContent.find({
    program: 'qudrat',
    subjectId: 'subject.qudrat.quantitative',
    title: { $in: [...bankByTitle.keys()] },
  }).project({ title: 1, videoUrl: 1, attachments: 1, quiz: 1 }).toArray();
  for (const lesson of existingLessons) {
    const bank = bankByTitle.get(lesson.title);
    const matchingAttachment = bank?.attachment?.id
      && lesson.attachments?.some((attachment) => attachment.id === bank.attachment.id);
    const expectedQuestionIds = (bank?.questions || [])
      .filter((question) => question.answerStatus === 'approved')
      .map((question) => {
        const sourceQuestionId = `quantitative-computer-bank-${bank.number}-${question.questionNumber}`;
        return existingSourceQuestionById.get(sourceQuestionId)?._id?.toString();
      })
      .filter(Boolean)
      .sort();
    const lessonQuestionIds = (lesson.quiz?.questionIds || []).map(String).sort();
    const matchingQuiz = lesson.quiz?.title === `اختبار ${lesson.title}`
      && expectedQuestionIds.length === (bank?.questions || [])
        .filter((question) => question.answerStatus === 'approved').length
      && lessonQuestionIds.length === expectedQuestionIds.length
      && lessonQuestionIds.every((questionId, index) => questionId === expectedQuestionIds[index]);
    const matchingVideoOnly = bank
      && !bank.attachment
      && Array.isArray(bank.questions)
      && bank.questions.length === 0
      && Boolean(bank.video?.url)
      && lesson.videoUrl === bank.video.url
      && !lesson.attachments?.length
      && !lesson.quiz;
    if (!bank || (lesson.videoUrl && lesson.videoUrl !== bank.video?.url)
      || (!matchingAttachment && !matchingQuiz && !matchingVideoOnly)) {
      throw new Error(`Refusing to replace existing foundation content: ${lesson.title}`);
    }
  }

  if (dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      banks: payload.banks.map((bank) => ({
        bank: bank.number,
        questions: bank.questions.length,
        approvedAnswers: bank.questions.filter((question) => question.answerStatus === 'approved').length,
        hasPdfAttachment: Boolean(bank.attachment),
      })),
      totalQuestions: payload.banks.reduce((total, bank) => total + bank.questions.length, 0),
    }, null, 2));
  } else {
  const now = new Date();
  const result = [];

  for (const bank of payload.banks) {
    const questionIds = [];
    for (const question of bank.questions) {
      const sourceQuestionId = `quantitative-computer-bank-${bank.number}-${question.questionNumber}`;
      const questionId = 500000 + bank.number * 100 + question.questionNumber;
      const sourceUrl = bank.attachment && question.sourcePdf
        ? `/foundation/quantitative/computer-banks/exam-${String(bank.number).padStart(2, '0')}.pdf`
        : undefined;
      const updateResult = await questions.findOneAndUpdate(
        { 'source.type': 'generated', 'source.questionId': sourceQuestionId },
        {
          $set: {
            questionId,
            category: 'quantitative',
            subcategory: question.subcategory || 'العمليات الحسابية',
            text: question.text,
            options: question.options,
            correctOptionIndex: question.correctOptionIndex,
            difficulty: 'intermediate',
            topic: question.subcategory || 'العمليات الحسابية',
            dialect: 'standard',
            keywords: ['كمي', 'محوسب', `بنك ${bank.number}`, question.subcategory || 'كمي'],
            section: 1,
            explanation: question.answerToken
              ? `الإجابة المطبوعة في النسخة المحلولة هي: ${question.answerToken}.`
              : 'تحتاج الإجابة المطبوعة إلى مراجعة قبل اعتمادها.',
            studentTip: 'اعتمد على صورة السؤال المرفقة؛ فهي تحفظ النص الرياضي والأشكال كما وردت في المصدر.',
            answerStatus: question.answerStatus,
            source: {
              type: 'generated',
              url: sourceUrl,
              formTitle: titleFor(bank.number),
              questionId: sourceQuestionId,
              section: 'بنك الكمي المحوسب',
              subcategory: question.subcategory || 'العمليات الحسابية',
              videoTimestampSeconds: Number.isInteger(question.videoTimestampSeconds)
                ? question.videoTimestampSeconds
                : undefined,
              videoTimestampInferred: question.videoTimestampInferred === true,
            },
            imageUrl: question.imageUrl,
            imageUrls: question.imageUrls,
            imageOriginalUrl: question.imageUrl,
            imageOriginalUrls: question.imageUrls,
            imageMetadata: {
              source: question.sourcePdf,
              examNumber: bank.number,
              questionNumber: question.questionNumber,
            },
            imageProcessing: {
              status: 'original_only',
              backgroundRemoved: false,
              watermarkCleanupApplied: false,
              note: 'صورة السؤال المفصولة عن صفحة المصدر؛ لا تتضمن شريط مفتاح الإجابة.',
            },
            updatedAt: now,
            createdBy: 'quantitative-computer-bank-import',
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: 'after' },
      );
      const document = updateResult.value || updateResult;
      if (question.answerStatus === 'approved') {
        questionIds.push(document._id);
      }
    }

    const attachment = bank.attachment ? [bank.attachment] : [];
    const hasVideo = Boolean(bank.video?.url);
    const quiz = bank.questions.length
      ? {
          title: `اختبار ${titleFor(bank.number)}`,
        instructions: hasVideo
            ? 'شاهد الفيديو، ثم أجب عن أسئلة النسخة المحلولة. تظهر صورة السؤال كاملة للحفاظ على الأشكال والرموز الرياضية.'
          : 'أجب عن الأسئلة بالاعتماد على صورة كل سؤال. لا يتضمن عرض الأسئلة شريط مفتاح الإجابة.',
          questionIds,
          passingScore: 60,
          timeLimitMinutes: 45,
        }
      : undefined;

    const set = {
      program: 'qudrat',
      subjectId: 'subject.qudrat.quantitative',
      title: titleFor(bank.number),
      description: hasVideo
        ? bank.attachment
          ? 'فيديو تدريبي مع اختبار محوسب محلول من بنك الكمي.'
          : 'فيديو تدريبي من سلسلة بنوك الكمي المحوسب.'
        : bank.attachment
          ? 'اختبار محوسب محلول من بنك الكمي.'
          : bank.questions.length
            ? 'اختبار محوسب من بنك الكمي؛ تظهر الأسئلة في صور مستقلة دون عرض مفتاح الإجابة.'
            : 'سيُضاف ملف البنك وفيديو الشرح عند توفرهما.',
      order: 8 + bank.number,
      published: true,
      videoUrl: hasVideo ? bank.video.url : '',
      durationMinutes: hasVideo && Number.isFinite(bank.video.durationSeconds)
        ? Math.ceil(bank.video.durationSeconds / 60)
        : undefined,
      attachments: attachment,
      version: 1,
      updatedAt: now,
    };
    if (quiz) set.quiz = quiz;
    else set.quiz = null;

    await foundationContent.updateOne(
      {
        program: 'qudrat',
        subjectId: 'subject.qudrat.quantitative',
        title: titleFor(bank.number),
      },
      {
        $set: set,
        $setOnInsert: {
          sections: [],
          createdAt: now,
        },
      },
      { upsert: true },
    );

    result.push({
      bank: bank.number,
      title: titleFor(bank.number),
      video: bank.video?.url || null,
      hasPdf: Boolean(bank.attachment),
      questions: bank.questions.length,
      linkedQuizQuestions: questionIds.length,
    });
  }

  console.log(JSON.stringify({ banks: result }, null, 2));
  }
} finally {
  await mongoose.disconnect();
}