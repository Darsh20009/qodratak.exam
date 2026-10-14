import { quantitativeVideoQuestion } from '@/lib/questionVideoIdentity';
import { shouldHideImageBackedQuantitativeQuestionText } from '@/lib/questionTextVisibility';
import QuestionVideoExplanation from './QuestionVideoExplanation';

/** Shared by mixed and quantitative-only result screens; no requests until a clip is opened. */
export default function QuantitativeVideoReview({
  questions, quantitativeOnly = false,
}: { questions: unknown; quantitativeOnly?: boolean }) {
  const entries = (Array.isArray(questions) ? questions : []).flatMap((question, index) => {
    const source = quantitativeVideoQuestion(question, quantitativeOnly);
    return source ? [{ ...source, position: index + 1 }] : [];
  });
  if (!entries.length) return null;
  return <details dir="rtl" className="relative z-10 my-5 rounded-xl border border-border bg-card text-card-foreground p-4">
    <summary className="cursor-pointer font-bold text-primary">شرح أسئلة الكمي من الفيديو ({entries.length})</summary>
    <p className="my-3 text-sm text-muted-foreground">
      اختر السؤال لفتح مقطع شرحه من فيديو البنك الأصلي. لا نستخدم ترتيب الاختبار لتحديد الفيديو؛
      إذا لم يتوفر مقطع مرتبط بالسؤال، نوضح ذلك دون فتح شرح آخر.
    </p>
    <div className="space-y-3">
      {entries.map((question) => <details key={`${question.position}-${question.id}`} className="rounded-lg border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold">السؤال {question.position}</summary>
        {question.text && !shouldHideImageBackedQuantitativeQuestionText(question, true) &&
          <p className="my-3 whitespace-pre-wrap text-sm leading-7">{question.text}</p>}
        <div className="mt-3">{question.id ? <QuestionVideoExplanation questionId={question.id} />
          : <p className="text-sm text-muted-foreground">معرّف مصدر السؤال غير محفوظ؛ لا يمكن ربطه بفيديو موثوق.</p>}</div>
      </details>)}
    </div>
  </details>;
}
