export function timingAnalysis(seconds: number[]) {
  const measured = seconds.filter((s) => Number.isFinite(s) && s > 0).sort((a, b) => a - b);
  const mid = Math.floor(measured.length / 2);
  const median = measured.length ? (measured.length % 2 ? measured[mid] : (measured[mid - 1] + measured[mid]) / 2) : null;
  return {
    measuredQuestions: measured.length,
    totalSeconds: measured.reduce((sum, value) => sum + value, 0),
    medianSeconds: median,
    // Small samples cannot support a reliable relative-speed judgment.
    slowThresholdSeconds: measured.length >= 5 && median !== null ? Math.max(30, median * 1.8) : null,
  };
}

export function speedAdvice(category: string, subcategory: string) {
  const topic = `${category} ${subcategory}`;
  if (/هندس/.test(topic)) return 'ارسم المعطيات، واكتب القانون قبل التعويض، ثم اختبر تناسب الأطوال أو المساحات بدل الحساب المطوّل.';
  if (/نسب|تناسب|مئوي/.test(topic)) return 'بسّط النسبة أولًا، واستخدم قيمة مرجعية مثل 100، وقارن الخيارات قبل إجراء جميع العمليات.';
  if (/جبر|معادل/.test(topic)) return 'حدّد المجهول، واجمع الحدود المتشابهة، وجرّب التعويض بالخيارات عندما يكون أقصر من حل المعادلة كاملة.';
  if (/استيعاب|مقروء/.test(topic)) return 'اقرأ المطلوب أولًا، وحدّد موضع الدليل في النص، واستبعد الخيار الذي يضيف معلومة غير موجودة.';
  if (/تناظر/.test(topic)) return 'عبّر عن العلاقة بجملة قصيرة، ثم طبّق الجملة نفسها على كل خيار مع الحفاظ على اتجاه العلاقة.';
  if (/إكمال|سياقي/.test(topic)) return 'حدّد قرينة السياق وأداة الربط، واستبعد الخيارات المتناقضة قبل مقارنة الكلمات المتبقية.';
  return 'حدّد المطلوب والمعطيات أولًا، واستبعد الخيارات غير الممكنة، ثم طبّق خطوة واحدة في كل مرة. أعد الحل دون الشرح وسجّل الوقت الجديد.';
}
