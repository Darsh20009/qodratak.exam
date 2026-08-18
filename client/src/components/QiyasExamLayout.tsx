import { useState, useEffect } from "react";
import formulasImg from "@assets/Screenshot_2026-03-08_071500_1772943315708.png";
import { X, BookmarkCheck, Bookmark, Flag, AlertTriangle, CheckCircle2, LayoutGrid, ChevronRight, ChevronLeft } from "lucide-react";
import ImageZoom from "@/components/ImageZoom";

const OPTION_LABELS = ['أ', 'ب', 'ج', 'د'];

export interface QuestionStatus {
  answered: boolean;
  bookmarked: boolean;
}

export interface QiyasExamLayoutProps {
  examTitle?: string;

  questionNumber: number;
  totalQuestions: number;
  sectionLabel?: string;
  sectionNumber?: number;
  totalSections?: number;

  timeLeft: number;
  isTimeUrgent?: boolean;

  questionText: string;
  questionTypeLabel?: string;
  questionImageUrl?: string;
  options: string[];
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  questionsStatus?: QuestionStatus[];
  currentQuestionIndex?: number;
  onJumpToQuestion?: (index: number) => void;

  isBookmarked?: boolean;
  onToggleBookmark?: () => void;

  onPrev?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  onEndSection?: () => void;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  isLastQuestion?: boolean;

  topRightSlot?: React.ReactNode;
  answeredCount?: number;

  userName?: string;
  userId?: string;
  userAvatar?: string;

  sectionQuestionsCount?: number;
  onShowFormulas?: () => void;

  questionId?: number | string;
}

