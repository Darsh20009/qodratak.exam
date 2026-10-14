export type GuideChapter =
  | "dashboard" | "course" | "today" | "foundation" | "book" | "computerized" | "mock"
  | "instructions" | "runner" | "passage" | "custom" | "results" | "account" | "support"
  | "flashcards" | "analysis" | "mistakes" | "security" | "preexam" | "tutor" | "rooms" | "notifications";

export const GUIDE_CHAPTER_LABELS: Record<GuideChapter, { title: string; caption: string }> = {
  dashboard: { title: "لوحتك في دقيقة", caption: "أين تجد خطوتك التالية وتقدمك." },
  course: { title: "كيف تمشي في دورتك", caption: "مراحل الدورة وترتيب مهامها وطريقة إنهائها." },
  today: { title: "مهمة اليوم خطوة بخطوة", caption: "ابدأ مهمتك وأنهها ثم انتقل لما بعدها." },
  foundation: { title: "صفحة التأسيس", caption: "اختر المادة والدرس وتابع ما أنجزته." },
  book: { title: "القراءة داخل الكتاب", caption: "تنقّل بين الدروس والأمثلة واختبر فهمك." },
  computerized: { title: "التدريب المحوسب", caption: "اختر البنك أو الاختبار المناسب لمستواك." },
  mock: { title: "الاختبارات المحاكية", caption: "اختر نموذجًا يشبه يوم الاختبار الحقيقي." },
  instructions: { title: "قبل أن تبدأ الاختبار", caption: "اقرأ التعليمات والوقت ثم ابدأ بتركيز." },
  runner: { title: "شاشة الأسئلة", caption: "التنقل بين الأسئلة والتعليم والمراجعة." },
  passage: { title: "أسئلة القطع", caption: "كيف تقرأ القطعة وتجيب عن أسئلتها." },
  custom: { title: "اختبارك المخصص", caption: "اختر الأقسام والعدد والوقت بنفسك." },
  results: { title: "اقرأ نتيجتك", caption: "افهم درجتك وأخطاءك وما تراجعه بعدها." },
  account: { title: "حسابك واشتراكك", caption: "بياناتك والاشتراك وربط ولي الأمر." },
  support: { title: "الدعم والمساعدة", caption: "أين تجد الإجابات وكيف تتواصل معنا." },
  flashcards: { title: "بطاقات المراجعة", caption: "اقلب البطاقة وقيّم حفظك وراجع ما نسيته." },
  analysis: { title: "تحليل أدائك", caption: "اقرأ مؤشرات مهاراتك ونقاط ضعفك عبر المحاولات." },
  mistakes: { title: "تحدي الأخطاء", caption: "أعد حل الأسئلة التي أخطأت فيها حتى تتقنها." },
  security: { title: "أمان حسابك", caption: "كلمة المرور وأسئلة الأمان وحماية الدخول." },
  preexam: { title: "قبل يوم الاختبار", caption: "خطة الأيام الأخيرة وإدارة الوقت داخل القاعة." },
  tutor: { title: "المعلم الذكي", caption: "اسأل عن سؤال أو مفهوم واحصل على شرح خطوة بخطوة." },
  rooms: { title: "غرف المذاكرة", caption: "أنشئ غرفة أو انضم بالرمز وتدرّب مع زملائك." },
  notifications: { title: "التنبيهات", caption: "أين تصلك التذكيرات وكيف تضبطها كما تريد." },
};

const startsAt = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");

