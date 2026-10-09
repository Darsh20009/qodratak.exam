import crypto from 'node:crypto';
import { questionIdea, observedIdeas, normalizeArabic } from './questionIdeas';

const DAY = 86400000;
export const riyadhDay = (now = new Date()) => new Date(now.getTime() + 3 * 3600000).toISOString().slice(0, 10);
export function validateCourseInput(input: any, now = new Date()) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input.examDate || '') ||
    ![5, 10, 15, 30].includes(input.durationDays) || !Number.isInteger(input.dailyMinutes) ||
    input.dailyMinutes < 30 || input.dailyMinutes > 240) return 'أدخل تاريخ الاختبار وخطة ٥ أو ١٠ أو ١٥ أو ٣٠ يومًا ووقتًا يوميًا من ٣٠ إلى ٢٤٠ دقيقة.';
  const date = new Date(`${input.examDate}T00:00:00Z`);
  const delta = (date.getTime() - new Date(`${riyadhDay(now)}T00:00:00Z`).getTime()) / DAY;
  if (!Number.isFinite(delta) || date.toISOString().slice(0, 10) !== input.examDate || delta < 0 || delta > 366) {
    return 'موعد الاختبار يجب أن يكون اليوم أو خلال السنة القادمة.';
  }
  return null;
}
export function classifyCourseLevel(profile: any, reports: any[]) {
  if (profile?.status !== 'diagnostic_completed') return {
    level: 'unassessed', reason: 'لم تكتمل نقطة البداية بعد؛ سنبدأ بتقييم قصير، ولا نفترض مستواك.',
  };
  const verified = reports.flatMap((r) => r.questions || []).filter((q) => typeof q.isCorrect === 'boolean' &&
    ['verbal', 'quantitative'].includes(q.category)).slice(0, 100);
  const baseline = Number(profile.baseline?.overall || 0);
  const accuracy = verified.length ? verified.filter((q) => q.isCorrect).length / verified.length * 100 : baseline;
  const distinct = new Set(verified.map((q) => q.sourceQuestionId || q.id)).size;
  if (baseline < 60 || (verified.length >= 12 && accuracy < 60)) return {
    level: 'foundation', reason: 'نتيجة التقييم أو المحاولات المصححة تشير إلى الحاجة للأساسيات أولًا؛ نبدأ بالشرح والأمثلة قبل التدريب المكثف.',
  };
  if (baseline >= 80 && verified.length >= 20 && distinct >= 10 && accuracy >= 85) return {
    level: 'advanced', reason: `التقييم والمحاولات المصححة يدعمان التدريب المتقدم (${Math.round(accuracy)}٪ خلال ${verified.length} محاولة). هذه جاهزية تدريبية وليست ضمانًا لدرجة الاختبار.`,
  };
  return { level: 'practice', reason: 'التقييم يسمح بالبدء بالتدريب مع مراجعة الأساسيات عند ظهور فجوات؛ لا نعلن إتقانًا اعتمادًا على التقييم وحده.' };
}
export function buildPreparationCourse(input: any, profile: any, reports: any[], bank: any[], lessons: any[], now = new Date()) {
  const invalid = validateCourseInput(input, now);
  if (invalid) throw new Error(invalid);
  const start = riyadhDay(now);
  const daysUntil = Math.round((Date.parse(input.examDate) - Date.parse(start)) / DAY);
  const duration = Math.max(1, Math.min(input.durationDays, daysUntil || 1));
  const { level, reason: levelReason } = classifyCourseLevel(profile, reports);
  const ideas = observedIdeas(reports);
  const focusIdea = ideas.find((i) => i.wrong > 0 || i.slow > 0);
  const focusCategory = focusIdea?.category || profile?.focus?.category || 'quantitative';
  const focus = focusIdea?.label || profile?.focus?.label || 'الأساسيات الكمية واللفظية';
  const courseId = crypto.randomUUID();
  const validBank = bank.filter((q) => ['quantitative', 'verbal'].includes(q.category) &&
    q.answerStatus === 'approved' && Array.isArray(q.options) && q.options.length >= 2 &&
    Number.isInteger(q.correctOptionIndex) && q.correctOptionIndex >= 0 && q.correctOptionIndex < q.options.length);
  const weights = new Map(ideas.map((i) => [i.key, i.wrong * 2 + i.slow]));
  validBank.sort((a, b) => (weights.get(questionIdea(b).key) || 0) - (weights.get(questionIdea(a).key) || 0) ||
    (level === 'foundation' || level === 'unassessed'
      ? Number(a.difficulty !== 'beginner') - Number(b.difficulty !== 'beginner')
      : Number(b.difficulty === 'advanced') - Number(a.difficulty === 'advanced')) ||
    String(a._id).localeCompare(String(b._id)));
  const used = new Set<string>();
  let plannedQuestions = 0;
  const days = Array.from({ length: duration }, (_, index) => {
    const category = index % 3 === 2 ? (focusCategory === 'verbal' ? 'quantitative' : 'verbal') : focusCategory;
    const categoryLabel = category === 'verbal' ? 'اللفظي' : 'الكمي';
    const date = new Date(Date.parse(start) + index * DAY).toISOString().slice(0, 10);
    const last = index === duration - 1;
    const title = daysUntil === 0 ? 'مراجعة خفيفة قبل الاختبار' : last ? 'مراجعة الأفكار والتوقيت' :
      index < Math.ceil(duration / 3) && ['foundation', 'unassessed'].includes(level) ? 'تأسيس ثم تطبيق' : 'تدريب مركز ثم مراجعة';
    const tasks: any[] = [];
    const task = (kind: string, data: any) => ({
      id: `${courseId}:${index + 1}:${kind}`, kind, status: 'pending', completionSource: 'pending', category,
      ...data,
    });
    if (!index && level === 'unassessed') tasks.push(task('diagnostic', {
      title: 'تحديد نقطة البداية في القدرات', reason: 'التقييم يسبق اختيار مستوى الصعوبة. بعده حدّث الدورة من نتيجتك.',
      href: '/foundation?program=qudrat', minutes: Math.min(25, input.dailyMinutes), questionCount: 0,
    }));
    const categoryLessons = lessons.filter((l) => String(l.subjectId || '').endsWith(category) ||
      normalizeArabic(l.title).includes(category === 'verbal' ? 'لفظي' : 'كمي'));
    const lesson = categoryLessons[index % Math.max(1, categoryLessons.length)];
    const lessonMinutes = Math.max(10, Math.floor(input.dailyMinutes * (level === 'foundation' || level === 'unassessed' ? .45 : .25)));
    if (!(level === 'unassessed' && !index)) tasks.push(task('lesson', {
      title: lesson ? `شرح: ${lesson.title}` : `مراجعة أساسيات ${categoryLabel}`,
      reason: `راجع الشرح والمثال المحلول قبل التطبيق. التركيز الحالي: ${focus}.`,
      href: lesson ? `/foundation/content/${lesson._id}` : `/foundation?program=qudrat&subject=${category}`,
      minutes: daysUntil === 0 ? 10 : lessonMinutes, questionCount: 0,
    }));
    const availableMinutes = input.dailyMinutes - tasks.reduce((sum, t) => sum + t.minutes, 0);
    const practiceMinutes = Math.max(0, availableMinutes - Math.min(10, Math.floor(availableMinutes / 3)));
    const size = daysUntil === 0 ? Math.min(5, Math.floor(practiceMinutes / 2)) : Math.min(40, Math.floor(practiceMinutes / 2));
    const simulation = level !== 'unassessed' && level !== 'foundation' && index > 0 && !last && (index + 1) % 5 === 0;
    const candidates = validBank.filter((q) => (simulation || q.category === category) && !used.has(String(q._id)));
    // Select across observed question ideas, not just the first database IDs.
    const chosen: any[] = [];
    const represented = new Set<string>();
    for (const q of candidates) {
      const idea = questionIdea(q).key;
      if (represented.has(idea)) continue;
      chosen.push(q); represented.add(idea);
      if (chosen.length >= size) break;
    }
    if (size > chosen.length) for (const q of candidates) {
      if (chosen.some((item) => String(item._id) === String(q._id))) continue;
      chosen.push(q); if (chosen.length >= size) break;
    }
    if (size > 0 && chosen.length) {
      for (const q of chosen) used.add(String(q._id));
      plannedQuestions += chosen.length;
      const kind = simulation ? 'simulation' : 'practice';
      tasks.push(task(kind, {
        title: simulation ? 'محاكاة زمنية مختصرة للكمي واللفظي' : `تطبيق ${categoryLabel}: ${chosen.length} أسئلة معتمدة`,
        reason: `${focusIdea ? 'أولوية للأفكار المرصودة في أخطائك وبطئك، مع تنويع الأفكار.' : 'تغطية متنوعة للأفكار المتاحة بمفاتيح حل معتمدة.'} لا نعتمد على الذكاء الاصطناعي في التصحيح.`,
        href: `/preparation-course/practice/${courseId}:${index + 1}:${kind}`,
        minutes: practiceMinutes, questionCount: chosen.length, questionIds: chosen.map((q) => String(q._id)),
        category: simulation ? 'mixed' : category,
      }));
      tasks.push(task('review', {
        title: 'راجع الأخطاء والأسئلة البطيئة', reason: 'افتح نتيجة تدريب هذا اليوم، افهم السبب ثم أعد حل ما أخطأت فيه.',
        href: '/records', minutes: availableMinutes - practiceMinutes, questionCount: 0,
        practiceTaskId: `${courseId}:${index + 1}:${kind}`,
      }));
    }
    return { day: index + 1, date, title, tasks };
  });
  return {
    id: courseId, examDate: input.examDate, durationDays: duration, requestedDurationDays: input.durationDays,
    dailyMinutes: input.dailyMinutes, level, levelReason, focus,
    availableQuestions: validBank.length, plannedQuestions, days,
    coverageNote: `خطة ${duration} أيام حسب وقتك وتغطي ${plannedQuestions} أسئلة مختلفة من ${validBank.length} سؤالًا صالحًا للتصحيح. ${daysUntil < input.durationDays ? 'اختُصرت الخطة لقرب الاختبار. ' : ''}${!validBank.length ? 'لا توجد أسئلة معتمدة متاحة حاليًا؛ الشرح متاح ولن نختلق تدريبًا. ' : ''}الأولوية لفهم الأساسيات والأفكار المتكررة، وليست إنهاء كل أسئلة المنصة أو ضمان الدرجة الكاملة.`,
  };
}
export function publicCourse(course: any) {
  if (!course) return null;
  return { ...course, days: course.days.map((day: any) => ({
    ...day, tasks: day.tasks.map(({ questionIds, practiceTaskId, completedAt, ...task }: any) => task),
  })) };
}
