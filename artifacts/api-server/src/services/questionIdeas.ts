// Observed question families, NOT approved concept/mastery taxonomy.
export function normalizeArabic(value: unknown) {
  return String(value || '').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase();
}
export function isReadingQuestion(q: any): boolean {
  if (q.category && !['verbal', 'general'].includes(q.category)) return false;
  const labels = [q.subcategory, q.source?.subcategory, q.source?.section, q.questionTypeLabel]
    .map(normalizeArabic).join(' ');
  if (/تناظر|اكمال|سياقي|مفردة|مفرده|ارتباط|analogy|completion|contextual/.test(labels)) return false;
  return /استيعاب|مقرو|فهم النص|reading|comprehension/.test(labels);
}
export function questionIdea(q: any) {
  const text = normalizeArabic(q.text);
  const category = q.category === 'quantitative' ? 'quantitative' : 'verbal';
  if (isReadingQuestion(q)) {
    if (/عنوان/.test(text)) return { key: 'reading-title', label: 'اختيار أنسب عنوان للنص', category };
    if (/يستنتج|استنتج|نستنتج|يفهم من|يمكن فهم/.test(text)) return { key: 'reading-inference', label: 'الاستنتاج من النص', category };
    if (/معني|المقصود|يقصد/.test(text)) return { key: 'reading-meaning', label: 'معنى كلمة في سياق النص', category };
    if (/الفكرة|الفكره|الرئيسية|الرئيسيه/.test(text)) return { key: 'reading-main-idea', label: 'الفكرة الرئيسية للنص', category };
    return { key: 'reading-details', label: 'فهم النص وتفاصيله', category };
  }
  const sub = normalizeArabic(q.subcategory || q.source?.subcategory);
  if (/تناظر|analogy/.test(sub)) return { key: 'verbal-analogy', label: 'علاقة التناظر اللفظي', category };
  if (/اكمال|completion/.test(sub)) return { key: 'verbal-completion', label: 'إكمال الجمل', category };
  if (/سياقي|contextual/.test(sub)) return { key: 'verbal-context', label: 'الخطأ السياقي', category };
  // Printed images may have no readable stem. Never infer a finer idea from OCR noise.
  return { key: `${category}:${sub || 'general'}`, label: q.subcategory || (category === 'quantitative' ? 'الكمي — فكرة غير مصنفة' : 'اللفظي — فكرة غير مصنفة'), category };
}
export function observedIdeas(reports: any[]) {
  const groups = new Map<string, any>();
  for (const report of reports) for (const q of report.questions || []) {
    if (typeof q.isCorrect !== 'boolean' || !['verbal', 'quantitative'].includes(q.category)) continue;
    const idea = questionIdea(q);
    const group = groups.get(idea.key) || { ...idea, attempts: 0, wrong: 0, slow: 0, distinct: new Set<string>() };
    group.attempts++; group.wrong += Number(q.isCorrect === false); group.slow += Number(q.isSlow === true);
    group.distinct.add(String(q.sourceQuestionId || q.id));
    groups.set(idea.key, group);
  }
  return [...groups.values()].map(({ distinct, ...g }) => ({
    ...g,
    confidence: distinct.size >= 8 && g.attempts >= 12 ? 'repeated' : distinct.size >= 3 ? 'developing' : 'limited',
    reason: `رُصدت ${g.wrong} إجابة خاطئة و${g.slow} إجابة بطيئة خلال ${g.attempts} محاولة على ${distinct.size} أسئلة مختلفة. تصنيف إرشادي وليس حكمًا بإتقان الفكرة.`,
  })).sort((a, b) => (b.wrong * 2 + b.slow) - (a.wrong * 2 + a.slow));
}

