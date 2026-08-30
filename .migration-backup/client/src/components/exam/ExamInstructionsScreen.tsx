import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface PastAttempt {
  id: number | string;
  percentage: number;
  verbalPercentage?: number;
  quantitativePercentage?: number;
  testType: string;
  completedAt: string;
  examName?: string;
}

interface ExamSection {
  sectionNumber: number;
  name: string;
  category: string;
  questionCount: number;
  timeLimit: number;
}

interface Exam {
  id: number;
  name: string;
  totalSections: number;
  totalQuestions: number;
  totalTime: number;
  sections: ExamSection[];
}

interface Props {
  exam: Exam;
  userId?: number | string;
  onStart: () => void;
  onBack: () => void;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hr = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const sec = String(d.getSeconds()).padStart(2, "0");
    return `${yr}-${mo}-${day} ${hr}:${min}:${sec}`;
  } catch {
    return dateStr;
  }
}

function getExamTypeLabel(testType: string, examName?: string) {
  if (examName) return examName;
  if (testType === "qiyas") return "قسم واحد";
  if (testType === "verbal") return "لفظي";
  if (testType === "quantitative") return "كمي";
  return testType;
}

function calcBestAttempt(attempts: PastAttempt[]) {
  if (!attempts || attempts.length === 0) return null;
  const scores = attempts.map((a) => a.percentage || 0);
  const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  const best = Math.max(...scores);
  const predicted = Math.min(Math.round(best * 1.05), 100);
  return { avg, best, predicted };
}

export default function ExamInstructionsScreen({ exam, userId, onStart, onBack }: Props) {
  const { data: pastAttempts = [] } = useQuery<PastAttempt[]>({
    queryKey: ["/api/test-results/user", userId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId,
  });

  const qiyasAttempts = pastAttempts.filter(
    (a) => a.testType === "qiyas" || a.testType === "verbal" || a.testType === "quantitative"
  ).slice(0, 10);

  const stats = calcBestAttempt(qiyasAttempts);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8 px-4 font-arabic"
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Instructions Card — main column */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6 w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">تعليمات الاختبار</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-800 font-semibold text-sm leading-relaxed">
              <li>
                الغش أو الشروع فيه أو محاولة ذلك، أو الإخلال بسير الاختبارات، يعرضك لاتخاذ
                الإجراء النظامي.
              </li>
              <li>
                يمنع اصطحاب الهاتف المحمول أثناء الاختبار لأي غرض، وإخراجه أثناء الاختبار
                يعرضك لاتخاذ الإجراء النظامي.
              </li>
              <li>
                على الطالب إنهاء القسم الواحد خلال الوقت المحدد (٢٥) دقيقة ولن يستطيع
                الإجابة على أي أسئلة بعد انتهاء الزمن المحدد.
              </li>
              <li>
                نظام الاختبارات يحسب للطالب، الدرجة الأعلى في محاولاته.
              </li>
              <li>
                لا يسمح باستخدام جهاز الحاسب الآلي للغش بأي شكل من الأشكال في الاختبار.
              </li>
              <li>
                جميع قواعد الاختبارات التقليدية تنطبق على الاختبارات الإلكترونية.
              </li>
            </ol>
            <p className="mt-5 text-gray-600 text-sm">مع خالص دعواتنا بالتوفيق…</p>
            <button
              onClick={onStart}
              className="mt-6 bg-[#02a89f] hover:bg-[#028a82] text-white font-semibold py-2 px-8 rounded transition-colors text-sm"
            >
              أوافق
            </button>
          </div>

          {/* Exam Details Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 mt-4">
            <h3 className="text-base font-bold text-gray-800 mb-3">تفاصيل الاختبار</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 border border-gray-100 rounded p-3">
                <div className="text-2xl font-bold text-gray-900">{exam.totalSections}</div>
                <div className="text-xs text-gray-500 mt-1">أقسام</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded p-3">
                <div className="text-2xl font-bold text-gray-900">{exam.totalQuestions}</div>
                <div className="text-xs text-gray-500 mt-1">سؤال</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded p-3">
                <div className="text-2xl font-bold text-gray-900">{exam.totalTime}</div>
                <div className="text-xs text-gray-500 mt-1">دقيقة</div>
              </div>
            </div>

            {/* Sections Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-3 py-2 text-right font-semibold text-gray-700">القسم</th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">النوع</th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">الأسئلة</th>
                    <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.sections.map((sec, i) => (
                    <tr key={sec.sectionNumber} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="border border-gray-200 px-3 py-2 text-gray-800">{sec.name}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-gray-600">
                        {sec.category === "verbal" ? "لفظي" : sec.category === "quantitative" ? "كمي" : "مختلط"}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-gray-800 font-medium">{sec.questionCount}</td>
                      <td className="border border-gray-200 px-3 py-2 text-center text-gray-600">{sec.timeLimit} د</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={onBack}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm underline"
          >
            ← العودة لاختيار اختبار آخر
          </button>
        </div>

        {/* Past Attempts Sidebar */}
        <div className="lg:col-span-1">
          {/* Predicted Score */}
          {stats && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3">المتوقع لو حليت بتركيز</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#02a89f]">{stats.predicted}%</div>
                <div className="text-xs text-gray-500 mt-1">درجة متوقعة</div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-bold text-gray-800">{stats.avg}%</div>
                  <div className="text-gray-500">متوسط محاولاتك</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-bold text-gray-800">{stats.best}%</div>
                  <div className="text-gray-500">أفضل محاولة</div>
                </div>
              </div>
            </div>
          )}

          {/* Past Attempts Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">محاولاتك الماضية</h3>
            {qiyasAttempts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">لا توجد محاولات سابقة</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-700">الكلية</th>
                      <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-700">الكمي</th>
                      <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-700">اللفظي</th>
                      <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-700 hidden sm:table-cell">النوع</th>
                      <th className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-700">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qiyasAttempts.map((a, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-gray-900">
                          {Math.round(a.percentage || 0)}%
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-700">
                          {a.quantitativePercentage !== undefined ? `${Math.round(a.quantitativePercentage)}%` : "—"}
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-700">
                          {a.verbalPercentage !== undefined ? `${Math.round(a.verbalPercentage)}%` : "—"}
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-600 hidden sm:table-cell">
                          {getExamTypeLabel(a.testType, a.examName)}
                        </td>
                        <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-500 text-[10px]">
                          {formatDate(a.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
