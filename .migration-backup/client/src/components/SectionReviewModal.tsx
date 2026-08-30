import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, MinusCircle, BookmarkCheck, X } from "lucide-react";
import ImageZoom from "@/components/ImageZoom";

interface QuestionReview {
  index: number;
  text: string;
  studentAnswer: string | null;
  correctAnswer: string;
  options: string[];
  isCorrect: boolean;
  isBookmarked: boolean;
  category?: string;
  imageUrl?: string;
}

interface SectionReviewModalProps {
  sectionIndex: number;
  questions: QuestionReview[];
  onClose: () => void;
  breakDuration?: number;
}

type FilterType = 'all' | 'wrong' | 'bookmarked' | 'correct';

export function SectionReviewModal({ sectionIndex, questions, onClose, breakDuration = 30 }: SectionReviewModalProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const correct = questions.filter(q => q.isCorrect).length;
  const wrong = questions.filter(q => !q.isCorrect && q.studentAnswer !== null).length;
  const skipped = questions.filter(q => q.studentAnswer === null).length;
  const bookmarked = questions.filter(q => q.isBookmarked).length;

  const filtered = questions.filter(q => {
    if (filter === 'wrong') return !q.isCorrect && q.studentAnswer !== null;
    if (filter === 'bookmarked') return q.isBookmarked;
    if (filter === 'correct') return q.isCorrect;
    return true;
  });

  const optionLabels = ['أ', 'ب', 'ج', 'د'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-3 sm:px-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
              مراجعة القسم {sectionIndex + 1}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">راجع إجاباتك قبل الانتقال للقسم التالي</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="btn-close-review" className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2 px-4 sm:px-6 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 rounded-xl px-2.5 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">{correct}</span>
            <span className="text-xs text-green-600/70">صحيح</span>
          </div>
          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 rounded-xl px-2.5 py-1.5">
            <XCircle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-sm font-bold text-red-700 dark:text-red-400">{wrong}</span>
            <span className="text-xs text-red-600/70">خطأ</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-2.5 py-1.5">
            <MinusCircle className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{skipped}</span>
            <span className="text-xs text-gray-400">متخطي</span>
          </div>
          {bookmarked > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-2.5 py-1.5">
              <BookmarkCheck className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{bookmarked}</span>
              <span className="text-xs text-amber-600/70">معلّم</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-6 py-2 border-b border-gray-100 dark:border-gray-800">
          {([
            { key: 'all', label: 'الكل' },
            { key: 'wrong', label: 'الخاطئة' },
            { key: 'correct', label: 'الصحيحة' },
            { key: 'bookmarked', label: 'المعلّمة' },
          ] as { key: FilterType; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              data-testid={`btn-filter-${f.key}`}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                filter === f.key
                  ? 'bg-teal-100 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Questions list */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-3 space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">لا توجد أسئلة في هذا التصفية</div>
          )}
          {filtered.map((q) => (
            <div
              key={q.index}
              className={`rounded-xl border p-3 cursor-pointer transition-all ${
                q.isCorrect
                  ? 'border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-900/10'
                  : q.studentAnswer === null
                  ? 'border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30'
                  : 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-900/10'
              }`}
              onClick={() => setExpandedQ(expandedQ === q.index ? null : q.index)}
              data-testid={`question-review-${q.index}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    q.isCorrect
                      ? 'bg-green-500 text-white'
                      : q.studentAnswer === null
                      ? 'bg-gray-300 text-gray-600'
                      : 'bg-red-500 text-white'
                  }`}>
                    {q.index + 1}
                  </span>
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{q.text}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {q.isBookmarked && <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" />}
                  {q.isCorrect
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : q.studentAnswer === null
                    ? <MinusCircle className="h-4 w-4 text-gray-400" />
                    : <XCircle className="h-4 w-4 text-red-500" />
                  }
                </div>
              </div>

              {expandedQ === q.index && (
                <div className="mt-3 space-y-1.5 border-t border-gray-200 dark:border-gray-700 pt-3">
                  {q.imageUrl && (
                    <div className="mb-3 flex justify-center">
                      <ImageZoom src={q.imageUrl} imgClassName="max-w-full rounded-lg border border-gray-200 dark:border-gray-600 max-h-48 object-contain" />
                    </div>
                  )}
                  {q.options.map((opt, i) => {
                    const correctIdx = q.options.indexOf(q.correctAnswer);
                    const studentIdx = q.studentAnswer !== null ? q.options.indexOf(q.studentAnswer) : -1;
                    const isCorrect = i === correctIdx;
                    const isStudentAnswer = q.studentAnswer !== null && i === studentIdx;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-2 ${
                          isCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium'
                            : isStudentAnswer && !isCorrect
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCorrect ? 'bg-green-500 text-white' : isStudentAnswer ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>{optionLabels[i]}</span>
                        <span className="leading-snug">{opt}</span>
                        {isCorrect && <Badge className="mr-auto text-[10px] bg-green-500/20 text-green-700 border-0 py-0 shrink-0">صحيح</Badge>}
                        {isStudentAnswer && !isCorrect && <Badge className="mr-auto text-[10px] bg-red-500/20 text-red-700 border-0 py-0 shrink-0">إجابتك</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-gray-500">
            {breakDuration > 0 ? `استراحة ${breakDuration} ثانية بعد الإغلاق` : 'انقر للانتقال للقسم التالي'}
          </p>
          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-teal-100 hover:bg-teal-100 text-white rounded-xl"
            data-testid="btn-proceed-next-section"
          >
            متابعة →
          </Button>
        </div>
      </div>
    </div>
  );
}
