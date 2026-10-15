import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectToMongoDB, disconnectFromMongoDB } from '../../artifacts/api-server/src/mongodb/connection';
import { TahsiliQuestionDraft } from '../../artifacts/api-server/src/mongodb/models';

interface CandidateInput {
  sourceId?: string;
  sourceOrdinal?: number;
  subject: string;
  subcategory?: string;
  text: string;
  options: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  topic?: string;
  explanation?: string;
  requiresImage?: boolean;
  sourcePage: number;
  sourceQuestionNumber?: number | null;
  sourceBook: string;
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const nasserCandidateFile = path.join(workspaceRoot, '.agents', 'outputs', 'tahsili-question-review-blocks.json');
const textCandidateFile = path.join(workspaceRoot, 'generated-artifacts', 'tahsili-question-drafts', 'tahsili-text-layer-candidates.json');
const examCandidateFile = path.join(workspaceRoot, 'generated-artifacts', 'tahsili-question-drafts', 'tahsili-exam-card-candidates.json');
const allowedSubjects = new Set(['رياضيات', 'فيزياء', 'كيمياء', 'أحياء', 'علم الأرض', 'مختلط']);

async function readCandidates(file: string): Promise<CandidateInput[]> {
  const payload = JSON.parse(await fs.readFile(file, 'utf8')) as { questions: CandidateInput[] };
  if (!Array.isArray(payload.questions)) throw new Error(`ملف المرشحات غير صالح: ${path.basename(file)}`);
  return payload.questions;
}

async function main() {
  const nasser = await readCandidates(nasserCandidateFile);
  const textLayer = await readCandidates(textCandidateFile);
  const examCards = await readCandidates(examCandidateFile);
  const inputs: CandidateInput[] = [
    ...nasser.map((candidate) => ({
      ...candidate,
      sourceId: 'nasser-abdulkarim-main',
      sourceOrdinal: 1,
    })),
    ...textLayer,
    ...examCards,
  ];
  if (!inputs.length) throw new Error('لا توجد مرشحات أسئلة للتحصيلي.');

  const pageOrdinals = new Map<string, number>();
  const candidates = inputs.map((candidate) => {
    const sourceId = String(candidate.sourceId || '').trim();
    const sourceOrdinal = Number(candidate.sourceOrdinal);
    const sourcePage = Number(candidate.sourcePage);
    const pageKey = `${sourceId}:${sourcePage}`;
    const pageIndex = (pageOrdinals.get(pageKey) || 0) + 1;
    pageOrdinals.set(pageKey, pageIndex);
    return {
      sourceKey: `${sourceId}:page-${sourcePage}:candidate-${pageIndex}`,
      sourceId,
      sourceOrdinal,
      questionId: sourceOrdinal * 100_000 + sourcePage * 100 + pageIndex,
      subject: candidate.subject,
      subcategory: String(candidate.subcategory || 'عام').trim() || 'عام',
      text: String(candidate.text || '').trim(),
      options: Array.isArray(candidate.options) ? candidate.options.map((option) => String(option || '').trim()) : [],
      difficulty: candidate.difficulty || 'intermediate',
      topic: String(candidate.topic || candidate.subcategory || 'عام').trim() || 'عام',
      explanation: String(candidate.explanation || '').trim() || undefined,
      requiresImage: candidate.requiresImage === true,
      sourcePage,
      sourceQuestionNumber: candidate.sourceQuestionNumber ?? undefined,
      sourceBlockIndex: pageIndex,
      sourceBook: String(candidate.sourceBook || '').trim(),
    };
  });

  const invalid = candidates.filter((candidate) =>
    !candidate.sourceId ||
    !Number.isInteger(candidate.sourceOrdinal) ||
    candidate.sourceOrdinal < 1 ||
    candidate.sourceOrdinal > 18 ||
    !Number.isInteger(candidate.sourcePage) ||
    candidate.sourcePage < 1 ||
    !allowedSubjects.has(candidate.subject) ||
    candidate.text.length < 8 ||
    candidate.text.length > 5000 ||
    candidate.options.length !== 4 ||
    candidate.options.some((option) => !option || option.length > 1000) ||
    !['beginner', 'intermediate', 'advanced'].includes(candidate.difficulty) ||
    !candidate.sourceBook,
  );
  if (invalid.length) {
    throw new Error(`توجد ${invalid.length} مرشحات OCR غير مكتملة؛ لم يتم استيراد أي مسودة.`);
  }
  if (new Set(candidates.map((candidate) => candidate.sourceKey)).size !== candidates.length) {
    throw new Error('توجد معرفات مصدر مكررة؛ أوقف الاستيراد للمراجعة.');
  }

  const connected = await connectToMongoDB();
  if (!connected) throw new Error('تعذر الاتصال بقاعدة البيانات؛ لم تُستورد مسودات الأسئلة.');
  try {
    let inserted = 0;
    let matched = 0;
    for (let offset = 0; offset < candidates.length; offset += 200) {
      const operations = candidates.slice(offset, offset + 200).map((candidate) => ({
        updateOne: {
          filter: { sourceKey: candidate.sourceKey },
          update: {
            $setOnInsert: {
              ...candidate,
              status: 'pending_review',
            },
          },
          upsert: true,
        },
      }));
      const result = await TahsiliQuestionDraft.bulkWrite(operations, { ordered: false });
      inserted += result.upsertedCount;
      matched += result.matchedCount;
    }

    let imageFlagsCorrected = 0;
    if (process.argv.includes('--clear-inferred-full-page-images')) {
      const examSourceIds = [
        'friday-evening-p2-biology-2024',
        'friday-evening-p2-math-2024',
        'friday-evening-p2-physics-2024',
        'friday-evening-p2-chemistry-2024',
      ];
      const correction = await TahsiliQuestionDraft.updateMany(
        {
          sourceId: { $in: examSourceIds },
          status: 'pending_review',
          requiresImage: true,
          sourceImageObjectKey: { $exists: false },
        },
        { $set: { requiresImage: false } },
      );
      imageFlagsCorrected = correction.modifiedCount;
    }

    const sourceIds = [...new Set(candidates.map((candidate) => candidate.sourceId))];
    const pendingReview = await TahsiliQuestionDraft.countDocuments({
      sourceId: { $in: sourceIds },
      status: 'pending_review',
    });
    const bySource = await TahsiliQuestionDraft.aggregate([
      { $match: { sourceId: { $in: sourceIds }, status: 'pending_review' } },
      { $group: { _id: '$sourceId', count: { $sum: 1 } } },
    ]);
    console.log(JSON.stringify({
      sources: sourceIds.length,
      candidates: candidates.length,
      draftsInserted: inserted,
      draftsAlreadyPresent: matched,
      imageFlagsCorrected,
      pendingReview,
      bySource: Object.fromEntries(bySource.map((row: any) => [row._id, row.count])),
      answerKeysImported: 0,
      questionImagesImported: 0,
    }));
  } finally {
    await disconnectFromMongoDB();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'تعذر استيراد أسئلة التحصيلي للمراجعة');
  process.exitCode = 1;
});
