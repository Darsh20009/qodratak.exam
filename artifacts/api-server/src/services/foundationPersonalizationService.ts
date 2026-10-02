import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { FoundationContent, Question } from '../mongodb/models';
import { LearningAttempt } from '../mongodb/learningProfileModels';

type FoundationSubject = 'subject.qudrat.verbal' | 'subject.qudrat.quantitative';
type FoundationCategory = 'verbal' | 'quantitative';
export type FoundationQuestionDifficulty = 'mixed' | 'beginner' | 'intermediate' | 'advanced';

interface ModelRecommendation {
  skillKey: string;
  title: string;
  predictedCorrectProbability: number;
  confidence: number;
  reason: string;
}

const BOOK_TITLES: Record<FoundationCategory, string> = {
  verbal: 'كتاب قدراتك · التأسيس اللفظي',
  quantitative: 'كتاب قدراتك · التأسيس الكمي',
};
const VALID_DIFFICULTIES = new Set<FoundationQuestionDifficulty>(['mixed', 'beginner', 'intermediate', 'advanced']);

export function isFoundationQuestionDifficulty(value: string): value is FoundationQuestionDifficulty {
  return VALID_DIFFICULTIES.has(value as FoundationQuestionDifficulty);
}

const pythonScriptCandidates = [
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../learning/foundation_personalization.py'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'learning/foundation_personalization.py'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/learning/foundation_personalization.py'),
  path.resolve(process.cwd(), 'src/learning/foundation_personalization.py'),
];

function findPythonScript(): string {
  const scriptPath = pythonScriptCandidates.find((candidate) => existsSync(candidate));
  if (!scriptPath) throw new Error('Python personalization model was not found.');
  return scriptPath;
}

function classifyCategory(subjectId: FoundationSubject): FoundationCategory {
  return subjectId.endsWith('.verbal') ? 'verbal' : 'quantitative';
}

function questionIdSets(ids: readonly string[]) {
  const numericIds = ids
    .map((id) => Number(id))
    .filter((id) => Number.isSafeInteger(id) && id >= 0);
  const objectIds = ids
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  return { numericIds: [...new Set(numericIds)], objectIds };
}

function questionLookupQuery(ids: readonly string[], category: FoundationCategory) {
  const { numericIds, objectIds } = questionIdSets(ids);
  const alternatives: Record<string, unknown>[] = [];
  if (numericIds.length) alternatives.push({ questionId: { $in: numericIds } });
  if (objectIds.length) alternatives.push({ _id: { $in: objectIds } });
  return alternatives.length
    ? { category, $or: alternatives }
    : { category, _id: { $in: [] } };
}

function eligibleQuestionFilter(
  category: FoundationCategory,
  difficulty: FoundationQuestionDifficulty = 'mixed',
) {
  const optionsSize = { $size: { $ifNull: ['$options', []] } };
  return {
    category,
    answerStatus: { $ne: 'review' as const },
    ...(difficulty !== 'mixed' ? { difficulty } : {}),
    $expr: {
      $and: [
        { $isNumber: '$correctOptionIndex' },
        { $gte: ['$correctOptionIndex', 0] },
        { $lt: ['$correctOptionIndex', optionsSize] },
        { $gte: [optionsSize, 2] },
      ],
    },
  };
}

export async function selectFoundationCoverageQuestions(
  studentId: string,
  category: FoundationCategory,
  count: number,
  difficulty: FoundationQuestionDifficulty,
) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('A valid student account is required for question-bank coverage.');
  }
  if (!Number.isInteger(count) || count < 5 || count > 60) {
    throw new Error('Question count must be between 5 and 60.');
  }
  const subjectId = category === 'verbal'
    ? 'subject.qudrat.verbal'
    : 'subject.qudrat.quantitative';
  const attemptedIds = (await LearningAttempt.distinct('questionId', {
    studentId,
    programId: 'program.qudrat',
    subjectId,
    sourceType: 'mongo_question',
    isAnswered: true,
  })).map(String);
  const { numericIds, objectIds } = questionIdSets(attemptedIds);
  const baseFilter = eligibleQuestionFilter(category, difficulty);
  const unseenFilter = {
    ...baseFilter,
    ...(numericIds.length ? { questionId: { $nin: numericIds } } : {}),
    ...(objectIds.length ? { _id: { $nin: objectIds } } : {}),
  };
  const unseenQuestions = await Question.aggregate([
    { $match: unseenFilter },
    { $sample: { size: count } },
  ]);
  const selected = [...unseenQuestions];
  if (selected.length < count) {
    const selectedObjectIds = selected.map((question) => question._id);
    const additional = await Question.aggregate([
      { $match: { ...baseFilter, _id: { $nin: selectedObjectIds } } },
      { $sample: { size: count - selected.length } },
    ]);
    selected.push(...additional);
  }

  return {
    questions: selected,
    coverage: await questionBankCoverage(studentId, subjectId, category),
  };
}

