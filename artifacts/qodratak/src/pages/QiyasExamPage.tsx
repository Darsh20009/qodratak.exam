import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { AntiCheatWarning } from '@/components/AntiCheatWarning';
import AiReviewingScreen, { WrongQuestion } from '@/components/AiReviewingScreen';
import ImageZoom from '@/components/ImageZoom';
import ResultsTeacherAnalysis from '@/components/exam-results/ResultsTeacherAnalysis';
import QuestionReportModal from '@/components/exam-results/QuestionReportModal';
import { apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/SEO";
import { QiyasExamLayout } from "@/components/QiyasExamLayout";
import ExamInstructionsScreen from "@/components/exam/ExamInstructionsScreen";
import ExamSectionIntro from "@/components/exam/ExamSectionIntro";
import SubSectionIntroOverlay, { normalizeSubcategory } from "@/components/exam/SubSectionIntroOverlay";
import {
  generateBalancedQuestionSet,
  calculateDetailedResults,
  type DetailedExamResult
} from "@shared/examUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EndTestButton } from '@/components/ui/EndTestButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Clock3,
  GraduationCapIcon,
  Info,
  TrophyIcon, Download,
  ClipboardList,
  Timer,
  ArrowLeftIcon,
  BookOpen,
  ArrowRightIcon,
  CheckCircle,
  LockIcon,
  Sparkles,
  Brain,
  Atom,
  Palette,
  Moon,
  Star,
  CloudSun,
  Eye, // Added for Review Button
  RefreshCw, // For retake challenge
  Target, // For challenge icon
  AlertTriangle, // For warnings or important notes
  MessageSquare, // For explanations or feedback
  Check, // For correct items
  X, // For incorrect items
  Infinity, // For untimed option
  BarChart3,
  FolderPlus, // For save to folder
  Bookmark, // For save icon
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { TestType } from "@shared/types"; // Assuming TestType is "verbal" | "quantitative" | "mixed"
import { DetailedTestResults } from "@/components/DetailedTestResults";
import { PointsAndRankingCard } from "@/components/test-results/PointsAndRankingCard";
import { EnhancedSaveToFolderDialog } from "@/components/EnhancedSaveToFolderDialog";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";

// Types for Qiyas exams
interface QiyasSection {
  sectionNumber: number;
  name: string;
  category: TestType;
  questionCount: number;
  timeLimit: number; // in minutes
  verbalCount?: number; // For mixed sections: number of verbal questions
  quantitativeCount?: number; // For mixed sections: number of quantitative questions
}

interface QiyasExam {
  id: number;
  name:string;
  description?: string;
  totalSections: number;
  totalQuestions: number; // Total questions presented to the user
  totalTime: number; // in minutes
  sections: QiyasSection[];
  isQiyas?: boolean;
  requiresSubscription?: boolean;
  isMockExam?: boolean;
  hideQuestionReview?: boolean;
  overallCategory?: TestType; // For exams primarily of one type
  nonScoredCount?: number; // Number of questions not counted in score
  nonScoredVerbal?: number; // Number of verbal non-scored questions
  nonScoredQuantitative?: number; // Number of quantitative non-scored questions
  themeColor?: string; // For creative exam selection
  icon?: React.ElementType; // For creative exam selection
  sectionBreakDuration?: number; // Break duration in seconds between sections
}

interface ExamQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: TestType;
  subcategory?: string;
  section: number;
  explanation?: string;
  imageUrl?: string;
}

interface ProcessedExamQuestion extends ExamQuestion {
  _isNonScored?: boolean;
  _globalIndex?: number;
  subcategory?: string;
}

// Type for questions passed to challenge generator
type ChallengeQuestionData = ProcessedExamQuestion & {
    userAnswerIndex: number | undefined;
    sectionName: string;
    wasUnanswered: boolean;
};


