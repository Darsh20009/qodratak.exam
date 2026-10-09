import type { RequestHandler } from 'express';
import { isReadingQuestion } from '../services/questionIdeas';
import { FoundationContent } from '../mongodb/models';

const adminRoles = new Set(['system_admin', 'support_admin', 'admin']);
export function requestsTahsili(path: string, query: any = {}, body: any = {}) {
  if (/^\/api\/(?:admin|institution|teacher)(?:\/|$)/.test(path)) return false;
  if (/^\/api\/(?:tahsili|tahsilik)(?:[-/]|$)/.test(path)) return true;
  // Read-only historic reports must stay accessible. Preferences/payment must not be blocked.
  if (!/^\/api\/(?:foundation|learning|student\/(?:learning|adaptive|daily|course)|questions|test-results|ai)/.test(path)) return false;
  const values = [query.program, query.programId, query.subject, query.subjectId, query.track,
    body?.program, body?.programId, body?.subject, body?.subjectId, body?.track];
  return values.some((value) => /tahsili|تحصيل/i.test(String(value || '')));
}

export const enforceStudentContentAvailability: RequestHandler = async (req, res, next) => {
  const role = (req.session as any)?.userRole || (req.session as any)?.adminRole;
  if (adminRoles.has(role)) return next();
  if (requestsTahsili(req.originalUrl.split('?')[0], req.query, req.body)) {
    res.status(423).json({ error: 'التحصيلي قريبًا. المحتوى قيد التجهيز.', code: 'TAHSILI_COMING_SOON' });
    return;
  }
  const contentMatch = req.originalUrl.split('?')[0].match(/^\/api\/foundation-content\/([a-fA-F0-9]{24})(?:\/|$)/);
  if (contentMatch) {
    try {
      if (await FoundationContent.exists({ _id: contentMatch[1], program: 'tahsili' })) {
        res.status(423).json({ error: 'التحصيلي قريبًا. المحتوى قيد التجهيز.', code: 'TAHSILI_COMING_SOON' });
        return;
      }
    } catch (error) {
      req.log.error({ err: error }, 'Unable to verify foundation content availability');
      res.status(503).json({ error: 'تعذر التحقق من توفر المحتوى. حاول لاحقًا.' });
      return;
    }
  }
  next();
};

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
