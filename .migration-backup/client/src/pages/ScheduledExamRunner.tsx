import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SectionReviewModal } from "@/components/SectionReviewModal";
import { QiyasExamLayout } from "@/components/QiyasExamLayout";
import { AntiCheatWarning } from "@/components/AntiCheatWarning";
import AiReviewingScreen, { WrongQuestion } from "@/components/AiReviewingScreen";
import {
  Clock, BookmarkIcon, ChevronRight, ChevronLeft,
  AlertTriangle, CheckCircle2, Maximize2, Flag,
  XCircle, Loader2, SkipForward, LogOut
} from "lucide-react";

interface Question {
  _id: string;
  questionId: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory: string;
  imageUrl?: string;
}

interface SectionConfig {
  verbalCount: number;
  quantCount: number;
  experimentalIndices: Set<number>;
}

const SECTIONS = 5;
const VERBAL_PER_SECTION = 13;
const QUANT_PER_SECTION = 12;
const QUESTIONS_PER_SECTION = 25;
const SECTION_TIME_SECONDS = 26 * 60;
const BREAK_SECONDS = 30;
const EXPERIMENTAL_TOTAL = 20;
const OPTION_LABELS = ['أ', 'ب', 'ج', 'د'];
const MAX_VIOLATIONS = 3;

type Phase = 'loading' | 'error' | 'countdown' | 'expired' | 'ready' | 'section' | 'section_review' | 'break' | 'thank_you';