function formatTime(s: number): string {
  const m = Math.floor(Math.abs(s) / 60);
  const sec = Math.abs(s) % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function QiyasExamLayout({
  examTitle,
  questionNumber,
  totalQuestions,
  sectionLabel,
  sectionNumber = 1,
  totalSections = 1,
  timeLeft,
  isTimeUrgent,
  questionText,
  questionTypeLabel,
  questionImageUrl,
  options,
  selectedAnswer,
  onSelectAnswer,
  questionsStatus,
  currentQuestionIndex = 0,
  onJumpToQuestion,
  isBookmarked,
  onToggleBookmark,
  onPrev,
  onNext,
  onFinish,
  onEndSection,
  canGoPrev = true,
  canGoNext = true,
  isLastQuestion = false,
  topRightSlot,
  answeredCount,
  userName,
  userId,
  userAvatar,
  sectionQuestionsCount,
  onShowFormulas,
  questionId,
}: QiyasExamLayoutProps) {
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [showExamInstructions, setShowExamInstructions] = useState(false);
  const [showSectionInstructions, setShowSectionInstructions] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const handleSubmitReport = async () => {
    if (!reportType) return;
    setReportLoading(true);
    try {
      await fetch('/api/questions/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          questionId: questionId ?? 0,
          questionText: questionText.slice(0, 300),
          reportType,
          description: reportDesc,
        }),
      });
      setReportSent(true);
    } catch (_) {}
    setReportLoading(false);
  };

  const handleCloseReport = () => {
    setShowReportDialog(false);
    setReportType('');
    setReportDesc('');
    setReportSent(false);
  };

  useEffect(() => {
    setVisitedQuestions(prev => {
      const next = new Set(Array.from(prev));
      next.add(currentQuestionIndex);
      return next;
    });
  }, [currentQuestionIndex]);

  const fontClass =
    fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-xl' : 'text-base';

  const answeredTotal = answeredCount ?? questionsStatus?.filter(q => q.answered).length ?? 0;
  const sectionTotal = sectionQuestionsCount ?? questionsStatus?.length ?? totalQuestions;
  const visitedCount = visitedQuestions.size;
  const notVisitedCount = sectionTotal - visitedCount;
  const remainingInSection = sectionTotal - answeredTotal;

  const gridQuestions = questionsStatus ?? Array.from({ length: sectionTotal }, () => ({ answered: false, bookmarked: false }));

  const QuestionGrid = () => (
    <div className="grid grid-cols-6 gap-1">
      {gridQuestions.map((status, idx) => (
        <button
          key={idx}
          onClick={() => { onJumpToQuestion?.(idx); setShowMobilePanel(false); }}
          title={`سؤال ${idx + 1}`}
          className={`w-full aspect-square rounded text-xs font-bold transition-all hover:scale-105 active:scale-95 ${
            idx === currentQuestionIndex && (status as any).bookmarked
              ? 'bg-blue-600 text-white ring-2 ring-yellow-400 shadow-sm'
              : idx === currentQuestionIndex
              ? 'bg-blue-600 text-white shadow-sm'
              : (status as any).bookmarked && status.answered
              ? 'bg-green-500 text-white ring-2 ring-yellow-400'
              : (status as any).bookmarked
              ? 'bg-yellow-400 text-white hover:bg-yellow-500'
              : status.answered
              ? 'bg-green-500 text-white hover:bg-green-600'
              : visitedQuestions.has(idx)
              ? 'bg-orange-400 text-white hover:bg-orange-500'
              : 'bg-red-200 text-red-800 hover:bg-red-300'
          }`}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row" dir="rtl">

      {/* ════════════════════════════════════════
          MOBILE TOP BAR (hidden on md+)
      ════════════════════════════════════════ */}
      <div className="md:hidden bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between shadow-sm sticky top-0 z-30">
        {/* Logo */}
        <img src="/logo-512x512.png" alt="قدراتك" className="w-7 h-7 rounded-lg object-cover" />

        {/* Question number + section */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-700">
            سؤال {questionNumber} / {totalQuestions}
          </span>
          {sectionLabel && (
            <span className="text-[10px] text-gray-400">{sectionLabel}</span>
          )}
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${isTimeUrgent ? 'bg-red-50' : 'bg-blue-50'}`}>
          <span className={`text-base font-mono font-bold ${isTimeUrgent ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
            {formatTime(timeLeft)}
          </span>
          {topRightSlot && <div className="mr-1">{topRightSlot}</div>}
        </div>
      </div>

      {/* ════════════════════════════════════════
          MAIN CONTENT AREA
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">

        {/* Desktop Top Bar (hidden on mobile) */}
        <div className="hidden md:flex bg-white border-b border-gray-200 px-5 py-3 items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 mr-3 pr-3 border-r border-gray-200 order-last">
            <span className="hidden sm:block text-xs font-bold text-gray-500">قدراتك</span>
            <img src="/logo-512x512.png" alt="قدراتك" className="w-8 h-8 rounded-xl object-cover" />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize('lg')}
              className={`w-9 h-9 rounded font-bold text-base border transition-colors ${
                fontSize === 'lg'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`w-9 h-9 rounded font-bold text-sm border transition-colors ${
                fontSize === 'base'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('sm')}
              className={`w-9 h-9 rounded font-bold text-xs border transition-colors ${
                fontSize === 'sm'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              'A
            </button>
          </div>

          <div className="flex items-center gap-3">
            {sectionLabel && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{sectionLabel}</span>
            )}
            <span className="text-sm font-semibold text-gray-700">
              رقم السؤال {questionNumber}
            </span>
            {topRightSlot}
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 bg-white md:m-3 md:rounded-lg md:border md:border-gray-200 flex flex-col overflow-hidden md:shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">

            {/* Mobile font controls */}
            <div className="md:hidden flex items-center gap-1 mb-3">
              {(['sm', 'base', 'lg'] as const).map((size, i) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`h-7 px-2.5 rounded border text-xs font-bold transition-colors ${
                    fontSize === size
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {i === 0 ? 'ص' : i === 1 ? 'م' : 'ك'}
                </button>
              ))}
              <span className="text-xs text-gray-400 mr-1">حجم الخط</span>
            </div>

            {questionTypeLabel && (
              <div className="mb-3">
                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                  {questionTypeLabel}
                </span>
              </div>
            )}

            {questionImageUrl && (
              <div className="mb-4 flex justify-center">
                <ImageZoom
                  src={questionImageUrl}
                  imgClassName="rounded-xl object-contain border border-gray-200 shadow-sm max-w-full"
                  imgStyle={{ maxHeight: '280px', maxWidth: '100%', width: 'auto' }}
                />
              </div>
            )}

            <p className={`text-gray-800 leading-relaxed mb-5 ${fontClass}`}>
              {questionText}
            </p>

            {showFormulas && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-700">القوانين والمعادلات</h3>
                  <button onClick={() => setShowFormulas(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <img src={formulasImg} alt="القوانين والمعادلات" className="w-full rounded-lg" />
              </div>
            )}

            {/* Answer options */}
            <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectAnswer(idx)}
                  className={`flex items-center gap-0 text-right transition-all ${
                    selectedAnswer === idx
                      ? 'bg-blue-50'
                      : 'bg-white hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <span className={`flex-shrink-0 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center text-sm font-bold border-l border-gray-100 transition-colors ${
                    selectedAnswer === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}>
                    {OPTION_LABELS[idx]}
                  </span>
                  <span className={`flex-1 px-3 md:px-4 py-3 ${fontClass} ${selectedAnswer === idx ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                    {option}
                  </span>
                  {selectedAnswer === idx && (
                    <span className="ml-3 mr-3 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Bottom action bar */}
          <div className="hidden md:flex border-t border-gray-200 px-6 py-3 items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              {onPrev && (
                <button
                  onClick={onPrev}
                  disabled={!canGoPrev}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
              )}
              {isLastQuestion ? (
                <button
                  onClick={onFinish}
                  className="px-6 py-2 rounded-lg bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm"
                >
                  إنهاء القسم
                </button>
              ) : (
                <button
                  onClick={onNext}
                  disabled={!canGoNext}
                  className="px-6 py-2 rounded-lg bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  حفظ والتالي
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleBookmark?.()}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                  isBookmarked
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-4 h-4 text-yellow-600" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">تمييز للمراجعة</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReportDialog(true)}
                title="الإبلاغ عن خطأ في السؤال"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-500 bg-rose-50 hover:bg-rose-100 transition-all text-sm font-medium"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">إبلاغ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION BAR (fixed)
      ════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 shadow-lg" dir="rtl">
        <div className="flex items-center h-14 px-2 gap-1">
          {/* Previous */}
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => onToggleBookmark?.()}
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              isBookmarked
                ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Center: Question grid button */}
          <button
            onClick={() => setShowMobilePanel(true)}
            className="flex-1 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center gap-2 text-xs font-semibold active:scale-95 transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{answeredTotal}/{sectionTotal} أُجيب</span>
          </button>

          {/* Report */}
          <button
            type="button"
            onClick={() => setShowReportDialog(true)}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center active:scale-95 transition-all"
          >
            <Flag className="w-4 h-4" />
          </button>

          {/* Next / Finish */}
          {isLastQuestion ? (
            <button
              onClick={onFinish}
              className="flex-shrink-0 h-10 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold active:scale-95 transition-all shadow-sm"
            >
              إنهاء
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE SLIDE-UP PANEL (Questions Grid)
      ════════════════════════════════════════ */}
      {showMobilePanel && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          dir="rtl"
          onClick={() => setShowMobilePanel(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-gray-200 rounded-full" />
            </div>

            <div className="px-4 pb-4 pt-2 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 text-center">
                  <p className="text-base font-bold text-gray-600">{notVisitedCount}</p>
                  <p className="text-[10px] text-gray-400">لم تُزَر</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-2 text-center">
                  <p className="text-base font-bold text-orange-500">{visitedCount}</p>
                  <p className="text-[10px] text-orange-400">زُرت</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-2 text-center">
                  <p className="text-base font-bold text-green-600">{answeredTotal}</p>
                  <p className="text-[10px] text-green-500">أُجيب</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-2 text-center">
                  <p className="text-base font-bold text-red-500">{remainingInSection}</p>
                  <p className="text-[10px] text-red-400">متبقية</p>
                </div>
              </div>

              {/* Timer (mobile panel) */}
              <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${isTimeUrgent ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-100'}`}>
                <span className="text-xs text-gray-500 font-medium">الوقت المتبقي</span>
                <span className={`text-xl font-mono font-bold ${isTimeUrgent ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Question grid */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">الأسئلة — اضغط للانتقال</p>
                <QuestionGrid />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {[
                  { color: 'bg-green-500', label: 'أُجيب عنه' },
                  { color: 'bg-yellow-400', label: 'مُميَّز' },
                  { color: 'bg-orange-400', label: 'تمت الزيارة' },
                  { color: 'bg-red-200', label: 'لم يُزَر' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <span className={`w-3 h-3 rounded ${color} inline-block flex-shrink-0`} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Action buttons (mobile) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setShowExamInstructions(true); setShowMobilePanel(false); }}
                  className="py-2.5 px-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  تعليمات الاختبار
                </button>
                <button
                  onClick={() => { setShowSectionInstructions(true); setShowMobilePanel(false); }}
                  className="py-2.5 px-1 text-xs font-semibold bg-green-100 text-green-700 border border-green-400 rounded-xl hover:bg-green-100 transition-colors"
                >
                  تعليمات القسم
                </button>
                <button
                  onClick={() => { if (onShowFormulas) onShowFormulas(); else setShowFormulas(v => !v); setShowMobilePanel(false); }}
                  className="py-2.5 px-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  المعادلات
                </button>
                <button
                  onClick={() => { setShowMobilePanel(false); (onEndSection ?? onFinish)?.(); }}
                  className="py-2.5 px-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                >
                  إنهاء القسم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          REPORT DIALOG
      ════════════════════════════════════════ */}
      {showReportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> الإبلاغ عن خطأ في السؤال
              </h3>
              <button onClick={handleCloseReport} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {reportSent ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-bold text-gray-800 text-lg mb-1">شكراً على إبلاغك!</h4>
                  <p className="text-gray-500 text-sm">تم إرسال بلاغك وسيقوم فريقنا بمراجعة السؤال.</p>
                  <button onClick={handleCloseReport} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
                    حسناً
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 line-clamp-2">السؤال: {questionText.slice(0, 120)}...</p>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">نوع الخطأ *</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { value: 'wrong_answer', label: '❌ الإجابة الصحيحة خاطئة' },
                        { value: 'typo', label: '🔤 خطأ إملائي أو نحوي' },
                        { value: 'unclear', label: '❓ السؤال غير واضح' },
                        { value: 'missing_image', label: '🖼 صورة مفقودة' },
                        { value: 'other', label: '📝 ملاحظة أخرى' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setReportType(opt.value)}
                          className={`text-right px-4 py-2.5 rounded-xl border text-sm transition-all ${
                            reportType === opt.value
                              ? 'border-rose-400 bg-rose-50 text-rose-700 font-semibold'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">تفاصيل إضافية (اختياري)</p>
                    <textarea
                      value={reportDesc}
                      onChange={e => setReportDesc(e.target.value)}
                      placeholder="اكتب أي تفاصيل إضافية هنا..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleSubmitReport}
                      disabled={!reportType || reportLoading}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40"
                    >
                      {reportLoading ? 'جارٍ الإرسال...' : 'إرسال البلاغ'}
                    </button>
                    <button onClick={handleCloseReport} className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DESKTOP SIDEBAR (hidden on mobile)
      ════════════════════════════════════════ */}
      <div className="hidden md:flex w-56 flex-shrink-0 bg-white border-r border-gray-200 flex-col overflow-y-auto shadow-sm">
        {/* Timer */}
        <div className={`p-3 border-b text-center ${isTimeUrgent ? 'bg-red-50 border-red-200' : 'border-gray-200'}`}>
          <p className="text-xs text-gray-500 mb-1">الوقت المتبقي</p>
          <p className={`text-2xl font-mono font-bold ${
            isTimeUrgent ? 'text-red-600 animate-pulse' : 'text-blue-600'
          }`}>
            {formatTime(timeLeft)}
          </p>
          {isTimeUrgent && (
            <p className="text-xs text-red-500 font-medium mt-1">⚠️ الوقت ينفد</p>
          )}
        </div>

        {/* User info */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-emerald-600 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-sm font-bold">
                  {userName ? userName.charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">{userName ?? 'مستخدم'}</p>
              {userId && <p className="text-xs text-gray-400">#{userId.slice(-4)}</p>}
            </div>
          </div>
        </div>

        {/* Section info */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>القسم الحالي</span>
            <span className="font-bold text-blue-600">{sectionNumber}/{totalSections}</span>
          </div>
          {totalSections > 1 && (
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(sectionNumber / totalSections) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-3 border-b border-gray-200 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
            <p className="text-base font-bold text-gray-600">{notVisitedCount}</p>
            <p className="text-xs text-gray-400 leading-tight">لم تُزَر</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-2 text-center">
            <p className="text-base font-bold text-orange-500">{visitedCount}</p>
            <p className="text-xs text-orange-400 leading-tight">زُرت</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-2 text-center">
            <p className="text-base font-bold text-green-600">{answeredTotal}</p>
            <p className="text-xs text-green-500 leading-tight">أُجيب عنها</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-center">
            <p className="text-base font-bold text-red-500">{remainingInSection}</p>
            <p className="text-xs text-red-400 leading-tight">متبقية</p>
          </div>
        </div>

        {/* Question grid */}
        <div className="p-3 border-b border-gray-200 flex-1">
          <p className="text-xs text-gray-500 mb-2 font-medium">الأسئلة</p>
          <QuestionGrid />
          {/* Legend */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-green-500 inline-block flex-shrink-0"></span>
              <span>أُجيب عنه</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-yellow-400 inline-block flex-shrink-0"></span>
              <span>مُميَّز للمراجعة</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-orange-400 inline-block flex-shrink-0"></span>
              <span>تمت الزيارة</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-red-200 inline-block flex-shrink-0"></span>
              <span>لم يُزَر</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowExamInstructions(true)}
            className="py-2 px-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            تعليمات الاختبار
          </button>
          <button
            onClick={() => setShowSectionInstructions(true)}
            className="py-2 px-1 text-xs font-semibold bg-green-100 text-green-700 border border-green-400 rounded-lg hover:bg-green-100 transition-colors"
          >
            تعليمات القسم
          </button>
          <button
            onClick={onEndSection ?? onFinish}
            className="py-2 px-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            إنهاء القسم
          </button>
          <button
            onClick={() => {
              if (onShowFormulas) onShowFormulas();
              else setShowFormulas(v => !v);
            }}
            className="py-2 px-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
          >
            المعادلات
          </button>
        </div>
      </div>

      {/* Exam Instructions Modal */}
      {showExamInstructions && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowExamInstructions(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">تعليمات الاختبار</h3>
              <button onClick={() => setShowExamInstructions(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              {[
                'اقرأ كل سؤال بعناية قبل الإجابة.',
                'يمكنك التنقل بين الأسئلة باستخدام الأرقام في الشريط الجانبي.',
                'اضغط على زر تمييز للمراجعة لحفظ السؤال للمراجعة لاحقاً.',
                'سيتوقف الاختبار تلقائياً عند انتهاء الوقت.',
                'لا يمكن الرجوع بعد إنهاء القسم الحالي.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowExamInstructions(false)}
              className="mt-5 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
            >
              فهمت
            </button>
          </div>
        </div>
      )}

      {/* Section Instructions Modal */}
      {showSectionInstructions && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowSectionInstructions(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">تعليمات القسم الحالي</h3>
              <button onClick={() => setShowSectionInstructions(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed space-y-3">
              {[
                `هذا القسم (${sectionLabel || `القسم ${sectionNumber}`}) يحتوي على ${sectionTotal} سؤال.`,
                'يُرجى الإجابة على جميع الأسئلة قبل انتهاء الوقت.',
                'يمكنك تغيير إجابتك في أي وقت خلال هذا القسم.',
                'استخدم الشبكة الجانبية للتنقل السريع بين الأسئلة.',
                'بعد إنهاء القسم لا يمكن العودة إليه.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowSectionInstructions(false)}
              className="mt-5 w-full py-2.5 bg-green-100 text-white rounded-xl text-sm font-bold hover:bg-green-100 transition-colors"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
