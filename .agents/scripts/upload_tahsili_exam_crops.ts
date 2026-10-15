import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectToMongoDB, disconnectFromMongoDB } from '../../artifacts/api-server/src/mongodb/connection';
import { TahsiliQuestionDraft } from '../../artifacts/api-server/src/mongodb/models';
import { fetchR2VerbalObject, writeR2Object } from '../../artifacts/api-server/src/services/qudratVerbalBookFilesService';

interface ExamCropCandidate {
  sourceId: string;
  sourcePage: number;
  sourceQuestionNumber: number;
  sourceCropFile: string;
}

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inputPath = path.join(
  workspaceRoot,
  'generated-artifacts',
  'tahsili-question-drafts',
  'tahsili-exam-card-candidates.json',
);

async function main() {
  const payload = JSON.parse(await fs.readFile(inputPath, 'utf8')) as { questions: ExamCropCandidate[] };
  const pageOrdinals = new Map<string, number>();
  const candidates = payload.questions.map((candidate) => {
    const pageKey = `${candidate.sourceId}:${candidate.sourcePage}`;
    const pageIndex = (pageOrdinals.get(pageKey) || 0) + 1;
    pageOrdinals.set(pageKey, pageIndex);
    return {
      ...candidate,
      pageIndex,
      sourceKey: `${candidate.sourceId}:page-${candidate.sourcePage}:candidate-${pageIndex}`,
      objectKey: `tahsili/question-source-crops/${candidate.sourceId}/page-${candidate.sourcePage}-candidate-${pageIndex}.png`,
    };
  });

  const connected = await connectToMongoDB();
  if (!connected) throw new Error('تعذر الاتصال بقاعدة البيانات؛ لم تُرفق صور المصادر.');
  let uploaded = 0;
  let attached = 0;
  let skipped = 0;
  try {
    let cursor = 0;
    let processed = 0;
    const worker = async () => {
      while (cursor < candidates.length) {
        const candidate = candidates[cursor++];
        const draft = await TahsiliQuestionDraft.findOne({
          sourceKey: candidate.sourceKey,
          status: 'pending_review',
        }).select('_id sourceImageObjectKey').lean();
        if (!draft) {
          skipped += 1;
          processed += 1;
          continue;
        }

        const cropPath = path.resolve(workspaceRoot, candidate.sourceCropFile);
        if (!cropPath.startsWith(`${workspaceRoot}${path.sep}`)) throw new Error('مسار صورة مصدر غير آمن.');
        const body = await fs.readFile(cropPath);
        if (body.length === 0 || body.length > 5 * 1024 * 1024) {
          throw new Error(`حجم قصاصة المصدر غير صالح للسؤال ${candidate.sourceId}:${candidate.sourceQuestionNumber}.`);
        }

        const existing = await fetchR2VerbalObject(candidate.objectKey, { method: 'HEAD' });
        const existingBytes = Number(existing.headers.get('content-length') || 0);
        if (!existing.ok || existingBytes !== body.length) {
          await writeR2Object(candidate.objectKey, body, 'image/png', 60_000);
          const verification = await fetchR2VerbalObject(candidate.objectKey, { method: 'HEAD' });
          const verifiedBytes = Number(verification.headers.get('content-length') || 0);
          if (!verification.ok || verifiedBytes !== body.length) {
            throw new Error(`تعذر التحقق من قصاصة المصدر ${candidate.sourceId}:${candidate.sourceQuestionNumber}.`);
          }
          uploaded += 1;
        }

        if (!draft.sourceImageObjectKey) {
          const result = await TahsiliQuestionDraft.updateOne(
            {
              _id: draft._id,
              status: 'pending_review',
              sourceImageObjectKey: { $exists: false },
            },
            { $set: { sourceImageObjectKey: candidate.objectKey } },
          );
          attached += result.modifiedCount;
        }
        processed += 1;
        if (processed % 40 === 0 || processed === candidates.length) {
          console.log(`verified ${processed}/${candidates.length} question crops`);
        }
      }
    };
    const workerResults = await Promise.allSettled(
      Array.from({ length: Math.min(8, candidates.length) }, () => worker()),
    );
    const failedWorker = workerResults.find((result) => result.status === 'rejected');
    if (failedWorker?.status === 'rejected') throw failedWorker.reason;
  } finally {
    await disconnectFromMongoDB();
  }

  console.log(JSON.stringify({
    candidates: candidates.length,
    uploaded,
    attached,
    skipped,
    answerKeysIncludedInCrops: false,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'تعذر رفع قصاصات أسئلة التحصيلي');
  process.exitCode = 1;
});