// Mock data for Qiyas exams
const qiyasExams: QiyasExam[] = [
  {
    id: 1,
    name: "اختبار قدراتك التأهيلي",
    description: "اختبار تأهيلي شامل يتكون من سبعة أقسام متنوعة بين اللفظي والكمي. يتضمن 20 سؤالاً تجريبياً (12 لفظي + 8 كمي) غير محسوب للمساعدة. متاح مجاناً كل يومين.",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    isQiyas: true,
    requiresSubscription: true,
    nonScoredCount: 20,
    nonScoredVerbal: 12,
    nonScoredQuantitative: 8,
    themeColor: "from-blue-500 to-teal-500",
    icon: Brain,
    sections: [
      { sectionNumber: 1, name: "القسم الأول", category: "mixed", questionCount: 24, timeLimit: 24, verbalCount: 13, quantitativeCount: 11 },
      { sectionNumber: 2, name: "القسم الثاني", category: "mixed", questionCount: 24, timeLimit: 24, verbalCount: 13, quantitativeCount: 11 },
      { sectionNumber: 3, name: "القسم الثالث", category: "mixed", questionCount: 24, timeLimit: 24, verbalCount: 13, quantitativeCount: 11 },
      { sectionNumber: 4, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 5, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      { sectionNumber: 6, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 7, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 }
    ]
  },
  {
    id: 2,
    name: "اختبار لفظي - 65 سؤال",
    description: "اختبار قدرات لفظي شامل يحاكي نموذج قياس: 65 سؤال في 65 دقيقة مع الشرح المفصل",
    overallCategory: "verbal",
    totalSections: 5,
    totalQuestions: 65,
    totalTime: 65,
    isMockExam: true,
    requiresSubscription: true,
    themeColor: "from-green-500 to-emerald-600",
    icon: Palette,
    sections: [
      { sectionNumber: 1, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 2, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 3, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 4, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 5, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },

    ]
  },
  {
    id: 3,
    name: "اختبار كمي - 55 سؤال",
    description: "اختبار قدرات كمي شامل يحاكي نموذج قياس: 55 سؤال في 55 دقيقة مع الشرح المفصل",
    overallCategory: "quantitative",
    totalSections: 5,
    totalQuestions: 55,
    totalTime: 55,
    isMockExam: true,
    requiresSubscription: true,
    themeColor: "from-red-500 to-orange-600",
    icon: Atom,
    sections: [
       { sectionNumber: 1, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
        { sectionNumber: 2, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
        { sectionNumber: 3, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
        { sectionNumber: 4, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
        { sectionNumber: 5, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      ]
      },
  {
    id: 4,
    name: "اختبار قياس عام 2025",
    description: "اختبار محاكاة كامل يتبع النموذج الرسمي لاختبار قياس. يتضمن 20 سؤالاً تجريبياً غير محسوب للمساعدة.",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    requiresSubscription: false,
    hideQuestionReview: true,
    nonScoredCount: 20,
    themeColor: "from-green-600 to-amber-600",
    icon: Sparkles,
    sections: [
      { sectionNumber: 1, name: "القسم الأول", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 2, name: "القسم الثاني", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 3, name: "القسم الثالث", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 4, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 5, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      { sectionNumber: 6, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 7, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
    ]
  },
  {
    id: 5,
    name: "اختبار قدراتك ",
    description: "اختبار تدريبي يحاكي بنية اختبار القدرات العامة",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    isQiyas: true,
    requiresSubscription: false,
    themeColor: "from-blue-500 to-teal-500",
    icon: Brain,
    sections: [
      { sectionNumber: 1, name: "القسم الأول", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 2, name: "القسم الثاني", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 3, name: "القسم الثالث", category: "mixed", questionCount: 24, timeLimit: 24 },
      { sectionNumber: 4, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      { sectionNumber: 5, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 },
      { sectionNumber: 6, name: "قدرات كمية", category: "quantitative", questionCount: 11, timeLimit: 11 },
      { sectionNumber: 7, name: "قدرات لفظية", category: "verbal", questionCount: 13, timeLimit: 13 }
    ]
  },
  {
    id: 6,
    name: "اختبار قياس تجريبي",
    description: "اختبار تدريبي يحاكي بنية اختبار القدرات العامة",
    totalSections: 2,
    totalQuestions: 20,
    totalTime: 20,
    themeColor: "from-yellow-500 to-amber-600",
    icon: CloudSun,
    sections: [
      { sectionNumber: 1, name: "قدرات لفظية", category: "verbal", questionCount: 10, timeLimit: 10 },
      { sectionNumber: 2, name: "قدرات كمية", category: "quantitative", questionCount: 10, timeLimit: 10 },
    ]
  },
  {
    id: 7,
    name: "اختبار نظام نمر",
    description: "اختبار محاكاة بنظام نمر: 5 أقسام متكاملة، كل قسم 25 سؤالاً (13 لفظي + 12 كمي) في 26 دقيقة مع استراحة 30 ثانية بين الأقسام. يتضمن 20 سؤالاً تجريبياً غير محسوبة.",
    totalSections: 5,
    totalQuestions: 125,
    totalTime: 130,
    isQiyas: true,
    requiresSubscription: true,
    nonScoredCount: 20,
    nonScoredVerbal: 10,
    nonScoredQuantitative: 10,
    sectionBreakDuration: 30,
    themeColor: "from-rose-500 to-red-600",
    icon: Target,
    sections: [
      { sectionNumber: 1, name: "القسم الأول", category: "mixed", questionCount: 25, timeLimit: 26, verbalCount: 13, quantitativeCount: 12 },
      { sectionNumber: 2, name: "القسم الثاني", category: "mixed", questionCount: 25, timeLimit: 26, verbalCount: 13, quantitativeCount: 12 },
      { sectionNumber: 3, name: "القسم الثالث", category: "mixed", questionCount: 25, timeLimit: 26, verbalCount: 13, quantitativeCount: 12 },
      { sectionNumber: 4, name: "القسم الرابع", category: "mixed", questionCount: 25, timeLimit: 26, verbalCount: 13, quantitativeCount: 12 },
      { sectionNumber: 5, name: "القسم الخامس", category: "mixed", questionCount: 25, timeLimit: 26, verbalCount: 13, quantitativeCount: 12 },
    ]
  },
  {
    id: 8,
    name: "قسم نمر واحد",
    description: "قسم واحد على نمط نمر: 25 سؤالاً مختلطة (13 لفظي + 12 كمي) في 26 دقيقة. مناسب للتدريب السريع.",
    totalSections: 1,
    totalQuestions: 25,
    totalTime: 26,
    isQiyas: true,
    requiresSubscription: true,
    themeColor: "from-rose-500 to-red-600",
    icon: Target,
    sections: [
      { sectionNumber: 1, name: "قسم نمر", category: "mixed", questionCount: 25, timeLimit: 26, verbalCount: 13, quantitativeCount: 12 },
    ]
  },
];

// Main component
const QiyasExamPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useUser();
  const finishExamRef = useRef<(() => void) | null>(null);

  const [selectedExam, setSelectedExam] = useState<QiyasExam | null>(null);
  const [currentView, setCurrentView] = useState<"selection" | "instructions" | "section-intro" | "inProgress" | "results">("selection");
  const [showAiReview, setShowAiReview] = useState(false);
  const [wrongQuestionsForAI, setWrongQuestionsForAI] = useState<WrongQuestion[]>([]);
  const [showSubSectionIntro, setShowSubSectionIntro] = useState(false);
  const [lastShownSubcategory, setLastShownSubcategory] = useState<string | null>(null);
  const [showEarlySubmitConfirm, setShowEarlySubmitConfirm] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [pendingSectionAdvance, setPendingSectionAdvance] = useState(false);

  const { violations: antiCheatViolations, lastViolationType: antiCheatType, isWarningVisible: antiCheatWarning, dismissWarning: dismissAntiCheatWarning } = useAntiCheat({
    enabled: currentView === 'inProgress',
    maxViolations: 3,
    onMaxViolations: () => { setTimeout(() => finishExamRef.current?.(), 2000); },
  });

  const [sectionOnlyIndex, setSectionOnlyIndex] = useState<number | null>(null); // 0-based section index for single-section mode

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const examIdParam = params.get('examId');
    const sectionOnlyParam = params.get('sectionOnly'); // 1-based section number
    if (examIdParam) {
      const exam = qiyasExams.find(e => e.id === parseInt(examIdParam));
      if (exam) {
        let resolvedExam = exam;
        if (sectionOnlyParam) {
          const sectionNum = parseInt(sectionOnlyParam);
          const sectionIdx = exam.sections.findIndex(s => s.sectionNumber === sectionNum);
          if (sectionIdx !== -1) {
            setSectionOnlyIndex(sectionIdx);
            // Narrow exam to just that section
            resolvedExam = {
              ...exam,
              sections: [exam.sections[sectionIdx]],
              totalSections: 1,
              totalQuestions: exam.sections[sectionIdx].questionCount,
              totalTime: exam.sections[sectionIdx].timeLimit,
              nonScoredCount: 0,
              nonScoredVerbal: undefined,
              nonScoredQuantitative: undefined,
            };
          }
        }
        setSelectedExam(resolvedExam);
        setCurrentView("instructions");
      }
    }
  }, []);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [questions, setQuestions] = useState<ProcessedExamQuestion[]>([]);
  const [answers, setAnswers] = useState<{[questionId: number]: number}>({}); // questionId maps to selectedOptionIndex
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const toggleBookmark = () => {
    const qId = questions[currentQuestionIdx]?.id;
    if (!qId) return;
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId); else next.add(qId);
      return next;
    });
  };

  const [sectionScores, setSectionScores] = useState<{[sectionNumber: number]: { score: number, scoredQuestionsCount: number } }>({});
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);

  const [allProcessedQuestionsBySection, setAllProcessedQuestionsBySection] = useState<{[sectionNumber: number]: ProcessedExamQuestion[]}>({});

  const [isPrayerBreak, setIsPrayerBreak] = useState(false);
  const [hasPrayerBreakBeenUsed, setHasPrayerBreakBeenUsed] = useState(false); // Track if prayer break has been used
  const [prayerBreakStartTime, setPrayerBreakStartTime] = useState<Date | null>(null); // Track when prayer break started
  const [prayerBreakTimeLeft, setPrayerBreakTimeLeft] = useState(900); // 15 minutes in seconds

  // Section break states (30 seconds between sections for نظام نمر exam)
  const [isSectionBreak, setIsSectionBreak] = useState(false);
  const [sectionBreakTimeLeft, setSectionBreakTimeLeft] = useState(30);
  const [pendingNextSectionIdx, setPendingNextSectionIdx] = useState<number | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false); // State for review dialog
  const [isFinalReviewDialogOpen, setIsFinalReviewDialogOpen] = useState(false); // State for final review dialog
  const [isMistakeChallengeDialogOpen, setIsMistakeChallengeDialogOpen] = useState(false);
  const [challengeQuestions, setChallengeQuestions] = useState<ChallengeQuestionData[]>([]);
  const [detailedResults, setDetailedResults] = useState<DetailedExamResult | null>(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  // Question report modal state
  const [reportingQuestion, setReportingQuestion] = useState<{ id: number | string; text: string; options: string[]; correctOptionIndex: number } | null>(null);

  // Folder save state
  const [isSaveFolderDialogOpen, setIsSaveFolderDialogOpen] = useState(false);
  const [saveQuestionType, setSaveQuestionType] = useState<"all" | "wrong" | "unanswered">("wrong");
  const [questionsToSave, setQuestionsToSave] = useState<number[]>([]);

  // Query للمجلدات
  const { data: folders = [] } = useQuery<any[]>({
    queryKey: ["/api/folders/user", user?.id],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.id,
  });



  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (currentView === "inProgress" && timeLeft > 0 && !isPrayerBreak && !isSectionBreak) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentView === "inProgress" && selectedExam && !isPrayerBreak && !isSectionBreak) {
        toast({
            title: "الوقت انتهى",
            description: `انتهى وقت القسم الحالي. سيتم نقلك للقسم التالي أو لصفحة النتائج.`,
            duration: 4000,
        });
      moveToNextSection(true); // Call with isTimeOut = true
    }
    return () => clearTimeout(timerId);
  }, [timeLeft, currentView, isPrayerBreak, isSectionBreak, selectedExam]);

  // إخفاء شريط التنقل عند بداية الاختبار فقط
  useEffect(() => {
    if (currentView === "inProgress") {
      localStorage.setItem('qiyasExamInProgress', 'true');
      window.dispatchEvent(new Event('storage'));
    } else {
      localStorage.removeItem('qiyasExamInProgress');
      window.dispatchEvent(new Event('storage'));
    }
  }, [currentView]);

  // حفظ الإجابات في localStorage أثناء الاختبار لمنع فقدانها عند تحديث الصفحة
  useEffect(() => {
    if (currentView === "inProgress" && selectedExam && Object.keys(answers).length > 0) {
      const saveKey = `qiyasAnswers_${selectedExam.id}`;
      localStorage.setItem(saveKey, JSON.stringify(answers));
    }
  }, [answers, selectedExam, currentView]);

  // كشف تغيير القسم الفرعي لعرض مقدمة النوع
  useEffect(() => {
    if (currentView !== "inProgress") return;
    const currentQ = questions[currentQuestionIdx];
    if (!currentQ) return;
    const currentSub = normalizeSubcategory(currentQ.subcategory);
    if (currentSub !== lastShownSubcategory) {
      setLastShownSubcategory(currentSub);
      setShowSubSectionIntro(true);
    }
  }, [currentQuestionIdx, currentView, questions]);

  // Prayer break timer effect
  useEffect(() => {
    let prayerTimerId: NodeJS.Timeout;
    if (isPrayerBreak && prayerBreakTimeLeft > 0) {
      prayerTimerId = setTimeout(() => {
        setPrayerBreakTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isPrayerBreak && prayerBreakTimeLeft === 0) {
      // Auto-resume when prayer break time expires
      setIsPrayerBreak(false);
      toast({
        title: "انتهت فترة الصلاة",
        description: "تم استئناف الاختبار تلقائياً بعد انتهاء الوقت المسموح (15 دقيقة).",
        duration: 5000,
      });
    }
    return () => clearTimeout(prayerTimerId);
  }, [isPrayerBreak, prayerBreakTimeLeft]);

  // Section break timer effect (for نظام نمر and similar exams)
  useEffect(() => {
    let breakTimerId: NodeJS.Timeout;
    if (isSectionBreak && sectionBreakTimeLeft > 0) {
      breakTimerId = setTimeout(() => {
        setSectionBreakTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isSectionBreak && sectionBreakTimeLeft === 0) {
      setIsSectionBreak(false);
      if (pendingNextSectionIdx !== null && selectedExam) {
        const nextSectionData = selectedExam.sections[pendingNextSectionIdx];
        const nextSectionQuestions = allProcessedQuestionsBySection[nextSectionData.sectionNumber];
        setCurrentSectionIdx(pendingNextSectionIdx);
        setCurrentQuestionIdx(0);
        setPendingNextSectionIdx(null);
        if (nextSectionQuestions && nextSectionQuestions.length > 0) {
          setQuestions(nextSectionQuestions);
          setTimeLeft(nextSectionData.timeLimit * 60);
          setSelectedAnswer(null);
        }
      }
    }
    return () => clearTimeout(breakTimerId);
  }, [isSectionBreak, sectionBreakTimeLeft, pendingNextSectionIdx, selectedExam, allProcessedQuestionsBySection]);


  const renderPrayerBreakOverlay = () => {
    if (!isPrayerBreak) return null;
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4 font-arabic animate-fadeIn">
        <div className="bg-white dark:bg-gray-950 p-8 rounded-2xl max-w-lg w-full mx-auto text-center space-y-8 relative overflow-hidden shadow-2xl border border-orange-300 dark:border-orange-700">
          {/* Creative Background Elements */}
          <div className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-orange-400/15 dark:bg-orange-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 bg-teal-400/15 dark:bg-teal-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
          <div className="absolute top-10 left-10 w-10 h-10 bg-yellow-300/20 dark:bg-yellow-400/10 rounded-full animate-ping opacity-50"></div>
          <div className="absolute bottom-10 right-10 w-12 h-12 bg-white/20 dark:bg-white/10 rounded-full animate-bounce delay-1000"></div>

          <div className="relative z-10">
             {/* Enhanced Icon */}
            <div className="w-32 h-32 bg-gradient-to-br from-orange-100 via-orange-200 to-yellow-200 dark:from-gray-800 dark:via-gray-800/70 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transform transition-transform hover:scale-110 duration-300 ring-4 ring-orange-500/30 dark:ring-orange-400/20">
                <Moon className="h-20 w-20 text-orange-500 dark:text-orange-400 animate-pulse-slow" />
            </div>
             {/* Enhanced Text */}
            <h3 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-orange-500 to-yellow-400 dark:from-orange-400 dark:to-yellow-300 text-transparent bg-clip-text drop-shadow-sm">
              استراحة للصلاة
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-xl">
              تقبّل الله طاعتكم <Star className="inline h-5 w-5 text-yellow-400 animate-spin-slow" />
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-3">
              تم إيقاف الاختبار مؤقتاً. عند الانتهاء، يمكنك استئناف الاختبار.
            </p>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-4 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md text-center">
              ملاحظة: يمكن استخدام زر توقف الصلاة مرة واحدة فقط لكل اختبار (الحد الأقصى 15 دقيقة)
            </div>
          </div>

          {/* Prayer break timer display */}
          <div className="text-center mb-6 relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg border border-orange-200 dark:border-orange-700">
              <Clock3 className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-200">
                الوقت المتبقي: {formatTime(prayerBreakTimeLeft)}
              </span>
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 opacity-80">
              سيتم استئناف الاختبار تلقائياً عند انتهاء الوقت
            </p>
          </div>

          <Button
            onClick={() => setIsPrayerBreak(false)}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 transition-all duration-300 shadow-xl hover:shadow-orange-500/40 dark:shadow-orange-400/20 text-xl py-4 rounded-xl relative z-10 transform hover:scale-105"
          >
            استئناف الاختبار (لن يتوفر مرة أخرى)
          </Button>
           {/* Quranic Verse */}
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-6 relative z-10 tracking-wide">
            "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا" <span className="opacity-70">(النساء: 103)</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionBreakOverlay = () => {
    if (!isSectionBreak || pendingNextSectionIdx === null || !selectedExam) return null;
    const nextSection = selectedExam.sections[pendingNextSectionIdx];
    const prevSection = selectedExam.sections[pendingNextSectionIdx - 1];
    const totalBreak = selectedExam.sectionBreakDuration!;
    const progress = ((totalBreak - sectionBreakTimeLeft) / totalBreak) * 100;
    const circumference = 2 * Math.PI * 52;
    const strokeDashoffset = circumference - (sectionBreakTimeLeft / totalBreak) * circumference;

    const nextCategoryLabel = nextSection?.category === 'verbal'
      ? 'لفظي'
      : nextSection?.category === 'quantitative'
      ? 'كمي'
      : 'مختلط';

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center" dir="rtl">
        {/* Blurred background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600/95 via-slate-900/98 to-emerald-600/95 backdrop-blur-xl" />

        {/* Decorative circles */}
        <div className="absolute top-16 right-16 w-72 h-72 bg-teal-100/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-16 left-16 w-80 h-80 bg-green-100/10 rounded-full blur-3xl animate-pulse" />

        <div className="relative z-10 w-full max-w-lg mx-4">
          {/* Card */}
          <div className="bg-slate-900/80 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="bg-gradient-to-l from-teal-600 to-emerald-500 px-6 py-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
                <p className="text-white/80 text-sm font-medium">
                  انتهى {prevSection?.name || 'القسم السابق'}
                </p>
              </div>
              <h2 className="text-white font-black text-2xl">استراحة قصيرة</h2>
            </div>

            {/* Main content */}
            <div className="p-6 flex flex-col items-center gap-5">
              {/* Circular countdown */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="url(#grad)" strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white tabular-nums leading-none">{sectionBreakTimeLeft}</span>
                  <span className="text-xs text-slate-400 font-medium mt-1">ثانية</span>
                </div>
              </div>

              {/* Next section info */}
              <div className="w-full bg-gradient-to-l from-teal-600/20 to-emerald-500/20 border border-teal-400/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-teal-100 animate-pulse" />
                  <p className="text-teal-700 text-xs font-bold uppercase tracking-wider">القسم التالي</p>
                </div>
                <h3 className="text-white font-black text-xl mb-3">{nextSection?.name}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-teal-700">{nextSection?.questionCount ?? nextSection?.verbalCount !== undefined ? (nextSection.verbalCount || 0) + (nextSection.quantitativeCount || 0) : '-'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">سؤال</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <p className="text-xl font-black text-teal-700">{nextSection?.timeLimit ?? '-'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">دقيقة</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <p className={`text-base font-black ${
                      nextSection?.category === 'verbal' ? 'text-blue-300' :
                      nextSection?.category === 'quantitative' ? 'text-emerald-300' :
                      'text-amber-300'
                    }`}>{nextCategoryLabel}</p>
                    <p className="text-xs text-slate-400 mt-0.5">نوع القسم</p>
                  </div>
                </div>
                {nextSection?.verbalCount !== undefined && nextSection?.quantitativeCount !== undefined && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                      <span className="text-xs text-slate-300">{nextSection.verbalCount} لفظي</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                      <span className="text-xs text-slate-300">{nextSection.quantitativeCount} كمي</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500 mt-2">ينتقل للقسم التالي تلقائياً</p>
              </div>

              <button
                onClick={() => setSectionBreakTimeLeft(0)}
                className="w-full py-3 rounded-2xl bg-gradient-to-l from-teal-600 to-emerald-500 text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                تخطي الاستراحة والبدء الآن ←
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  useEffect(() => {
    if (isPrayerBreak) {
      toast({
        title: "وقت الصلاة",
        description: "تم إيقاف الاختبار مؤقتاً. يمكنك استئناف الاختبار بعد الانتهاء من الصلاة.",
        duration: 7000,
      });
    }
  }, [isPrayerBreak, toast]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const loadExam = (exam: QiyasExam) => {
    setSelectedExam(exam);
    setCurrentView("instructions");
  };

  const fetchRawQuestionsForSectionConfig = async (section: QiyasSection, usedQuestionIds: Set<number>): Promise<ExamQuestion[]> => {
    try {
      const response = await fetch('/api/questions', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`فشل في جلب الأسئلة من الخادم: ${response.status}`);
      }
      const allAvailableQuestions: ExamQuestion[] = await response.json();

      // فلترة الأسئلة لتجنب التكرار
      const availableQuestions = allAvailableQuestions.filter(q => !usedQuestionIds.has(q.id));

      let balancedQuestions: ExamQuestion[] = [];

      // للأقسام المختلطة مع توزيع محدد
      if (section.category === 'mixed' && section.verbalCount !== undefined && section.quantitativeCount !== undefined) {
        // جلب الأسئلة اللفظية
        const verbalQuestions = generateBalancedQuestionSet(
          availableQuestions,
          'verbal',
          section.verbalCount
        );
        
        // جلب الأسئلة الكمية
        const quantitativeQuestions = generateBalancedQuestionSet(
          availableQuestions,
          'quantitative',
          section.quantitativeCount
        );
        
        // الكمي أولاً ثم اللفظي (حسب نظام قياس الرسمي)
        balancedQuestions = [...quantitativeQuestions, ...verbalQuestions];
      } else {
        // استخدام نظام التوزيع المتوازن العادي
        balancedQuestions = generateBalancedQuestionSet(
          availableQuestions,
          section.category,
          section.questionCount
        );
      }

      let filteredQuestions = balancedQuestions;

      // إذا لم نحصل على أسئلة كافية من الأسئلة غير المستخدمة
      if (filteredQuestions.length < section.questionCount) {
         console.warn(`تحذير: تم العثور على ${filteredQuestions.length} سؤال فقط لقسم ${section.name} (مطلوب ${section.questionCount})`);

         // إذا لم نجد أي أسئلة متاحة، استخدم من جميع الأسئلة
         if (filteredQuestions.length === 0) {
           const fallbackQuestions = generateBalancedQuestionSet(
             allAvailableQuestions,
             section.category,
             section.questionCount
           );
           filteredQuestions = fallbackQuestions;

           toast({
             title: `تحذير: قسم ${section.name}`,
             description: "تم إعادة استخدام بعض الأسئلة بسبب عدم توفر أسئلة جديدة كافية",
             variant: "default"
           });
         }

         // إذا لا تزال الأسئلة غير كافية، املأ بأسئلة عشوائية
         while (filteredQuestions.length < section.questionCount && allAvailableQuestions.length > 0) {
            const randomQ = allAvailableQuestions[Math.floor(Math.random() * allAvailableQuestions.length)];
            if (!filteredQuestions.find(q => q.id === randomQ.id)) {
              filteredQuestions.push({...randomQ, id: randomQ.id + Math.random() * 1000});
            }
         }
      }

      // تحديث مجموعة الأسئلة المستخدمة
      filteredQuestions.forEach(q => usedQuestionIds.add(q.id));

      return filteredQuestions.map(q => ({
        ...q,
        section: section.sectionNumber,
        id: q.id || Date.now() + Math.random(),
        imageUrl: (q as any).imageUrl || (q as any).displayImage || (q as any).image_url || undefined
      }));

    } catch (error) {
      console.error(`خطأ في تحميل أسئلة قسم ${section.name}:`, error);
      toast({
        title: "خطأ في تحميل الأسئلة",
        description: `لم نتمكن من تحميل أسئلة قسم "${section.name}".`,
        variant: "destructive"
      });
      return [];
    }
  };

  const startExam = async () => {
    if (!selectedExam) return;

    setCurrentSectionIdx(0);
    setCurrentQuestionIdx(0);
    // محاولة استعادة الإجابات المحفوظة عند وجود اختبار في التقدم
    const savedAnswersKey = `qiyasAnswers_${selectedExam.id}`;
    const savedAnswers = localStorage.getItem(savedAnswersKey);
    setAnswers(savedAnswers ? JSON.parse(savedAnswers) : {});
    setSectionScores({});
    setAllProcessedQuestionsBySection({});
    setQuestions([]);
    setSelectedAnswer(null);
    setIsFinalReviewDialogOpen(false); // Reset on start
    setHasPrayerBreakBeenUsed(false); // Reset prayer break usage for new exam
    setIsSectionBreak(false); // Reset section break
    setSectionBreakTimeLeft(30);
    setPendingNextSectionIdx(null);

    try {
      let flatListOfAllRawQuestions: ExamQuestion[] = [];
      const usedQuestionIds = new Set<number>(); // تتبع الأسئلة المستخدمة

      for (const section of selectedExam.sections) {
        const rawQs = await fetchRawQuestionsForSectionConfig(section, usedQuestionIds);
        flatListOfAllRawQuestions.push(...rawQs);
      }

      // التحقق من وجود أسئلة كافية
      if (flatListOfAllRawQuestions.length === 0) {
        toast({
          title: "خطأ: لا توجد أسئلة",
          description: "لم يتم تحميل أي أسئلة للاختبار. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
        setCurrentView("selection");
        return;
      }

      // تحذير إذا كانت الأسئلة أقل من المطلوب
      if (flatListOfAllRawQuestions.length < selectedExam.totalQuestions) {
        toast({
          title: "تحذير: أسئلة محدودة",
          description: `تم تحميل ${flatListOfAllRawQuestions.length} سؤال فقط من أصل ${selectedExam.totalQuestions} مطلوب. سيتم المتابعة بالأسئلة المتاحة.`,
          variant: "default",
          duration: 6000
        });
      }

      // Ensure total fetched questions match totalQuestions for accurate non-scored distribution
      if (flatListOfAllRawQuestions.length !== selectedExam.totalQuestions) {
          console.warn(`Mismatch: Fetched ${flatListOfAllRawQuestions.length} raw questions, expected ${selectedExam.totalQuestions}. Non-scored distribution might be affected.`);
          // Adjust flatListOfAllRawQuestions to match totalQuestions if necessary (e.g. slice or pad further)
          if (flatListOfAllRawQuestions.length > selectedExam.totalQuestions) {
            flatListOfAllRawQuestions = flatListOfAllRawQuestions.slice(0, selectedExam.totalQuestions);
          } // Padding already handled in fetchRawQuestionsForSectionConfig to some extent
      }


      const numNonScored = selectedExam.nonScoredCount || 0;
      const nonScoredGlobalIndices = new Set<number>();

      if (numNonScored > 0 && flatListOfAllRawQuestions.length > 0) {
        if (selectedExam.nonScoredVerbal !== undefined && selectedExam.nonScoredQuantitative !== undefined) {
          const verbalIndices: number[] = [];
          const quantitativeIndices: number[] = [];
          
          flatListOfAllRawQuestions.forEach((q, index) => {
            if (q.category === 'verbal') {
              verbalIndices.push(index);
            } else if (q.category === 'quantitative') {
              quantitativeIndices.push(index);
            }
          });
          
          for (let i = verbalIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [verbalIndices[i], verbalIndices[j]] = [verbalIndices[j], verbalIndices[i]];
          }
          for (let i = quantitativeIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [quantitativeIndices[i], quantitativeIndices[j]] = [quantitativeIndices[j], quantitativeIndices[i]];
          }
          
          for (let i = 0; i < Math.min(selectedExam.nonScoredVerbal, verbalIndices.length); i++) {
            nonScoredGlobalIndices.add(verbalIndices[i]);
          }
          for (let i = 0; i < Math.min(selectedExam.nonScoredQuantitative, quantitativeIndices.length); i++) {
            nonScoredGlobalIndices.add(quantitativeIndices[i]);
          }
        } else {
          const totalIndices = Array.from({ length: flatListOfAllRawQuestions.length }, (_, i) => i);
          for (let i = totalIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [totalIndices[i], totalIndices[j]] = [totalIndices[j], totalIndices[i]];
          }
          for (let i = 0; i < Math.min(numNonScored, totalIndices.length) ; i++) {
            nonScoredGlobalIndices.add(totalIndices[i]);
          }
        }
      }

      const processedQuestionsMap: {[sectionNumber: number]: ProcessedExamQuestion[]} = {};
      let currentGlobalIndex = 0;
      let cumulativeQuestionCount = 0;

      for (const section of selectedExam.sections) {
        const questionsForThisSection = flatListOfAllRawQuestions.slice(cumulativeQuestionCount, cumulativeQuestionCount + section.questionCount);

        processedQuestionsMap[section.sectionNumber] = questionsForThisSection.map(q => {
          const isNonScored = nonScoredGlobalIndices.has(currentGlobalIndex);
          const processedQ: ProcessedExamQuestion = {
            ...q,
            _isNonScored: isNonScored,
            _globalIndex: currentGlobalIndex,
          };
          currentGlobalIndex++;
          return processedQ;
        });
        cumulativeQuestionCount += section.questionCount;
      }

      setAllProcessedQuestionsBySection(processedQuestionsMap);

      if (selectedExam.sections.length > 0 && processedQuestionsMap[selectedExam.sections[0].sectionNumber]) {
        setQuestions(processedQuestionsMap[selectedExam.sections[0].sectionNumber]);
        setTimeLeft(selectedExam.sections[0].timeLimit * 60);
      } else {
        throw new Error("No questions found or processed for the first section.");
      }

      setExamStartTime(new Date());
      setLastShownSubcategory(null);
      setCurrentView("section-intro");

    } catch (error) {
      console.error("Error starting exam:", error);
      toast({
        title: "خطأ فادح عند بدء الاختبار",
        description: `فشل في تحميل أو معالجة أسئلة الاختبار. ${(error as Error).message}`,
        variant: "destructive",
      });
       setCurrentView("selection");
    }
  };

  const selectAnswer = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    if (questions[currentQuestionIdx]) {
      const questionId = questions[currentQuestionIdx].id;
      setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      const nextQuestionId = questions[nextIdx]?.id;
      setSelectedAnswer(answers[nextQuestionId] ?? null);
    } else {
      moveToNextSection(false); // Call with isTimeOut = false (user action)
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIdx > 0) {
      const prevIdx = currentQuestionIdx - 1;
      setCurrentQuestionIdx(prevIdx);
      const prevQuestionId = questions[prevIdx]?.id;
      setSelectedAnswer(answers[prevQuestionId] ?? null);
    }
  };

   const jumpToQuestion = (index: number) => {
      setCurrentQuestionIdx(index);
      const questionId = questions[index]?.id;
      setSelectedAnswer(answers[questionId] ?? null);
      setIsReviewDialogOpen(false); // Close dialog on jump
  };

    const moveToNextSection = (isTimeOut = false) => {
        if (!selectedExam) return;

        calculateSectionScore(); // Calculate score for the *current* section before moving/finishing

        // التحقق من وجود أسئلة غير مجابة في القسم الحالي
        const currentSectionQuestions = questions || [];
        const unansweredQuestions = currentSectionQuestions.filter((q, index) => {
          return answers[q.id] === undefined;
        });

        // إذا كان هناك أسئلة غير مجابة ولم ينته الوقت، تحذير المستخدم
        if (unansweredQuestions.length > 0 && !isTimeOut && !pendingSectionAdvance) {
          setUnansweredCount(unansweredQuestions.length);
          setShowEarlySubmitConfirm(true);
          return;
        }
        // Reset pending flag after confirm
        setPendingSectionAdvance(false);

        // Check if we are on the last section
        if (currentSectionIdx >= selectedExam.sections.length - 1) {
            if (isTimeOut) {
                finishExam(); // Finish directly if time ran out on the last section
            } else {
                setIsFinalReviewDialogOpen(true); // Show review dialog if user initiated finish
            }
            return;
        }

        // If not the last section, move to the next one
        const nextSectionIndex = currentSectionIdx + 1;

        // Show section break if the exam has sectionBreakDuration configured
        if (selectedExam.sectionBreakDuration && selectedExam.sectionBreakDuration > 0) {
          setPendingNextSectionIdx(nextSectionIndex);
          setSectionBreakTimeLeft(selectedExam.sectionBreakDuration);
          setIsSectionBreak(true);
          return;
        }

        setCurrentSectionIdx(nextSectionIndex);
        setCurrentQuestionIdx(0);

        const nextSectionData = selectedExam.sections[nextSectionIndex];
        const nextSectionQuestions = allProcessedQuestionsBySection[nextSectionData.sectionNumber];

        if (nextSectionQuestions && nextSectionQuestions.length > 0) {
            setQuestions(nextSectionQuestions);
            setTimeLeft(nextSectionData.timeLimit * 60);
            const firstQuestionId = nextSectionQuestions[0]?.id;
            setSelectedAnswer(answers[firstQuestionId] ?? null);
            setLastShownSubcategory(null);
            setCurrentView("section-intro");
        } else {
            toast({
                title: "خطأ في تحميل القسم",
                description: `فشل في تحميل أسئلة القسم التالي (${nextSectionData.name}). إنهاء الاختبار.`,
                variant: "destructive",
            });
            finishExam();
        }
    };


  const calculateSectionScore = () => {
    if (!selectedExam || !questions || questions.length === 0 || currentSectionIdx < 0 || currentSectionIdx >= selectedExam.sections.length) return;

    const currentSectionConfig = selectedExam.sections[currentSectionIdx];
    const sectionNumber = currentSectionConfig.sectionNumber;

    // Make sure to get the questions from allProcessedQuestionsBySection for calculation
    // in case 'questions' hasn't updated yet, though it should be current.
    const questionsForScore = allProcessedQuestionsBySection[sectionNumber] || questions;

    const scoredQuestionsInThisSection = questionsForScore.filter(q => !q._isNonScored);
    let correctCount = 0;

    scoredQuestionsInThisSection.forEach(q => {
      if (answers[q.id] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    setSectionScores(prev => ({
      ...prev,
      [sectionNumber]: { score: correctCount, scoredQuestionsCount: scoredQuestionsInThisSection.length }
    }));
  };

  const finishExam = async () => {
    // Ensure the last section's score is calculated before finishing
    calculateSectionScore();
    // مسح الإجابات المؤقتة المحفوظة بعد إتمام الاختبار
    if (selectedExam) {
      localStorage.removeItem(`qiyasAnswers_${selectedExam.id}`);
    }

    const finalStats = calculateExamStats();
    const currentDate = new Date().toISOString();
    const examName = selectedExam?.name || "اختبار قياس";

    // Calculate detailed results with subcategory breakdown
    const allQuestions = Object.values(allProcessedQuestionsBySection).flat();

    // Build wrong questions for AI review
    const wrongs: WrongQuestion[] = allQuestions
      .filter(q => !q._isNonScored)
      .filter(q => answers[q.id] === undefined || answers[q.id] !== q.correctOptionIndex)
      .map(q => ({
        questionText: q.text,
        options: q.options,
        studentAnswerIndex: answers[q.id] ?? null,
        correctAnswerIndex: q.correctOptionIndex,
        category: q.category,
        subcategory: q.subcategory,
        imageUrl: q.imageUrl || undefined,
      }));
    setWrongQuestionsForAI(wrongs);
    setShowAiReview(true);
    const timeTakenMinutes = finalStats.timeTaken;
    const detailedExamResults = calculateDetailedResults(allQuestions, answers, timeTakenMinutes);
    setDetailedResults(detailedExamResults);

    const storedRecords = localStorage.getItem('examRecords') || '[]';
    let records = [];
    try {
        records = JSON.parse(storedRecords);
    } catch (e) {
        console.error("Failed to parse examRecords from localStorage", e);
        records = []; // Reset if corrupted
    }

    records.push({
      date: currentDate,
      examType: examName,
      score: finalStats.totalCorrect,
      totalQuestions: finalStats.totalScoredQuestions,
      timeTaken: finalStats.timeTaken,
      examId: selectedExam?.id,
      userAnswers: answers,
      sectionScores: sectionScores,
      detailedResults: detailedExamResults, // Store detailed subcategory results
    });
    try {
        localStorage.setItem('examRecords', JSON.stringify(records));
    } catch (e) {
        console.error("Failed to save examRecords to localStorage", e);
        toast({title: "خطأ", description: "لم نتمكن من حفظ نتيجة الاختبار بسبب امتلاء الذاكرة.", variant:"destructive"});
    }

    // حفظ النتيجة في قاعدة البيانات وتحديث النقاط
    if (user?.id) {
      try {
        const timeTakenInSeconds = timeTakenMinutes * 60;
        
        // حساب الأسئلة المتروكة (غير المجاب عليها)
        const allQuestions = Object.values(allProcessedQuestionsBySection).flat();
        const scoredQuestions = allQuestions.filter(q => !q._isNonScored);
        const skippedQuestions = scoredQuestions.filter(q => answers[q.id] === undefined).length;
        
        const response = await apiRequest('POST', '/api/test-results', {
          testType: 'qiyas',
          difficulty: 'advanced', // اختبارات قياس متقدمة
          score: finalStats.totalCorrect,
          totalQuestions: finalStats.totalScoredQuestions,
          timeTaken: timeTakenInSeconds,
          skippedQuestions
        }) as any; // Cast to any لتجنب خطأ TypeScript

        // حفظ النقاط المكتسبة في localStorage للعرض
        if (response?.pointsEarned !== undefined) {
          localStorage.setItem('lastExamPointsEarned', response.pointsEarned.toString());
        }

        // إطلاق حدث تحديث النقاط
        window.dispatchEvent(new Event('pointsUpdated'));
      } catch (error) {
        console.error('Failed to save test results:', error);
      }
    }
    finishExamRef.current = null;
  };

  // Keep finishExamRef updated
  finishExamRef.current = finishExam;

  const examStats = useMemo(() => {
    if (!selectedExam || !examStartTime || Object.keys(allProcessedQuestionsBySection).length === 0) {
      return {
        totalCorrect: 0, totalScoredQuestions: 0, verbalScore: 0, verbalTotal: 0,
        verbalPercentage: 0, quantitativeScore: 0, quantitativeTotal: 0,
        quantitativePercentage: 0, timeTaken: 0, percentage: 0,
      };
    }

    const endTime = new Date();
    const timeDiffInSeconds = Math.round((endTime.getTime() - examStartTime.getTime()) / 1000);
    const actualTimeTakenInMinutes = Math.min(Math.ceil(timeDiffInSeconds / 60), selectedExam.totalTime);

    let totalCorrectScored = 0;
    let totalScoredQuestionsPresented = 0;
    let verbalCorrectScored = 0;
    let quantitativeCorrectScored = 0;
    let verbalTotalScored = 0;
    let quantitativeTotalScored = 0;

    selectedExam.sections.forEach(sectionConfig => {
      const sectionNum = sectionConfig.sectionNumber;
      const questionsInSection = allProcessedQuestionsBySection[sectionNum] || [];

      questionsInSection.forEach(q => {
        if (!q._isNonScored) {
          totalScoredQuestionsPresented++;
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correctOptionIndex;

          // Simplified category check for mixed questions
          if ((q.category as string) === "verbal" || (sectionConfig.category === "mixed" && ((q.category as string) === "verbal" || String(q.text).match(/مرادف|معنى|نص|علاقة/i)) ) ) {
            verbalTotalScored++;
            if (isCorrect) verbalCorrectScored++;
          } else if ((q.category as string) === "quantitative" || (sectionConfig.category === "mixed" && ((q.category as string) === "quantitative" || String(q.text).match(/حساب|هندسة|جبر|نسبة|رقم/i)) ) ) {
            quantitativeTotalScored++;
            if (isCorrect) quantitativeCorrectScored++;
          }
          // This logic for mixed can be refined if questions have clearer sub-categories

          if (isCorrect) totalCorrectScored++;
        }
      });
    });

    const percentage = totalScoredQuestionsPresented > 0 ? (totalCorrectScored / totalScoredQuestionsPresented) * 100 : 0;
    const verbalPercentage = verbalTotalScored > 0 ? (verbalCorrectScored / verbalTotalScored) * 100 : 0;
    const quantitativePercentage = quantitativeTotalScored > 0 ? (quantitativeCorrectScored / quantitativeTotalScored) * 100 : 0;

    return {
      totalCorrect: totalCorrectScored,
      totalScoredQuestions: totalScoredQuestionsPresented,
      verbalScore: verbalCorrectScored,
      verbalTotal: verbalTotalScored,
      verbalPercentage,
      quantitativeScore: quantitativeCorrectScored,
      quantitativeTotal: quantitativeTotalScored,
      quantitativePercentage,
      timeTaken: actualTimeTakenInMinutes,
      percentage,
    };
  }, [selectedExam, examStartTime, answers, allProcessedQuestionsBySection, currentView]); // Depend on currentView to recalculate when results are shown


  const calculateExamStats = () => examStats;

  const handleStartExamClick = async (exam: QiyasExam) => {
    // التحقق من حالة المستخدم
    if (!user) {
      setLocation("/login");
      return;
    }

    // التحقق من توفر الأسئلة قبل بدء الاختبار (باستخدام stats بدلاً من جلب كل الأسئلة)
    try {
      const response = await fetch('/api/questions/stats', { credentials: 'include' });
      if (!response.ok) {
        toast({
          title: "خطأ في الاتصال",
          description: "لا يمكن الوصول إلى قاعدة الأسئلة. تأكد من اتصالك بالإنترنت.",
          variant: "destructive"
        });
        return;
      }

      const stats = await response.json();
      const totalCount = stats?.total ?? 0;
      if (totalCount === 0) {
        toast({
          title: "خطأ: لا توجد أسئلة",
          description: "قاعدة الأسئلة فارغة. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.",
          variant: "destructive"
        });
        return;
      }

      // التحقق من توفر أسئلة كافية لكل قسم
      let totalRequiredQuestions = 0;
      for (const section of exam.sections) {
        totalRequiredQuestions += section.questionCount;
      }

      if (totalCount < totalRequiredQuestions * 0.5) {
        toast({
          title: "تحذير: أسئلة محدودة",
          description: `قاعدة الأسئلة تحتوي على ${totalCount} سؤال فقط. قد تواجه تكرار في الأسئلة.`,
          variant: "default",
          duration: 5000
        });
      }

    } catch (error) {
      // إذا فشل التحقق، نكمل بدون توقف
    }

    const isUserSubscribed = user?.subscription?.type === 'Pro Live' || user?.subscription?.type === 'Pro Life Plus' || user?.subscription?.type === 'Pro Life' || user?.subscription?.type === 'Pro';

    // Default behavior for all other exams
    if (exam.requiresSubscription && !isUserSubscribed) {
        setLocation("/subscription");
    } else {
        loadExam(exam);
    }
  };


  const renderExamSelection = () => {
    const isUserSubscribed = user?.subscription?.type === 'Pro Live' || user?.subscription?.type === 'Pro Life Plus' || user?.subscription?.type === 'Pro Life' || user?.subscription?.type === 'Pro';

    // Exam references
    const examFull    = qiyasExams.find(e => e.id === 1)!; // قدراتك التأهيلي كامل
    const examVerbal  = qiyasExams.find(e => e.id === 2)!; // لفظي 65س
    const examQuant   = qiyasExams.find(e => e.id === 3)!; // كمي 55س
    const examNamer   = qiyasExams.find(e => e.id === 7)!; // نمر كامل
    const examNamer1  = qiyasExams.find(e => e.id === 8)!; // قسم نمر واحد

    const canStart = !!user;

    const ExamTile = ({
      exam, label, sublabel, icon: Icon, accent, locked
    }: { exam: QiyasExam; label: string; sublabel?: string; icon: React.ElementType; accent: string; locked?: boolean }) => (
      <button
        data-testid={`tile-exam-${exam.id}`}
        onClick={() => !locked && handleStartExamClick(exam)}
        disabled={locked}
        className={cn(
          "group relative w-full transition-all duration-200 rounded-2xl border text-right",
          "hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
          locked
            ? "cursor-not-allowed opacity-50 border-border bg-muted/30"
            : "cursor-pointer border-border bg-card hover:border-primary/40 dark:hover:border-primary/60"
        )}
      >
        {/* Mobile: horizontal row layout */}
        <div className="flex sm:hidden items-center gap-3 p-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", accent)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-foreground leading-tight truncate">{label}</div>
            {sublabel && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sublabel}</div>}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{exam.totalQuestions} سؤال</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{exam.totalTime} د</span>
            </div>
          </div>
          {locked && <LockIcon className="w-4 h-4 text-muted-foreground shrink-0" />}
        </div>
        {/* Desktop: vertical card layout */}
        <div className="hidden sm:flex flex-col items-center gap-2 p-4 text-center">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center mb-1 transition-transform group-hover:scale-110", accent)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground leading-tight">{label}</span>
          {sublabel && <span className="text-[11px] text-muted-foreground">{sublabel}</span>}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{exam.totalQuestions} سؤال</span>
            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{exam.totalTime} دقيقة</span>
          </div>
          {locked && <LockIcon className="absolute top-2 left-2 w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
    );

    return (
      <div className="p-4 md:p-8 min-h-screen bg-gray-50 dark:bg-gray-950 font-arabic" dir="rtl">
        <div className="max-w-2xl mx-auto">

          {/* ── Header ── */}
          <div className="text-center mb-5 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white">
              اختبارات <span style={{ color: "#1a7c3e" }}>قياس</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">اختر نظامك وابدأ اختبارك الآن</p>
          </div>

          {/* ══════════════════════════════════════
              البطاقة الرئيسية: قدراتك التأهيلي
          ══════════════════════════════════════ */}
          <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-border bg-white dark:bg-card">

            {/* Card header */}
            <div className="p-5 md:p-7 text-white relative overflow-hidden" style={{ background: "#1a7c3e" }}>
              <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
                  <Brain className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold leading-tight">قدراتك التأهيلي</h2>
                  <p className="text-sm text-white/75 mt-0.5">اختر النظام والنوع المناسب لك</p>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">

              {/* ── نظام 1: النظام العادي ── */}
              <div className="rounded-2xl border border-green-100 bg-green-50/50 dark:bg-green-950/10 p-3 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#1a7c3e" }}>
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground">النظام العادي</h3>
                    <p className="text-xs text-muted-foreground">اختبار كامل أو قسم واحد فقط</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <ExamTile
                    exam={examFull}
                    label="اختبار كامل"
                    sublabel="7 أقسام مختلطة"
                    icon={Brain}
                    accent="bg-[#1a7c3e]"
                    locked={!canStart}
                  />
                  <ExamTile
                    exam={examVerbal}
                    label="لفظي فقط"
                    sublabel="5 أقسام لفظية"
                    icon={Palette}
                    accent="bg-gradient-to-br from-emerald-500 to-green-600"
                    locked={!canStart}
                  />
                  <ExamTile
                    exam={examQuant}
                    label="كمي فقط"
                    sublabel="5 أقسام كمية"
                    icon={Atom}
                    accent="bg-gradient-to-br from-orange-500 to-red-500"
                    locked={!canStart}
                  />
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground px-2">أو</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* ── نظام 2: نظام نمر ── */}
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-900/10 p-3 sm:p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-foreground">نظام نمر</h3>
                      <span className="text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full font-bold">NAMER</span>
                    </div>
                    <p className="text-xs text-muted-foreground">أقسام مختلطة مع استراحة 30 ث بين كل قسم</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <ExamTile
                    exam={examNamer}
                    label="اختبار نمر كامل"
                    sublabel="5 أقسام · استراحة بين كل قسم"
                    icon={Target}
                    accent="bg-gradient-to-br from-rose-500 to-red-600"
                    locked={!canStart}
                  />
                  <ExamTile
                    exam={examNamer1}
                    label="قسم نمر واحد"
                    sublabel="13 لفظي + 12 كمي"
                    icon={Zap}
                    accent="bg-gradient-to-br from-amber-500 to-rose-600"
                    locked={!canStart}
                  />
                </div>
              </div>

              {/* ── Bottom hint ── */}
              {!user ? (
                <p className="text-center text-sm text-muted-foreground">
                  <LockIcon className="inline w-3.5 h-3.5 mb-0.5 mr-1" />
                  يجب <button className="text-primary font-semibold underline" onClick={() => setLocation("/auth")}>تسجيل الدخول</button> لبدء الاختبار
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderExamInstructions = () => {
    if (!selectedExam) return null;
    return (
      <ExamInstructionsScreen
        exam={selectedExam}
        userId={user?.id}
        onStart={startExam}
        onBack={() => setCurrentView("selection")}
      />
    );
  };

  const renderSectionIntro = () => {
    if (!selectedExam) return null;
    const sectionData = selectedExam.sections[currentSectionIdx];
    if (!sectionData) return null;
    return (
      <ExamSectionIntro
        sectionName={sectionData.name}
        sectionNumber={currentSectionIdx + 1}
        totalSections={selectedExam.sections.length}
        questionCount={sectionData.questionCount}
        timeLimit={sectionData.timeLimit}
        category={sectionData.category}
        onStart={() => setCurrentView("inProgress")}
      />
    );
  };

  const renderFinalReviewDialog = () => (
    <Dialog open={isFinalReviewDialogOpen} onOpenChange={setIsFinalReviewDialogOpen}>
      <DialogContent className="font-arabic max-w-md dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#e8f5ee' }}>
            <TrophyIcon className="h-5 w-5" style={{ color: '#1a7c3e' }} />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">على وشك الانتهاء</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              هل تود مراجعة إجاباتك قبل التسليم؟
            </DialogDescription>
          </div>
        </div>

        <div className="my-3 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          المراجعة تمنحك فرصة لتصحيح الأخطاء غير المقصودة والتأكد من فهم الأسئلة. <strong className="text-gray-900 dark:text-white">كل درجة تفرق!</strong>
        </div>

        <div className="flex flex-col gap-2">
          <DialogClose asChild>
            <Button
              className="w-full text-white"
              style={{ background: '#1a7c3e' }}
              onClick={() => setIsReviewDialogOpen(true)}
            >
              <Eye className="h-4 w-4 ml-2" />
              نعم، أريد مراجعة القسم الأخير
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => finishExam()}
            >
              أنهِ الاختبار الآن
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full text-gray-500 dark:text-gray-400">
              إلغاء (البقاء في القسم)
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderMistakeChallengeDialog = () => (
    <Dialog open={isMistakeChallengeDialogOpen} onOpenChange={setIsMistakeChallengeDialogOpen}>
      <DialogContent className="font-arabic max-w-md dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#e8f5ee' }}>
            <Target className="h-5 w-5" style={{ color: '#1a7c3e' }} />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">تحدي الأخطاء</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              لديك <strong>{challengeQuestions.length}</strong> سؤال — اختر طريقة المراجعة
            </DialogDescription>
          </div>
        </div>

        <div className="my-3 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          مراجعة الأخطاء تُرسّخ المعلومات وتمنع تكرارها في الاختبارات القادمة.
        </div>

        <div className="flex flex-col gap-2">
          <DialogClose asChild>
            <Button
              className="w-full text-white flex items-center justify-center gap-2"
              style={{ background: '#1a7c3e' }}
              onClick={() => generateChallengeFile({ isTimed: true, questions: challengeQuestions })}
            >
              <Timer className="h-4 w-4" />
              تحدي بوقت ({challengeQuestions.length} دقيقة)
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 border-gray-300"
              onClick={() => generateChallengeFile({ isTimed: false, questions: challengeQuestions })}
            >
              <Infinity className="h-4 w-4" />
              تحدي بدون وقت
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="ghost" className="w-full text-gray-500 dark:text-gray-400">
              إلغاء
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderExamInProgress = () => {
    if (!selectedExam || !questions || questions.length === 0) {
      return (
        <div className="container py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-200px)] font-arabic animate-fadeIn">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-6"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">جاري تحضير أسئلة الاختبار...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">لحظات قليلة ويبدأ التحدي!</p>
        </div>
      );
    }

    const currentSectionData = selectedExam.sections[currentSectionIdx];
    const currentQuestionData = questions[currentQuestionIdx];

    if (!currentSectionData || !currentQuestionData) {
      toast({ title: "خطأ في عرض السؤال", description: "لا يمكن عرض السؤال أو القسم الحالي. الرجاء المحاولة مرة أخرى.", variant: "destructive", duration: 5000 });
      setCurrentView("selection");
      return null;
    }

    return (
      <>
        {renderPrayerBreakOverlay()}
        {renderSectionBreakOverlay()}
        {renderFinalReviewDialog()}
        {showSubSectionIntro && (
          <SubSectionIntroOverlay
            subcategory={questions[currentQuestionIdx]?.subcategory || ""}
            onContinue={() => setShowSubSectionIntro(false)}
          />
        )}

        {showEarlySubmitConfirm && (
          <div dir="rtl" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 font-arabic">
            <div className="bg-white border border-gray-200 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 className="text-base font-bold text-gray-900 mb-3">تسليم القسم مبكراً</h3>
              <p className="text-gray-700 text-sm mb-2">
                أنت تريد أن تسلّم القسم قبل انتهاء الوقت.
              </p>
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm mb-5">
                لديك <strong>{unansweredCount}</strong> سؤال غير مجاب في هذا القسم. الأسئلة غير المجابة ستُحسب كإجابات خاطئة.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEarlySubmitConfirm(false);
                    setPendingSectionAdvance(true);
                    setTimeout(() => moveToNextSection(false), 50);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded text-sm transition-colors"
                >
                  نعم، سلّم القسم
                </button>
                <button
                  onClick={() => setShowEarlySubmitConfirm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  إلغاء، أكمل الإجابة
                </button>
              </div>
            </div>
          </div>
        )}

        <QiyasExamLayout
          examTitle={selectedExam.name}
          questionNumber={currentQuestionIdx + 1}
          totalQuestions={questions.length}
          sectionLabel={currentSectionData.name}
          sectionNumber={currentSectionIdx + 1}
          totalSections={selectedExam.sections.length}
          timeLeft={timeLeft}
          isTimeUrgent={timeLeft <= 60}
          questionText={currentQuestionData.text}
          questionImageUrl={currentQuestionData.imageUrl}
          options={currentQuestionData.options}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={selectAnswer}
          questionsStatus={questions.map(q => ({
            answered: answers[q.id] !== undefined,
            bookmarked: bookmarkedQuestions.has(q.id)
          }))}
          currentQuestionIndex={currentQuestionIdx}
          onJumpToQuestion={jumpToQuestion}
          onPrev={goToPreviousQuestion}
          onNext={goToNextQuestion}
          onFinish={goToNextQuestion}
          canGoPrev={currentQuestionIdx > 0}
          canGoNext={true}
          isLastQuestion={currentQuestionIdx === questions.length - 1}
          isBookmarked={bookmarkedQuestions.has(currentQuestionData.id)}
          onToggleBookmark={toggleBookmark}
          userName={user?.username || user?.name}
          userId={user?.id?.toString()}
          topRightSlot={
            <div className="flex items-center gap-2">
              <EndTestButton
                onEndTest={finishExam}
                variant="subtle"
                testName={selectedExam.name}
                showProgress={true}
                questionsAnswered={Object.keys(answers).length}
                totalQuestions={selectedExam.totalQuestions}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!isPrayerBreak && !hasPrayerBreakBeenUsed) {
                    setIsPrayerBreak(true);
                    setHasPrayerBreakBeenUsed(true);
                    setPrayerBreakStartTime(new Date());
                    setPrayerBreakTimeLeft(900); // Reset to 15 minutes
                  } else if (isPrayerBreak) {
                    setIsPrayerBreak(false);
                  }
                }}
                disabled={!isPrayerBreak && hasPrayerBreakBeenUsed}
                className={cn(
                  "transition-colors dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700 text-xs",
                  isPrayerBreak && "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-700/30 dark:text-orange-300 dark:border-orange-600",
                  (!isPrayerBreak && hasPrayerBreakBeenUsed) && "opacity-50 cursor-not-allowed"
                )}
              >
                <Moon className="h-3.5 w-3.5 ml-1" />
                {isPrayerBreak ? "استئناف" : hasPrayerBreakBeenUsed ? "تم استخدامه" : "توقف للصلاة"}
              </Button>
            </div>
          }
        />
      </>
    );
  };

  const startChallengeFlow = () => {
    if (!selectedExam || !allProcessedQuestionsBySection) {
        toast({ title: "خطأ", description: "بيانات الاختبار غير متوفرة.", variant: "destructive" });
        return;
    }

    const incorrectOrUnansweredQuestionsData: ChallengeQuestionData[] = [];

    Object.entries(allProcessedQuestionsBySection).forEach(([sectionNumStr, sectionQuestions]) => {
        const sectionConfig = selectedExam.sections.find(s => s.sectionNumber === parseInt(sectionNumStr));
        sectionQuestions.forEach(q => {
            const userAnswerOriginalIndex = answers[q.id];
            const isCorrect = userAnswerOriginalIndex === q.correctOptionIndex;
            const wasUnanswered = userAnswerOriginalIndex === undefined;

            if (!isCorrect || wasUnanswered) { // Include incorrect and unanswered
                incorrectOrUnansweredQuestionsData.push({
                    ...q,
                    userAnswerIndex: userAnswerOriginalIndex,
                    sectionName: sectionConfig?.name || `القسم ${sectionNumStr}`,
                    wasUnanswered: wasUnanswered,
                });
            }
        });
    });

    if (incorrectOrUnansweredQuestionsData.length === 0) {
        toast({
            title: "ممتاز! 🎉",
            description: `أجبت على جميع الأسئلة بشكل صحيح! لا توجد أسئلة خاطئة أو غير مجاب عليها للمراجعة. أداؤك كان مثالياً!`,
            duration: 6000,
            className: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
        });
        return;
    }

    // Always show the creative challenge options dialog
    setChallengeQuestions(incorrectOrUnansweredQuestionsData);
    setIsMistakeChallengeDialogOpen(true);
};

const generateChallengeFile = ({ isTimed, questions: incorrectOrUnansweredQuestionsData }: { isTimed: boolean, questions: ChallengeQuestionData[] }) => {
    if (!selectedExam) return;

    // Close the dialog if it was open
    setIsMistakeChallengeDialogOpen(false);

    const examNameForFile = selectedExam.name.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '_');
    const optionChars = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

    if (isMobile) {
        // Generate HTML for Mobile (Static Review) - This part remains unchanged
        let mobileHtmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مراجعة الأخطاء: ${selectedExam.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet">
    <style>
        /* Light and Dark Mode Variables */
        :root {
            --bg-color: #f4f7f9;
            --text-color: #333;
            --container-bg: #fff;
            --header-color: #667eea;
            --border-color: #e0e0e0;
            --question-bg: #fcfdff;
            --question-text: #2c3e50;
            --correct-bg: #d4edda;
            --correct-border: #c3e6cb;
            --correct-text: #155724;
            --incorrect-bg: #f8d7da;
            --incorrect-border: #f5c6cb;
            --incorrect-text: #721c24;
            --explanation-bg: #e9ecef;
            --explanation-text: #495057;
            --shadow: rgba(0,0,0,0.1);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #1a1b23;
                --text-color: #e2e8f0;
                --container-bg: #2d3748;
                --header-color: #90cdf4;
                --border-color: #4a5568;
                --question-bg: #2d3748;
                --question-text: #f7fafc;
                --correct-bg: #2f855a;
                --correct-border: #38a169;
                --correct-text: #c6f6d5;
                --incorrect-bg: #e53e3e;
                --incorrect-border: #fc8181;
                --incorrect-text: #fed7d7;
                --explanation-bg: #4a5568;
                --explanation-text: #cbd5e0;
                --shadow: rgba(0,0,0,0.3);
            }
        }

        /* Dark mode toggle button */
        .theme-toggle {
            position: fixed;
            top: 20px;
            left: 20px;
            background: var(--container-bg);
            border: 2px solid var(--border-color);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: 0 2px 10px var(--shadow);
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .theme-toggle:hover {
            transform: scale(1.1);
        }

        body {
            font-family: 'Noto Kufi Arabic', sans-serif;
            margin: 0;
            padding: 10px;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.7;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        .container {
            background-color: var(--container-bg);
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 4px 15px var(--shadow);
            max-width: 800px;
            margin: 20px auto;
            transition: background-color 0.3s ease, box-shadow 0.3s ease;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid var(--header-color);
        }

        .header h1 {
            color: var(--header-color);
            font-size: 1.6rem;
            margin-bottom: 5px;
        }

        .header p {
            color: var(--text-color);
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .question-review {
            border: 1px solid var(--border-color);
            border-radius: 10px;
            margin-bottom: 20px;
            padding: 15px;
            background-color: var(--question-bg);
            transition: all 0.3s ease;
        }

        .question-text {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 12px;
            color: var(--question-text);
        }

        .info-badge {
            display: inline-block;
            font-size: 0.75rem;
            padding: 3px 8px;
            border-radius: 15px;
            margin-right: 8px;
            margin-bottom: 8px;
            font-weight: bold;
        }

        .info-badge.section {
            background-color: #e7f3ff;
            color: #007bff;
        }

        .info-badge.experimental {
            background-color: #fff3cd;
            color: #856404;
        }

        .answer-info {
            font-size: 0.9rem;
            color: var(--text-color);
            margin-bottom: 8px;
            padding: 8px;
            border-radius: 6px;
        }

        .answer-info.user-ans {
            background-color: var(--incorrect-bg);
            border-left: 3px solid var(--incorrect-border);
            color: var(--incorrect-text);
        }

        .answer-info.user-ans.unanswered {
            background-color: #fff9c4;
            border-left: 3px solid #fdd835;
            color: #856404;
        }

        .answer-info.correct-ans {
            background-color: var(--correct-bg);
            border-left: 3px solid var(--correct-border);
            color: var(--correct-text);
        }

        .options-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .options-list li {
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            background-color: var(--container-bg);
            transition: all 0.3s ease;
        }

        .options-list li.correct {
            background-color: var(--correct-bg);
            border-color: var(--correct-border);
            color: var(--correct-text);
            font-weight: bold;
        }

        .options-list li.user-incorrect {
            background-color: var(--incorrect-bg);
            border-color: var(--incorrect-border);
            color: var(--incorrect-text);
            text-decoration: line-through;
        }

        .explanation {
            margin-top: 12px;
            padding: 12px;
            background-color: var(--explanation-bg);
            border-radius: 6px;
            font-size: 0.9rem;
            color: var(--explanation-text);
            transition: all 0.3s ease;
        }

        .explanation strong {
            color: var(--question-text);
        }

        .footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid var(--border-color);
            font-size: 0.85rem;
            color: var(--text-color);
            opacity: 0.7;
        }

        @media (max-width: 600px) {
            .header h1 {font-size: 1.4rem;}
            .question-text {font-size: 1rem;}
            .theme-toggle {
                width: 40px;
                height: 40px;
                font-size: 1rem;
                top: 15px;
                left: 15px;
            }
        }

        /* Dark mode class toggle */
        body.dark-mode {
            --bg-color: #1a1b23;
            --text-color: #e2e8f0;
            --container-bg: #2d3748;
            --header-color: #90cdf4;
            --border-color: #4a5568;
            --question-bg: #2d3748;
            --question-text: #f7fafc;
            --correct-bg: #2f855a;
            --correct-border: #38a169;
            --correct-text: #c6f6d5;
            --incorrect-bg: #e53e3e;
            --incorrect-border: #fc8181;
            --incorrect-text: #fed7d7;
            --explanation-bg: #4a5568;
            --explanation-text: #cbd5e0;
            --shadow: rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <!-- Dark Mode Toggle Button -->
    <button class="theme-toggle" onclick="toggleDarkMode()" title="تبديل الوضع الليلي">
        🌙
    </button>

    <script>
        // Dark mode toggle functionality
        function toggleDarkMode() {
            const body = document.body;
            const toggle = document.querySelector('.theme-toggle');

            body.classList.toggle('dark-mode');

            // Update button icon
            if (body.classList.contains('dark-mode')) {
                toggle.innerHTML = '☀️';
                localStorage.setItem('darkMode', 'enabled');
            } else {
                toggle.innerHTML = '🌙';
                localStorage.setItem('darkMode', 'disabled');
            }
        }

        // Load dark mode preference
        document.addEventListener('DOMContentLoaded', function() {
            const darkMode = localStorage.getItem('darkMode');
            const toggle = document.querySelector('.theme-toggle');

            if (darkMode === 'enabled' || (darkMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.body.classList.add('dark-mode');
                toggle.innerHTML = '☀️';
            } else {
                toggle.innerHTML = '🌙';
            }
        });
    </script>

    <div class="container">
        <div class="header">
            <h1>مراجعة الأخطاء والأسئلة غير المجابة</h1>
            <p>اختبار: ${selectedExam.name}</p>
            <p>تاريخ المراجعة: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>`;

        incorrectOrUnansweredQuestionsData.forEach((q, index) => {
            mobileHtmlContent += `
            <div class="question-review">
                <span class="info-badge section">القسم: ${q.sectionName}</span>
                ${q._isNonScored ? '<span class="info-badge experimental">سؤال تجريبي</span>' : ''}
                <p class="question-text">(${index + 1}) ${q.text}</p>`;

            if (q.wasUnanswered) {
                mobileHtmlContent += `<div class="answer-info user-ans unanswered"><strong>إجابتك الأصلية:</strong> لم يتم الإجابة على هذا السؤال.</div>`;
            } else if (q.userAnswerIndex !== undefined) {
                mobileHtmlContent += `<div class="answer-info user-ans"><strong>إجابتك الأصلية:</strong> ${optionChars[q.userAnswerIndex]}. ${q.options[q.userAnswerIndex]} (خاطئة)</div>`;
            }
            mobileHtmlContent += `<div class="answer-info correct-ans"><strong>الإجابة الصحيحة:</strong> ${optionChars[q.correctOptionIndex]}. ${q.options[q.correctOptionIndex]}</div>`;

            mobileHtmlContent += `<p><strong>الخيارات:</strong></p><ul class="options-list">`;
            q.options.forEach((opt, optIdx) => {
                let liClass = '';
                if (optIdx === q.correctOptionIndex) liClass = 'correct';
                else if (optIdx === q.userAnswerIndex) liClass = 'user-incorrect';
                mobileHtmlContent += `<li class="${liClass}">${optionChars[optIdx]}. ${opt}</li>`;
            });
            mobileHtmlContent += `</ul>`;

            if (q.explanation) {
                mobileHtmlContent += `<div class="explanation"><strong>الشرح:</strong> ${q.explanation}</div>`;
            }
            mobileHtmlContent += `</div>`;
        });

        mobileHtmlContent += `
        <div class="footer">© ${new Date().getFullYear()} منصة قدراتك</div>
    </div>
</body>
</html>`;
        const blob = new Blob([mobileHtmlContent], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${examNameForFile}_مراجعة_الاخطاء_جوال.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast({
            title: "تم تحميل ملخص الأخطاء",
            description: `تم إنشاء ملف لمراجعة ${incorrectOrUnansweredQuestionsData.length} سؤال. افتحه في متصفحك على الجوال.`,
            duration: 7000
        });

    } else {
        // Generate HTML for Desktop (Interactive Challenge) - Now with timer option
        const questionsJson = JSON.stringify(incorrectOrUnansweredQuestionsData.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation || "راجع مصادرك لمزيد من التفاصيل.",
            userAnswerIndex: q.userAnswerIndex,
            sectionName: q.sectionName,
            isNonScored: q._isNonScored || false,
            wasUnanswered: q.wasUnanswered,
        })));

        const desktopInteractiveHtmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحدي الأخطاء: ${selectedExam.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #667eea; /* Indigo */
            --secondary-color: #764ba2; /* Purple */
            --success-color: #28a745; /* Green */
            --danger-color: #dc3545; /* Red */
            --warning-color: #ffc107; /* Yellow */
            --light-bg: #f8f9fa;
            --dark-text: #212529;
            --light-text: #f8f9fa;
            --card-bg: #ffffff;
            --border-color: #e0e0e0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Noto Kufi Arabic', sans-serif;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            color: var(--dark-text);
            padding: 20px;
            min-height: 100vh;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background-color: var(--card-bg);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.25);
            width: 100%;
            max-width: 850px;
            margin: 20px auto;
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 3px solid var(--primary-color);
        }
        .header h1 {
            color: var(--primary-color);
            font-size: 2rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .header p { color: #555; font-size: 1rem; line-height: 1.6; }

        #timer-container {
            text-align: center;
            font-size: 1.2rem;
            font-weight: bold;
            color: var(--dark-text);
            background-color: #f0f2f5;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        #timer-display {
            color: var(--primary-color);
            padding: 0 8px;
        }
        #timer-display.low-time {
            color: var(--danger-color);
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .controls { margin-bottom: 20px; padding: 15px; background-color: #f0f2f5; border-radius: 8px; display: flex; align-items: center; }
        .controls label { font-size: 0.95rem; color: #333; display: flex; align-items: center; cursor: pointer; }
        .controls input[type="checkbox"] { margin-left: 10px; width: 18px; height: 18px; accent-color: var(--primary-color); }

        #progress-bar-container {
            width: 100%; background-color: #e9ecef; border-radius: 25px;
            margin-bottom: 25px; height: 22px; overflow: hidden;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
        }
        #progress-bar {
            width: 0%; height: 100%;
            background: linear-gradient(90deg, var(--success-color), #52c234); /* Green gradient */
            border-radius: 25px;
            transition: width 0.4s ease-in-out;
            text-align: center; color: white;
            font-size: 0.9rem; line-height: 22px; font-weight: 600;
        }

        .question-card {
            padding: 20px; border: 1px solid var(--border-color);
            border-radius: 12px; margin-bottom: 20px;
            background: #fff;
            box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        }
        .question-text {
            font-size: 1.2rem; font-weight: 600;
            margin-bottom: 18px; color: #2c3e50; line-height: 1.7;
        }
        .original-info {
            font-size: 0.9rem; color: #454545;
            margin-bottom: 18px; background-color: #f9f9f9;
            padding: 15px; border-radius: 8px; border-right: 4px solid var(--warning-color);
        }
        .original-info strong { color: #2c3e50; }
        .original-info .detail { margin-top: 5px; }
        .original-info .correct-highlight { color: var(--success-color); font-weight: bold; }
        .original-info .incorrect-highlight { color: var(--danger-color); font-weight: bold; }
        .original-info .unanswered-highlight { color: #fd7e14; font-weight: bold; } /* Orange for unanswered */

        .options-list { list-style: none; padding: 0; margin: 0; }
        .options-list li {
            padding: 14px 18px; margin: 10px 0;
            border: 2px solid var(--border-color);
            border-radius: 10px; cursor: pointer;
            transition: all 0.25s ease; display: flex; align-items: center;
            background-color: #fff; font-size: 1rem; min-height: 55px;
        }
        .options-list li:hover { border-color: var(--primary-color); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102,126,234,0.2); }
        .options-list li.selected {
            border-color: var(--primary-color);
            background-color: #e8f5ee /* Light green */ */
            font-weight: 600; color: var(--primary-color);
            transform: translateY(-2px); box-shadow: 0 5px 18px rgba(102,126,234,0.3);
        }
        .option-letter {
            min-width: 38px; height: 38px;
            background: linear-gradient(135deg, #bdc3c7, #95a5a6); /* Grey gradient */
            color: white; border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
            margin-left: 15px; font-weight: bold; font-size: 1rem; flex-shrink: 0;
            transition: background 0.25s ease;
        }
        .options-list li.selected .option-letter { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); }

        .feedback-area {
            margin-top: 18px; padding: 15px; border-radius: 10px;
            font-size: 1rem; display: none; line-height: 1.6; font-weight: 600;
            text-align: center;
        }
        .feedback-area.correct { background-color: #d4edda; color: #155724; border: 2px solid var(--success-color); }
        .feedback-area.incorrect { background-color: #f8d7da; color: #721c24; border: 2px solid var(--danger-color); }
        .explanation-text { margin-top: 12px; font-style: normal; font-weight:normal; color: #333; line-height: 1.7; font-size: 0.95rem; text-align:right; padding:10px; background-color: #f0f0f0; border-radius: 6px;}
        .explanation-text strong { color: var(--primary-color); }

        #navigation-buttons, #result-area { text-align: center; margin-top: 25px; }
        button {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white; border: none; padding: 14px 28px;
            border-radius: 30px; font-size: 1.05rem; cursor: pointer;
            transition: all 0.3s ease; margin: 8px; font-weight: 600;
            min-width: 130px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        button:hover { transform: translateY(-3px); box-shadow: 0 7px 20px rgba(102,126,234,0.35); }
        button:active { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(102,126,234,0.25); }
        button:disabled {
            background: linear-gradient(135deg, #b0bec5, #90a4ae); /* Disabled grey */
            cursor: not-allowed; transform: none; box-shadow: none; opacity: 0.7;
        }
        #submit-retake-btn { background: linear-gradient(135deg, var(--success-color), #388e3c); } /* Green */
        #submit-retake-btn:hover { box-shadow: 0 7px 20px rgba(40,167,69,0.3); }

        #result-area { padding: 20px; background-color: #f0f2f5; border-radius: 12px; }
        #result-area h2 { color: var(--primary-color); font-size: 1.8rem; margin-bottom:15px; }
        #result-area p { margin: 12px 0; font-size: 1.1rem; color: #333; }
        #feedback-message { font-weight: bold; }

        .footer {
            text-align: center; margin-top: 30px; padding-top: 20px;
            border-top: 2px solid #e9ecef; font-size: 0.9rem; color: #6c757d;
        }
        .no-questions {
            text-align: center; font-size: 1.3rem; color: var(--success-color);
            padding: 35px; background-color: #e6ffed;
            border-radius: 15px; border: 2px solid var(--success-color);
            font-weight: 600;
        }
        .toggleable-original-details { display: block; /* Default to show, JS will hide if checkbox is unchecked initially */ }
        .hidden { display: none !important; }

        @media (max-width: 768px) {
            body { padding: 10px; font-size: 15px; }
            .container { padding: 20px; }
            .header h1 { font-size: 1.7rem; }
            .question-text { font-size: 1.1rem; }
            .options-list li { padding: 12px 15px; font-size: 0.95rem; min-height: 50px; }
            .option-letter { min-width: 30px; height: 30px; font-size: 0.9rem; margin-left: 10px; }
            button { padding: 10px 18px; font-size: 0.9rem; min-width: 100px; }
            #navigation-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
        }
        @media (max-width: 480px) {
            .header h1 { font-size: 1.5rem; }
            .question-text { font-size: 1rem; }
            .options-list li { font-size: 0.9rem; padding: 10px 12px; min-height: 45px; }
            .option-letter { min-width: 30px; height: 30px; font-size: 0.9rem; margin-left: 10px; }
            button { padding: 10px 18px; font-size: 0.9rem; min-width: 100px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 تحدي الأخطاء والأسئلة غير المجابة</h1>
            <p>هذه فرصتك لمراجعة وتصحيح الأسئلة التي أخطأت بها أو لم تجب عليها. ركز جيداً!</p>
        </div>
        <div id="timer-container" class="hidden">
            <p>⏳ الوقت المتبقي: <span id="timer-display"></span></p>
        </div>
        <div class="controls">
            <label for="toggle-details-cb">
                <input type="checkbox" id="toggle-details-cb" onchange="toggleOriginalDetailsVisibility(this.checked)" checked>
                إظهار التفاصيل الأصلية (إجابتك السابقة، الإجابة الصحيحة، القسم، إلخ)
            </label>
        </div>
        <div id="progress-bar-container">
            <div id="progress-bar">0%</div>
        </div>
        <div id="question-area">
            </div>
        <div id="navigation-buttons">
            <button id="prev-btn" onclick="prevRetakeQuestion()" disabled>السابق</button>
            <button id="next-btn" onclick="nextRetakeQuestion()">التالي</button>
            <button id="submit-retake-btn" onclick="submitRetake()" style="display:none;">عرض النتيجة النهائية للتحدي</button>
        </div>
        <div id="result-area" style="display:none;">
            <h2>نتائج تحدي الأخطاء:</h2>
            <p id="score-text"></p>
            <p id="feedback-message"></p>
            <button onclick="restartRetake()">أعد محاولة التحدي</button>
        </div>
    </div>
    <div class="footer">
        © ${new Date().getFullYear()} منصة قدراتك - بالتوفيق في رحلتك التعليمية!
    </div>

    <script>
        const IS_TIMED = ${isTimed};
        const TIME_LIMIT_SECONDS = ${isTimed ? incorrectOrUnansweredQuestionsData.length * 60 : 0};
        let timerInterval;
        let timeLeft = TIME_LIMIT_SECONDS;

        let allIncorrectOrUnansweredQuestions = [];
        let userRetakeAnswers = {}; // { questionOriginalId: selectedOptionOriginalIndex }
        let currentRetakeQuestionDisplayIndex = 0;
        let retakeSubmitted = false;
        let mappedQuestionsForRetake = [];
        const optionDisplayChars = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
        let showOriginalDetails = true;

        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return \`\${String(minutes).padStart(2, '0')}:\${String(remainingSeconds).padStart(2, '0')}\`;
        }

        function startTimer() {
            if (!IS_TIMED) return;
            const timerContainer = document.getElementById('timer-container');
            const timerDisplay = document.getElementById('timer-display');
            if (!timerContainer || !timerDisplay) return;

            timerContainer.classList.remove('hidden');
            timeLeft = TIME_LIMIT_SECONDS;
            timerDisplay.textContent = formatTime(timeLeft);
            timerDisplay.classList.remove('low-time');

            clearInterval(timerInterval); // Clear any existing timer
            timerInterval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = formatTime(timeLeft);
                if (timeLeft <= 60 && !timerDisplay.classList.contains('low-time')) {
                    timerDisplay.classList.add('low-time');
                }
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    alert('انتهى الوقت! سيتم عرض نتيجتك الآن.');
                    submitRetake();
                }
            }, 1000);
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function createQuestionMapWithShuffledOptions(question) {
            const optionsWithOriginalIndex = question.options.map((optionText, originalIndex) => ({
                text: optionText,
                originalIndex: originalIndex
            }));
            const shuffledOptions = shuffleArray([...optionsWithOriginalIndex]);
            return { ...question, shuffledOptions };
        }

        function toggleOriginalDetailsVisibility(isVisible) {
            showOriginalDetails = isVisible;
            const detailDivs = document.querySelectorAll('.toggleable-original-details');
            detailDivs.forEach(div => {
                div.style.display = isVisible ? 'block' : 'none';
            });
        }

        function loadRetakeQuestion(index) {
            const questionArea = document.getElementById('question-area');
            const questionData = mappedQuestionsForRetake[index];
            if (!questionData) return;

            const progressBar = document.getElementById('progress-bar');
            const progressPercentage = Math.round(((index + 1) / mappedQuestionsForRetake.length) * 100);
            progressBar.style.width = progressPercentage + '%';
            progressBar.textContent = progressPercentage + '%';

            let originalAnswerHtml = '';
            if (questionData.wasUnanswered) {
                originalAnswerHtml = '<p class="detail">إجابتك الأصلية: <span class="unanswered-highlight">لم تجب على هذا السؤال</span></p>';
            } else if (questionData.userAnswerIndex !== undefined) {
                originalAnswerHtml = \`<p class="detail">إجابتك الأصلية: <span class="incorrect-highlight">"\${questionData.options[questionData.userAnswerIndex]}" (خاطئة)</span></p>\`;
            }

            questionArea.innerHTML = \`
                <div class="question-card" id="qcard-\${questionData.id}">
                    <p class="question-text">(\${index + 1}/\${mappedQuestionsForRetake.length}) \${questionData.text}</p>
                    <div class="original-info">
                        <p><strong>تذكير بالامتحان الأصلي:</strong></p>
                        \${originalAnswerHtml}
                        <div class="toggleable-original-details" style="display: \${showOriginalDetails ? 'block' : 'none'};">
                            <p class="detail">الإجابة الصحيحة الأصلية: <span class="correct-highlight">"\${questionData.options[questionData.correctOptionIndex]}"</span></p>
                            <p class="detail">القسم الأصلي: <strong>\${questionData.sectionName}</strong></p>
                            <p class="detail">\${questionData.isNonScored ? '<span style="color: #0984e3; font-weight: bold;">📝 سؤال تجريبي (غير محسوب في النتيجة)</span>' : '<span style="color: var(--success-color); font-weight: bold;">✓ سؤال محسوب في النتيجة</span>'}</p>
                        </div>
                    </div>
                    <ul class="options-list" id="options-\${questionData.id}">
                        \${questionData.shuffledOptions.map((opt, i) => \`
                            <li onclick="selectRetakeAnswer('\${questionData.id}', \${opt.originalIndex}, this)">
                                <span class="option-letter">\${optionDisplayChars[i] || i+1}</span>
                                <span style="flex: 1;">\${opt.text}</span>
                            </li>
                        \`).join('')}
                    </ul>
                    <div class="feedback-area" id="feedback-\${questionData.id}"></div>
                </div>
            \`;

            if (userRetakeAnswers[questionData.id] !== undefined) {
                const listItems = document.getElementById(\`options-\${questionData.id}\`).getElementsByTagName('li');
                const selectedOriginalIndex = userRetakeAnswers[questionData.id];
                for (let i = 0; i < listItems.length; i++) {
                    if (questionData.shuffledOptions[i].originalIndex === selectedOriginalIndex) {
                        listItems[i].classList.add('selected');
                        break;
                    }
                }
            }
            if (retakeSubmitted) {
                showFeedbackForQuestion(questionData);
            }

            document.getElementById('prev-btn').disabled = index === 0;
            document.getElementById('next-btn').disabled = index === mappedQuestionsForRetake.length - 1;
            document.getElementById('submit-retake-btn').style.display = (index === mappedQuestionsForRetake.length - 1) ? 'inline-block' : 'none';
            document.getElementById('result-area').style.display = 'none';
            if(retakeSubmitted) {
                 const qOptionsList = document.getElementById(\`options-\${questionData.id}\`);
                 if(qOptionsList) { Array.from(qOptionsList.getElementsByTagName('li')).forEach(li => li.onclick = null); }
            }
        }

        function showFeedbackForQuestion(qData) {
            const feedbackDiv = document.getElementById(\`feedback-\${qData.id}\`);
            if (!feedbackDiv) return;
            const selectedOptOriginalIndex = userRetakeAnswers[qData.id];
            const isCorrectThisTime = selectedOptOriginalIndex === qData.correctOptionIndex;
            let feedbackHtml = '';
            if (selectedOptOriginalIndex !== undefined) {
                if (isCorrectThisTime) {
                    feedbackHtml = \`🎉 ممتاز! إجابة صحيحة هذه المرة.\`;
                    feedbackDiv.className = 'feedback-area correct';
                } else {
                    feedbackHtml = \`❌ للأسف، إجابة خاطئة. الإجابة الصحيحة كانت: <strong class="correct-highlight">"\${qData.options[qData.correctOptionIndex]}"</strong>.\`;
                    feedbackDiv.className = 'feedback-area incorrect';
                }
            } else {
                feedbackHtml = \`⚠️ لم تجب على هذا السؤال في التحدي. الإجابة الصحيحة هي: <strong class="correct-highlight">"\${qData.options[qData.correctOptionIndex]}"</strong>.\`;
                feedbackDiv.className = 'feedback-area incorrect';
            }
            if (qData.explanation) {
                feedbackHtml += \`<div class="explanation-text"><strong>الشرح:</strong> \${qData.explanation}</div>\`;
            }
            feedbackDiv.innerHTML = feedbackHtml;
            feedbackDiv.style.display = 'block';
        }

        function selectRetakeAnswer(questionId, originalOptionIndex, listItemElement) {
            if (retakeSubmitted) return;
            userRetakeAnswers[questionId] = originalOptionIndex;
            const optionsList = listItemElement.parentNode;
            Array.from(optionsList.getElementsByTagName('li')).forEach(li => li.classList.remove('selected'));
            listItemElement.classList.add('selected');
        }

        function prevRetakeQuestion() {
            if (currentRetakeQuestionDisplayIndex > 0) {
                currentRetakeQuestionDisplayIndex--;
                loadRetakeQuestion(currentRetakeQuestionDisplayIndex);
            }
        }

        function nextRetakeQuestion() {
            if (currentRetakeQuestionDisplayIndex < mappedQuestionsForRetake.length - 1) {
                currentRetakeQuestionDisplayIndex++;
                loadRetakeQuestion(currentRetakeQuestionDisplayIndex);
            }
        }

        function submitRetake() {
            if (retakeSubmitted) return;
            retakeSubmitted = true;
            clearInterval(timerInterval);
            let score = 0;
            mappedQuestionsForRetake.forEach(qData => {
                if (userRetakeAnswers[qData.id] === qData.correctOptionIndex) {
                    score++;
                }
                showFeedbackForQuestion(qData);
                const qOptionsList = document.getElementById(\`options-\${qData.id}\`);
                if(qOptionsList) { Array.from(qOptionsList.getElementsByTagName('li')).forEach(li => li.onclick = null); }
            });
            const resultArea = document.getElementById('result-area');
            const scoreText = document.getElementById('score-text');
            const feedbackMsg = document.getElementById('feedback-message');
            const percentageScore = mappedQuestionsForRetake.length > 0 ? ((score / mappedQuestionsForRetake.length) * 100).toFixed(1) : 0;
            scoreText.textContent = \`نتيجتك في هذا التحدي: \${score} من \${mappedQuestionsForRetake.length} (\${percentageScore}%)\`;
            if (mappedQuestionsForRetake.length === 0) {
                 feedbackMsg.textContent = "لا توجد أسئلة في هذا التحدي.";
            } else if (score === mappedQuestionsForRetake.length) {
                feedbackMsg.textContent = "🎉 مذهل! لقد أتقنت جميع الأسئلة التي واجهتك في هذا التحدي. استمر على هذا المنوال!";
                feedbackMsg.style.color = "var(--success-color)";
            } else if (score >= mappedQuestionsForRetake.length * 0.7) {
                feedbackMsg.textContent = "👍 رائع! لقد تحسنت بشكل كبير. القليل من المراجعة وستصل للكمال.";
                feedbackMsg.style.color = "#54a0ff";
            } else if (score >= mappedQuestionsForRetake.length * 0.4) {
                feedbackMsg.textContent = "💡 جيد! لقد قطعت شوطاً. ركز على مراجعة الأخطاء لفهم أعمق.";
                 feedbackMsg.style.color = "#f39c12";
            } else {
                feedbackMsg.textContent = "💪 لا تستسلم! كل محاولة هي خطوة نحو الإتقان. راجع الشروحات بعناية وحاول مجدداً.";
                feedbackMsg.style.color = "var(--danger-color)";
            }
            resultArea.style.display = 'block';
            document.getElementById('navigation-buttons').style.display = 'none';
            document.getElementById('submit-retake-btn').style.display = 'none';
            resultArea.scrollIntoView({ behavior: 'smooth' });
        }

        function restartRetake() {
            currentRetakeQuestionDisplayIndex = 0;
            userRetakeAnswers = {};
            retakeSubmitted = false;
            clearInterval(timerInterval);

            mappedQuestionsForRetake.forEach(q => {
                q.shuffledOptions = shuffleArray([...q.options.map((text, originalIndex) => ({text, originalIndex}))]);
            });

            mappedQuestionsForRetake.forEach(qData => {
                const feedbackDiv = document.getElementById(\`feedback-\${qData.id}\`);
                if (feedbackDiv) { feedbackDiv.innerHTML = ''; feedbackDiv.style.display = 'none';}
            });
            document.getElementById('navigation-buttons').style.display = 'block';
            document.getElementById('result-area').style.display = 'none';
            document.getElementById('submit-retake-btn').style.display = (mappedQuestionsForRetake.length === 1) ? 'inline-block' : 'none';
            toggleOriginalDetailsVisibility(document.getElementById('toggle-details-cb').checked);

            startTimer(); // Restart the timer
            loadRetakeQuestion(0);
        }

        window.onload = () => {
            allIncorrectOrUnansweredQuestions = ${questionsJson};
            if (allIncorrectOrUnansweredQuestions.length > 0) {
                mappedQuestionsForRetake = allIncorrectOrUnansweredQuestions.map(q => createQuestionMapWithShuffledOptions(q));
                toggleOriginalDetailsVisibility(document.getElementById('toggle-details-cb').checked);
                startTimer();
                loadRetakeQuestion(0);
            } else {
                document.getElementById('question-area').innerHTML = '<p class="no-questions">🎉 رائع! لم تكن لديك أي أسئلة خاطئة أو غير مجاب عليها لمراجعتها في هذا الاختبار. أداؤك كان مثالياً!</p>';
                document.getElementById('navigation-buttons').style.display = 'none';
                document.getElementById('progress-bar-container').style.display = 'none';
                document.querySelector('.controls').style.display = 'none';
                document.getElementById('timer-container').classList.add('hidden');
            }
        };
    </script>
</body>
</html>`;
        const blob = new Blob([desktopInteractiveHtmlContent], { type: 'text/html;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${examNameForFile}_تحدي_الاخطاء${isTimed ? '_موقوت' : ''}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
            title: "تم تحميل تحدي الأخطاء التفاعلي",
            description: `تم إنشاء تحدي يحتوي على ${incorrectOrUnansweredQuestionsData.length} سؤال. افتحه في متصفحك على الحاسوب.`,
            duration: 7000
        });
    }
};



  const renderExamResults = () => {
    if (!selectedExam || currentView !== "results") return null;
    const stats = calculateExamStats();

    // قراءة النقاط المكتسبة من localStorage
    const pointsEarned = parseFloat(localStorage.getItem('lastExamPointsEarned') || '0');

    const performance =
      stats.percentage >= 90 ? { label: "ممتاز جداً!", color: "text-green-500 dark:text-green-400", icon: <TrophyIcon className="inline-block mr-2 h-7 w-7"/> } :
      stats.percentage >= 80 ? { label: "ممتاز", color: "text-sky-500 dark:text-sky-400", icon: <Star className="inline-block mr-2 h-6 w-6"/> } :
      stats.percentage >= 70 ? { label: "جيد جداً", color: "text-blue-500 dark:text-blue-400", icon: <CheckCircle className="inline-block mr-2 h-6 w-6"/> } :
      stats.percentage >= 50 ? { label: "جيد", color: "text-yellow-500 dark:text-yellow-400", icon: <Info className="inline-block mr-2 h-6 w-6"/> } :
      { label: "بحاجة للمزيد من التدريب", color: "text-red-500 dark:text-red-400", icon: <BookOpen className="inline-block mr-2 h-6 w-6"/> };

    return (
      <div className="container py-8 max-w-4xl font-arabic animate-fadeIn">
        {renderMistakeChallengeDialog()}
        <Card className="mb-8 overflow-hidden shadow-xl dark:bg-slate-800/50">
          <div className={cn("h-3 rounded-t-lg", selectedExam.themeColor || "bg-primary")}></div>
          <CardHeader className="text-center p-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg animate-pulse-slow">
                {performance.icon}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">نتيجة اختبار: {selectedExam.name}</CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-1">
              أكملت الاختبار بنجاح! إليك ملخص أدائك.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center mb-10">
              <div className="text-5xl font-bold mb-2 text-gray-800 dark:text-white">{stats.totalCorrect} <span className="text-3xl text-gray-500 dark:text-gray-400">/ {stats.totalScoredQuestions}</span></div>
              <div className={cn("text-2xl font-semibold", performance.color)}>
                {performance.label} ({stats.percentage.toFixed(1)}%)
              </div>
               {selectedExam.nonScoredCount && selectedExam.nonScoredCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                    <Info size={12} className="inline ml-1"/>
                    تم عرض {selectedExam.totalQuestions} سؤالاً، منها {selectedExam.nonScoredCount} أسئلة تجريبية لم تُحتسب في النتيجة أعلاه.
                </p>
            )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 text-center">
              {[
                {label: "اللفظي", value: `${stats.verbalScore}/${stats.verbalTotal}`, percentage: stats.verbalPercentage},
                {label: "الكمي", value: `${stats.quantitativeScore}/${stats.quantitativeTotal}`, percentage: stats.quantitativePercentage},
                {label: "الوقت", value: `${stats.timeTaken} د`, subtext: `من ${selectedExam.totalTime} د`},
                {label: "النقاط", value: pointsEarned >= 0 ? `+${pointsEarned}` : pointsEarned.toString(), color: pointsEarned >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400", subtext: "المكتسبة"},
                {label: "التقدير", value: performance.label, color: performance.color, subtext: "العام"},
              ].map(item => (
                <div key={item.label} className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{item.label}</div>
                  <div className={cn("text-lg sm:text-xl font-bold text-gray-800 dark:text-white", item.color)}>{item.value}</div>
                  {item.percentage !== undefined && <div className="text-xs text-gray-500 dark:text-gray-400">{item.percentage.toFixed(1)}%</div>}
                  {item.subtext && <div className="text-xs text-gray-500 dark:text-gray-400">{item.subtext}</div>}
                </div>
              ))}
            </div>

            <Separator className="my-8 dark:bg-slate-700" />

            {/* Enhanced Results Section with Detailed Analytics Button */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-xl text-gray-700 dark:text-gray-100">النتائج التفصيلية:</h3>
                {detailedResults && (
                  <Button
                    onClick={() => setShowDetailedResults(true)}
                    className="bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-600 hover:to-emerald-600 text-white shadow-lg"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    عرض التحليل الشامل للأقسام الفرعية
                  </Button>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-100 mb-4">النتائج حسب القسم:</h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-3 text-right font-medium text-gray-600 dark:text-gray-300">القسم</th>
                      <th className="px-3 py-3 text-right font-medium text-gray-600 dark:text-gray-300 hidden sm:table-cell">النوع</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-300">النتيجة (المحسوبة)</th>
                       <th className="px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-300">الأسئلة المعروضة</th>
                      <th className="px-3 py-3 text-center font-medium text-gray-600 dark:text-gray-300">النسبة</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {selectedExam.sections.map((section, index) => {
                      const sectionResult = sectionScores[section.sectionNumber] || { score: 0, scoredQuestionsCount: 0 };
                      const sectionRawQuestions = allProcessedQuestionsBySection[section.sectionNumber] || [];
                      const actualScoredCountInSection = sectionRawQuestions.filter(q => !q._isNonScored).length;

                      const sectionPercentage = actualScoredCountInSection > 0
                        ? (sectionResult.score / actualScoredCountInSection) * 100
                        : 0;

                      return (
                        <tr key={section.sectionNumber} className={index % 2 === 0 ? "bg-white dark:bg-slate-900/30" : "bg-slate-50/50 dark:bg-slate-800/30"}>
                          <td className="border-t border-slate-200 dark:border-slate-700 px-3 py-3">{section.name}</td>
                          <td className="border-t border-slate-200 dark:border-slate-700 px-3 py-3 hidden sm:table-cell">
                            {section.category === "verbal" ? "لفظي" :
                             section.category === "quantitative" ? "كمي" :
                             "مختلط"}
                          </td>
                          <td className="border-t border-slate-200 dark:border-slate-700 px-3 py-3 text-center font-semibold">{sectionResult.score}/{actualScoredCountInSection}</td>
                          <td className="border-t border-slate-200 dark:border-slate-700 px-3 py-3 text-center">{section.questionCount}</td>
                          <td className="border-t border-slate-200 dark:border-slate-700 px-3 py-3 text-center">{sectionPercentage.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* بطاقة النقاط والترتيب */}
            <Separator className="my-8 dark:bg-slate-700" />
            <PointsAndRankingCard pointsEarned={pointsEarned} className="mb-6" />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-6 bg-gray-50 dark:bg-slate-800/30 border-t dark:border-slate-700">
            <Button variant="outline" className="w-full sm:w-auto dark:text-gray-200 dark:border-slate-600" onClick={() => setCurrentView("selection")}>
              <ArrowRightIcon className="h-4 w-4 ml-2" />
              العودة للاختبارات
            </Button>

              <div className="flex flex-wrap justify-center gap-3 w-full">
                <Button
                  onClick={startChallengeFlow}
                  variant="default"
                  className="gap-2 bg-red-600 text-white dark:bg-red-700"
                >
                  <Target className="h-4 w-4" />
                  {isMobile ? 'مراجعة الأخطاء (للجوال)' : 'تحدي الأخطاء (للحاسوب)'}
                </Button>
                <Button
                  onClick={() => {
                    try {
                      if (!selectedExam || !allProcessedQuestionsBySection) {
                        toast({ title: "خطأ", description: "بيانات الاختبار غير متوفرة للتحميل.", variant: "destructive" });
                        return;
                      }
                      const examName = selectedExam.name || "اختبار قياس";
                      const withAnswers = true; // For this button, always show answers

                      const resultsWindow = window.open('', '_blank');
                      if (!resultsWindow) {
                        toast({ title: "خطأ بفتح النافذة", description: "يرجى السماح بالنوافذ المنبثقة.", variant: "destructive" });
                        return;
                      }

                      let content = `
                        <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>نتائج: ${examName}</title><style>
                        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap');
                        :root{--bg-color:#f8f9fa;--text-color:#212529;--container-bg:#fff;--border-color:#e0e0e0;--primary-color:#4f46e5;--correct-bg:#d4edda;--correct-border:#c3e6cb;--correct-text:#155724;--wrong-bg:#f8d7da;--wrong-border:#f5c6cb;--wrong-text:#721c24;}
                        @media(prefers-color-scheme:dark){:root{--bg-color:#1a1b23;--text-color:#e2e8f0;--container-bg:#2d3748;--border-color:#4a5568;--primary-color:#90cdf4;--correct-bg:#2f855a;--correct-border:#38a169;--correct-text:#c6f6d5;--wrong-bg:#e53e3e;--wrong-border:#fc8181;--wrong-text:#fed7d7;}}
                        .theme-toggle{position:fixed;top:20px;left:20px;background:var(--container-bg);border:2px solid var(--border-color);border-radius:50%;width:50px;height:50px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.2rem;z-index:1000;}
                        body{font-family:'Noto Kufi Arabic',sans-serif;padding:20px;margin:0;background-color:var(--bg-color);color:var(--text-color);line-height:1.6;transition:all 0.3s ease;}
                        body.dark-mode{--bg-color:#1a1b23;--text-color:#e2e8f0;--container-bg:#2d3748;--border-color:#4a5568;--primary-color:#90cdf4;--correct-bg:#2f855a;--correct-border:#38a169;--correct-text:#c6f6d5;--wrong-bg:#e53e3e;--wrong-border:#fc8181;--wrong-text:#fed7d7;}
                        .container{max-width:800px;margin:auto;background:var(--container-bg);padding:20px;border-radius:8px;box-shadow:0 0 15px rgba(0,0,0,0.1);}
                        .header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:1px solid var(--border-color);}
                        .logo{font-size:28px;font-weight:bold;color:var(--primary-color);margin-bottom:10px;}
                        .section{margin-bottom:30px;padding-bottom:20px;border-bottom:1px dashed #eee;}.section:last-child{border-bottom:none;}
                        .section h2{color:var(--primary-color);margin-bottom:20px;font-size:1.6em;}
                        .question{margin-bottom:25px;padding:15px;border:1px solid var(--border-color);border-radius:8px;background:#fdfdfd;}
                        .question h3{color:#343a40;margin:0 0 15px 0;font-size:1.1em;font-weight:bold;}
                        .question p:first-of-type{margin-top:0;} .options p{padding:10px 15px;margin:8px 0;border-radius:6px;border:1px solid var(--border-color);background:var(--container-bg);position:relative;}
                        .options p.correct{color:var(--correct-text) !important;background-color:var(--correct-bg) !important;border-color:var(--correct-border) !important;font-weight:bold;}
                        .options p.correct::before{content:"✓";position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--correct-text);font-size:1.2em;}
                        .options p.wrong{color:var(--wrong-text) !important;background-color:var(--wrong-bg) !important;border-color:var(--wrong-border) !important;font-weight:bold;}
                        .options p.wrong::before{content:"✗";position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--wrong-text);font-size:1.2em;}
                        .explanation{margin-top:10px;padding:10px;background:#fff3cd;border-radius:6px;border:1px solid #ffeeba;color:#856404;font-size:0.9em;}
                        .explanation .note{font-weight:bold;display:block;margin-bottom:5px;}
                        .option-label{font-size:0.9em;margin-left:8px;font-weight:normal;color:#555;}
                        .non-scored-q{border-left: 4px solid #007bff; padding-left:10px;}
                        .non-scored-badge{font-size:0.8em;background-color:#e7f3ff;color:#007bff;padding:2px 6px;border-radius:4px;margin-left:10px;font-weight:normal;}
                        @media print{body{padding:0;background:#fff;}.container{box-shadow:none;border:none;padding:5px;}.header{margin-bottom:10px;} P{page-break-inside: avoid;}}
                        </style></head><body><div class="container"><div class="header"><div class="logo">قدراتك</div><h1>نتائج: ${examName}</h1>
                        <div style="font-size:0.9em;color:#6c757d;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}</div></div>`;

                      Object.entries(allProcessedQuestionsBySection).forEach(([sectionNum, sectionQuestions]) => {
                        const sectionConfig = selectedExam.sections.find(s => s.sectionNumber === parseInt(sectionNum));
                        const sectionName = sectionConfig?.name || `القسم ${sectionNum}`;
                        content += `<div class="section"><h2>${sectionName}</h2>`;
                        sectionQuestions.forEach((q, idx) => {
                          content += `<div class="question ${q._isNonScored ? 'non-scored-q' : ''}"><h3>السؤال ${idx + 1}${q._isNonScored? '<span class="non-scored-badge">تجريبي</span>':''}</h3><p>${q.text}</p><div class="options">`;
                          q.options.forEach((opt, i) => {
                            let optionClass = ''; let label = '';
                            const isUserAnswer = (i === answers[q.id]);
                            const isCorrectAnswer = (i === q.correctOptionIndex);
                            if (isUserAnswer && isCorrectAnswer) { optionClass = 'correct'; label = ' <span class="option-label">(إجابتك - صحيحة)</span>'; }
                            else if (isUserAnswer && !isCorrectAnswer) { optionClass = 'wrong'; label = ' <span class="option-label">(إجابتك - خاطئة)</span>'; }
                            else if (!isUserAnswer && isCorrectAnswer) { optionClass = 'correct'; label = ' <span class="option-label">(الإجابة الصحيحة)</span>'; }
                            content += `<p class="${optionClass}">${String.fromCharCode(0x0623 + i)}. ${opt}${label}</p>`;
                          });
                          content += `</div>`;
                          if (answers[q.id] !== undefined && answers[q.id] !== q.correctOptionIndex) {
                            if (q.explanation) { content += `<div class="explanation"><strong class="note">الشرح:</strong>${q.explanation}</div>`; }
                            else { content += `<div class="explanation"><strong class="note">ملاحظة:</strong> إجابتك غير صحيحة. الإجابة الصحيحة هي الخيار: ${String.fromCharCode(0x0623 + q.correctOptionIndex)}.</div>`; }
                          } else if (answers[q.id] !== undefined && answers[q.id] === q.correctOptionIndex && q.explanation) {
                             content += `<div class="explanation"><strong class="note">الشرح (إجابة صحيحة):</strong>${q.explanation}</div>`;
                          }
                          content += `</div>`;
                        });
                        content += `</div>`;
                      });
                      content += `<div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;font-size:0.8em;color:#6c757d;">© ${new Date().getFullYear()} قدراتك</div></div></body></html>`;

                      resultsWindow.document.write(content);
                      resultsWindow.document.close();
                      toast({ title: "تم عرض النتائج", description: "يمكنك طباعة هذه الصفحة أو حفظها كـ PDF.", duration: 5000 });
                    } catch (error) {
                      console.error("Error displaying results with answers:", error);
                      toast({ title: "خطأ", description: "حدث خطأ أثناء محاولة عرض النتائج.", variant: "destructive" });
                    }
                  }}
                  className="gap-2 bg-blue-600 text-white"
                >
                  <Download className="h-4 w-4" />
                  عرض النتائج للطباعة
                </Button>

                <Button
                  variant="outline"
                   className="gap-2 dark:text-gray-200 dark:border-slate-600"
                  onClick={() => {
                    try {
                      if (!selectedExam || !allProcessedQuestionsBySection) {
                        toast({ title: "خطأ", description: "بيانات الاختبار غير متوفرة للتحميل.", variant: "destructive" });
                        return;
                      }
                      const examName = selectedExam.name || "اختبار قياس";
                      let content = `
                        <!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>أسئلة: ${examName}</title><style>
                        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap');
                        body{font-family:'Noto Kufi Arabic',sans-serif;padding:20px;margin:0;background-color:#f8f9fa;color:#212529;line-height:1.6;}
                        .container{max-width:800px;margin:auto;background:#fff;padding:20px;border-radius:8px;box-shadow:0 0 15px rgba(0,0,0,0.1);}
                        .header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:1px solid #e0e0e0;}
                        .logo{font-size:28px;font-weight:bold;color:#4f46e5;margin-bottom:10px;}
                        .section{margin-bottom:30px;padding-bottom:20px;border-bottom:1px dashed #eee;}.section:last-child{border-bottom:none;}
                        .section h2{color:#4f46e5;margin-bottom:20px;font-size:1.6em;}
                        .question{margin-bottom:25px;padding:15px;border:1px solid #e0e0e0;border-radius:8px;background:#fdfdfd;}
                        .question h3{color:#343a40;margin:0 0 15px 0;font-size:1.1em;font-weight:bold;}
                        .question p:first-of-type{margin-top:0;} .options p{padding:10px 15px;margin:8px 0;border-radius:6px;border:1px solid #ced4da;background:#fff;}
                        .non-scored-badge{font-size:0.8em;background-color:#e7f3ff;color:#007bff;padding:2px 6px;border-radius:4px;margin-left:10px;font-weight:normal;}
                        @media print{body{padding:0;background:#fff;}.container{box-shadow:none;border:none;padding:5px;} .header{margin-bottom:10px;} P{page-break-inside: avoid;}}
                        </style></head><body><div class="container"><div class="header"><div class="logo">قدراتك</div><h1>أسئلة: ${examName}</h1>
                        <div style="font-size:0.9em;color:#6c757d;">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</div></div>`;

                      Object.entries(allProcessedQuestionsBySection).forEach(([sectionNum, sectionQuestions]) => {
                        const sectionConfig = selectedExam.sections.find(s => s.sectionNumber === parseInt(sectionNum));
                        const sectionName = sectionConfig?.name || `القسم ${sectionNum}`;
                        content += `<div class="section"><h2>${sectionName}</h2>`;
                        sectionQuestions.forEach((q, idx) => {
                          content += `<div class="question ${q._isNonScored ? 'non-scored-q' : ''}"><h3>السؤال ${idx + 1}${q._isNonScored? '<span class="non-scored-badge">تجريبي</span>':''}</h3><p>${q.text}</p><div class="options">`;
                          q.options.forEach((opt, i) => {
                            content += `<p>${String.fromCharCode(0x0623 + i)}. ${opt}</p>`;
                          });
                          content += `</div></div>`;
                        });
                        content += `</div>`;
                      });
                      content += `<div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e0e0e0;font-size:0.8em;color:#6c757d;">© ${new Date().getFullYear()} قدراتك</div></div></body></html>`;

                      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      const examNameForFile = examName.replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, '_');
                      a.download = `${examNameForFile}_اسئلة_فقط.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                      toast({ title: "تم تحميل الأسئلة", description: "يمكنك فتح الملف في المتصفح لطباعته أو تحويله إلى PDF.", duration: 5000});
                    } catch (error) {
                      console.error("Error downloading questions only:", error);
                      toast({ title: "خطأ", description: "حدث خطأ أثناء محاولة تحميل ملف الأسئلة.", variant: "destructive"});
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                  تحميل الاسئلة فقط
                </Button>

                <Button
                  variant="outline"
                  data-testid="button-save-all"
                  className="border-green-400 dark:border-green-400"
                  onClick={() => {
                    const allQuestions = Object.values(allProcessedQuestionsBySection).flat();
                    const questionIds = allQuestions.map(q => q.id);
                    setQuestionsToSave(questionIds);
                    setSaveQuestionType("all");
                    setIsSaveFolderDialogOpen(true);
                  }}
                >
                  <FolderPlus className="h-4 w-4" />
                  حفظ كل الأسئلة
                </Button>

                <Button
                  variant="outline"
                  data-testid="button-save-wrong"
                  className="border-red-500 dark:border-red-400"
                  onClick={() => {
                    const allQuestions = Object.values(allProcessedQuestionsBySection).flat();
                    const wrongQuestions = allQuestions.filter(
                      q => answers[q.id] !== undefined && answers[q.id] !== q.correctOptionIndex
                    );
                    const questionIds = wrongQuestions.map(q => q.id);
                    if (questionIds.length === 0) {
                      toast({
                        title: "لا توجد أسئلة خاطئة",
                        description: "لم تخطئ في أي سؤال! رائع!",
                        variant: "default",
                      });
                      return;
                    }
                    setQuestionsToSave(questionIds);
                    setSaveQuestionType("wrong");
                    setIsSaveFolderDialogOpen(true);
                  }}
                >
                  <Bookmark className="h-4 w-4" />
                  حفظ الأسئلة الخطأ
                </Button>

                <Button
                  variant="outline"
                  data-testid="button-save-unanswered"
                  className="border-yellow-500 dark:border-yellow-400"
                  onClick={() => {
                    const allQuestions = Object.values(allProcessedQuestionsBySection).flat();
                    const unansweredQuestions = allQuestions.filter(q => answers[q.id] === undefined);
                    const questionIds = unansweredQuestions.map(q => q.id);
                    if (questionIds.length === 0) {
                      toast({
                        title: "لا توجد أسئلة غير مجابة",
                        description: "لقد أجبت على كل الأسئلة!",
                        variant: "default",
                      });
                      return;
                    }
                    setQuestionsToSave(questionIds);
                    setSaveQuestionType("unanswered");
                    setIsSaveFolderDialogOpen(true);
                  }}
                >
                  <Bookmark className="h-4 w-4" />
                  حفظ الأسئلة غير المجابة
                </Button>
              </div>
          </CardFooter>
        </Card>

        {/* Enhanced Save to Folder Dialog */}
        <EnhancedSaveToFolderDialog
          open={isSaveFolderDialogOpen}
          onOpenChange={setIsSaveFolderDialogOpen}
          questionIds={questionsToSave}
          saveMode={saveQuestionType}
        />

        {/* ── تحليل المعلم ── */}
        {wrongQuestionsForAI.length > 0 && (
          <div className="mb-6">
            <ResultsTeacherAnalysis
              wrongQuestions={wrongQuestionsForAI}
              totalQuestions={stats.totalScoredQuestions}
              score={stats.totalCorrect}
              verbalScore={stats.verbalScore}
              verbalTotal={stats.verbalTotal}
              quantitativeScore={stats.quantitativeScore}
              quantitativeTotal={stats.quantitativeTotal}
            />
          </div>
        )}

        {/* ── مراجعة الأسئلة ── */}
        {(!selectedExam?.hideQuestionReview) && (
        <Card className="mb-6 dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">مراجعة الأسئلة والإجابات</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              راجع إجاباتك وتعلم من أخطائك للتحضير بشكل أفضل.
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-white">الكل</TabsTrigger>
              <TabsTrigger value="correct" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-green-400">الصحيحة</TabsTrigger>
              <TabsTrigger value="incorrect" className="data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-red-400">الخاطئة</TabsTrigger>
            </TabsList>

            {['all', 'correct', 'incorrect'].map(filterType => (
                <TabsContent key={filterType} value={filterType} className="space-y-6">
                  {Object.entries(allProcessedQuestionsBySection)
                    .flatMap(([sectionNumStr, sectionQuestions]) => {
                        const sectionConfig = selectedExam.sections.find(s => s.sectionNumber === parseInt(sectionNumStr));
                        return sectionQuestions.map((question, index) => ({
                            question,
                            sectionName: sectionConfig?.name || `القسم ${sectionNumStr}`,
                            questionDisplayIndex: index + 1
                        }));
                    })
                    .filter(({question}) => {
                        if (filterType === "all") return true;
                        // Always show non-scored in 'all', but filter based on answer for others
                        const isCorrect = answers[question.id] === question.correctOptionIndex;
                        return filterType === "correct" ? isCorrect : !isCorrect;
                    })
                    .map(({question, sectionName, questionDisplayIndex}, reviewIndex) => {
                    const isCorrect = answers[question.id] === question.correctOptionIndex;
                    return (
                        <div key={`${question.id}-${filterType}-${reviewIndex}`} className={cn(
                        "p-4 rounded-lg border-2 shadow-sm",
                        question._isNonScored ? "border-dashed border-blue-400 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-600/50" :
                        isCorrect ? "border-green-500 bg-green-50/50 dark:bg-green-900/20 dark:border-green-600" :
                        "border-red-500 bg-red-50/50 dark:bg-red-900/20 dark:border-red-600"
                        )}>
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className={cn(
                            "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 mt-1",
                            question._isNonScored ? "bg-blue-400" : isCorrect ? "bg-green-500" : "bg-red-500"
                            )}>
                            {question._isNonScored ? <Info size={18}/> : isCorrect ? <Check size={18}/> : <X size={18}/>}
                            </div>
                            <div className="flex-grow">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-100 mb-1">{sectionName} - سؤال {questionDisplayIndex}</h4>
                            {question._isNonScored && <Badge variant="outline" className="mb-2 text-xs border-blue-500 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600">سؤال تجريبي</Badge>}
                            <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed text-sm sm:text-base" dir="auto">{question.text}</p>
                            {question.imageUrl && (
                              <div className="mb-4 flex justify-center">
                                <ImageZoom src={question.imageUrl} imgClassName="max-w-full rounded-xl border border-gray-200 dark:border-gray-600 max-h-72 object-contain" />
                              </div>
                            )}
                            <div className="space-y-2">
                                {question.options.map((option, optIndex) => (
                                <div key={`${question.id}-optrev-${optIndex}-${filterType}-${reviewIndex}`} className={cn(
                                    "p-3 rounded-lg border text-xs sm:text-sm",
                                    "bg-white dark:bg-slate-700/50 dark:border-slate-600",
                                    optIndex === question.correctOptionIndex && "border-green-400 bg-green-50/80 dark:bg-green-800/30 dark:border-green-500 font-semibold text-green-700 dark:text-green-300",
                                    optIndex === answers[question.id] && optIndex !== question.correctOptionIndex && "border-red-400 bg-red-50/80 dark:bg-red-800/30 dark:border-red-500 text-red-700 dark:text-red-300"
                                )}>
                                    <div className="flex items-center justify-between">
                                    <span dir="auto">{["أ", "ب", "ج", "د"][optIndex]}. {option}</span>
                                    {optIndex === answers[question.id] && (
                                        <Badge variant={optIndex === question.correctOptionIndex ? "default" : "destructive"} className={cn("text-xs px-1.5 py-0.5", optIndex === question.correctOptionIndex ? "bg-green-500" : "bg-red-500", "text-white")}>
                                        {optIndex === question.correctOptionIndex ? "إجابتك (صحيحة)" : "إجابتك (خاطئة)"}
                                        </Badge>
                                    )}
                                     {optIndex !== answers[question.id] && optIndex === question.correctOptionIndex && (
                                         <Badge variant="default" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-500 dark:bg-green-800/50 dark:text-green-300">الإجابة الصحيحة</Badge>
                                     )}
                                    </div>
                                </div>
                                ))}
                            </div>
                            {question.explanation && (
                                <div className="mt-4 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/8 to-orange-500/5 dark:from-amber-900/20 dark:to-orange-900/10">
                                  <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-amber-500/15 bg-amber-500/5 dark:bg-amber-900/15">
                                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                                      <Sparkles className="w-3 h-3 text-amber-500" />
                                    </div>
                                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">شرح الإجابة</span>
                                    <div className="flex-1" />
                                    <div className="flex items-center gap-1 text-[10px] text-amber-600/70 dark:text-amber-400/70 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                      <span>الإجابة الصحيحة:</span>
                                      <span className="font-bold">{question.options[question.correctOptionIndex]?.slice(0, 20)}{question.options[question.correctOptionIndex]?.length > 20 ? '...' : ''}</span>
                                    </div>
                                  </div>
                                  <div className="px-4 py-3">
                                    <p className="text-xs sm:text-sm text-gray-700 dark:text-amber-100/80 leading-relaxed" dir="auto">{question.explanation}</p>
                                  </div>
                                </div>
                            )}
                            <div className="mt-3 flex justify-end">
                                <button
                                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-red-400 border border-border hover:border-red-500/30 bg-muted/30 hover:bg-red-500/5 px-3 py-1.5 rounded-xl transition-all duration-150"
                                  onClick={() => setReportingQuestion({ id: question.id, text: question.text, options: question.options, correctOptionIndex: question.correctOptionIndex })}
                                  data-testid={`btn-report-${question.id}`}
                                >
                                  <Info size={11} /> إبلاغ عن خطأ
                                </button>
                            </div>
                            </div>
                        </div>
                        </div>
                    );
                    })}
                </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      )}

        {/* نموذج الإبلاغ عن خطأ */}
        {reportingQuestion && (
          <QuestionReportModal
            question={reportingQuestion}
            onClose={() => setReportingQuestion(null)}
          />
        )}
      </div>
    );
  };


  if (showAiReview) {
    const allQs = Object.values(allProcessedQuestionsBySection).flat().filter(q => !q._isNonScored);
    const correctCount = allQs.filter(q => answers[q.id] !== undefined && answers[q.id] === q.correctOptionIndex).length;
    return (
      <AiReviewingScreen
        wrongQuestions={wrongQuestionsForAI}
        totalQuestions={allQs.length}
        score={correctCount}
        userEmail={user?.email}
        onShowResults={() => {
          setShowAiReview(false);
          setCurrentView("results");
        }}
      />
    );
  }

  return (
    <>
      <AntiCheatWarning
        violations={antiCheatViolations}
        lastViolationType={antiCheatType}
        isVisible={antiCheatWarning}
        onDismiss={dismissAntiCheatWarning}
        maxViolations={3}
      />
      <SEO 
        title="اختبارات قياس - منصة قدراتك"
        description="اختبارات قياس التفاعلية مع محاكاة دقيقة للاختبار الرسمي. نماذج متنوعة للقدرات اللفظية والكمية مع شروحات تفصيلية لكل سؤال"
        url="/qiyas"
      />
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {currentView === "selection" && renderExamSelection()}
        {currentView === "instructions" && renderExamInstructions()}
        {currentView === "section-intro" && renderSectionIntro()}
        {currentView === "inProgress" && renderExamInProgress()}
        {currentView === "results" && renderExamResults()}

      {/* Detailed Subcategory Results Modal */}
      {showDetailedResults && detailedResults && (
        <DetailedTestResults
          results={detailedResults}
          examType={selectedExam?.name || "اختبار قياس"}
          onClose={() => setShowDetailedResults(false)}
        />
      )}
      </div>
    </>
  );
};

export default QiyasExamPage;