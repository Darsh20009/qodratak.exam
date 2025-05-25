import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { TestType } from "@shared/types"; // Assuming TestType is "verbal" | "quantitative" | "mixed"

// Types for Qiyas exams
interface QiyasSection {
  sectionNumber: number;
  name: string;
  category: TestType;
  questionCount: number;
  timeLimit: number; // in minutes
}

interface QiyasExam {
  id: number;
  name: string;
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
  themeColor?: string; // For creative exam selection
  icon?: React.ElementType; // For creative exam selection
}

interface ExamQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: TestType;
  section: number;
  explanation?: string;
}

interface ProcessedExamQuestion extends ExamQuestion {
  _isNonScored?: boolean;
  _globalIndex?: number;
}


// Mock data for Qiyas exams
const qiyasExams: QiyasExam[] = [
  {
    id: 1,
    name: "اختبار قدراتك التأهيلي",
    description: "اختبار تأهيلي شامل يتكون من سبعة أقسام متنوعة بين اللفظي والكمي. يتضمن 20 سؤالاً تجريبياً غير محسوب للمساعدة.",
    totalSections: 7,
    totalQuestions: 120,
    totalTime: 120,
    isQiyas: true,
    requiresSubscription: true,
    nonScoredCount: 20,
    themeColor: "from-blue-500 to-indigo-600",
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
    themeColor: "from-purple-500 to-pink-600",
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
    requiresSubscription: true,
    themeColor: "from-blue-500 to-indigo-600",
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
  }
];

