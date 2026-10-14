export type ContributionCategory = 'quantitative' | 'verbal';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuestionContribution {
  id: string | number;
  questionText: string;
  category: ContributionCategory;
  subcategory?: string | null;
  options: string[];
  selectedOptionIndex: number;
  notes?: string | null;
  status: ContributionStatus;
  submittedAt: string;
  studentName?: string | null;
  adminNote?: string | null;
  publishedQuestionId?: string | number | null;
}

export interface StudentContributionInput {
  questionText: string;
  category: ContributionCategory;
  subcategory?: string;
  options: string[];
  selectedOptionIndex: number;
  notes?: string;
}

export interface ApproveContributionInput {
  questionText: string;
  category: ContributionCategory;
  subcategory: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: Difficulty;
  section: number;
  explanation: string;
  imageUrl?: string;
  adminNote?: string;
}

/** API errors must never expose an Express HTML error page in the interface. */
async function readJsonResponse(res: Response) {
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* invalid API response */ }
  const serverMessage = typeof data?.message === 'string' ? data.message
    : typeof data?.error === 'string' ? data.error : null;
  if (!res.ok || data?.success === false) {
    throw new Error(serverMessage || (res.status === 404
      ? 'هذه الخدمة غير متاحة في نسخة الخادم الحالية. يلزم تحديث الخادم ثم إعادة المحاولة.'
      : `تعذر إكمال الطلب (${res.status}). أعد المحاولة لاحقًا.`));
  }
  if (data === null || typeof data !== 'object') {
    throw new Error('تعذر قراءة رد الخادم. أعد تحميل الصفحة ثم حاول مرة أخرى.');
  }
  return data;
}

/** Fetch JSON and preserve structured server errors when present. */
export async function jsonRequest<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('تعذر الاتصال بالخادم. تحقق من الإنترنت ثم أعد المحاولة.');
  }
  return await readJsonResponse(res) as T;
}

export const submitQuestionContribution = (input: StudentContributionInput) =>
  jsonRequest<{ success: true; id: string | number; status: 'pending'; notificationStatus: 'sent' | 'failed' | 'queued' }>(
    'POST', '/api/student/question-contributions', input);

// Admin requests go through /api/admin, which the adminSession fetch bridge decorates with the bearer token.
export const listQuestionContributions = (status: ContributionStatus) =>
  jsonRequest<{ contributions: QuestionContribution[] }>('GET', `/api/admin/question-contributions?status=${status}`);

export const approveQuestionContribution = (id: string | number, input: ApproveContributionInput) =>
  jsonRequest<{ success: true; questionId: string | number; contribution: QuestionContribution }>(
    'POST', `/api/admin/question-contributions/${encodeURIComponent(String(id))}/approve`, input);

export const rejectQuestionContribution = (id: string | number, adminNote: string) =>
  jsonRequest<{ success: true }>('POST', `/api/admin/question-contributions/${encodeURIComponent(String(id))}/reject`, { adminNote });

export const isPersistentImageUrl = (url: string) =>
  !url || (/^(https?:\/\/|\/)/i.test(url) && !/^(blob:|data:)/i.test(url));

export const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

export async function uploadContributionImage(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('الصيغ المسموحة: PNG أو JPEG أو WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت.');
  const body = new FormData();
  body.append('file', file);
  let res: Response;
  try { res = await fetch('/api/admin/question-contributions/image', { method: 'POST', credentials: 'include', body }); }
  catch { throw new Error('تعذر الاتصال بالخادم لرفع الصورة.'); }
  const data = await readJsonResponse(res);
  if (typeof data.imageUrl !== 'string' || !data.imageUrl.trim()) throw new Error('لم يُرجع الخادم رابط الصورة. أعد محاولة الرفع.');
  return data.imageUrl as string;
}