export default function ScheduledExamRunner() {
  const { id: bookingId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('loading');
  const [allQuestions, setAllQuestions] = useState<Question[][]>([]);
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);

  const [currentSection, setCurrentSection] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[][]>(
    Array.from({ length: SECTIONS }, () => Array(QUESTIONS_PER_SECTION).fill(null))
  );
  const [bookmarks, setBookmarks] = useState<boolean[][]>(
    Array.from({ length: SECTIONS }, () => Array(QUESTIONS_PER_SECTION).fill(false))
  );

  const [sectionTimeLeft, setSectionTimeLeft] = useState(SECTION_TIME_SECONDS);
  const [breakTimeLeft, setBreakTimeLeft] = useState(BREAK_SECONDS);
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [countdown, setCountdown] = useState('');
  const [finalResults, setFinalResults] = useState<{
    totalScoreOutOf100: number;
    verbalPercent: number;
    quantPercent: number;
    correctAnswers: number;
    wrongAnswers: number;
    skippedAnswers: number;
    emailSent: boolean;
    folderCreated: boolean;
    resultVisibleAt?: string;
  } | null>(null);
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);

  const sectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const violationRef = useRef(0);
  const submitCalledRef = useRef(false);
  const lastSubmitDataRef = useRef<any>(null);
  const questionsLoadedRef = useRef(false);
  const allQuestionsRef = useRef<Question[][]>([]);

  const examActivePhases: Phase[] = ['section', 'section_review', 'break', 'thank_you'];
  const isExamActive = examActivePhases.includes(phase);

  const { data: user } = useQuery<any>({ queryKey: ['/api/user'] });

  const { data: bookingData } = useQuery<{ booking: any }>({
    queryKey: [`/api/exam-bookings/${bookingId}`],
    enabled: !!bookingId && !isExamActive,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
  });

  const submitExam = useMutation({
    mutationFn: async (data: any) => {
      lastSubmitDataRef.current = data;
      const res = await apiRequest('POST', `/api/exam-bookings/${bookingId}/submit`, data);
      return res.json();
    },
    onSuccess: (response: any) => {
      clearTimers();
      toast({ title: '✅ تم تسليم الاختبار بنجاح!', description: 'جارٍ مراجعة إجاباتك بالذكاء الاصطناعي...' });
      const d = lastSubmitDataRef.current;
      setFinalResults({
        totalScoreOutOf100: d?.totalScoreOutOf100 ?? 0,
        verbalPercent: d?.verbalPercent ?? 0,
        quantPercent: d?.quantPercent ?? 0,
        correctAnswers: d?.correctAnswers ?? 0,
        wrongAnswers: d?.wrongAnswers ?? 0,
        skippedAnswers: d?.skippedAnswers ?? 0,
        emailSent: response?.emailSent ?? false,
        folderCreated: (d?.wrongAnswers ?? 0) > 0,
        resultVisibleAt: response?.booking?.resultVisibleAt,
      });
      // Build wrong questions for AI review
      const wrongs: WrongQuestion[] = [];
      allQuestionsRef.current.forEach((sectionQs, si) => {
        sectionQs.forEach((q, qi) => {
          const studentAnswer = answers[si]?.[qi];
          if (studentAnswer === null || studentAnswer === undefined || studentAnswer !== q.correctOptionIndex) {
            wrongs.push({
              questionText: q.text,
              options: q.options,
              studentAnswerIndex: studentAnswer ?? null,
              correctAnswerIndex: q.correctOptionIndex,
              category: q.category,
              subcategory: q.subcategory,
            });
          }
        });
      });
      setWrongQuestionsForAI(wrongs);
      setShowAiReview(true);
    },
    onError: () => {
      toast({ title: 'تعذر تسليم الاختبار', description: 'سيتم المحاولة مجدداً...', variant: 'destructive' });
    },
  });

  function clearTimers() {
    if (sectionTimerRef.current) clearInterval(sectionTimerRef.current);
    if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }

  const buildSubmitData = useCallback((cheating = false, extraViolations = 0) => {
    const sectionResults = allQuestions.map((sectionQs, si) => {
      const questions = sectionQs.map((q, qi) => ({
        questionId: String(q.questionId),
        studentAnswer: answers[si][qi] !== null ? String(answers[si][qi]) : null,
        correctAnswer: String(q.correctOptionIndex),
        isCorrect: answers[si][qi] === q.correctOptionIndex,
        isExperimental: sectionConfigs[si]?.experimentalIndices?.has(qi) || false,
        isBookmarked: bookmarks[si][qi],
        category: q.category,
      }));
      const counted = questions.filter(q => !q.isExperimental);
      return {
        sectionIndex: si,
        questions,
        correctCount: counted.filter(q => q.isCorrect).length,
        wrongCount: counted.filter(q => !q.isCorrect && q.studentAnswer !== null).length,
        skippedCount: counted.filter(q => q.studentAnswer === null).length,
        timeTakenSeconds: SECTION_TIME_SECONDS,
      };
    });

    let verbalCorrect = 0, verbalTotal = 0, quantCorrect = 0, quantTotal = 0;
    sectionResults.forEach((sec, si) => {
      sec.questions.forEach((q, qi) => {
        if (sectionConfigs[si]?.experimentalIndices?.has(qi)) return;
        const originalQ = allQuestions[si]?.[qi];
        if (!originalQ) return;
        if (originalQ.category === 'verbal') {
          verbalTotal++;
          if (q.isCorrect) verbalCorrect++;
        } else {
          quantTotal++;
          if (q.isCorrect) quantCorrect++;
        }
      });
    });

    const totalCorrect = sectionResults.reduce((s, r) => s + r.correctCount, 0);
    const totalWrong = sectionResults.reduce((s, r) => s + r.wrongCount, 0);
    const totalSkipped = sectionResults.reduce((s, r) => s + r.skippedCount, 0);
    const totalCounted = totalCorrect + totalWrong + totalSkipped;
    const totalScore = totalCorrect * 10 - totalWrong - totalSkipped * 0.5;
    const totalScoreOutOf100 = Math.max(0, Math.round((totalCorrect / Math.max(totalCounted, 1)) * 100));
    const verbalPercent = verbalTotal > 0 ? (verbalCorrect / verbalTotal) * 100 : 0;
    const quantPercent = quantTotal > 0 ? (quantCorrect / quantTotal) * 100 : 0;

    const questionIds = allQuestions.flat().map(q => String(q.questionId));

    return {
      sectionResults,
      totalScore,
      verbalScore: verbalCorrect * 10,
      quantScore: quantCorrect * 10,
      totalScoreOutOf100,
      verbalPercent,
      quantPercent,
      correctAnswers: totalCorrect,
      wrongAnswers: totalWrong,
      skippedAnswers: totalSkipped,
      cheatingFlag: cheating,
      cheatingViolations: violationRef.current + extraViolations,
      questionIds,
    };
  }, [allQuestions, answers, bookmarks, sectionConfigs]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleForceSubmit = useCallback(() => {
    if (submitCalledRef.current) return;
    submitCalledRef.current = true;
    clearTimers();
    exitFullscreen();
    submitExam.mutate(buildSubmitData(true, 1));
  }, [buildSubmitData, submitExam, exitFullscreen]);

  const registerViolation = useCallback(() => {
    violationRef.current += 1;
    setViolations(v => v + 1);
    setShowViolationWarning(true);
    setTimeout(() => setShowViolationWarning(false), 4000);
    if (violationRef.current >= MAX_VIOLATIONS) {
      handleForceSubmit();
    }
  }, [handleForceSubmit]);

  useEffect(() => {
    if (phase !== 'section' && phase !== 'section_review' && phase !== 'break') return;

    const handleVisibility = () => {
      if (document.hidden && phase === 'section') registerViolation();
    };
    const handleBlur = () => {
      if (phase === 'section') registerViolation();
    };
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.key === 'u') || (e.ctrlKey && e.key === 'c') ||
          (e.ctrlKey && e.key === 'v') || (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.altKey && e.key === 'F4')) {
        e.preventDefault();
      }
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen && (phase === 'section' || phase === 'section_review' || phase === 'break')) {
        setTimeout(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        }, 300);
        if (phase === 'section') registerViolation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [phase, registerViolation]);

  useEffect(() => {
    if (phase !== 'section') return;
    clearTimers();
    setSectionTimeLeft(SECTION_TIME_SECONDS);
    sectionTimerRef.current = setInterval(() => {
      setSectionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(sectionTimerRef.current!);
          handleSectionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimers();
  }, [phase, currentSection]);

  useEffect(() => {
    if (phase !== 'break') return;
    setBreakTimeLeft(BREAK_SECONDS);
    breakTimerRef.current = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(breakTimerRef.current!);
          startNextSection();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (breakTimerRef.current) clearInterval(breakTimerRef.current); };
  }, [phase]);

  function handleSectionEnd() {
    setPhase('section_review');
  }

  function startNextSection() {
    if (currentSection + 1 >= SECTIONS) {
      doSubmit();
    } else {
      setCurrentSection(s => s + 1);
      setCurrentQ(0);
      setPhase('section');
    }
  }

  function doSubmit() {
    if (submitCalledRef.current) return;
    submitCalledRef.current = true;
    clearTimers();
    exitFullscreen();
    submitExam.mutate(buildSubmitData(false));
  }

  async function loadQuestions() {
    try {
      const experimentalPerSection = Math.floor(EXPERIMENTAL_TOTAL / SECTIONS);

      const res = await fetch(`/api/exam-bookings/${bookingId}/questions`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rawSections: Question[][] = data.sections || [];

      const shuffle = <T,>(arr: T[]) => arr.sort(() => Math.random() - 0.5);

      const sections: Question[][] = [];
      const configs: SectionConfig[] = [];

      for (let s = 0; s < SECTIONS; s++) {
        const combined = rawSections[s] || [];
        const shuffled = shuffle([...combined]);
        const limited = shuffled.slice(0, QUESTIONS_PER_SECTION);

        const expIndices = new Set<number>();
        const candidateIndices = Array.from({ length: limited.length }, (_, i) => i);
        shuffle(candidateIndices).slice(0, experimentalPerSection).forEach(i => expIndices.add(i));

        sections.push(limited);
        configs.push({ verbalCount: VERBAL_PER_SECTION, quantCount: QUANT_PER_SECTION, experimentalIndices: expIndices });
      }

      // Store in ref FIRST (immune to React batching/Strict Mode issues)
      allQuestionsRef.current = sections;

      setAllQuestions(sections);
      setSectionConfigs(configs);
      setAnswers(Array.from({ length: SECTIONS }, () => Array(QUESTIONS_PER_SECTION).fill(null)));
      setBookmarks(Array.from({ length: SECTIONS }, () => Array(QUESTIONS_PER_SECTION).fill(false)));
      questionsLoadedRef.current = true;
      setPhase('ready');
    } catch (err) {
      questionsLoadedRef.current = false;
      setPhase('error');
    }
  }

  useEffect(() => {
    if (!bookingData?.booking) return;
    const booking = bookingData.booking;
    const scheduledAt = new Date(booking.scheduledAt);

    // If already in exam or questions already loaded, don't reset
    if (questionsLoadedRef.current) return;

    function checkAndProceed() {
      const now = new Date();
      const diffMs = scheduledAt.getTime() - now.getTime();
      const EARLY_MS = 5 * 60 * 1000;   // 5 min before
      const LATE_MS  = 60 * 60 * 1000;  // 60 min after

      if (diffMs > EARLY_MS) {
        // Too early — show countdown
        const updateCountdown = () => {
          const d = scheduledAt.getTime() - Date.now();
          if (d <= EARLY_MS) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            if (!questionsLoadedRef.current) {
              questionsLoadedRef.current = true;
              loadQuestions();
            }
            return;
          }
          const h = Math.floor(d / 3600000);
          const m = Math.floor((d % 3600000) / 60000);
          const s = Math.floor((d % 60000) / 1000);
          if (h > 0) setCountdown(`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
          else setCountdown(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
        };
        updateCountdown();
        setPhase('countdown');
        countdownTimerRef.current = setInterval(updateCountdown, 1000);
      } else if (diffMs < -LATE_MS) {
        // Expired — past 60 minute window
        setPhase('expired');
      } else {
        // Within window — load questions now
        questionsLoadedRef.current = true;
        loadQuestions();
      }
    }

    checkAndProceed();

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [bookingData]);

  async function activateAndStart() {
    try {
      await apiRequest('POST', `/api/exam-bookings/${bookingId}/activate`, {});
    } catch {}

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => {});
      }
    } catch {}

    try {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission().catch(() => {});
      }
    } catch {}

    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch {}

    if (allQuestionsRef.current.length > 0) {
      setAllQuestions(allQuestionsRef.current);
    }
    setCurrentSection(0);
    setCurrentQ(0);
    setPhase('section');
  }

  const selectAnswer = (optionIndex: number) => {
    setAnswers(prev => {
      const updated = prev.map(s => [...s]);
      updated[currentSection][currentQ] = optionIndex;
      return updated;
    });
  };

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const updated = prev.map(s => [...s]);
      updated[currentSection][currentQ] = !updated[currentSection][currentQ];
      return updated;
    });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2,'0')}:${(s % 60).toString().padStart(2,'0')}`;

  const timePercent = ((SECTION_TIME_SECONDS - sectionTimeLeft) / SECTION_TIME_SECONDS) * 100;
  const timeUrgent = sectionTimeLeft < 3 * 60;

  const currentQuestion = allQuestions[currentSection]?.[currentQ];
  const isExp = sectionConfigs[currentSection]?.experimentalIndices?.has(currentQ);
  const isBookmarked = bookmarks[currentSection]?.[currentQ];

  const sectionAnsweredCount = answers[currentSection]?.filter(a => a !== null).length || 0;

  // ====== PHASE: loading ======
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-600" dir="rtl">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold">جاري تحضير الاختبار...</p>
          <p className="text-teal-700 mt-2 text-sm">يتم اختيار الأسئلة المناسبة لك</p>
        </div>
      </div>
    );
  }

  // ====== PHASE: error ======
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-600 px-4" dir="rtl">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mb-2">فشل تحميل الاختبار</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            تعذّر جلب أسئلة الاختبار. تحقق من اتصالك بالإنترنت وحاول مجدداً.
          </p>
          <Button
            onClick={() => {
              questionsLoadedRef.current = false;
              setPhase('loading');
              loadQuestions();
            }}
            className="w-full bg-teal-100 hover:bg-teal-100 text-white rounded-xl py-3 font-bold mb-3"
          >
            إعادة المحاولة
          </Button>
          <Button variant="ghost" onClick={() => navigate('/book-exam')} className="w-full text-gray-400">
            العودة للحجوزات
          </Button>
        </div>
      </div>
    );
  }

  // ====== PHASE: countdown (too early) ======
  if (phase === 'countdown') {
    const booking = bookingData?.booking;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-600 px-4" dir="rtl">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="h-10 w-10 text-teal-700" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">لم يحن موعد الاختبار بعد</h1>
          {booking && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              موعد اختبارك:{' '}
              <span className="font-semibold text-teal-700 dark:text-teal-700">
                {new Date(booking.scheduledAt).toLocaleString('ar-SA', {
                  weekday: 'long', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </p>
          )}
          <div className="bg-teal-100 dark:bg-teal-100/30 rounded-2xl p-5 mb-6">
            <p className="text-xs text-teal-700 mb-2">الوقت المتبقي</p>
            <p className="text-5xl font-black text-teal-700 dark:text-teal-700 font-mono tabular-nums" dir="ltr">
              {countdown}
            </p>
            <p className="text-xs text-teal-700 mt-2">سيُفتح الاختبار تلقائياً عند الموعد</p>
          </div>
          <p className="text-xs text-gray-400">يمكنك إبقاء هذه الصفحة مفتوحة، سيبدأ الاختبار تلقائياً</p>
          <button
            onClick={() => navigate('/book-exam')}
            className="mt-4 text-sm text-gray-400 hover:text-teal-700 transition-colors"
          >
            ← العودة لصفحة الحجز
          </button>
        </div>
      </div>
    );
  }

  // ====== PHASE: expired (past 60 min window) ======
  if (phase === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-gray-900 px-4" dir="rtl">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">انتهت نافذة الاختبار</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            لقد مر أكثر من ساعة على موعد الاختبار المحدد. يمكنك حجز موعد جديد.
          </p>
          <button
            onClick={() => navigate('/book-exam')}
            className="w-full py-3 bg-teal-100 hover:bg-teal-100 text-white font-bold rounded-xl transition-colors"
          >
            احجز موعداً جديداً
          </button>
        </div>
      </div>
    );
  }

  // ====== PHASE: ready ======
  if (phase === 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-600 px-4" dir="rtl">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-8 max-w-lg w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flag className="h-8 w-8 text-teal-700" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">جاهز للاختبار؟</h1>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            اختبار القدرات - 5 أقسام، 26 دقيقة لكل قسم<br/>
            تأكد من استقرار اتصالك بالإنترنت قبل البدء
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-6 text-right">
            <p className="text-amber-800 dark:text-amber-300 text-sm font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              تحذيرات مهمة
            </p>
            <ul className="text-amber-700 dark:text-amber-400 text-xs space-y-1 list-disc list-inside">
              <li>لا تغادر الصفحة أو تفتح نوافذ أخرى</li>
              <li>عند المغادرة 3 مرات سيتم تسليم الاختبار تلقائياً</li>
              <li>سيعمل الاختبار في وضع الشاشة الكاملة</li>
              <li>النتيجة ستصلك على بريدك الإلكتروني</li>
            </ul>
          </div>
          <Button
            onClick={activateAndStart}
            className="w-full bg-teal-100 hover:bg-teal-100 text-white rounded-xl py-3 text-lg font-bold"
            data-testid="btn-start-exam-confirmed"
          >
            ابدأ الاختبار الآن
          </Button>
          <Button variant="ghost" onClick={() => navigate('/book-exam')} className="w-full mt-2 text-gray-400">
            العودة للحجوزات
          </Button>
        </div>
      </div>
    );
  }

  // ====== PHASE: section_review ======
  if (phase === 'section_review') {
    const reviewQs = (allQuestions[currentSection] || []).map((q, qi) => ({
      index: qi,
      text: q.text,
      studentAnswer: answers[currentSection][qi] !== null ? String(answers[currentSection][qi]) : null,
      correctAnswer: String(q.correctOptionIndex),
      options: q.options,
      isCorrect: answers[currentSection][qi] === q.correctOptionIndex,
      isBookmarked: bookmarks[currentSection][qi],
      category: q.category,
      imageUrl: q.imageUrl,
    }));
    const isLastSection = currentSection + 1 >= SECTIONS;
    return (
      <SectionReviewModal
        sectionIndex={currentSection}
        questions={reviewQs}
        breakDuration={isLastSection ? 0 : BREAK_SECONDS}
        onClose={() => {
          if (isLastSection) doSubmit();
          else setPhase('break');
        }}
      />
    );
  }

  // ====== PHASE: break ======
  if (phase === 'break') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-emerald-600" dir="rtl">
        <div className="text-center text-white">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 border-4 border-white/30">
            <span className="text-4xl font-black">{breakTimeLeft}</span>
          </div>
          <p className="text-2xl font-bold mb-2">استراحة قصيرة</p>
          <p className="text-teal-700 mb-2">انتهى القسم {currentSection + 1} من {SECTIONS}</p>
          <p className="text-teal-700 text-sm mb-6">ينتقل للقسم التالي تلقائياً خلال {breakTimeLeft} ثانية</p>
          <Button
            onClick={() => { clearTimers(); startNextSection(); }}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-xl"
            data-testid="btn-skip-break"
          >
            <SkipForward className="h-4 w-4 ml-2" />
            تخطي الاستراحة
          </Button>
        </div>
      </div>
    );
  }

  // ====== AI REVIEW SCREEN ======
  if (showAiReview) {
    const userStr = localStorage.getItem('user');
    const userEmail = userStr ? JSON.parse(userStr)?.email : undefined;
    const totalQ = SECTIONS * QUESTIONS_PER_SECTION;
    const correctQ = finalResults?.correctAnswers ?? 0;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={totalQ}
        score={correctQ}
        userEmail={userEmail}
        onShowResults={() => {
          setShowAiReview(false);
          setPhase('thank_you');
        }}
      />
    );
  }

  // ====== PHASE: thank_you ======
  if (phase === 'thank_you') {
    const visibleAt = finalResults?.resultVisibleAt ? new Date(finalResults.resultVisibleAt) : null;
    const minutesLeft = visibleAt ? Math.max(0, Math.ceil((visibleAt.getTime() - Date.now()) / 60000)) : 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-teal-600 to-slate-900 px-4" dir="rtl">
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-3xl p-10 max-w-md w-full shadow-2xl text-center space-y-5">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/40">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white mb-3">شكراً لك!</h1>
            <p className="text-slate-300 text-lg font-medium">تم استلام اختبارك بنجاح</p>
          </div>

          {/* مراجعة الذكاء الاصطناعي والبريد */}
          <div className="bg-teal-100/30 border border-teal-400/40 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 justify-center mb-1">
              <span className="text-teal-700 text-base">🤖</span>
              <p className="text-teal-700 text-sm font-bold">جارٍ مراجعة إجاباتك بالذكاء الاصطناعي</p>
            </div>
            <p className="text-slate-400 text-xs text-center">
              {minutesLeft > 0
                ? `ستصلك النتيجة المراجَعة خلال ${minutesLeft} دقيقة${minutesLeft === 1 ? '' : 'ً'} تقريباً`
                : 'ستصلك النتيجة المراجَعة خلال 10-15 دقيقة'}
            </p>
            <p className="text-slate-500 text-xs text-center">📧 سيتم إرسال النتيجة إلى بريدك الإلكتروني بعد اكتمال المراجعة</p>
            <p className="text-slate-600 text-[10px] text-center mt-1">يمكنك متابعة نتائجك من صفحة "احجز اختبارك"</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate('/book-exam')}
              className="w-full bg-teal-100 hover:bg-teal-100 text-white rounded-xl py-3 text-base font-bold"
              data-testid="btn-back-book-exam"
            >
              متابعة نتائجي
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full text-slate-400 hover:text-slate-200 rounded-xl py-2.5 text-sm"
              data-testid="btn-back-home"
            >
              العودة إلى الرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ====== PHASE: section (main exam) ======
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
      </div>
    );
  }

  const questionsStatusArr = Array.from({ length: QUESTIONS_PER_SECTION }, (_, i) => ({
    answered: answers[currentSection][i] !== null,
    bookmarked: bookmarks[currentSection][i],
  }));

  return (
    <div className="relative">
      {/* Violation warning overlay */}
      <AntiCheatWarning
        violations={violations}
        lastViolationType="tab_switch"
        isVisible={showViolationWarning}
        onDismiss={() => setShowViolationWarning(false)}
        maxViolations={MAX_VIOLATIONS}
      />

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center" dir="rtl">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-7 w-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">إلغاء الاختبار؟</h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              إذا ألغيت الاختبار الآن سيتم تسليم إجاباتك الحالية وتحتسب كنتيجة نهائية. هل أنت متأكد؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  handleForceSubmit();
                }}
                data-testid="btn-confirm-cancel"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 font-bold text-sm transition-colors"
              >
                نعم، إلغاء الاختبار
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                data-testid="btn-dismiss-cancel"
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl py-2.5 font-bold text-sm transition-colors"
              >
                متابعة الاختبار
              </button>
            </div>
          </div>
        </div>
      )}

      <QiyasExamLayout
        examTitle="اختبار القدرات"
        questionNumber={currentQ + 1}
        totalQuestions={QUESTIONS_PER_SECTION}
        sectionLabel={`القسم ${currentSection + 1}`}
        sectionNumber={currentSection + 1}
        totalSections={SECTIONS}
        timeLeft={sectionTimeLeft}
        isTimeUrgent={timeUrgent}
        questionText={currentQuestion.text}
        questionImageUrl={currentQuestion.imageUrl}
        options={currentQuestion.options}
        selectedAnswer={answers[currentSection][currentQ]}
        onSelectAnswer={selectAnswer}
        questionsStatus={questionsStatusArr}
        currentQuestionIndex={currentQ}
        onJumpToQuestion={(i) => setCurrentQ(i)}
        isBookmarked={isBookmarked}
        onToggleBookmark={toggleBookmark}
        onPrev={() => setCurrentQ(q => Math.max(0, q - 1))}
        onNext={() => setCurrentQ(q => q + 1)}
        onFinish={handleSectionEnd}
        canGoPrev={currentQ > 0}
        canGoNext={currentQ < QUESTIONS_PER_SECTION - 1}
        isLastQuestion={currentQ >= QUESTIONS_PER_SECTION - 1}
        answeredCount={sectionAnsweredCount}
        userName={user?.username || user?.name}
        userId={user?.id ? String(user.id) : undefined}
        topRightSlot={
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={handleSectionEnd}
              data-testid="btn-end-section"
              className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium"
            >
              إنهاء القسم
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              data-testid="btn-cancel-exam"
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors font-medium flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              إلغاء
            </button>
          </div>
        }
      />
    </div>
  );
}
