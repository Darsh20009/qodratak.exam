import fs from 'node:fs/promises';
import process from 'node:process';
import mongoose from 'mongoose';

const inputPath = new URL('../attached_assets/verbal-forms-import.json', import.meta.url);
const apply = process.argv.includes('--apply');
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is required');
}

const questionSchema = new mongoose.Schema({
  questionId: { type: Number, required: true },
  category: String,
  subcategory: String,
  text: String,
  options: [String],
  correctOptionIndex: Number,
  difficulty: String,
  topic: String,
  dialect: String,
  keywords: [String],
  section: Number,
  explanation: String,
  studentTip: String,
  answerStatus: String,
  source: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
}, { collection: 'questions', strict: false });

const Question = mongoose.models.VerbalFormImportQuestion
  || mongoose.model('VerbalFormImportQuestion', questionSchema);

const questions = JSON.parse(await fs.readFile(inputPath, 'utf8'));
if (!Array.isArray(questions) || questions.length === 0) {
  throw new Error('The import file is empty or invalid');
}

await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
});

try {
  const sourceKeys = questions.map((question) => ({
    url: question.source?.url,
    questionId: String(question.source?.questionId || ''),
  }));
  const existing = await Question.find({
    'source.type': 'google_form',
    $or: sourceKeys.map((key) => ({
      'source.url': key.url,
      'source.questionId': key.questionId,
    })),
  }).select({ questionId: 1, source: 1 }).lean();

  const existingByKey = new Map(
    existing.map((question) => [
      `${question.source?.url}|${question.source?.questionId}`,
      question.questionId,
    ]),
  );
  const maxQuestion = await Question.findOne().sort({ questionId: -1 }).select({ questionId: 1 }).lean();
  let nextQuestionId = Number(maxQuestion?.questionId || 0) + 1;
  const operations = questions.map((question) => {
    const key = `${question.source.url}|${question.source.questionId}`;
    const existingQuestionId = existingByKey.get(key);
    const questionId = existingQuestionId || nextQuestionId++;
    const now = new Date();
    const document = {
      questionId,
      category: 'verbal',
      subcategory: question.subcategory || 'اللفظي',
      text: question.text,
      options: question.options,
      correctOptionIndex: question.correctOptionIndex,
      difficulty: 'intermediate',
      topic: question.subcategory || 'اللفظي',
      dialect: 'standard',
      keywords: [question.subcategory || 'اللفظي', 'google-forms'],
      section: 1,
      explanation: question.explanation,
      studentTip: question.studentTip,
      answerStatus: question.answerStatus || 'approved',
      source: question.source,
      updatedAt: now,
      createdBy: 'google-forms-logical-import',
    };

    return {
      updateOne: {
        filter: {
          'source.type': 'google_form',
          'source.url': question.source.url,
          'source.questionId': String(question.source.questionId),
        },
        update: {
          $set: document,
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    };
  });

  const newCount = questions.filter((question) => !existingByKey.has(
    `${question.source.url}|${question.source.questionId}`,
  )).length;
  const updateCount = questions.length - newCount;

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    inputCount: questions.length,
    existingImportedCount: existing.length,
    newCount,
    updateCount,
    nextQuestionIdAfterImport: nextQuestionId,
  }));

  if (apply) {
    for (let index = 0; index < operations.length; index += 250) {
      await Question.bulkWrite(operations.slice(index, index + 250), { ordered: false });
    }
    console.log(JSON.stringify({ imported: questions.length }));
  }
} finally {
  await mongoose.disconnect();
}