function runPythonModel(input: {
  subjectId: FoundationSubject;
  attempts: Array<Record<string, unknown>>;
}): Promise<{
  modelVersion: string;
  attemptsUsed: number;
  level: 'STARTER' | 'BUILDING' | 'DEVELOPING' | 'READY';
  recommendations: ModelRecommendation[];
}> {
  return new Promise((resolve, reject) => {
    const child = spawn('python3', [findPythonScript()], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      if (!settled) {
        settled = true;
        reject(new Error('Python personalization model timed out.'));
      }
    }, 5000);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      if (stdout.length > 512_000 && !settled) {
        settled = true;
        child.kill('SIGKILL');
        clearTimeout(timeout);
        reject(new Error('Python personalization model returned too much data.'));
      }
    });
    child.stderr.on('data', (chunk: string) => {
      if (stderr.length < 2000) stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(new Error(`Python personalization model could not start: ${error.message}`));
      }
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (settled) return;
      settled = true;
      if (code !== 0) {
        reject(new Error(`Python personalization model failed with exit code ${code}: ${stderr.trim()}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Python personalization model returned invalid JSON.'));
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}

async function questionBankCoverage(
  studentId: string,
  subjectId: FoundationSubject,
  category: FoundationCategory,
) {
  const attempts = await LearningAttempt.distinct('questionId', {
    studentId,
    programId: 'program.qudrat',
    subjectId,
    sourceType: 'mongo_question',
    isAnswered: true,
  });
  const ids = attempts.map(String);
  const { numericIds, objectIds } = questionIdSets(ids);
  const eligible = eligibleQuestionFilter(category);
  const total = await Question.countDocuments(eligible);
  let covered = 0;
  if (numericIds.length || objectIds.length) {
    const referenceMatches: Record<string, unknown>[] = [];
    if (numericIds.length) referenceMatches.push({ questionId: { $in: numericIds } });
    if (objectIds.length) referenceMatches.push({ _id: { $in: objectIds } });
    covered = await Question.countDocuments({
      ...eligible,
      $or: referenceMatches,
    });
  }
  const safeCovered = Math.min(total, covered);
  return {
    covered: safeCovered,
    total,
    remaining: Math.max(0, total - safeCovered),
    percent: total ? Math.round((safeCovered / total) * 100) : 0,
  };
}

export async function getFoundationLearningPath(
  studentId: string,
  subjectId: string,
) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new Error('A valid student account is required for personalization.');
  }
  if (subjectId !== 'subject.qudrat.verbal' && subjectId !== 'subject.qudrat.quantitative') {
    throw new Error('Unsupported Qudrat foundation subject.');
  }

  const subject = subjectId as FoundationSubject;
  const category = classifyCategory(subject);
  const [book, attemptRows, coverage] = await Promise.all([
    FoundationContent.findOne({
      program: 'qudrat',
      subjectId: subject,
      title: BOOK_TITLES[category],
      published: true,
    }).select('_id title sections').lean(),
    LearningAttempt.find({
      studentId,
      programId: 'program.qudrat',
      subjectId: subject,
      sourceType: 'mongo_question',
      isAnswered: true,
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .select('questionId isCorrect responseTime createdAt metadata')
      .lean(),
    questionBankCoverage(studentId, subject, category),
  ]);

  if (!book) throw new Error('The foundation book has not been seeded or published.');

  const ids = attemptRows.map((attempt) => String(attempt.questionId));
  const questions = await Question.find(questionLookupQuery(ids, category))
    .select('_id questionId category subcategory topic difficulty text keywords source')
    .lean();
  const byObjectId = new Map(questions.map((question) => [String(question._id), question]));
  const byQuestionId = new Map(questions.map((question) => [String(question.questionId), question]));
  const now = Date.now();
  const trainingAttempts = attemptRows.map((attempt) => {
    const id = String(attempt.questionId);
    const question = byObjectId.get(id) || byQuestionId.get(id);
    const metadata = (attempt.metadata || {}) as Record<string, unknown>;
    const createdAt = attempt.createdAt instanceof Date ? attempt.createdAt : new Date(attempt.createdAt);
    return {
      category: question?.category || metadata.category || '',
      subcategory: question?.subcategory || metadata.subcategory || '',
      topic: question?.topic || metadata.topic || '',
      keywords: question?.keywords || metadata.keywords || '',
      text: question?.text || metadata.questionText || '',
      difficulty: question?.difficulty || metadata.difficulty || '',
      isCorrect: Boolean(attempt.isCorrect),
      responseTime: Math.max(0, Number(attempt.responseTime) || 0),
      ageDays: Number.isFinite(createdAt.getTime())
        ? Math.max(0, (now - createdAt.getTime()) / 86_400_000)
        : 0,
    };
  });
  const model = await runPythonModel({ subjectId: subject, attempts: trainingAttempts });

  return {
    programId: 'program.qudrat',
    subjectId: subject,
    book: {
      contentId: String(book._id),
      title: book.title,
      chapterCount: (book.sections || []).filter((section) => section.type === 'CONCEPT').length,
    },
    attemptsUsed: model.attemptsUsed,
    level: model.level,
    modelVersion: model.modelVersion,
    recommendations: model.recommendations,
    coverage,
  };
}