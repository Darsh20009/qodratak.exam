function normalized(value: unknown) {
  return String(value || '').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase();
}
export function isReadingComprehension(question: any, typeLabel?: string) {
  if (question?.category && !['verbal', 'general'].includes(question.category)) return false;
  const labels = [question?.subcategory, question?.source?.subcategory, question?.source?.section, typeLabel]
    .map(normalized).join(' ');
  if (/تناظر|اكمال|سياقي|مفردة|مفرده|ارتباط|analogy|completion|contextual/.test(labels)) return false;
  return /استيعاب|مقرو|فهم النص|reading|comprehension/.test(labels);
}
