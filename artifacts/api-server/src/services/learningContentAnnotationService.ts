import mongoose from 'mongoose';
import {
  LearningContentAnnotation,
  type ILearningContentAnnotation,
  type LearningContentAnnotationType,
} from '../mongodb/learningContentModels';
import { getLearningContent, type LearningContentDocument } from './learningContentService';

const MAX_NOTE_LENGTH = 2000;
const MAX_SELECTED_TEXT_LENGTH = 600;
const MAX_POINTS = 1200;
const MAX_DATA_BYTES = 80_000;

type Point = { x: number; y: number; pressure?: number };
type TextAnchor = { start: number; end: number };

export type LearningContentAnnotationData = {
  selectedText?: string;
  anchor?: TextAnchor;
  text?: string;
  points?: Point[];
  color?: string;
  lineWidth?: number;
};

export interface PublicLearningContentAnnotation {
  id: string;
  contentId: string;
  contentVersion: number;
  sectionId?: string;
  type: LearningContentAnnotationType;
  data: LearningContentAnnotationData;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicLearningContentAnnotations {
  contentVersion: number;
  annotations: PublicLearningContentAnnotation[];
  legacyCount: number;
}

export class LearningContentAnnotationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'STUDENT_REQUIRED'
      | 'INVALID_CONTENT_ID'
      | 'CONTENT_UNAVAILABLE'
      | 'INVALID_SECTION'
      | 'INVALID_ANNOTATION_ID'
      | 'INVALID_ANNOTATION_TYPE'
      | 'INVALID_ANNOTATION_DATA'
      | 'PAYLOAD_TOO_LARGE'
      | 'VERSION_MISMATCH'
      | 'ANNOTATION_NOT_FOUND',
  ) {
    super(message);
    this.name = 'LearningContentAnnotationError';
  }
}

function assertStudent(studentId: string): void {
  if (!studentId.trim()) {
    throw new LearningContentAnnotationError('الطالب غير صالح', 'STUDENT_REQUIRED');
  }
}

function assertObjectId(value: string, code: 'INVALID_CONTENT_ID' | 'INVALID_ANNOTATION_ID'): void {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new LearningContentAnnotationError('معرف العنصر غير صالح', code);
  }
}

function normalizeTextAnchor(value: unknown): TextAnchor | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const anchor = value as Record<string, unknown>;
  const start = Number(anchor.start);
  const end = Number(anchor.end);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end - start > MAX_SELECTED_TEXT_LENGTH * 4) {
    throw new LearningContentAnnotationError('موضع النص غير صالح', 'INVALID_ANNOTATION_DATA');
  }
  return { start, end };
}

function normalizePoint(value: unknown): Point {
  if (!value || typeof value !== 'object') {
    throw new LearningContentAnnotationError('نقطة الرسم غير صالحة', 'INVALID_ANNOTATION_DATA');
  }
  const point = value as Record<string, unknown>;
  const x = Number(point.x);
  const y = Number(point.y);
  const pressure = point.pressure === undefined ? undefined : Number(point.pressure);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) {
    throw new LearningContentAnnotationError('إحداثيات الرسم غير صالحة', 'INVALID_ANNOTATION_DATA');
  }
  if (pressure !== undefined && (!Number.isFinite(pressure) || pressure < 0 || pressure > 1)) {
    throw new LearningContentAnnotationError('ضغط القلم غير صالح', 'INVALID_ANNOTATION_DATA');
  }
  return { x, y, ...(pressure === undefined ? {} : { pressure }) };
}