/** Maps a student route to its guide chapter. Returns null where no contextual film belongs (dashboard already has the full guide). */
export function chapterForPath(location: string): GuideChapter | null {
  const path = (location.split(/[?#]/)[0].replace(/\/+$/, "")) || "/";
  if (path === "/") return null;
  if (startsAt(path, "/preparation-course/practice") || startsAt(path, "/learning/today")) return "today";
  if (startsAt(path, "/preparation-course")) return "course";
  if (startsAt(path, "/student/foundation-book") || startsAt(path, "/foundation/content")) return "book";
  if (startsAt(path, "/foundation/coverage-test") || startsAt(path, "/foundation/computer-bank-test")) return "instructions";
  if (startsAt(path, "/foundation") || startsAt(path, "/student-program")) return "foundation";
  if (startsAt(path, "/flashcards")) return "flashcards";
  if (["/performance-report", "/error-analysis", "/analytics", "/skill-progress"].some((p) => startsAt(path, p))) return "analysis";
  if (["/mistake-challenge", "/enhanced-mistake-challenge"].some((p) => startsAt(path, p))) return "mistakes";
  if (startsAt(path, "/security-settings")) return "security";
  if (["/pre-exam-day", "/time-management"].some((p) => startsAt(path, p))) return "preexam";
  if (["/ai-tutor", "/ai-hub"].some((p) => startsAt(path, p))) return "tutor";
  if (startsAt(path, "/study-rooms")) return "rooms";
  if (["/notifications", "/notification-settings"].some((p) => startsAt(path, p))) return "notifications";
  if (startsAt(path, "/custom-exam")) return "custom";
  if (startsAt(path, "/verbal-lesson-quiz")) return "passage";
  if (/^\/question-bank\/.+/.test(path) || ["/standard-test", "/verbal-test-runner", "/quantitative-test-runner", "/advanced-verbal-test", "/advanced-quantitative-test", "/free-verbal-test", "/free-quantitative-test", "/folder-test", "/test-me", "/adaptive-test"].includes(path)) return "runner";
  if (["/mock-exams", "/qiyas", "/qiyas-hub", "/qiyas-exam", "/seasonal-exams", "/paper-models", "/paper-exam"].some((p) => startsAt(path, p)) || startsAt(path, "/abilities") || startsAt(path, "/abilities-test")) return "mock";
  if (["/book-exam", "/scheduled-exam", "/pre-exam-day", "/time-management"].some((p) => startsAt(path, p))) return "instructions";
  if (["/records", "/test-results", "/exam-review", "/analytics", "/performance-report", "/paper-exam-results", "/error-analysis", "/skill-progress", "/mistake-challenge", "/enhanced-mistake-challenge", "/ai-tutor", "/ai-hub"].some((p) => startsAt(path, p))) return "results";
  if (["/account", "/profile", "/security-settings", "/notification-settings", "/notifications", "/subscription", "/enhanced-subscription", "/wallet"].some((p) => startsAt(path, p))) return "account";
  if (["/support", "/faq"].some((p) => startsAt(path, p))) return "support";
  if (["/computerized", "/question-bank", "/verbal-tests", "/quantitative-tests", "/library", "/books", "/folders", "/flashcards", "/challenges", "/strategy-library", "/study-rooms"].some((p) => startsAt(path, p))) return "computerized";
  return "dashboard";
}

export const pageGuideKey = (uid: string, chapter: GuideChapter) => `qodratak.pageGuide.hidden.v1.${uid}.${chapter}`;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function readPageGuideHidden(store: Store | null | undefined, uid: string | null, chapter: GuideChapter) {
  if (!uid || !store) return false;
  try { return store.getItem(pageGuideKey(uid, chapter)) === "1"; } catch { return false; }
}
export function writePageGuideHidden(store: Store | null | undefined, uid: string | null, chapter: GuideChapter, hidden: boolean) {
  if (!uid || !store) return;
  try { if (hidden) store.setItem(pageGuideKey(uid, chapter), "1"); else store.removeItem(pageGuideKey(uid, chapter)); } catch { /* session-only */ }
}

/** Pure caller rule: film only for a signed-in student, a mapped chapter, and no running exam. */
export function shouldShowPageGuide(opts: { chapter: GuideChapter | null; role?: string | null; studentId?: unknown; examActive?: boolean }) {
  const hasId = opts.studentId !== undefined && opts.studentId !== null && opts.studentId !== "";
  return Boolean(opts.chapter && hasId && opts.role === "student" && !opts.examActive);
}

