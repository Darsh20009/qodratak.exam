import mongoose from 'mongoose';
import {
  FoundationContent,
  type IFoundationContent,
  type IFoundationContentSection,
} from '../mongodb/models';
import {
  LearningContentProgress,
  type ILearningContentPracticeReference,
  type ILearningContentProgress,
  type LearningContentProgressState,
} from '../mongodb/learningContentModels';
import {
  recordVerifiedLearningAttempt,
  type LearningAttemptError,
} from './learningProfileService';
import {
  selectQuestionForContext,
  getQuestionCandidateForReference,
  publicQuestionCandidate,
  type PublicSelectedQuestion,
  type QuestionSelectionContext,
} from './questionSelectionService';
import { CONTROLLED_TAXONOMY_NODES } from '../learning/taxonomyRegistry';

export interface LearningContentDocument {
  id: string;
  programId: string;
  subjectId?: string;
  taxonomyNodeId?: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  sections: IFoundationContentSection[];
  status: 'published';
  version: number;
  publishedAt?: Date;
  videoUrl?: string;
  thumbnailUrl?: string;
  linkedQuizRoute?: string;
  hasPractice: boolean;
}

export interface PublicLearningContentProgress {
  contentId: string;
  contentVersion: number;
  currentSectionId?: string;
  progress: number;
  state: LearningContentProgressState;
  startedAt?: Date;
  lastReadAt?: Date;
  completedAt?: Date;
  practiceCompletedAt?: Date;
}

export interface PublicFoundationPractice {
  question?: PublicSelectedQuestion;
}

export interface FoundationPracticeResult {
  isCorrect: boolean;
  explanation?: string;
  correction?: string;
  nextStep?: string;
  practiceCompletedAt?: Date;
}

export class LearningContentError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'STUDENT_REQUIRED'
      | 'INVALID_CONTENT_ID'
      | 'CONTENT_UNAVAILABLE'
      | 'INVALID_SECTION'
      | 'INVALID_PROGRESS'
      | 'PRACTICE_UNAVAILABLE'
      | 'INVALID_PRACTICE'
      | 'INVALID_ANSWER',
  ) {
    super(message);
    this.name = 'LearningContentError';
  }
}

function programId(program: string): string {
  return `program.${program}`;
}

function contentSections(content: Pick<IFoundationContent, 'sections' | 'description' | 'title'>): IFoundationContentSection[] {
  if (Array.isArray(content.sections) && content.sections.length > 0) return content.sections;
  if (!content.description.trim()) return [];
  return [{
    id: 'overview',
    type: 'INTRO',
    title: 'نظرة عامة',
    body: content.description,
  }];
}

export const learningContentSections = contentSections;

function isApprovedScope(content: Pick<IFoundationContent, 'program' | 'subjectId' | 'taxonomyNodeId'>): boolean {
  const nodes = CONTROLLED_TAXONOMY_NODES;
  const programCode = programId(content.program);
  const program = nodes.find((node) => node.code === programCode);
  if (!program || program.status !== 'APPROVED') return false;
  if (!content.subjectId) return true;
  const subject = nodes.find((node) => node.code === content.subjectId);
  if (!subject || subject.status !== 'APPROVED' || subject.program !== content.program) return false;
  if (!content.taxonomyNodeId) return true;
  const taxonomyNode = nodes.find((node) => node.code === content.taxonomyNodeId);
  return Boolean(
    taxonomyNode &&
    taxonomyNode.status === 'APPROVED' &&
    taxonomyNode.program === content.program &&
    (taxonomyNode.code === content.subjectId || taxonomyNode.parentId === content.subjectId),
  );
}

export const isApprovedLearningContentScope = isApprovedScope;

function assertStudent(studentId: string): void {
  if (!studentId.trim()) throw new LearningContentError('الطالب غير صالح', 'STUDENT_REQUIRED');
}

async function loadPublishedContent(contentId: string): Promise<IFoundationContent> {
  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    throw new LearningContentError('معرف المحتوى غير صالح', 'INVALID_CONTENT_ID');
  }
  const content = await FoundationContent.findOne({
    _id: contentId,
    published: true,
  }).lean() as IFoundationContent | null;
  if (!content || !isApprovedScope(content)) {
    throw new LearningContentError('المحتوى غير متاح حاليًا', 'CONTENT_UNAVAILABLE');
  }
  return content;
}