function normalizeAnnotationData(type: LearningContentAnnotationType, raw: unknown): LearningContentAnnotationData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new LearningContentAnnotationError('بيانات annotation غير صالحة', 'INVALID_ANNOTATION_DATA');
  }
  const data = raw as Record<string, unknown>;
  let normalized: LearningContentAnnotationData;

  if (type === 'DRAWING') {
    if (!Array.isArray(data.points) || data.points.length < 2 || data.points.length > MAX_POINTS) {
      throw new LearningContentAnnotationError('عدد نقاط الرسم غير صالح', 'INVALID_ANNOTATION_DATA');
    }
    const color = String(data.color || '#e07a5f');
    const lineWidth = Number(data.lineWidth ?? 3);
    if (!/^#[0-9a-f]{6}$/i.test(color) || !Number.isFinite(lineWidth) || lineWidth < 1 || lineWidth > 8) {
      throw new LearningContentAnnotationError('إعدادات الرسم غير صالحة', 'INVALID_ANNOTATION_DATA');
    }
    normalized = {
      points: data.points.map(normalizePoint),
      color,
      lineWidth,
    };
  } else if (type === 'NOTE') {
    const text = String(data.text || '').trim();
    if (!text || text.length > MAX_NOTE_LENGTH) {
      throw new LearningContentAnnotationError('ملاحظة الطالب غير صالحة', 'INVALID_ANNOTATION_DATA');
    }
    normalized = {
      text,
      ...(data.selectedText ? { selectedText: String(data.selectedText).slice(0, MAX_SELECTED_TEXT_LENGTH) } : {}),
      ...(data.anchor ? { anchor: normalizeTextAnchor(data.anchor) } : {}),
    };
  } else {
    const selectedText = String(data.selectedText || '').trim();
    const anchor = normalizeTextAnchor(data.anchor);
    if (!selectedText || selectedText.length > MAX_SELECTED_TEXT_LENGTH || !anchor) {
      throw new LearningContentAnnotationError('تحديد النص غير صالح', 'INVALID_ANNOTATION_DATA');
    }
    normalized = { selectedText, anchor };
  }

  if (Buffer.byteLength(JSON.stringify(normalized), 'utf8') > MAX_DATA_BYTES) {
    throw new LearningContentAnnotationError('حجم annotation أكبر من المسموح', 'PAYLOAD_TOO_LARGE');
  }
  return normalized;
}

export const normalizeLearningContentAnnotationData = normalizeAnnotationData;

function assertSection(content: LearningContentDocument, sectionId?: string): void {
  if (!sectionId) return;
  if (!content.sections.some((section) => section.id === sectionId)) {
    throw new LearningContentAnnotationError('قسم المحتوى غير صالح', 'INVALID_SECTION');
  }
}

function normalizeType(value: unknown): LearningContentAnnotationType {
  const type = String(value || '').toUpperCase() as LearningContentAnnotationType;
  if (!['HIGHLIGHT', 'UNDERLINE', 'DRAWING', 'NOTE'].includes(type)) {
    throw new LearningContentAnnotationError('نوع annotation غير مدعوم', 'INVALID_ANNOTATION_TYPE');
  }
  return type;
}

export const normalizeLearningContentAnnotationType = normalizeType;

function publicAnnotation(annotation: ILearningContentAnnotation): PublicLearningContentAnnotation {
  return {
    id: String(annotation._id),
    contentId: String(annotation.contentId),
    contentVersion: annotation.contentVersion,
    sectionId: annotation.sectionId,
    type: annotation.type,
    data: annotation.data as LearningContentAnnotationData,
    createdAt: annotation.createdAt,
    updatedAt: annotation.updatedAt,
  };
}

export const publicLearningContentAnnotation = publicAnnotation;

async function loadContent(studentId: string, contentId: string): Promise<LearningContentDocument> {
  assertStudent(studentId);
  assertObjectId(contentId, 'INVALID_CONTENT_ID');
  try {
    return await getLearningContent(studentId, contentId);
  } catch (error) {
    if (error instanceof Error && error.name === 'LearningContentError') {
      throw new LearningContentAnnotationError(error.message, 'CONTENT_UNAVAILABLE');
    }
    throw error;
  }
}

