import { useEffect } from 'react';

export type TimedQuestion = {
  id: string; text: string; options: string[]; category?: string; subcategory?: string;
  imageUrl?: string; bankId?: string; selectedOptionIndex: number | null; seconds: number;
};
type Run = { runId: string; title: string; path?: string; finished: boolean; questions: Record<string, TimedQuestion> };
let run: Run | null = null;
let active: { id: string; since: number } | null = null;
const storageKey = 'qodratak:active-exam-timing';
function persist() { try { sessionStorage.setItem(storageKey, JSON.stringify(run)); } catch { /* Timing remains available in memory. */ } }
function restore() {
  if (run) return;
  try { run = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { run = null; }
}
function flush() {
  if (!active || !run) return;
  const question = run.questions[active.id];
  if (question) question.seconds += Math.max(0, (performance.now() - active.since) / 1000);
  active.since = performance.now();
  persist();
}
export function readExamTiming() { restore(); flush(); return run; }
export function examQuestionSeconds(id: string | number) {
  const current = readExamTiming();
  const question = current?.questions[String(id)] || Object.values(current?.questions || {}).find((q) => q.bankId === String(id));
  return Math.round(question?.seconds || 0);
}
export function completeExamTiming() { flush(); active = null; if (run) { run.finished = true; persist(); } return run; }
export function resetExamTiming() { run = null; active = null; sessionStorage.removeItem(storageKey); }
export function bindExamTimingOwner(owner: string | null) {
  try {
    const previous = sessionStorage.getItem(`${storageKey}:owner`);
    if (previous !== (owner || '') && previous !== null) resetExamTiming();
    sessionStorage.setItem(`${storageKey}:owner`, owner || '');
  } catch { /* Storage unavailable: no cross-tab restoration occurs. */ }
}
export function attachExamTiming(data: any) {
  if (!data || typeof data !== 'object') return data;
  const snapshot = readExamTiming();
  if (!snapshot) return data;
  const enrich = (answer: any) => {
    if (!answer || typeof answer !== 'object' || !('questionId' in answer || 'id' in answer)) return answer;
    const id = String(answer.questionId ?? answer.id);
    const timed = run?.questions[id] || Object.values(run?.questions || {}).find((q) => q.bankId === id);
    const selected = 'selectedOptionIndex' in answer ? answer.selectedOptionIndex : answer.selectedAnswer;
    if (timed && (selected === null || (Number.isInteger(selected) && selected >= 0))) timed.selectedOptionIndex = selected;
    return { ...answer, responseTime: answer.responseTime > 0 ? answer.responseTime : examQuestionSeconds(id) };
  };
  const copy = {
    ...data,
    learningAnswers: Array.isArray(data.learningAnswers) ? data.learningAnswers.map(enrich) : data.learningAnswers,
    answers: Array.isArray(data.answers) ? data.answers.map(enrich) : data.answers,
  };
  persist();
  return copy;
}
export function useExamQuestionTiming(question: any, selected: number | null, enabled: boolean, title: string) {
  const id = String(question?._id ?? question?.questionId ?? question?.id ?? '');
  useEffect(() => {
    if (!enabled || !id) return;
    restore();
    if (!run || run.finished || run.path !== location.pathname) run = { runId: crypto.randomUUID(), title, path: location.pathname, finished: false, questions: {} };
    const previous = run.questions[id];
    run.questions[id] = { id, text: question.text || '', options: question.options || [],
      category: question.category || question.subject, subcategory: question.subcategory,
      imageUrl: question.imageUrl, bankId: String(question.questionId ?? question.id ?? id),
      selectedOptionIndex: selected, seconds: previous?.seconds || 0 };
    active = document.hidden ? null : { id, since: performance.now() };
    const visibility = () => { flush(); active = document.hidden ? null : { id, since: performance.now() }; };
    document.addEventListener('visibilitychange', visibility);
    const pagehide = () => { flush(); active = null; };
    window.addEventListener('pagehide', pagehide);
    const checkpoint = window.setInterval(flush, 5000);
    persist();
    return () => { flush(); active = null; document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pagehide); window.clearInterval(checkpoint); };
  }, [id, enabled, title]);
  useEffect(() => {
    if (run?.questions[id]) { run.questions[id].selectedOptionIndex = selected; persist(); }
  }, [id, selected]);
}