function publicContent(content: IFoundationContent): LearningContentDocument {
  const sections = contentSections(content);
  return {
    id: String(content._id),
    programId: programId(content.program),
    subjectId: content.subjectId,
    taxonomyNodeId: content.taxonomyNodeId,
    title: content.title,
    description: content.description,
    estimatedMinutes: content.durationMinutes || Math.max(1, Math.ceil(sections.reduce(
      (total, section) => total + (section.body?.length || 0) + (section.problem?.length || 0),
      0,
    ) / 900)),
    sections,
    status: 'published',
    version: content.version || 1,
    publishedAt: content.publishedAt || content.createdAt,
    videoUrl: content.videoUrl || undefined,
    thumbnailUrl: content.thumbnailUrl,
    linkedQuizRoute: content.linkedQuizRoute,
    hasPractice: true,
  };
}

export const publicLearningContentDocument = publicContent;

function publicProgress(progress: ILearningContentProgress): PublicLearningContentProgress {
  return {
    contentId: String(progress.contentId),
    contentVersion: progress.contentVersion,
    currentSectionId: progress.currentSectionId,
    progress: progress.progress,
    state: progress.state,
    startedAt: progress.startedAt,
    lastReadAt: progress.lastReadAt,
    completedAt: progress.completedAt,
    practiceCompletedAt: progress.practiceCompletedAt,
  };
}

async function getOrCreateProgress(
  studentId: string,
  content: IFoundationContent,
): Promise<ILearningContentProgress> {
  const contentId = content._id;
  const version = content.version || 1;
  let progress = await LearningContentProgress.findOne({ studentId, contentId });
  if (!progress) {
    progress = await LearningContentProgress.create({
      studentId,
      contentId,
      contentVersion: version,
      progress: 0,
      state: 'NOT_STARTED',
    });
  } else if (progress.contentVersion !== version) {
    progress.contentVersion = version;
    progress.currentSectionId = undefined;
    progress.progress = 0;
    progress.state = 'NOT_STARTED';
    progress.startedAt = undefined;
    progress.lastReadAt = undefined;
    progress.completedAt = undefined;
    progress.practiceCompletedAt = undefined;
    progress.pendingPractice = undefined;
    await progress.save();
  }
  return progress;
}

export async function getLearningContent(studentId: string, contentId: string): Promise<LearningContentDocument> {
  assertStudent(studentId);
  return publicContent(await loadPublishedContent(contentId));
}

export async function getLearningContentProgress(
  studentId: string,
  contentId: string,
): Promise<PublicLearningContentProgress> {
  assertStudent(studentId);
  const content = await loadPublishedContent(contentId);
  return publicProgress(await getOrCreateProgress(studentId, content));
}

export async function updateLearningContentProgress(
  studentId: string,
  contentId: string,
  input: { currentSectionId?: string; progress?: number; state?: LearningContentProgressState },
): Promise<PublicLearningContentProgress> {
  assertStudent(studentId);
  const content = await loadPublishedContent(contentId);
  const progress = await getOrCreateProgress(studentId, content);
  const sections = contentSections(content);
  if (input.currentSectionId && !sections.some((section) => section.id === input.currentSectionId)) {
    throw new LearningContentError('قسم المحتوى غير صالح', 'INVALID_SECTION');
  }
  const nextProgress = Number(input.progress);
  if (!Number.isFinite(nextProgress) || nextProgress < 0 || nextProgress > 100) {
    throw new LearningContentError('نسبة التقدم غير صالحة', 'INVALID_PROGRESS');
  }
  if (progress.state !== 'PRACTICE_COMPLETED' && progress.state !== 'COMPLETED') {
    progress.state = nextProgress > 0 || input.currentSectionId ? 'READING' : 'NOT_STARTED';
  }
  progress.currentSectionId = input.currentSectionId || progress.currentSectionId;
  progress.progress = Math.max(progress.progress, Math.round(nextProgress));
  if (!progress.startedAt) progress.startedAt = new Date();
  progress.lastReadAt = new Date();
  await progress.save();
  return publicProgress(progress);
}

export async function completeLearningContent(
  studentId: string,
  contentId: string,
): Promise<PublicLearningContentProgress> {
  assertStudent(studentId);
  const content = await loadPublishedContent(contentId);
  const progress = await getOrCreateProgress(studentId, content);
  const sections = contentSections(content);
  progress.progress = 100;
  progress.currentSectionId = sections.at(-1)?.id || progress.currentSectionId;
  progress.completedAt ||= new Date();
  if (progress.state !== 'PRACTICE_COMPLETED') progress.state = 'COMPLETED';
  if (!progress.startedAt) progress.startedAt = new Date();
  progress.lastReadAt = new Date();
  await progress.save();
  return publicProgress(progress);
}

