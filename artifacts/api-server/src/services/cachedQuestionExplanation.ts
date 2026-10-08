import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { Question, TahsiliQuestion } from '../mongodb/models';
import { LearningAttempt } from '../mongodb/learningProfileModels';
import { QuestionExplanationCache, ExplanationGenerationUsage } from '../mongodb/examReportModels';
import { speedAdvice } from './examReportMath';
import { generateReusableQuestionExplanation } from './aiService';

const pending = new Map<string, Promise<any>>();
export async function resolveReportQuestion(studentId: string, input: any) {
  const id = String(input.questionId ?? input.id ?? '');
  const text = String(input.questionText ?? input.text ?? '').trim();
  const filter: any = mongoose.isValidObjectId(id) ? { _id: id } : /^\d+$/.test(id) ? { questionId: Number(id) } : { text };
  const candidates = await Promise.all([
    Question.findOne({ ...filter, answerStatus: 'approved' }).lean(),
    TahsiliQuestion.findOne({ ...filter, answerConfidence: 'verified' }).lean(),
  ]);
  for (let index = 0; index < candidates.length; index++) {
    const question: any = candidates[index];
    if (!question || (text && text !== question.text) ||
      (Array.isArray(input.options) && JSON.stringify(input.options) !== JSON.stringify(question.options))) continue;
    const sourceType = index ? 'mongo_tahsili_question' : 'mongo_question';
    const questionId = index ? String(question.questionId) : String(question._id);
    const proof = await LearningAttempt.findOne({ studentId, questionId, sourceType }).sort({ createdAt: -1 }).lean() as any;
    if (!proof || Number(proof.correctAnswer) !== question.correctOptionIndex) continue; // Never pair old correction with a changed answer key.
    return { question, proof, questionId, sourceType };
  }
  // Legacy Tahsili exams are server-owned JSON sources, not Mongo bank rows.
  // Source identity includes the exam; numeric IDs alone are never enough.
  const legacyAttempts: any[] = await LearningAttempt.find({ studentId, sourceType: 'legacy_json', questionId: id, isAnswered: true })
    .sort({ createdAt: -1 }).limit(10).lean();
  for (const proof of legacyAttempts) {
    const examId = String(proof.sourceKey || '').split(':')[1];
    if (!['exam-50', 'exam-10', 'exam-100', 'exam-110'].includes(examId)) continue;
    try {
      const data = JSON.parse(await fs.readFile(path.join(process.cwd(), 'server', 'data', `${examId}.json`), 'utf8'));
      const source = data.questions[Number(id) - 1];
      if (!source) continue;
      const options = (source.answerOptions || []).map((option: any) => option.text);
      if (!text || source.question !== text || (input.options && JSON.stringify(input.options) !== JSON.stringify(options))) continue;
      const correctOptionIndex = source.answerOptions.findIndex((option: any) => option.isCorrect === true);
      if (correctOptionIndex < 0 || correctOptionIndex !== Number(proof.correctAnswer)) continue;
      return { question: { text, options, correctOptionIndex, category: source.category,
        explanation: source.explanation || source.answerOptions[correctOptionIndex].rationale || '',
        imageUrl: source.imageUrl, imageUrls: source.imageUrls }, proof, questionId: id, sourceType: 'legacy_json' };
    } catch { /* An unavailable file is not replaced by another source. */ }
  }
  return null;
}

export async function cachedQuestionExplanation(studentId: string, input: any, allowGenerate = false) {
  const resolved = await resolveReportQuestion(studentId, input);
  if (!resolved) return { explanation: '', tip: '', status: 'unverified', generated: false };
  const q = resolved.question;
  const tip = speedAdvice(q.category || q.subject || '', q.subcategory || '');
  if (q.explanation?.trim()) return { explanation: q.explanation, tip: q.studentTip || tip, status: 'approved', generated: false };
  const fingerprint = crypto.createHash('sha256').update(JSON.stringify({
    text: q.text, options: q.options, passage: q.source?.passageText,
    key: q.correctOptionIndex, images: q.imageUrls?.length ? q.imageUrls : [q.imageUrl].filter(Boolean),
  })).digest('hex');
  const saved = await QuestionExplanationCache.findOne({ fingerprint }).lean() as any;
  if (saved) return { explanation: saved.explanation, tip: saved.tip, status: 'generated', generated: false };
  if (!allowGenerate) return { explanation: '', tip, status: 'missing', generated: false };
  if (!pending.has(fingerprint)) {
    pending.set(fingerprint, (async () => {
      const bucket = Math.floor(Date.now() / 3600000);
      await ExplanationGenerationUsage.updateOne({ studentId, bucket }, { $setOnInsert: {
        studentId, bucket, used: 0, expiresAt: new Date((bucket + 2) * 3600000),
      } }, { upsert: true }).catch((error) => { if (error?.code !== 11000) throw error; });
      const reserved = await ExplanationGenerationUsage.findOneAndUpdate({ studentId, bucket, used: { $lt: 5 } },
        { $inc: { used: 1 } }, { returnDocument: 'after' });
      if (!reserved) return { explanation: '', tip, status: 'budget_exceeded', generated: false };
      const result = await generateReusableQuestionExplanation(q);
      if (!result) return { explanation: '', tip, status: 'unavailable', generated: false };
      await QuestionExplanationCache.updateOne({ fingerprint }, { $setOnInsert: {
        fingerprint, explanation: result.explanation, tip: result.tip || tip,
      } }, { upsert: true });
      return { ...result, tip: result.tip || tip, status: 'generated', generated: true };
    })().finally(() => pending.delete(fingerprint)));
  }
  return pending.get(fingerprint);
}