export async function listLearningContentAnnotations(
  studentId: string,
  contentId: string,
): Promise<PublicLearningContentAnnotations> {
  const content = await loadContent(studentId, contentId);
  const annotations = await LearningContentAnnotation.find({ studentId, contentId })
    .sort({ createdAt: 1 })
    .lean() as unknown as ILearningContentAnnotation[];
  const current = annotations.filter((annotation) => annotation.contentVersion === content.version);
  return {
    contentVersion: content.version,
    annotations: current.map(publicAnnotation),
    legacyCount: annotations.length - current.length,
  };
}

export async function createLearningContentAnnotation(
  studentId: string,
  contentId: string,
  input: {
    contentVersion: number;
    sectionId?: string;
    type: unknown;
    data: unknown;
  },
): Promise<PublicLearningContentAnnotation> {
  const content = await loadContent(studentId, contentId);
  if (!Number.isInteger(input.contentVersion) || input.contentVersion !== content.version) {
    throw new LearningContentAnnotationError('إصدار المحتوى لم يعد متاحًا للتحرير', 'VERSION_MISMATCH');
  }
  const type = normalizeType(input.type);
  assertSection(content, input.sectionId);
  if (type === 'DRAWING' && !input.sectionId) {
    throw new LearningContentAnnotationError('الرسم يحتاج إلى قسم مرتبط', 'INVALID_SECTION');
  }
  const annotation = await LearningContentAnnotation.create({
    studentId,
    contentId,
    contentVersion: content.version,
    sectionId: input.sectionId,
    type,
    data: normalizeAnnotationData(type, input.data),
  });
  return publicAnnotation(annotation);
}

export async function updateLearningContentAnnotation(
  studentId: string,
  contentId: string,
  annotationId: string,
  input: { contentVersion: number; sectionId?: string; data?: unknown },
): Promise<PublicLearningContentAnnotation> {
  const content = await loadContent(studentId, contentId);
  assertObjectId(annotationId, 'INVALID_ANNOTATION_ID');
  if (!Number.isInteger(input.contentVersion) || input.contentVersion !== content.version) {
    throw new LearningContentAnnotationError('إصدار المحتوى لم يعد متاحًا للتحرير', 'VERSION_MISMATCH');
  }
  const annotation = await LearningContentAnnotation.findOne({ _id: annotationId, studentId, contentId });
  if (!annotation) {
    throw new LearningContentAnnotationError('الـannotation غير موجودة', 'ANNOTATION_NOT_FOUND');
  }
  if (annotation.contentVersion !== content.version) {
    throw new LearningContentAnnotationError('هذه annotation مرتبطة بإصدار قديم ولا تعرض تلقائيًا', 'VERSION_MISMATCH');
  }
  const nextSectionId = input.sectionId === undefined ? annotation.sectionId : input.sectionId;
  assertSection(content, nextSectionId);
  annotation.sectionId = nextSectionId;
  if (input.data !== undefined) {
    annotation.data = normalizeAnnotationData(annotation.type, input.data);
  }
  await annotation.save();
  return publicAnnotation(annotation);
}

export async function deleteLearningContentAnnotation(
  studentId: string,
  contentId: string,
  annotationId: string,
): Promise<void> {
  const content = await loadContent(studentId, contentId);
  assertObjectId(annotationId, 'INVALID_ANNOTATION_ID');
  const annotation = await LearningContentAnnotation.findOne({ _id: annotationId, studentId, contentId });
  if (!annotation) {
    throw new LearningContentAnnotationError('الـannotation غير موجودة', 'ANNOTATION_NOT_FOUND');
  }
  if (annotation.contentVersion !== content.version) {
    throw new LearningContentAnnotationError('هذه annotation مرتبطة بإصدار قديم ولا تعرض تلقائيًا', 'VERSION_MISMATCH');
  }
  await LearningContentAnnotation.deleteOne({ _id: annotationId, studentId, contentId });
}

export const learningContentAnnotationLimits = {
  maxNoteLength: MAX_NOTE_LENGTH,
  maxSelectedTextLength: MAX_SELECTED_TEXT_LENGTH,
  maxPoints: MAX_POINTS,
  maxDataBytes: MAX_DATA_BYTES,
};