function practiceContext(studentId: string, content: IFoundationContent): QuestionSelectionContext {
  return {
    studentId,
    programId: programId(content.program),
    subjectId: content.subjectId,
    taxonomyNodeId: content.taxonomyNodeId || content.subjectId,
    activityType: 'PRACTICE',
  };
}

async function selectPracticeQuestion(
  studentId: string,
  content: IFoundationContent,
  pending?: ILearningContentPracticeReference,
): Promise<PublicSelectedQuestion> {
  const context = practiceContext(studentId, content);
  const candidate = pending
    ? await getQuestionCandidateForReference(context, pending)
    : (await selectQuestionForContext(context)).candidate;
  if (!candidate) {
    throw new LearningContentError('لا يوجد تدريب مناسب لهذا المحتوى حاليًا', 'PRACTICE_UNAVAILABLE');
  }
  return publicQuestionCandidate(candidate);
}

export async function getFoundationPractice(
  studentId: string,
  contentId: string,
): Promise<PublicFoundationPractice> {
  assertStudent(studentId);
  const content = await loadPublishedContent(contentId);
  const progress = await getOrCreateProgress(studentId, content);
  if (!progress.pendingPractice || progress.pendingPractice.answeredAt) {
    const question = await selectPracticeQuestion(studentId, content);
    progress.pendingPractice = {
      questionId: question.questionId,
      sourceType: question.sourceType as ILearningContentPracticeReference['sourceType'],
      sourceKey: question.sourceKey,
    };
    await progress.save();
    return { question };
  }
  const question = await selectPracticeQuestion(studentId, content, progress.pendingPractice);
  return { question };
}

export async function submitFoundationPractice(
  studentId: string,
  contentId: string,
  input: { questionId: string; selectedOptionIndex: number; idempotencyKey?: string },
): Promise<{ result: FoundationPracticeResult; progress: PublicLearningContentProgress }> {
  assertStudent(studentId);
  const content = await loadPublishedContent(contentId);
  const progress = await getOrCreateProgress(studentId, content);
  const pending = progress.pendingPractice;
  if (!pending || pending.answeredAt || pending.questionId !== String(input.questionId)) {
    throw new LearningContentError('السؤال التدريبي غير متاح لهذه المحاولة', 'INVALID_PRACTICE');
  }
  if (!Number.isInteger(input.selectedOptionIndex) || input.selectedOptionIndex < 0) {
    throw new LearningContentError('الإجابة المحددة غير صالحة', 'INVALID_ANSWER');
  }
  try {
    const attempt = await recordVerifiedLearningAttempt(studentId, {
      questionId: pending.questionId,
      sourceType: pending.sourceType,
      sourceKey: pending.sourceKey,
      programId: programId(content.program),
      subjectId: content.subjectId,
      selectedAnswer: input.selectedOptionIndex,
      responseTime: 0,
      idempotencyKey: input.idempotencyKey || `foundation-content:${contentId}:${pending.sourceType}:${pending.questionId}`,
      metadata: {
        flow: 'foundation-content-practice',
        contentId,
      },
    });
    pending.answeredAt = new Date();
    progress.practiceCompletedAt = new Date();
    if (progress.state === 'COMPLETED') progress.state = 'PRACTICE_COMPLETED';
    await progress.save();
    const isCorrect = Boolean(attempt.attempt?.isCorrect);
    const result: FoundationPracticeResult = {
      isCorrect,
      explanation: isCorrect
        ? 'إجابة صحيحة. احتفظ بطريقة التفكير نفسها عند الانتقال للسؤال التالي.'
        : 'الإجابة غير صحيحة. راجع الفكرة الأساسية في هذا المحتوى ثم جرّب سؤالًا مشابهًا.',
      correction: isCorrect ? undefined : 'ارجع إلى القسم المرتبط في المحتوى واقرأ المثال مرة أخرى.',
      nextStep: isCorrect ? 'يمكنك متابعة القراءة أو تجربة سؤال مشابه.' : 'افهم موضع الخطأ ثم اختر سؤالًا مشابهًا.',
      practiceCompletedAt: progress.practiceCompletedAt,
    };
    return { result, progress: publicProgress(progress) };
  } catch (error) {
    if ((error as LearningAttemptError)?.name === 'LearningAttemptError') {
      throw new LearningContentError((error as Error).message, 'INVALID_ANSWER');
    }
    throw error;
  }
}

export function publicLearningContentProgress(progress: PublicLearningContentProgress) {
  return progress;
}