// Main component
const QiyasExamPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null); // Replace 'any' with your User type

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user'); // Clear corrupted user data
      }
    }
  }, []);

  const [selectedExam, setSelectedExam] = useState<QiyasExam | null>(null);
  const [currentView, setCurrentView] = useState<"selection" | "instructions" | "inProgress" | "results">("selection");
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [questions, setQuestions] = useState<ProcessedExamQuestion[]>([]);
  const [answers, setAnswers] = useState<{[questionId: number]: number}>({}); // questionId maps to selectedOptionIndex
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const [sectionScores, setSectionScores] = useState<{[sectionNumber: number]: { score: number, scoredQuestionsCount: number } }>({});
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);

  const [allProcessedQuestionsBySection, setAllProcessedQuestionsBySection] = useState<{[sectionNumber: number]: ProcessedExamQuestion[]}>({});

  const [isPrayerBreak, setIsPrayerBreak] = useState(false);
  const [hasPrayerBreakBeenUsed, setHasPrayerBreakBeenUsed] = useState(false); // Track if prayer break has been used
  const [prayerBreakStartTime, setPrayerBreakStartTime] = useState<Date | null>(null); // Track when prayer break started
  const [prayerBreakTimeLeft, setPrayerBreakTimeLeft] = useState(900); // 15 minutes in seconds
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false); // State for review dialog
  const [isFinalReviewDialogOpen, setIsFinalReviewDialogOpen] = useState(false); // State for final review dialog


  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (currentView === "inProgress" && timeLeft > 0 && !isPrayerBreak) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentView === "inProgress" && selectedExam && !isPrayerBreak) {
        toast({
            title: "الوقت انتهى",
            description: `انتهى وقت القسم الحالي. سيتم نقلك للقسم التالي أو لصفحة النتائج.`,
            duration: 4000,
        });
      moveToNextSection(true); // Call with isTimeOut = true
    }
    return () => clearTimeout(timerId);
  }, [timeLeft, currentView, isPrayerBreak, selectedExam]);

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

  const fetchRawQuestionsForSectionConfig = async (section: QiyasSection): Promise<ExamQuestion[]> => {
    try {
      // In a real app, this endpoint would be more sophisticated, e.g., /api/questions?category=X&count=Y
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error(`فشل في جلب الأسئلة من الخادم: ${response.status}`);
      }
      const allAvailableQuestions: ExamQuestion[] = await response.json();

      let filteredQuestions: ExamQuestion[];

      if (section.category === "mixed") {
        const verbalCount = Math.ceil(section.questionCount * 0.55); // Slightly more verbal for typical mixed
        const quantitativeCount = section.questionCount - verbalCount;

        const verbalQuestions = allAvailableQuestions
          .filter(q => q.category === "verbal")
          .sort(() => 0.5 - Math.random())
          .slice(0, verbalCount);

        const quantitativeQuestions = allAvailableQuestions
          .filter(q => q.category === "quantitative")
          .sort(() => 0.5 - Math.random())
          .slice(0, quantitativeCount);

        filteredQuestions = [...verbalQuestions, ...quantitativeQuestions].sort(() => 0.5 - Math.random()).slice(0, section.questionCount);
      } else {
        filteredQuestions = allAvailableQuestions
          .filter(q => q.category === section.category)
          .sort(() => 0.5 - Math.random())
          .slice(0, section.questionCount);
      }

      if (filteredQuestions.length < section.questionCount) {
         console.warn(`Warning: Fetched ${filteredQuestions.length} for section ${section.name} (expected ${section.questionCount}). Padding...`);
         while (filteredQuestions.length < section.questionCount && allAvailableQuestions.length > 0) { // Pad with random from available
            const randomQ = allAvailableQuestions[Math.floor(Math.random() * allAvailableQuestions.length)];
            // Ensure unique ID if adding duplicates for padding in a real scenario
            filteredQuestions.push({...randomQ, id: Math.random() * 1000000 + (randomQ.id || 0) });
         }
         if (filteredQuestions.length === 0 && section.questionCount > 0) {
            // Create placeholder questions if API fails completely for a section
            return Array.from({ length: section.questionCount }, (_, i) => ({
                id: Date.now() + i, // Unique ID
                text: `نص سؤال تجريبي ${i + 1} (فئة: ${section.category}) - حدث خطأ في التحميل`,
                options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
                correctOptionIndex: 0,
                category: section.category,
                section: section.sectionNumber,
                explanation: "هذا سؤال تجريبي بسبب خطأ في تحميل الأسئلة الأصلية."
            }));
         }
      }
      return filteredQuestions.map(q => ({...q, section: section.sectionNumber, id: q.id || Date.now() + Math.random()})); // Ensure ID
    } catch (error) {
      console.error(`Error fetching raw questions for section ${section.name}:`, error);
      toast({ title: "خطأ في تحميل الأسئلة", description: `لم نتمكن من تحميل أسئلة قسم "${section.name}".`, variant: "destructive"});
      // Return placeholder questions on error to prevent crash
      return Array.from({ length: section.questionCount }, (_, i) => ({
        id: Date.now() + i, text: `Placeholder Question ${i+1} for ${section.name}`, options: ["A","B","C","D"], correctOptionIndex:0, category: section.category, section: section.sectionNumber
      }));
    }
  };

  const startExam = async () => {
    if (!selectedExam) return;

    setCurrentSectionIdx(0);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setSectionScores({});
    setAllProcessedQuestionsBySection({});
    setQuestions([]);
    setSelectedAnswer(null);
    setIsFinalReviewDialogOpen(false); // Reset on start
    setHasPrayerBreakBeenUsed(false); // Reset prayer break usage for new exam


    try {
      let flatListOfAllRawQuestions: ExamQuestion[] = [];
      for (const section of selectedExam.sections) {
        const rawQs = await fetchRawQuestionsForSectionConfig(section);
        flatListOfAllRawQuestions.push(...rawQs);
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
        const totalIndices = Array.from({ length: flatListOfAllRawQuestions.length }, (_, i) => i);
        for (let i = totalIndices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [totalIndices[i], totalIndices[j]] = [totalIndices[j], totalIndices[i]];
        }
        for (let i = 0; i < Math.min(numNonScored, totalIndices.length) ; i++) { // Ensure not to pick more than available
          nonScoredGlobalIndices.add(totalIndices[i]);
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
      setCurrentView("inProgress");

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
        setCurrentSectionIdx(nextSectionIndex);
        setCurrentQuestionIdx(0);

        const nextSectionData = selectedExam.sections[nextSectionIndex];
        const nextSectionQuestions = allProcessedQuestionsBySection[nextSectionData.sectionNumber];

        if (nextSectionQuestions && nextSectionQuestions.length > 0) {
            setQuestions(nextSectionQuestions);
            setTimeLeft(nextSectionData.timeLimit * 60);
            const firstQuestionId = nextSectionQuestions[0]?.id;
            setSelectedAnswer(answers[firstQuestionId] ?? null); // Restore answer if exists
        } else {
            toast({
                title: "خطأ في تحميل القسم",
                description: `فشل في تحميل أسئلة القسم التالي (${nextSectionData.name}). إنهاء الاختبار.`,
                variant: "destructive",
            });
            finishExam(); // Finish if next section fails
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

  const finishExam = () => {
    // Ensure the last section's score is calculated before finishing
    calculateSectionScore();
    setCurrentView("results");

    const finalStats = calculateExamStats();
    const currentDate = new Date().toISOString();
    const examName = selectedExam?.name || "اختبار قياس";

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
      // Storing allProcessedQuestionsBySection could be large, consider if needed for all records
      // allProcessedQuestionsBySection: allProcessedQuestionsBySection,
      userAnswers: answers,
      sectionScores: sectionScores, // Use the state which should be up-to-date
    });
    try {
        localStorage.setItem('examRecords', JSON.stringify(records));
    } catch (e) {
        console.error("Failed to save examRecords to localStorage", e);
        toast({title: "خطأ", description: "لم نتمكن من حفظ نتيجة الاختبار بسبب امتلاء الذاكرة.", variant:"destructive"});
    }
  };

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
          if (q.category === "verbal" || (sectionConfig.category === "mixed" && (q.category === "verbal" || String(q.text).match(/مرادف|معنى|نص|علاقة/i)) ) ) {
            verbalTotalScored++;
            if (isCorrect) verbalCorrectScored++;
          } else if (q.category === "quantitative" || (sectionConfig.category === "mixed" && (q.category === "quantitative" || String(q.text).match(/حساب|هندسة|جبر|نسبة|رقم/i)) ) ) {
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


  const renderExamSelection = () => (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-gray-100 to-slate-200 dark:from-gray-900 dark:to-slate-950 font-arabic">
       {/* Changed max-w-5xl to max-w-6xl for wider layout */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gray-800 dark:text-white">
            اختر <span className="bg-gradient-to-r from-blue-500 to-teal-400 text-transparent bg-clip-text">اختبارك</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
            اختبارات محاكية لاختبار القدرات العامة (قياس) لمساعدتك على التألق.
          </p>
        </div>

        {/* Changed lg:grid-cols-3 to lg:grid-cols-2 for larger cards */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {qiyasExams.map(exam => {
            const ExamIcon = exam.icon || GraduationCapIcon;
            const isUserSubscribed = user?.subscription?.type === 'Pro Live' || user?.subscription?.type === 'Pro';
            return (
            <Card
              key={exam.id}
              className={cn(
                "overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 group dark:bg-slate-800/70 border-4 border-transparent hover:border-blue-500/60 dark:hover:border-blue-400/60 rounded-2xl", // Increased roundness, shadow, hover effect
                exam.requiresSubscription && !isUserSubscribed && "opacity-60 hover:opacity-80"
              )}
            >
                {/* Enhanced Header */}
              <div className={cn("h-28 p-6 flex items-center justify-between text-white relative", exam.themeColor || "from-gray-700 to-gray-800", "bg-gradient-to-r")}>
                  <div className="absolute top-0 left-0 w-full h-full bg-black/10 mix-blend-multiply opacity-50 group-hover:opacity-70 transition-opacity"></div> {/* Overlay */}
                  <CardTitle className="text-2xl font-bold flex items-center gap-3 z-10"> {/* Increased size */}
                  <ExamIcon className="h-9 w-9 opacity-90" /> {/* Increased size */}
                  {exam.name}
                </CardTitle>
                {exam.isMockExam && <Badge variant="secondary" className="bg-white/30 text-white backdrop-blur-sm z-10 text-sm px-3 py-1">محاكاة</Badge>} {/* Enhanced Badge */}
              </div>

                {/* Increased padding (p-8) and spacing (space-y-6) */}
              <CardContent className="p-8 space-y-6">
                <CardDescription className="text-gray-600 dark:text-gray-300 h-20 line-clamp-3 text-base leading-relaxed">{exam.description}</CardDescription> {/* Increased size/leading */}

                <div className="grid grid-cols-3 gap-4 text-center text-base"> {/* Increased gap/size */}
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl shadow-sm"> {/* Increased padding/roundness */}
                    <div className="font-bold text-gray-800 dark:text-gray-100 text-lg">{exam.totalQuestions}</div> {/* Increased size */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">سؤال</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl shadow-sm">
                    <div className="font-bold text-gray-800 dark:text-gray-100 text-lg">{exam.totalTime}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">دقيقة</div>
                  </div>
                   <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-xl shadow-sm">
                    <div className="font-bold text-gray-800 dark:text-gray-100 text-lg">{exam.totalSections}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">أقسام</div>
                  </div>
                </div>

                {exam.nonScoredCount && exam.nonScoredCount > 0 && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center flex items-center justify-center gap-2"> {/* Increased size/padding */}
                        <Info size={16} /> {/* Increased size */}
                        يتضمن {exam.nonScoredCount} سؤالاً تجريبياً غير محسوب.
                    </div>
                )}

                {exam.requiresSubscription && (
                  <div className={cn(
                      "mt-4 p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2 font-medium", // Increased size/padding
                      isUserSubscribed
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                        : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700"
                    )}>
                    {isUserSubscribed ? (
                      <> <CheckCircle size={16} /> متاح (اشتراكك فعال) </>
                    ) : (
                      <> <LockIcon size={16} /> يتطلب اشتراك مدفوع </>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 dark:bg-slate-800 p-6"> {/* Increased padding */}
                <Button
                  className={cn("w-full font-bold text-lg py-4 bg-gradient-to-r hover:opacity-95 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30", exam.themeColor || "from-gray-700 to-gray-800")} // Increased size/effects
                  onClick={() => {
                    if (exam.requiresSubscription && !isUserSubscribed) {
                      setLocation("/subscription"); // Or your subscription page route
                    } else {
                      loadExam(exam);
                    }
                  }}
                >
                  ابدأ الاختبار
                </Button>
              </CardFooter>
            </Card>
          )})}
        </div>
      </div>
    </div>
  );


  const renderExamInstructions = () => {
    if (!selectedExam) return null;
    const ExamSpecificIcon = selectedExam.icon || GraduationCapIcon;
    const themeColorName = selectedExam.themeColor?.split('-')[1] || 'primary';


    return (
      <div className="container max-w-4xl py-8 font-arabic animate-fadeIn">
        <Card className="dark:bg-slate-800/50 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-3">
                <ExamSpecificIcon className={cn("h-10 w-10", `text-${themeColorName}-500 dark:text-${themeColorName}-400`)} />
                <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">{selectedExam.name}</CardTitle>
            </div>
            <CardDescription className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">{selectedExam.description}</CardDescription>
            {selectedExam.nonScoredCount && selectedExam.nonScoredCount > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>هذا الاختبار يحتوي على <strong>{selectedExam.nonScoredCount} أسئلة تجريبية</strong> موزعة عشوائياً. هذه الأسئلة لا تؤثر على نتيجتك النهائية وهي لمساعدتك على التعود على أنواع مختلفة من الأسئلة. لن تعرف أي الأسئلة تجريبية أثناء الحل.</span>
                </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg flex items-start gap-3 ">
              <Info className="h-6 w-6 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-100 mb-1 text-lg">هام جداً</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  هذا الاختبار يحاكي اختبار قياس الرسمي من حيث البنية والتوقيت. اتبع التعليمات بدقة للحصول على تجربة واقعية.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-100 mb-3 text-xl">تفاصيل الاختبار:</h3>
              <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/20 rounded-md border dark:border-slate-600/50 shadow-sm">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <span className="text-gray-700 dark:text-gray-200">عدد الأقسام: <strong>{selectedExam.totalSections}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/20 rounded-md border dark:border-slate-600/50 shadow-sm">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-gray-700 dark:text-gray-200">إجمالي الأسئلة المعروضة: <strong>{selectedExam.totalQuestions}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700/20 rounded-md border dark:border-slate-600/50 shadow-sm">
                    <Timer className="h-5 w-5 text-primary" />
                    <span className="text-gray-700 dark:text-gray-200">الوقت الإجمالي المتاح: <strong>{selectedExam.totalTime} دقيقة</strong></span>
                  </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-100 mb-3 text-xl">جدول الأقسام:</h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">القسم</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">النوع</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">عدد الأسئلة</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">الوقت (دقائق)</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {selectedExam.sections.map((section, index) => (
                      <tr key={section.sectionNumber} className={index % 2 === 0 ? "bg-white dark:bg-slate-900/30" : "bg-slate-50/50 dark:bg-slate-800/40"}>
                        <td className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">{section.name}</td>
                        <td className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">
                          {section.category === "verbal" ? "لفظي" :
                           section.category === "quantitative" ? "كمي" :
                           "مختلط"}
                        </td>
                        <td className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 text-center">{section.questionCount}</td>
                        <td className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 text-center">{section.timeLimit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 dark:text-gray-100 mb-2 text-xl">إرشادات هامة:</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc list-inside marker:text-primary pl-4">
                <li>لا يمكنك العودة إلى قسم سابق بعد الانتهاء منه ومتابعة للقسم التالي.</li>
                <li>يمكنك التنقل بين أسئلة القسم الواحد بحرية طالما لم ينته وقت القسم.</li>
                <li>يمكنك استخدام زر "مراجعة القسم" لرؤية حالة إجاباتك والقفز بين الأسئلة.</li> {/* Added instruction */}
                <li>سيتم الانتقال تلقائياً إلى القسم التالي عند انتهاء الوقت المخصص للقسم الحالي.</li>
                <li>كل إجابة صحيحة على سؤال <strong>محسوب</strong> تمنح نقطة واحدة.</li>
                <li>لا توجد نقاط سالبة للإجابات الخاطئة.</li>
                {selectedExam.nonScoredCount && selectedExam.nonScoredCount > 0 && <li>بعض الأسئلة المعروضة هي أسئلة تجريبية ولن يتم احتسابها ضمن نتيجتك النهائية.</li>}
                <li>تأكد من اتصال جيد بالإنترنت، وحاول أن تكون في مكان هادئ لضمان أفضل تركيز.</li>
                <li>قبل إنهاء الاختبار تماماً، ستظهر لك رسالة لتأكيد رغبتك في المراجعة النهائية للقسم الأخير.</li> {/* Added instruction about review */}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 p-6 bg-gray-50 dark:bg-slate-800/30 border-t dark:border-slate-700">
            <Button variant="outline" className="w-full sm:w-auto dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700" onClick={() => setCurrentView("selection")}>
              <ArrowRightIcon className="h-4 w-4 ml-2" />
              العودة لاختيار اختبار آخر
            </Button>
            <Button
                className={cn("w-full sm:w-auto font-semibold text-base py-3 px-6 bg-gradient-to-r hover:opacity-90 transition-opacity flex items-center justify-center gap-2", selectedExam.themeColor || "from-blue-500 to-indigo-600")}
                onClick={startExam}
            >
              ابدأ الاختبار الآن
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };

  const renderFinalReviewDialog = () => (
    <Dialog open={isFinalReviewDialogOpen} onOpenChange={setIsFinalReviewDialogOpen}>
      <DialogContent className="font-arabic dark:bg-slate-900 border-slate-700 max-w-lg p-0 overflow-hidden shadow-2xl rounded-2xl">
        {/* Creative Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full bg-black/10 mix-blend-multiply opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <div className="absolute -top-1/4 -right-1/4 w-60 h-60 bg-white/5 rounded-full filter blur-3xl opacity-70 animate-pulse-slow"></div>
            <div className="absolute -bottom-1/4 -left-1/4 w-60 h-60 bg-white/5 rounded-full filter blur-3xl opacity-80 animate-pulse-slow animation-delay-2000"></div>
            <TrophyIcon className="h-20 w-20 mx-auto mb-5 text-yellow-300 drop-shadow-lg transform transition-transform hover:scale-110 duration-300" />
            <DialogTitle className="text-4xl font-extrabold mb-3 drop-shadow-sm">على وشك الانتهاء!</DialogTitle>
            <DialogDescription className="text-xl opacity-90 leading-relaxed">
                خطوة أخيرة تفصلك عن النتيجة. هل تود <span className="font-bold underline decoration-yellow-300">مراجعة</span> إجاباتك؟
            </DialogDescription>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-5 bg-white dark:bg-slate-800">
            <div className="p-5 bg-slate-100 dark:bg-slate-700/50 border-r-4 border-primary dark:border-primary-light rounded-lg flex items-start gap-4">
                <Sparkles className="h-8 w-8 text-primary dark:text-primary-light mt-1 flex-shrink-0" />
                <div>
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">لماذا المراجعة؟</h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                        المراجعة تمنحك فرصة لتصحيح الأخطاء غير المقصودة، والتأكد من فهم الأسئلة، وربما تذكر معلومة مهمة. <strong className="text-gray-900 dark:text-white">كل درجة تفرق!</strong>
                    </p>
                </div>
            </div>

            {/* Buttons */}
             <DialogClose asChild>
                <Button
                    variant="default"
                    className="w-full text-lg py-4 bg-gradient-to-r from-blue-500 to-teal-500 hover:opacity-95 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30 flex items-center gap-3"
                    onClick={() => {
                        // setIsFinalReviewDialogOpen(false); // DialogClose handles this
                        setIsReviewDialogOpen(true); // Open the section review dialog
                    }}
                >
                    <Eye className="h-5 w-5"/>
                    نعم، أريد مراجعة القسم الأخير
                </Button>
            </DialogClose>
             <DialogClose asChild>
                <Button
                    className="w-full text-lg py-4 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 shadow-lg hover:shadow-red-500/30 transition-all duration-200 transform hover:scale-105"
                    onClick={() => {
                        // setIsFinalReviewDialogOpen(false); // DialogClose handles this
                        finishExam(); // Call finishExam directly
                    }}
                >
                    لا، أنا متأكد. أنهِ الاختبار الآن!
                </Button>
            </DialogClose>
             <DialogClose asChild>
                 <Button
                    variant="ghost"
                    className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    // onClick={() => setIsFinalReviewDialogOpen(false)} // DialogClose handles this
                >
                    إلغاء (البقاء في القسم)
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
         toast({ title: "خطأ في عرض السؤال", description: "لا يمكن عرض السؤال أو القسم الحالي. الرجاء المحاولة مرة أخرى.", variant: "destructive", duration: 5000});
         setCurrentView("selection");
         return null;
    }

    return (
      <div className="container py-6 max-w-4xl font-arabic animate-fadeIn">
        {renderPrayerBreakOverlay()}
        {renderFinalReviewDialog()} {/* Render the final review dialog */}

        <div className="bg-white dark:bg-slate-800 shadow-xl rounded-xl p-4 md:p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    القسم {currentSectionData.sectionNumber}: {currentSectionData.name}
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                    {currentSectionData.category === "verbal" ? "قدرات لفظية" :
                    currentSectionData.category === "quantitative" ? "قدرات كمية" :
                    "قدرات مختلطة"}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
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
                        "transition-colors dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-700 text-xs sm:text-sm px-2 sm:px-3",
                        isPrayerBreak && "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-700/30 dark:text-orange-300 dark:border-orange-600",
                        (!isPrayerBreak && hasPrayerBreakBeenUsed) && "opacity-50 cursor-not-allowed"
                    )}
                    >
                     <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    {isPrayerBreak ? "استئناف" : hasPrayerBreakBeenUsed ? "تم استخدامه" : "توقف للصلاة"}
                    </Button>
                    <div className="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <span className={cn(
                        "font-medium text-gray-700 dark:text-gray-200 text-sm",
                        timeLeft <= 10 && timeLeft > 0 && "text-red-500 dark:text-red-400 animate-ping", // Ping only when very low
                        timeLeft <= 60 && timeLeft > 10 && "text-red-500 dark:text-red-400"
                    )}>
                        {formatTime(timeLeft)}
                    </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between text-xs sm:text-sm mb-1 text-gray-600 dark:text-gray-400">
            <span>السؤال {currentQuestionIdx + 1} من {questions.length}</span>
            <span>القسم {currentSectionIdx + 1} من {selectedExam.sections.length}</span>
            </div>
            <Progress
                value={((currentQuestionIdx + 1) / questions.length) * 100}
                className="mb-1 h-2 sm:h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-teal-400"
            />
        </div>

        <Card className="mb-6 shadow-xl dark:bg-slate-800">
          <CardHeader className="p-5 md:p-6">
            <CardTitle className="text-lg md:text-xl text-gray-800 dark:text-white leading-relaxed font-semibold" dir="auto">
              {currentQuestionData.text}
            </CardTitle>
            {/* Removed the non-scored badge as per request */}
          </CardHeader>
        </Card>

        <div className="space-y-3 mb-8">
          {currentQuestionData.options.map((option, index) => (
            <div
              key={`${currentQuestionData.id}-opt-${index}`} // More robust key
              className={cn(
                "p-3 sm:p-4 border-2 rounded-lg cursor-pointer hover:border-primary/80 transition-all duration-200 ease-in-out text-gray-700 dark:text-gray-200",
                "bg-white dark:bg-slate-800 dark:border-slate-700",
                selectedAnswer === index
                  ? "border-primary bg-primary/10 dark:bg-primary/20 dark:border-primary shadow-md"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
              onClick={() => selectAnswer(index)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-sm font-semibold shrink-0",
                  selectedAnswer === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                )}>
                  {["أ", "ب", "ج", "د"][index] || index + 1}
                </div>
                <div className="text-sm sm:text-base" dir="auto">{option}</div>
              </div>
            </div>
          ))}
        </div>

        {/* --- Navigation and Actions --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            variant="outline"
            className="w-full sm:w-auto dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIdx === 0}
          >
            <ArrowRightIcon className="h-4 w-4 ml-2" />
            السؤال السابق
          </Button>

            {/* --- Review Section Button & Dialog --- */}
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full sm:w-auto dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700 flex items-center gap-2">
                        <Eye className="h-4 w-4"/>
                        مراجعة القسم
                    </Button>
                </DialogTrigger>
                <DialogContent className="font-arabic dark:bg-slate-800 border-slate-700 max-w-lg">
                    <DialogHeader>
                    <DialogTitle className="text-right dark:text-white">مراجعة أسئلة {currentSectionData.name}</DialogTitle>
                    <DialogDescription className="text-right dark:text-gray-300 pt-2">
                        اضغط على رقم السؤال للانتقال إليه. الأسئلة المجابة معلمة بالأخضر.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-4 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {questions.map((q, index) => (
                            <Button
                                key={q.id}
                                variant={answers[q.id] !== undefined ? "default" : "outline"}
                                className={cn(
                                    "h-10 w-10 text-base font-bold",
                                    answers[q.id] !== undefined
                                        ? "bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                                        : "dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700"
                                )}
                                onClick={() => jumpToQuestion(index)}
                            >
                                {index + 1}
                            </Button>
                        ))}
                    </div>
                    <DialogFooter className="sm:justify-start pt-4">
                        <Button variant="ghost" onClick={() => setIsReviewDialogOpen(false)} className="w-full sm:w-auto dark:text-gray-300 dark:hover:bg-slate-700">إغلاق</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

          {/* --- End Section Button & Dialog --- */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-500/70 dark:text-red-500/90 dark:hover:bg-red-900/30 dark:hover:text-red-400">
                {selectedExam && currentSectionIdx < selectedExam.sections.length -1 ? "إنهاء القسم الحالي" : "إنهاء الاختبار"}
              </Button>
            </DialogTrigger>
            <DialogContent className="font-arabic dark:bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-right dark:text-white">
                    {selectedExam && currentSectionIdx < selectedExam.sections.length -1
                        ? "هل أنت متأكد من إنهاء هذا القسم؟"
                        : "هل أنت متأكد من إنهاء الاختبار؟"
                    }
                </DialogTitle>
                <DialogDescription className="text-right dark:text-gray-300 pt-2">
                   {selectedExam && currentSectionIdx < selectedExam.sections.length -1
                        ? "لن تتمكن من العودة إلى هذا القسم بعد المتابعة."
                        : "سيتم الآن عرض رسالة مراجعة أخيرة قبل حساب نتيجتك."
                    }
                  {(questions.length - Object.keys(answers).filter(k => questions.some(q => q.id === Number(k))).length) > 0 && ` تبقى لديك ${questions.length - Object.keys(answers).filter(k => questions.some(q => q.id === Number(k))).length} سؤال لم تجب عليه في هذا القسم.`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-start pt-4">
                <DialogClose asChild>
                    <Button onClick={() => { moveToNextSection(false); }} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
                      {selectedExam && currentSectionIdx < selectedExam.sections.length -1 ? "نعم، إنهاء والانتقال" : "نعم، أنهِ الاختبار"}
                    </Button>
                </DialogClose>
                <DialogClose asChild>
                    <Button variant="ghost" className="w-full sm:w-auto dark:text-gray-300 dark:hover:bg-slate-700">إلغاء</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={goToNextQuestion}
            disabled={selectedAnswer === null && currentQuestionData.options?.length > 0}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-teal-500 hover:opacity-90 text-white"
          >
            {currentQuestionIdx < questions.length - 1 ? (
              <>
                السؤال التالي
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
              </>
            ) : (
              selectedExam && currentSectionIdx < selectedExam.sections.length -1 ? "القسم التالي" : "إنهاء الاختبار وعرض النتيجة"
            )}
             {currentQuestionIdx === questions.length - 1 && <ArrowLeftIcon className="h-4 w-4 mr-2" />}
          </Button>
        </div>
      </div>
    );
  };


  const renderExamResults = () => {
    if (!selectedExam || currentView !== "results") return null;
    const stats = calculateExamStats();

    const performance =
      stats.percentage >= 90 ? { label: "ممتاز جداً!", color: "text-green-500 dark:text-green-400", icon: <TrophyIcon className="inline-block mr-2 h-7 w-7"/> } :
      stats.percentage >= 80 ? { label: "ممتاز", color: "text-sky-500 dark:text-sky-400", icon: <Star className="inline-block mr-2 h-6 w-6"/> } :
      stats.percentage >= 70 ? { label: "جيد جداً", color: "text-blue-500 dark:text-blue-400", icon: <CheckCircle className="inline-block mr-2 h-6 w-6"/> } :
      stats.percentage >= 50 ? { label: "جيد", color: "text-yellow-500 dark:text-yellow-400", icon: <Info className="inline-block mr-2 h-6 w-6"/> } :
      { label: "بحاجة للمزيد من التدريب", color: "text-red-500 dark:text-red-400", icon: <BookOpen className="inline-block mr-2 h-6 w-6"/> };

    const handleDownloadIncorrectQuestions = () => {
      if (!selectedExam || !allProcessedQuestionsBySection) {
        toast({ title: "خطأ", description: "بيانات الاختبار غير متوفرة.", variant: "destructive" });
        return;
      }

      // أولاً، نتحقق من أن المستخدم قد أجاب على أسئلة فعلاً
      const totalAnsweredQuestions = Object.keys(answers).length;
      if (totalAnsweredQuestions === 0) {
        toast({ 
          title: "لا توجد إجابات", 
          description: "لم تجب على أي سؤال في هذا الاختبار. أكمل الاختبار أولاً للحصول على تحدي الأسئلة الخاطئة والغير مجاب عليها.", 
          variant: "destructive",
          duration: 5000 
        });
        return;
      }

      // تحقق من نوع الجهاز وعرض تنبيه للأجهزة المحمولة
      if (isMobile) {
        toast({ 
          title: "💻 ميزة متقدمة للحاسوب", 
          description: "ميزة اختبار الأخطاء التفاعلية تعمل بأفضل شكل على أجهزة الحاسوب. سيتم تحميل الأسئلة الخاطئة كملف للمراجعة.", 
          duration: 6000,
          className: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
        });
      }

      const incorrectQuestionsDataForRetake: Array<ProcessedExamQuestion & { userAnswerIndex: number | undefined; sectionName: string }> = [];
      
      // جمع جميع الأسئلة الخاطئة والغير مجاب عليها من جميع الأقسام
      Object.entries(allProcessedQuestionsBySection).forEach(([sectionNumStr, sectionQuestions]) => {
        const sectionConfig = selectedExam.sections.find(s => s.sectionNumber === parseInt(sectionNumStr));
        sectionQuestions.forEach(q => {
          const userAnswer = answers[q.id];
          // تضمين الأسئلة الخاطئة أو غير المجاب عليها
          if (userAnswer === undefined || userAnswer !== q.correctOptionIndex) {
            incorrectQuestionsDataForRetake.push({
              ...q,
              userAnswerIndex: userAnswer, // سيكون undefined للأسئلة غير المجاب عليها
              sectionName: sectionConfig?.name || `القسم ${sectionNumStr}`,
            });
          }
        });
      });

      if (incorrectQuestionsDataForRetake.length === 0) {
        toast({ 
          title: "ممتاز! 🎉", 
          description: `أجبت على جميع الأسئلة بشكل صحيح! لا توجد أسئلة خاطئة أو غير مجاب عليها للمراجعة. أداؤك كان مثالياً!`, 
          duration: 6000, 
          className: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700" 
        });
        return;
      }

      const questionsJson = JSON.stringify(incorrectQuestionsDataForRetake.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || "راجع مصادرك لمزيد من التفاصيل.",
        userAnswerIndex: q.userAnswerIndex, // قد يكون undefined للأسئلة غير المجاب عليها
        sectionName: q.sectionName,
        isNonScored: q._isNonScored || false, // تمييز الأسئلة التجريبية
        wasUnanswered: q.userAnswerIndex === undefined, // تمييز الأسئلة غير المجاب عليها
      })));

      const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحدي الأسئلة الخاطئة والغير مجاب عليها: ${selectedExam.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Noto Kufi Arabic', sans-serif; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333; 
            padding: 10px; 
            min-height: 100vh; 
            font-size: 16px;
        }
        .container { 
            background-color: #fff; 
            padding: 15px; 
            border-radius: 15px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
            width: 100%; 
            max-width: 800px; 
            margin: 0 auto;
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 3px solid #667eea; 
            padding-bottom: 15px; 
        }
        .header h1 { 
            color: #667eea; 
            font-size: 1.8rem; 
            margin-bottom: 8px; 
            font-weight: bold;
        }
        .header p { 
            color: #666; 
            font-size: 1rem; 
            line-height: 1.5;
        }
        .question-area { margin-bottom: 15px; }
        .question-card { 
            padding: 15px; 
            border: 1px solid #e0e0e0; 
            border-radius: 12px; 
            margin-bottom: 15px; 
            background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .question-text { 
            font-size: 1.1rem; 
            font-weight: bold; 
            margin-bottom: 15px; 
            color: #2c3e50; 
            line-height: 1.6; 
        }
        .original-info { 
            font-size: 0.9rem; 
            color: #555; 
            margin-bottom: 15px; 
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            padding: 12px; 
            border-radius: 8px; 
            border-right: 4px solid #f39c12;
        }
        .original-info strong { color: #2c3e50; }
        .options-list { 
            list-style: none; 
            padding: 0; 
            margin: 0;
        }
        .options-list li {
            padding: 12px 15px; 
            margin: 10px 0; 
            border: 2px solid #e8e8e8; 
            border-radius: 10px; 
            cursor: pointer;
            transition: all 0.3s ease; 
            display: flex; 
            align-items: center;
            background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
            font-size: 1rem;
            min-height: 50px;
        }
        .options-list li:hover { 
            border-color: #667eea; 
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        .options-list li.selected { 
            border-color: #00b894; 
            background: linear-gradient(135deg, #d1f2eb 0%, #a8e6cf 100%); 
            font-weight: bold; 
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 184, 148, 0.3);
        }
        .option-letter {
            min-width: 35px; 
            height: 35px; 
            background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
            color: white; 
            border-radius: 50%;
            display: flex; 
            justify-content: center; 
            align-items: center; 
            margin-left: 12px; 
            font-weight: bold; 
            font-size: 1rem;
            flex-shrink: 0;
        }
        .options-list li.selected .option-letter { 
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
        }
        .feedback-area { 
            margin-top: 15px; 
            padding: 15px; 
            border-radius: 10px; 
            font-size: 0.95rem; 
            display: none; 
            line-height: 1.5;
        }
        .feedback-area.correct { 
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            color: #155724; 
            border: 2px solid #28a745; 
        }
        .feedback-area.incorrect { 
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            color: #721c24; 
            border: 2px solid #dc3545; 
        }
        .explanation-text { 
            margin-top: 10px; 
            font-style: italic; 
            color: #495057; 
            line-height: 1.6; 
        }
        #navigation-buttons, #result-area { 
            text-align: center; 
            margin-top: 20px; 
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            padding: 12px 20px; 
            border-radius: 25px;
            font-size: 1rem; 
            cursor: pointer; 
            transition: all 0.3s ease; 
            margin: 5px;
            font-weight: bold;
            min-width: 100px;
        }
        button:hover { 
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        button:active {
            transform: translateY(0);
        }
        button:disabled { 
            background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
            cursor: not-allowed; 
            transform: none;
            box-shadow: none;
        }
        #submit-retake-btn { 
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
        }
        #submit-retake-btn:hover { 
            box-shadow: 0 6px 20px rgba(0, 184, 148, 0.4);
        }
        #result-area h2 { 
            color: #667eea; 
            font-size: 1.5rem;
        } 
        #result-area p { margin: 10px 0; }
        #progress-bar-container { 
            width: 100%; 
            background-color: #e9ecef; 
            border-radius: 10px; 
            margin-bottom: 20px; 
            height: 20px; 
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        #progress-bar { 
            width: 0%; 
            height: 100%; 
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
            border-radius: 10px; 
            transition: width 0.5s ease-in-out; 
            text-align: center; 
            color: white; 
            font-size: 0.9rem; 
            line-height: 20px;
            font-weight: bold;
        }
        .footer { 
            text-align: center; 
            margin-top: 25px; 
            padding-top: 15px; 
            border-top: 2px solid #e9ecef; 
            font-size: 0.9rem; 
            color: #6c757d; 
        }
        .no-questions { 
            text-align: center; 
            font-size: 1.2rem; 
            color: #00b894; 
            padding: 30px; 
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border-radius: 15px;
            border: 2px solid #28a745;
        }
        
        /* تحسينات للهواتف المحمولة */
        @media (max-width: 768px) {
            body { padding: 5px; font-size: 14px; }
            .container { padding: 12px; border-radius: 12px; }
            .header h1 { font-size: 1.5rem; }
            .header p { font-size: 0.9rem; }
            .question-text { font-size: 1rem; }
            .original-info { font-size: 0.8rem; padding: 10px; }
            .options-list li { 
                padding: 10px 12px; 
                margin: 8px 0; 
                font-size: 0.9rem;
                min-height: 45px;
            }
            .option-letter { 
                min-width: 30px; 
                height: 30px; 
                font-size: 0.9rem;
                margin-left: 8px;
            }
            button { 
                padding: 10px 16px; 
                font-size: 0.9rem; 
                margin: 3px;
                min-width: 80px;
            }
            #navigation-buttons { 
                display: flex; 
                flex-wrap: wrap; 
                justify-content: center; 
                gap: 5px; 
            }
            #progress-bar-container { height: 18px; }
            #progress-bar { font-size: 0.8rem; line-height: 18px; }
        }
        
        @media (max-width: 480px) {
            .header h1 { font-size: 1.3rem; }
            .question-text { font-size: 0.95rem; }
            .options-list li { 
                font-size: 0.85rem;
                padding: 8px 10px;
                min-height: 40px;
            }
            .option-letter { 
                min-width: 28px; 
                height: 28px; 
                font-size: 0.8rem;
                margin-left: 6px;
            }
            button { 
                padding: 8px 12px; 
                font-size: 0.8rem;
                min-width: 70px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 تحدي الأسئلة الخاطئة والغير مجاب عليها</h1>
            <p>فرصتك لمراجعة جميع الأسئلة الخاطئة والتي لم تجب عليها وتحويلها إلى نقاط قوة!</p>
        </div>
        <div id="progress-bar-container">
            <div id="progress-bar">0%</div>
        </div>
        <div id="question-area">
            </div>
        <div id="navigation-buttons">
            <button id="prev-btn" onclick="prevRetakeQuestion()" disabled>السابق</button>
            <button id="next-btn" onclick="nextRetakeQuestion()">التالي</button>
            <button id="submit-retake-btn" onclick="submitRetake()" style="display:none;">عرض النتيجة النهائية</button>
        </div>
        <div id="result-area" style="display:none;">
            <h2>نتائج تحدي الأخطاء والمفقودات:</h2>
            <p id="score-text"></p>
            <p id="feedback-message"></p>
            <button onclick="restartRetake()">أعد التحدي</button>
        </div>
    </div>
    <div class="footer">
        © ${new Date().getFullYear()} منصة قدراتك - بالتوفيق في رحلتك التعليمية!
    </div>
    <script>
        let incorrectQuestionsForRetake = [];
        let userRetakeAnswers = {}; // { questionOriginalId: selectedOptionOriginalIndex }
        let currentRetakeQuestionDisplayIndex = 0;
        let retakeSubmitted = false;
        let mappedIncorrectQuestions = [];
        const optionChars = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];


        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function createQuestionMap(question) {
            const optionsWithOriginalIndex = question.options.map((optionText, originalIndex) => ({
                text: optionText,
                originalIndex: originalIndex
            }));
            const shuffledOptions = shuffleArray([...optionsWithOriginalIndex]);
            return { ...question, shuffledOptions };
        }

        function loadRetakeQuestion(index) {
            retakeSubmitted = false;
            const questionArea = document.getElementById('question-area');
            const questionData = mappedIncorrectQuestions[index];
            if (!questionData) return;

            const progressBar = document.getElementById('progress-bar');
            const progressPercentage = Math.round(((index + 1) / mappedIncorrectQuestions.length) * 100);
            progressBar.style.width = progressPercentage + '%';
            progressBar.textContent = progressPercentage + '%';

            questionArea.innerHTML = \`
                <div class="question-card" id="qcard-\${questionData.id}">
                    <p class="question-text">(\${index + 1}/\${mappedIncorrectQuestions.length}) \${questionData.text}</p>
                    <div class="original-info">
                        <strong>تذكير بالامتحان الأصلي:</strong><br>
                        \${questionData.wasUnanswered 
                            ? 'إجابتك الأصلية: <span style="color: #e17055; font-weight: bold;">لم تجب على هذا السؤال</span>' 
                            : \`إجابتك الأصلية: <span style="color: #d63031; font-weight: bold;">"\${questionData.options[questionData.userAnswerIndex]}"</span>\`
                        }.<br>
                        الإجابة الصحيحة: <span style="color: #00b894; font-weight: bold;">"\${questionData.options[questionData.correctOptionIndex]}"</span>.<br>
                        القسم الأصلي: <span style="font-weight: bold;">\${questionData.sectionName}</span>.<br>
                        \${questionData.isNonScored ? '<span style="color: #0984e3; font-weight: bold;">📝 سؤال تجريبي (غير محسوب في النتيجة)</span>' : '<span style="color: #00b894; font-weight: bold;">✓ سؤال محسوب في النتيجة</span>'}
                    </div>
                    <ul class="options-list" id="options-\${questionData.id}">
                        \${questionData.shuffledOptions.map((opt, i) => \`
                            <li onclick="selectRetakeAnswer('\${questionData.id}', \${opt.originalIndex}, this)">
                                <span class="option-letter">\${optionChars[i] || i+1}</span>
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
                for (let i=0; i < listItems.length; i++) {
                    if (questionData.shuffledOptions[i].originalIndex === selectedOriginalIndex) {
                        listItems[i].classList.add('selected');
                        break;
                    }
                }
            }

            document.getElementById('prev-btn').disabled = index === 0;
            document.getElementById('next-btn').disabled = index === mappedIncorrectQuestions.length - 1;
            document.getElementById('submit-retake-btn').style.display = (index === mappedIncorrectQuestions.length - 1) ? 'inline-block' : 'none';
            document.getElementById('result-area').style.display = 'none';
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
            if (currentRetakeQuestionDisplayIndex < mappedIncorrectQuestions.length - 1) {
                currentRetakeQuestionDisplayIndex++;
                loadRetakeQuestion(currentRetakeQuestionDisplayIndex);
            }
        }

        function submitRetake() {
            retakeSubmitted = true;
            let score = 0;
            mappedIncorrectQuestions.forEach(qData => {
                const feedbackDiv = document.getElementById(\`feedback-\${qData.id}\`);
                const selectedOptOriginalIndex = userRetakeAnswers[qData.id];
                const isCorrectThisTime = selectedOptOriginalIndex === qData.correctOptionIndex;

                if (selectedOptOriginalIndex !== undefined) {
                    if (isCorrectThisTime) {
                        score++;
                        feedbackDiv.innerHTML = \`🎉 رائع! إجابة صحيحة هذه المرة. <br> \${qData.explanation ? \`<p class="explanation-text"><strong>الشرح:</strong> \${qData.explanation}</p>\` : ''}\`;
                        feedbackDiv.className = 'feedback-area correct';
                    } else {
                        feedbackDiv.innerHTML = \`❌ للأسف، إجابة خاطئة. الإجابة الصحيحة كانت: "\${qData.options[qData.correctOptionIndex]}". <br> \${qData.explanation ? \`<p class="explanation-text"><strong>الشرح:</strong> \${qData.explanation}</p>\` : ''}\`;
                        feedbackDiv.className = 'feedback-area incorrect';
                    }
                } else {
                    feedbackDiv.innerHTML = \`⚠️ لم تجب على هذا السؤال في التحدي. الإجابة الصحيحة هي: "\${qData.options[qData.correctOptionIndex]}". <br> \${qData.explanation ? \`<p class="explanation-text"><strong>الشرح:</strong> \${qData.explanation}</p>\` : ''}\`;
                    feedbackDiv.className = 'feedback-area incorrect';
                }
                feedbackDiv.style.display = 'block';
                const qOptionsList = document.getElementById(\`options-\${qData.id}\`);
                if(qOptionsList) { Array.from(qOptionsList.getElementsByTagName('li')).forEach(li => li.onclick = null); }
            });

            const resultArea = document.getElementById('result-area');
            const scoreText = document.getElementById('score-text');
            const feedbackMsg = document.getElementById('feedback-message');
            scoreText.textContent = \`نتيجتك في هذا التحدي: \${score} من \${mappedIncorrectQuestions.length} (\${((score / mappedIncorrectQuestions.length) * 100).toFixed(1)}%)\`;

            if (score === mappedIncorrectQuestions.length) {
                feedbackMsg.textContent = "🎉 ممتاز! لقد أتقنت جميع الأسئلة التي أخطأت بها أو لم تجب عليها سابقاً. استمر في هذا التقدم!";
                feedbackMsg.style.color = "#00b894";
            } else if (score >= mappedIncorrectQuestions.length / 2) {
                feedbackMsg.textContent = "👍 جيد جداً! لقد تحسنت كثيراً. القليل من التركيز وستتقن البقية.";
                feedbackMsg.style.color = "#0984e3";
            } else {
                feedbackMsg.textContent = "💡 لا بأس، كل خطأ هو فرصة للتعلم. راجع الشروحات وحاول مرة أخرى!";
                feedbackMsg.style.color = "#e17055";
            }
            resultArea.style.display = 'block';
            document.getElementById('navigation-buttons').style.display = 'none';
            resultArea.scrollIntoView({ behavior: 'smooth' });
        }

        function restartRetake() {
            currentRetakeQuestionDisplayIndex = 0;
            userRetakeAnswers = {};
            retakeSubmitted = false;
            mappedIncorrectQuestions.forEach(qData => {
                const feedbackDiv = document.getElementById(\`feedback-\${qData.id}\`);
                if (feedbackDiv) { feedbackDiv.innerHTML = ''; feedbackDiv.style.display = 'none';}
            });
            document.getElementById('navigation-buttons').style.display = 'block';
            document.getElementById('prev-btn').disabled = true;
            document.getElementById('next-btn').disabled = mappedIncorrectQuestions.length <=1;
            loadRetakeQuestion(0);
        }

        window.onload = () => {
            incorrectQuestionsForRetake = ${questionsJson};
            if (incorrectQuestionsForRetake.length > 0) {
                mappedIncorrectQuestions = incorrectQuestionsForRetake.map(q => createQuestionMap(q));
                loadRetakeQuestion(0);
            } else {
                document.getElementById('question-area').innerHTML = '<p class="no-questions">🎉 رائع! لم تكن لديك أي أسئلة خاطئة أو غير مجاب عليها لمراجعتها في هذا الاختبار. أداؤك كان مثالياً!</p>';
                document.getElementById('navigation-buttons').style.display = 'none';
                document.getElementById('progress-bar-container').style.display = 'none';
            }
        };
    </script>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedExam.name}_تحدي_الاخطاء.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      const wrongCount = incorrectQuestionsDataForRetake.filter(q => q.userAnswerIndex !== undefined).length;
      const unansweredCount = incorrectQuestionsDataForRetake.filter(q => q.userAnswerIndex === undefined).length;
      
      toast({ 
        title: "تم تحميل التحدي", 
        description: `تم إنشاء تحدي يحتوي على ${incorrectQuestionsDataForRetake.length} سؤال (${wrongCount} خاطئ، ${unansweredCount} غير مجاب عليه). ${isMobile ? 'افتح الملف في متصفحك للمراجعة.' : 'الآن محسّن للهواتف! افتح الملف في متصفحك لبدء التحدي التفاعلي.'}`, 
        duration: 7000 
      });
    };


    return (
      <div className="container py-8 max-w-4xl font-arabic animate-fadeIn">
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
              {[
                {label: "اللفظي", value: `${stats.verbalScore}/${stats.verbalTotal}`, percentage: stats.verbalPercentage},
                {label: "الكمي", value: `${stats.quantitativeScore}/${stats.quantitativeTotal}`, percentage: stats.quantitativePercentage},
                {label: "الوقت", value: `${stats.timeTaken} د`, subtext: `من ${selectedExam.totalTime} د`},
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

            <div>
              <h3 className="font-semibold text-xl text-gray-700 dark:text-gray-100 mb-4">النتائج التفصيلية حسب القسم:</h3>
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
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 p-6 bg-gray-50 dark:bg-slate-800/30 border-t dark:border-slate-700">
            <Button variant="outline" className="w-full sm:w-auto dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700" onClick={() => setCurrentView("selection")}>
              <ArrowRightIcon className="h-4 w-4 ml-2" />
              العودة للاختبارات
            </Button>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                 {/* New Button for Incorrect Questions Challenge */}
                <Button
                  onClick={handleDownloadIncorrectQuestions}
                  variant="default"
                  className="gap-2 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
                >
                  <Target className="h-4 w-4" /> {/* Or RefreshCw */}
                  🎯 {isMobile ? 'تحميل الأسئلة الخاطئة' : 'تحدي الأسئلة الخاطئة والغير مجاب عليها'}
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
                        body{font-family:'Noto Kufi Arabic',sans-serif;padding:20px;margin:0;background-color:#f8f9fa;color:#212529;line-height:1.6;}
                        .container{max-width:800px;margin:auto;background:#fff;padding:20px;border-radius:8px;box-shadow:0 0 15px rgba(0,0,0,0.1);}
                        .header{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:1px solid #e0e0e0;}
                        .logo{font-size:28px;font-weight:bold;color:#4f46e5;margin-bottom:10px;}
                        .section{margin-bottom:30px;padding-bottom:20px;border-bottom:1px dashed #eee;}.section:last-child{border-bottom:none;}
                        .section h2{color:#4f46e5;margin-bottom:20px;font-size:1.6em;}
                        .question{margin-bottom:25px;padding:15px;border:1px solid #e0e0e0;border-radius:8px;background:#fdfdfd;}
                        .question h3{color:#343a40;margin:0 0 15px 0;font-size:1.1em;font-weight:bold;}
                        .question p:first-of-type{margin-top:0;} .options p{padding:10px 15px;margin:8px 0;border-radius:6px;border:1px solid #ced4da;background:#fff;position:relative;}
                        .options p.correct{color:#155724 !important;background-color:#d4edda !important;border-color:#c3e6cb !important;font-weight:bold;}
                        .options p.correct::before{content:"✓";position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#155724;font-size:1.2em;}
                        .options p.wrong{color:#721c24 !important;background-color:#f8d7da !important;border-color:#f5c6cb !important;font-weight:bold;}
                        .options p.wrong::before{content:"✗";position:absolute;left:15px;top:50%;transform:translateY(-50%);color:#721c24;font-size:1.2em;}
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
                  className="gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="h-4 w-4" />
                  عرض النتائج للطباعة
                </Button>

                <Button
                  variant="outline"
                   className="gap-2 w-full sm:w-auto dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-700"
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
                        @media print{body{padding:0;background:#fff;}.container{box-shadow:none;border:none;padding:5px;} P{page-break-inside: avoid;}}
                        </style></head><body><div class="container"><div class="header"><div class="logo">قدراتك</div><h1>أسئلة: ${examName}</h1>
                        <div style="font-size:0.9em;color:#6c757d;">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</div></div>`;

                      Object.entries(allProcessedQuestionsBySection).forEach(([sectionNum, sectionQuestions]) => {
                        const sectionConfig = selectedExam.sections.find(s => s.sectionNumber === parseInt(sectionNum));
                        const sectionName = sectionConfig?.name || `القسم ${sectionNum}`;
                        content += `<div class="section"><h2>${sectionName}</h2>`;
                        sectionQuestions.forEach((q, idx) => {
                          content += `<div class="question"><h3>السؤال ${idx + 1}${q._isNonScored? '<span class="non-scored-badge">تجريبي</span>':''}</h3><p>${q.text}</p><div class="options">`;
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
                      a.download = `${examName}_اسئلة_فقط.html`;
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
              </div>
          </CardFooter>
        </Card>

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
                            {question._isNonScored ? <Info size={18}/> : isCorrect ? "✓" : "✗"}
                            </div>
                            <div className="flex-grow">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-100 mb-1">{sectionName} - سؤال {questionDisplayIndex}</h4>
                            {question._isNonScored && <Badge variant="outline" className="mb-2 text-xs border-blue-500 text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600">سؤال تجريبي</Badge>}
                            <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed text-sm sm:text-base" dir="auto">{question.text}</p>

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
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-xs sm:text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200">
                                    <strong className="block mb-1">الشرح:</strong>
                                    {question.explanation}
                                </div>
                            )}
                            <div className="mt-4 flex justify-end">
                                <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700"
                                onClick={() => {
                                    const message = encodeURIComponent(
                                    `تبليغ عن خطأ في السؤال (ID: ${question.id}):\n\nنص السؤال: ${question.text}\n\nالخيارات:\n${question.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nالإجابة الصحيحة المعلمة: ${question.options[question.correctOptionIndex]} (الخيار ${question.correctOptionIndex + 1})`
                                    );
                                    window.open(`https://t.me/qodratak2030?text=${message}`, '_blank');
                                }}
                                >
                                <Info size={12} className="ml-1"/> إبلاغ عن خطأ
                                </Button>
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

        <Card className="dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">تحليل الأداء والتوصيات</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              بناءً على أدائك، إليك بعض التوصيات لتحسين نتيجتك المستقبلية.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="verbal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <TabsTrigger value="verbal" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-white">القدرات اللفظية</TabsTrigger>
                <TabsTrigger value="quantitative" className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md dark:data-[state=active]:bg-slate-600 dark:data-[state=active]:text-white">القدرات الكمية</TabsTrigger>
              </TabsList>

              <TabsContent value="verbal" className="space-y-4">
                <div className="p-4 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/30 shadow-sm">
                  <h4 className="font-medium text-gray-700 dark:text-gray-100 mb-2">نقاط القوة</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside marker:text-green-500 pl-4">
                    <li>أداء جيد في فهم النصوص واستخلاص النتائج.</li>
                    <li>معرفة مناسبة بالمترادفات والمتضادات.</li>
                  </ul>
                </div>
                 <div className="p-4 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/30 shadow-sm">
                  <h4 className="font-medium text-gray-700 dark:text-gray-100 mb-2">مجالات التحسين</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside marker:text-red-500 pl-4">
                    <li>تحتاج إلى تحسين في الاستدلال اللفظي (إكمال الجمل).</li>
                    <li>تدرب على التمييز بين العلاقات اللفظية المتشابهة (التناظر اللفظي).</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-800 dark:text-blue-200 shadow-sm">
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Sparkles size={18}/> توصيات ذهبية</h4>
                  <p className="text-sm mb-2">
                    نوصي بالتركيز على تدريبات الاستدلال اللفظي والتناظر. يمكنك أيضًا:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside pl-4">
                    <li>قراءة نصوص متنوعة مع التركيز على فهم السياق.</li>
                    <li>حل تمارين مخصصة لإكمال الجمل والعلاقات اللفظية.</li>
                    <li>مراجعة شروحات الأسئلة الخاطئة لفهم طريقة التفكير الصحيحة.</li>
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="quantitative" className="space-y-4">
                <div className="p-4 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/30 shadow-sm">
                  <h4 className="font-medium text-gray-700 dark:text-gray-100 mb-2">نقاط القوة</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside marker:text-green-500 pl-4">
                    <li>إتقان العمليات الحسابية الأساسية.</li>
                    <li>فهم جيد للنسب المئوية والتناسب.</li>
                  </ul>
                </div>
                <div className="p-4 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/30 shadow-sm">
                  <h4 className="font-medium text-gray-700 dark:text-gray-100 mb-2">مجالات التحسين</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside marker:text-red-500 pl-4">
                    <li>تحتاج إلى تحسين في حل المسائل الهندسية (المساحات والحجوم).</li>
                    <li>تقوية مهارات تحليل البيانات وقراءة الرسوم البيانية.</li>
                  </ul>
                </div>
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-800 dark:text-blue-200 shadow-sm">
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Sparkles size={18}/> توصيات ذهبية</h4>
                  <p className="text-sm mb-2">
                    نوصي بالتركيز على تدريبات الهندسة وتحليل البيانات. يمكنك أيضًا:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside pl-4">
                    <li>مراجعة القوانين الأساسية للمساحات والحجوم للأشكال الهندسية الشائعة.</li>
                    <li>التدرب على مسائل متنوعة تتضمن رسومًا بيانية وجداول.</li>
                    <li>تعلم استراتيجيات الحل السريع للمسائل الكمية.</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      {currentView === "selection" && renderExamSelection()}
      {currentView === "instructions" && renderExamInstructions()}
      {currentView === "inProgress" && renderExamInProgress()}
      {currentView === "results" && renderExamResults()}
    </div>
  );
};

export default QiyasExamPage;