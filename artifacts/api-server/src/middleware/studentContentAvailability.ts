import type { RequestHandler } from 'express';
import { isReadingQuestion } from '../services/questionIdeas';

const adminRoles = new Set(['system_admin', 'support_admin', 'admin']);

// Tahsili is released. Its routes enforce student access individually and only
// serve published content; unreviewed drafts remain inaccessible to students.
export const enforceStudentContentAvailability: RequestHandler = (_req, _res, next) => next();

export function sanitizeStudentPassages(value: any): any {
  if (Array.isArray(value)) return value.map(sanitizeStudentPassages);
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  // Don't transform Mongoose/BSON scalar objects.
  if (typeof value.toHexString === 'function') return value;
  const result: any = Object.fromEntries(Object.entries(value).map(([key, v]) => [key, sanitizeStudentPassages(v)]));
  if (Array.isArray(value.options) && ('text' in value || 'questionText' in value) && !isReadingQuestion(value)) {
    delete result.passageText; delete result.passageLabel;
    if (result.source) { delete result.source.passageText; delete result.source.passageLabel; }
    // A legacy importer may also have prepended the passage to the question text.
    const passage = value.source?.passageText || value.passageText;
    if (typeof passage === 'string' && passage.trim()) {
      for (const key of ['text', 'questionText']) {
        if (typeof result[key] !== 'string') continue;
        const candidate = result[key].replace(/^النص المرتبط بالسؤال\s*[:：]?\s*/u, '').trimStart();
        if (candidate.startsWith(passage)) result[key] = candidate.slice(passage.length).replace(/^\s*السؤال\s*[:：]?\s*/u, '').trim();
      }
    }
  }
  return result;
}

export const studentPassagePresentation: RequestHandler = (req, res, next) => {
  if (adminRoles.has((req.session as any)?.userRole) || req.originalUrl.startsWith('/api/admin')) return next();
  if (/^\/api\/(?:questions|foundation|learning|student|test-results|qiyas|exam)/.test(req.originalUrl)) {
    const sendJson = res.json.bind(res);
    res.json = ((value: any) => sendJson(sanitizeStudentPassages(value))) as typeof res.json;
  }
  next();
};
