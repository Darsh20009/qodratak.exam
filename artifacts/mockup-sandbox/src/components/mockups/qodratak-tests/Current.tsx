import "./_group.css";
import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  BookMarked,
  Brain,
  Calculator,
  CheckCircle,
  Clock,
  Coffee,
  FileText,
  Layers,
  PenTool,
  Play,
  SkipForward,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

type PreviewState = "bank" | "break";

const verbalTopics = [
  { title: "استيعاب المقروء", count: 280, icon: BookMarked, color: "from-blue-500 to-teal-500" },
  { title: "إكمال الجمل", count: 160, icon: PenTool, color: "from-green-600 to-amber-600" },
  { title: "التناظر اللفظي", count: 140, icon: FileText, color: "from-emerald-500 to-teal-600" },
  { title: "الخطأ السياقي", count: 120, icon: AlertCircle, color: "from-orange-500 to-red-600" },
  { title: "المفردة الشاذة", count: 95, icon: Sparkles, color: "from-amber-500 to-yellow-600" },
];

const sampleTests = [
  { number: 1, completed: true, score: 72, label: "مكتمل" },
  { number: 2, completed: false, score: undefined, label: "ابدأ الاختبار" },
  { number: 3, completed: false, score: undefined, label: "ابدأ الاختبار" },
];

function CurrentTestCard({
  number,
  completed,
  score,
  label,
}: (typeof sampleTests)[number]) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-teal-500" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-md">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">اختبار {number}</h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> 50 سؤال
                <Layers className="h-3.5 w-3.5 text-blue-500" /> 5 أقسام
              </p>
            </div>
          </div>
          {completed && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle className="mr-1 inline h-3.5 w-3.5" /> مكتمل
            </span>
          )}
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>أقسام الاختبار (50 سؤال)</span>
            <span>{completed ? "مكتمل 5/5" : label}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`h-3 rounded-full ${completed ? "bg-gradient-to-r from-blue-500 to-teal-500" : "bg-gray-200 dark:bg-gray-700"}`}
              />
            ))}
          </div>
        </div>

        {completed && (
          <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">النتيجة الحالية</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score}%</p>
            </div>
            <Trophy className="h-7 w-7 text-amber-500" />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 50 دقيقة</span>
          <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> نظام الأقسام الجديد</span>
        </div>
        <button className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 px-4 py-3 font-medium text-white shadow-lg transition hover:scale-[1.02]">
          <Play className="mr-2 h-4 w-4" /> {completed ? "إعادة المحاولة" : "بدء الاختبار"}
        </button>
      </div>
    </article>
  );
}

function CurrentBank() {
  return (
    <>
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl px-5 py-9 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">بنك الأسئلة</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            مجموعة شاملة من الأسئلة الأصلية مقسمة إلى اختبارات متدرجة لضمان التحضير الأمثل
          </p>
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-5 md:grid-cols-4">
            {[
              ["1,240", "إجمالي الأسئلة", "text-blue-600"],
              ["42", "عدد الاختبارات", "text-green-700"],
              ["12", "مكتمل", "text-green-600"],
              ["72%", "متوسط النتائج", "text-amber-600"],
            ].map(([value, label, color]) => (
              <div key={label}>
                <div className={`mb-1 text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-7 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <div className="mb-1 flex items-center justify-center gap-2 font-medium">
              <Users className="h-4 w-4" /> حساب مجاني
            </div>
            اختبار واحد متبقٍ اليوم
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-7 flex justify-center">
          <div className="grid grid-cols-3 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white">القسم اللفظي</button>
            <button className="rounded-lg px-5 py-3 font-medium text-gray-600 dark:text-gray-300">القسم الكمي</button>
            <button className="rounded-lg px-5 py-3 font-medium text-gray-600 dark:text-gray-300">القسم القياسي</button>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {verbalTopics.map(({ title, count, icon: Icon, color }) => (
            <div key={title} className="rounded-xl border-2 border-gray-200 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{count} سؤال</p>
            </div>
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
          <span>تقدم الاختبارات اللفظية</span><span>28%</span>
        </div>
        <div className="mb-7 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-blue-500 to-teal-500" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sampleTests.map((test) => <CurrentTestCard key={test.number} {...test} />)}
        </div>
      </main>
    </>
  );
}

function CurrentBreak() {
  const breakTimeLeft = 23;
  const currentSection = 1;
  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-gradient-to-br from-blue-50 to-teal-500 p-4 dark:from-gray-900 dark:to-gray-800">
      <article className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
        <header className="px-6 pb-5 pt-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-blue-500">
            <Coffee className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">استراحة بين الأقسام</h1>
          <p className="text-gray-600 dark:text-gray-400">
            أنهيت القسم {currentSection}، استعد للقسم التالي
          </p>
        </header>
        <div className="space-y-6 px-6 pb-7 text-center">
          <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-700">
            <div className="mb-2 text-4xl font-bold text-blue-600 dark:text-blue-400">{formatTime(breakTimeLeft)}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">الوقت المتبقي للاستراحة</p>
          </div>
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">خذ نفسًا عميقًا واستعد للقسم القادم</p>
            <button className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 font-medium text-white shadow-lg transition hover:scale-[1.02]">
              <SkipForward className="mr-2 h-5 w-5" /> تخطي الاستراحة والمتابعة
            </button>
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                أو انتظر {formatTime(breakTimeLeft)} للمتابعة تلقائياً
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                <div className="h-full w-[23%] rounded-full bg-gradient-to-r from-blue-500 to-teal-500" />
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export function Current() {
  const [previewState, setPreviewState] = useState<PreviewState>("bank");

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans text-gray-900 dark:bg-gray-950 dark:text-white">
      <nav className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">معاينة الوضع الحالي</span>
        <div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
          <button
            className={`rounded-md px-3 py-1.5 text-sm ${previewState === "bank" ? "bg-white font-semibold shadow-sm dark:bg-gray-700" : "text-gray-500"}`}
            onClick={() => setPreviewState("bank")}
          >
            بنك الاختبارات
          </button>
          <button
            className={`rounded-md px-3 py-1.5 text-sm ${previewState === "break" ? "bg-white font-semibold shadow-sm dark:bg-gray-700" : "text-gray-500"}`}
            onClick={() => setPreviewState("break")}
          >
            الاستراحة
          </button>
        </div>
      </nav>
      {previewState === "bank" ? <CurrentBank /> : <CurrentBreak />}
    </div>
  );
}