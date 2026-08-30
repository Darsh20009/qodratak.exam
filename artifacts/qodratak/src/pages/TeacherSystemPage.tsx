import { useState, useEffect, useRef, useCallback, useMemo } from "react";

import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, Brain, ChevronLeft, ChevronRight,
  Clock, CheckCircle, XCircle, Star, Target,
  MessageSquare, Send, RotateCcw, TrendingUp,
  TrendingDown, Award, Calendar, ArrowLeft, Sparkles,
  BarChart3, Timer, Circle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
type ExamType = "qudrat" | "tahsili";
type Phase = "intro" | "test" | "analyzing" | "results";

interface DiagQuestion {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category: string;
  subcategory?: string;
  explanation?: string;
}

interface TeacherPlan {
  overallGrade: string;
  scorePercent: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  roadmap: Array<{ week: number; title: string; tasks: string[]; priority: "high" | "medium" | "low" }>;
  timingTips: string[];
  encouragement: string;
}

interface ChatMessage { role: "user" | "teacher"; content: string; }

// ─── Hardcoded diagnostic questions for instant load ─────────────────
const QUDRAT_QUESTIONS: DiagQuestion[] = [
  { id: 1, text: "كلمة 'عذب' تعني:", options: ["مر", "حلو سهل", "سريع", "بطيء"], correctOptionIndex: 1, category: "verbal", subcategory: "المفردات" },
  { id: 2, text: "أي الكلمات التالية مضاد كلمة 'قحط'؟", options: ["جفاف", "خصب", "حر", "برد"], correctOptionIndex: 1, category: "verbal", subcategory: "المتضادات" },
  { id: 3, text: "تاجر : ربح = معلم : ؟", options: ["مدرسة", "علم", "طالب", "كتاب"], correctOptionIndex: 1, category: "verbal", subcategory: "التناظر اللفظي" },
  { id: 4, text: "مررت بزمن _____ الكفاح.", options: ["طويل", "طويلًا", "طويلٍ", "طويلاً"], correctOptionIndex: 3, category: "verbal", subcategory: "إكمال الجملة" },
  { id: 5, text: "كتاب : مكتبة = سيارة : ؟", options: ["طريق", "جراج", "محرك", "بنزين"], correctOptionIndex: 1, category: "verbal", subcategory: "التناظر اللفظي" },
  { id: 6, text: "مفرد كلمة 'مساجد':", options: ["مسجد", "مسجدة", "مسجود", "ساجد"], correctOptionIndex: 0, category: "verbal", subcategory: "المفردات" },
  { id: 7, text: "أي الجمل صحيحة نحوياً؟", options: ["جاء الطلابُ", "جاء الطلابَ", "جاء الطلابِ", "جاء الطلابُون"], correctOptionIndex: 0, category: "verbal", subcategory: "إكمال الجملة" },
  { id: 8, text: "نتاج : منتج = زراعة : ؟", options: ["مزارع", "محصول", "نبات", "أرض"], correctOptionIndex: 1, category: "verbal", subcategory: "التناظر اللفظي" },
  { id: 9, text: "كلمة 'جليل' تعني:", options: ["صغير", "عظيم", "سريع", "قديم"], correctOptionIndex: 1, category: "verbal", subcategory: "المفردات" },
  { id: 10, text: "الشمس تشرق من الـ:", options: ["غرب", "شمال", "شرق", "جنوب"], correctOptionIndex: 2, category: "verbal", subcategory: "الاستنتاج" },
  { id: 11, text: "مضاد كلمة 'شحيح':", options: ["بخيل", "كريم", "سخي", "ثري"], correctOptionIndex: 2, category: "verbal", subcategory: "المتضادات" },
  { id: 12, text: "طبيب : مستشفى = مدرس : ؟", options: ["كتاب", "مدرسة", "علم", "طالب"], correctOptionIndex: 1, category: "verbal", subcategory: "التناظر اللفظي" },
  { id: 13, text: "أكمل: الطالب المجتهد _____ دائماً.", options: ["ينجحُ", "ينجحَ", "ينجحِ", "نجاحاً"], correctOptionIndex: 0, category: "verbal", subcategory: "إكمال الجملة" },
  { id: 14, text: "كلمة 'وجيز' تعني:", options: ["طويل", "موجز مختصر", "واضح", "غامض"], correctOptionIndex: 1, category: "verbal", subcategory: "المفردات" },
  { id: 15, text: "قلم : كتابة = مقص : ؟", options: ["ورق", "قطع", "خيط", "إبرة"], correctOptionIndex: 1, category: "verbal", subcategory: "التناظر اللفظي" },
  { id: 16, text: "مضاد كلمة 'هادئ':", options: ["ساكن", "راقٍ", "صاخب", "وديع"], correctOptionIndex: 2, category: "verbal", subcategory: "المتضادات" },
  { id: 17, text: "المقرر _____ الدراسي يشمل عدة مواد.", options: ["المنهجُ", "المنهجَ", "المنهجِ", "منهجاً"], correctOptionIndex: 0, category: "verbal", subcategory: "إكمال الجملة" },
  { id: 18, text: "اقرأ النص: 'يعتبر التعليم ركيزة أساسية في بناء الأمم.' — ما الفكرة الرئيسية؟", options: ["الأمم قوية", "التعليم مهم لبناء الأمم", "التعليم صعب", "الأمم تبني المدارس"], correctOptionIndex: 1, category: "verbal", subcategory: "فهم المقروء" },
  { id: 19, text: "كلمة 'نزيه' تعني:", options: ["كريم", "شريف أمين", "شجاع", "حكيم"], correctOptionIndex: 1, category: "verbal", subcategory: "المفردات" },
  { id: 20, text: "إذا كان 3x + 6 = 18، فإن x يساوي:", options: ["3", "4", "5", "6"], correctOptionIndex: 1, category: "quantitative", subcategory: "الجبر" },
  { id: 21, text: "ما ناتج (25% من 200)؟", options: ["25", "50", "75", "100"], correctOptionIndex: 1, category: "quantitative", subcategory: "العمليات الحسابية" },
  { id: 22, text: "محيط مربع طول ضلعه 7 سم:", options: ["28 سم", "49 سم", "14 سم", "21 سم"], correctOptionIndex: 0, category: "quantitative", subcategory: "الهندسة" },
  { id: 23, text: "إذا كان 40% من الطلاب 16 طالباً، كم عدد الطلاب الكلي؟", options: ["40", "36", "48", "50"], correctOptionIndex: 0, category: "quantitative", subcategory: "النسب والتناسب" },
  { id: 24, text: "ما الرقم التالي في المتتالية: 2، 6، 18، 54، ...؟", options: ["108", "162", "216", "270"], correctOptionIndex: 1, category: "quantitative", subcategory: "المتتاليات" },
  { id: 25, text: "متوسط الأعداد: 10، 20، 30، 40، 50 هو:", options: ["25", "30", "35", "40"], correctOptionIndex: 1, category: "quantitative", subcategory: "الإحصاء" },
  { id: 26, text: "طول قطر دائرة نصف قطرها 7 سم:", options: ["7", "14", "21", "49"], correctOptionIndex: 1, category: "quantitative", subcategory: "الهندسة" },
  { id: 27, text: "إذا كان س = 3 وص = 2، ما قيمة 2س + 3ص؟", options: ["10", "11", "12", "13"], correctOptionIndex: 2, category: "quantitative", subcategory: "الجبر" },
  { id: 28, text: "5 أرقام متتالية مجموعها 135، الأصغر منها:", options: ["25", "27", "29", "23"], correctOptionIndex: 0, category: "quantitative", subcategory: "الأعداد" },
  { id: 29, text: "إذا كانت نسبة الربح 20% وسعر الشراء 500 ريال، ما سعر البيع؟", options: ["520", "580", "600", "620"], correctOptionIndex: 2, category: "quantitative", subcategory: "النسب والتناسب" },
  { id: 30, text: "ما الرقم التالي: 1، 4، 9، 16، ...؟", options: ["20", "25", "36", "49"], correctOptionIndex: 1, category: "quantitative", subcategory: "المتتاليات" },
  { id: 31, text: "مساحة مثلث قاعدته 8 سم وارتفاعه 6 سم:", options: ["24 سم²", "48 سم²", "14 سم²", "36 سم²"], correctOptionIndex: 0, category: "quantitative", subcategory: "الهندسة" },
  { id: 32, text: "إذا كان الوسيط لمجموعة بيانات هو 15، وترتيبها تصاعدي: 10، 12، ؟، 18، 20، ما القيمة المجهولة؟", options: ["14", "15", "16", "17"], correctOptionIndex: 1, category: "quantitative", subcategory: "الإحصاء" },
  { id: 33, text: "حل المتراجحة: 2x - 3 > 7", options: ["x > 2", "x > 5", "x < 5", "x > 10"], correctOptionIndex: 1, category: "quantitative", subcategory: "الجبر" },
  { id: 34, text: "قطار طوله 200م يعبر نفقاً طوله 800م بسرعة 50م/ثا. كم يستغرق؟", options: ["16 ثا", "20 ثا", "24 ثا", "40 ثا"], correctOptionIndex: 1, category: "quantitative", subcategory: "العمليات الحسابية" },
  { id: 35, text: "ما نسبة الزيادة من 80 إلى 100؟", options: ["20%", "25%", "30%", "80%"], correctOptionIndex: 1, category: "quantitative", subcategory: "النسب والتناسب" },
  { id: 36, text: "ما عدد الزوايا في المضلع السداسي؟", options: ["4", "5", "6", "8"], correctOptionIndex: 2, category: "quantitative", subcategory: "الهندسة" },
  { id: 37, text: "مجموع زوايا المثلث يساوي:", options: ["90°", "180°", "270°", "360°"], correctOptionIndex: 1, category: "quantitative", subcategory: "الهندسة" },
  { id: 38, text: "ما قيمة √144؟", options: ["11", "12", "13", "14"], correctOptionIndex: 1, category: "quantitative", subcategory: "العمليات الحسابية" },
  { id: 39, text: "إذا كانت نسبة عدد البنين إلى البنات 3:2 وعدد الطلاب 50، كم عدد البنات؟", options: ["15", "20", "25", "30"], correctOptionIndex: 1, category: "quantitative", subcategory: "النسب والتناسب" },
  { id: 40, text: "ما الرقم التالي في المتتالية: 3، 7، 11، 15، ...؟", options: ["17", "18", "19", "20"], correctOptionIndex: 2, category: "quantitative", subcategory: "المتتاليات" },
];

const TAHSILI_QUESTIONS: DiagQuestion[] = [
  { id: 1, text: "ما رمز عنصر الذهب في الجدول الدوري؟", options: ["Gd", "Au", "Go", "Ag"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "الجدول الدوري" },
  { id: 2, text: "ما وحدة قياس الشغل في النظام الدولي؟", options: ["واط", "جول", "نيوتن", "باسكال"], correctOptionIndex: 1, category: "الفيزياء", subcategory: "الطاقة" },
  { id: 3, text: "أي المخلوقات التالية لا تنتمي إلى الثدييات؟", options: ["الحوت", "الخفاش", "التمساح", "الدلفين"], correctOptionIndex: 2, category: "الأحياء", subcategory: "تصنيف الكائنات" },
  { id: 4, text: "حل المعادلة: 2x - 4 = 10", options: ["x=5", "x=6", "x=7", "x=8"], correctOptionIndex: 2, category: "الرياضيات", subcategory: "الجبر" },
  { id: 5, text: "ما الصيغة الكيميائية لثاني أكسيد الكربون؟", options: ["CO", "CO₂", "C₂O", "CO₃"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "الصيغ الكيميائية" },
  { id: 6, text: "ما قانون نيوتن الثاني للحركة؟", options: ["F = m×a", "F = m×v", "F = m×g", "F = m²×a"], correctOptionIndex: 0, category: "الفيزياء", subcategory: "الميكانيكا" },
  { id: 7, text: "أي الأعضاء يُصنَّف ضمن الجهاز الهضمي؟", options: ["الكلية", "الرئة", "الكبد", "القلب"], correctOptionIndex: 2, category: "الأحياء", subcategory: "الجهاز الهضمي" },
  { id: 8, text: "مشتقة الدالة f(x) = x²:", options: ["2x²", "x", "2x", "x/2"], correctOptionIndex: 2, category: "الرياضيات", subcategory: "التفاضل" },
  { id: 9, text: "العنصر الأكثر وفرة في الغلاف الجوي للأرض:", options: ["الأكسجين", "النيتروجين", "الهيدروجين", "ثاني أكسيد الكربون"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "الغازات" },
  { id: 10, text: "وحدة قياس الكثافة:", options: ["كجم/م²", "كجم/م³", "كجم×م", "كجم/م"], correctOptionIndex: 1, category: "الفيزياء", subcategory: "الكثافة" },
  { id: 11, text: "الخلية هي:", options: ["أصغر وحدة حياة", "نواة الكائن", "جزيء عضوي", "ذرة بيولوجية"], correctOptionIndex: 0, category: "الأحياء", subcategory: "الخلية" },
  { id: 12, text: "لوغاريتم 1000 بالأساس 10:", options: ["2", "3", "4", "5"], correctOptionIndex: 1, category: "الرياضيات", subcategory: "اللوغاريتم" },
  { id: 13, text: "أيون الصوديوم موجب الشحنة يُكتب:", options: ["Na⁻", "Na⁺", "Na²⁺", "Na²⁻"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "الأيونات" },
  { id: 14, text: "الصوت ينتقل بأسرع في:", options: ["الهواء", "الفراغ", "الماء", "الحديد"], correctOptionIndex: 3, category: "الفيزياء", subcategory: "الصوت" },
  { id: 15, text: "البناء الضوئي يتم في:", options: ["الميتوكوندريا", "البلاستيدات الخضراء", "النواة", "الغشاء الخلوي"], correctOptionIndex: 1, category: "الأحياء", subcategory: "البناء الضوئي" },
  { id: 16, text: "مثلث قائم الزاوية أضلاعه 3 و4، ما طول الوتر؟", options: ["5", "6", "7", "8"], correctOptionIndex: 0, category: "الرياضيات", subcategory: "الهندسة" },
  { id: 17, text: "pH المحلول القلوي:", options: ["أقل من 7", "يساوي 7", "أكبر من 7", "يساوي صفر"], correctOptionIndex: 2, category: "الكيمياء", subcategory: "الأحماض والقواعد" },
  { id: 18, text: "الطاقة الحركية تتناسب طردياً مع:", options: ["الكتلة والسرعة", "الكتلة ومربع السرعة", "مربع الكتلة والسرعة", "الكتلة والارتفاع"], correctOptionIndex: 1, category: "الفيزياء", subcategory: "الطاقة" },
  { id: 19, text: "مرحلة الانقسام التي تنفصل فيها الكروموسومات إلى قطبين:", options: ["الطور التمهيدي", "الطور الاستوائي", "الطور الانفصالي", "الطور النهائي"], correctOptionIndex: 2, category: "الأحياء", subcategory: "الانقسام الخلوي" },
  { id: 20, text: "∫x dx = ؟", options: ["x² + C", "x²/2 + C", "2x + C", "x³/3 + C"], correctOptionIndex: 1, category: "الرياضيات", subcategory: "التكامل" },
  { id: 21, text: "رمز عنصر الحديد في الجدول الدوري:", options: ["Ir", "Fe", "In", "Fr"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "الجدول الدوري" },
  { id: 22, text: "سرعة الضوء في الفراغ تقريباً:", options: ["3×10⁶ م/ث", "3×10⁸ م/ث", "3×10¹⁰ م/ث", "3×10⁴ م/ث"], correctOptionIndex: 1, category: "الفيزياء", subcategory: "الضوء" },
  { id: 23, text: "أي المجموعات التالية تضم الحشرات فقط؟", options: ["العنكبوت والنحلة والبعوضة", "النحلة والبعوضة والذبابة", "العقرب والنملة والذبابة", "القمل والسرطان والجراد"], correctOptionIndex: 1, category: "الأحياء", subcategory: "تصنيف الكائنات" },
  { id: 24, text: "قيمة sin(90°):", options: ["0", "0.5", "1", "√2/2"], correctOptionIndex: 2, category: "الرياضيات", subcategory: "المثلثات" },
  { id: 25, text: "العملية التي يتحول فيها السائل إلى غاز عند درجة الغليان:", options: ["التكثف", "التبخر", "الانصهار", "التجمد"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "التحولات الفيزيائية" },
  { id: 26, text: "عندما يتضاعف طول ضلع المربع، تصبح المساحة:", options: ["ضعفين", "ثلاثة أضعاف", "أربعة أضعاف", "ثمانية أضعاف"], correctOptionIndex: 2, category: "الرياضيات", subcategory: "الهندسة" },
  { id: 27, text: "عدد البروتونات في نواة الكربون (العدد الذري 6):", options: ["6", "12", "4", "8"], correctOptionIndex: 0, category: "الكيمياء", subcategory: "التركيب الذري" },
  { id: 28, text: "نيوتن الثالث: لكل فعل رد فعل _____ وعكسي الاتجاه.", options: ["أكبر", "مساوٍ", "أصغر", "متغير"], correctOptionIndex: 1, category: "الفيزياء", subcategory: "الميكانيكا" },
  { id: 29, text: "الهرمونات تُفرز من:", options: ["الجهاز العصبي", "الغدد الصماء", "الدم", "الجهاز الهضمي"], correctOptionIndex: 1, category: "الأحياء", subcategory: "جسم الإنسان" },
  { id: 30, text: "إذا كان cos(θ) = 0.6 وكان sin(θ) موجباً، فإن sin(θ) يساوي:", options: ["0.6", "0.7", "0.8", "0.9"], correctOptionIndex: 2, category: "الرياضيات", subcategory: "المثلثات" },
  { id: 31, text: "التفاعل الكيميائي الذي يُطلق حرارة يُسمى:", options: ["ماص للحرارة", "طارد للحرارة", "محايد", "عكسي"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "التفاعلات الكيميائية" },
  { id: 32, text: "الضغط يحسب بقسمة القوة على:", options: ["الكتلة", "المساحة", "الحجم", "الكثافة"], correctOptionIndex: 1, category: "الفيزياء", subcategory: "الضغط" },
  { id: 33, text: "الـ DNA موجود في:", options: ["الغشاء الخلوي", "السيتوبلازم", "نواة الخلية", "الميتوكوندريا فقط"], correctOptionIndex: 2, category: "الأحياء", subcategory: "الجينات" },
  { id: 34, text: "مجموع زوايا المضلع الخماسي:", options: ["360°", "450°", "540°", "720°"], correctOptionIndex: 2, category: "الرياضيات", subcategory: "الهندسة" },
  { id: 35, text: "ما الرابطة التي تنشأ بين ذرتين تتشاركان في إلكترونات؟", options: ["رابطة أيونية", "رابطة تساهمية", "رابطة هيدروجينية", "قوى فاندرفالس"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "الروابط الكيميائية" },
  { id: 36, text: "القوة اللازمة لتحريك جسم كتلته 5 كجم بتسارع 3 م/ث²:", options: ["8 نيوتن", "15 نيوتن", "2 نيوتن", "1.67 نيوتن"], correctOptionIndex: 1, category: "الفيزياء", subcategory: "الميكانيكا" },
  { id: 37, text: "التنفس الخلوي يحدث في:", options: ["البلاستيدات", "الميتوكوندريا", "النواة", "الفجوات"], correctOptionIndex: 1, category: "الأحياء", subcategory: "الخلية" },
  { id: 38, text: "مشتقة الثابت تساوي:", options: ["الثابت نفسه", "1", "0", "لا نهاية"], correctOptionIndex: 2, category: "الرياضيات", subcategory: "التفاضل" },
  { id: 39, text: "المعادن التي تتفاعل مع الحمض لتُنتج هيدروجين:", options: ["الذهب والفضة", "الصوديوم والمغنيسيوم", "البلاتين والنحاس", "الزئبق والقصدير"], correctOptionIndex: 1, category: "الكيمياء", subcategory: "التفاعلات الكيميائية" },
  { id: 40, text: "الضوء الأبيض يتحلل إلى ألوانه عند مروره عبر:", options: ["مرآة", "عدسة محدبة", "منشور زجاجي", "شبكة معتمة"], correctOptionIndex: 2, category: "الفيزياء", subcategory: "الضوء" },
];

const PRIORITY_COLOR = {
  high: "bg-red-500/10 border-red-500/30 text-red-400",
  medium: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  low: "bg-green-500/10 border-green-500/30 text-green-400",
};

const PRIORITY_LABEL = { high: "أولوية عالية", medium: "أولوية متوسطة", low: "أولوية منخفضة" };

// ─── Main Component ──────────────────────────────────────────────────
export default function TeacherSystemPage() {
  const { toast } = useToast();

  // Phase control
  const [phase, setPhase] = useState<Phase>("intro");
  const [examType, setExamType] = useState<ExamType>("qudrat");

  // Test state
  const [questions, setQuestions] = useState<DiagQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [timings, setTimings] = useState<Record<number, number>>({});
  const [questionTimer, setQuestionTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  // Refs to always have the latest values (avoid stale closures)
  const answersRef = useRef<Record<number, number | null>>({});
  const timingsRef = useRef<Record<number, number>>({});
  const currentIdxRef = useRef<number>(0);
  const questionsRef = useRef<DiagQuestion[]>([]);
  const examTypeRef = useRef<ExamType>("qudrat");

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timingsRef.current = timings; }, [timings]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { examTypeRef.current = examType; }, [examType]);

  // Results state
  const [plan, setPlan] = useState<TeacherPlan | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [analyzingStep, setAnalyzingStep] = useState(0);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Active tab in results
  const [activeTab, setActiveTab] = useState<"path" | "timing" | "chat">("path");

  // ── Start test ─────────────────────────────────────────────────────
  const startTest = (type: ExamType) => {
    setExamType(type);
    examTypeRef.current = type;
    const qs = type === "qudrat" ? [...QUDRAT_QUESTIONS] : [...TAHSILI_QUESTIONS];
    const shuffled = qs.sort(() => Math.random() - 0.5).slice(0, 20);
    setQuestions(shuffled);
    questionsRef.current = shuffled;
    setCurrentIdx(0);
    currentIdxRef.current = 0;
    setAnswers({});
    answersRef.current = {};
    setTimings({});
    timingsRef.current = {};
    setQuestionTimer(0);
    questionStartRef.current = Date.now();
    setPhase("test");
  };

  // ── Per-question timer ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "test") return;
    timerRef.current = setInterval(() => {
      setQuestionTimer(Math.floor((Date.now() - questionStartRef.current) / 1000));
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentIdx]);

  const recordTime = useCallback(() => {
    const elapsed = Math.floor((Date.now() - questionStartRef.current) / 1000);
    const idx = currentIdxRef.current;
    timingsRef.current = { ...timingsRef.current, [idx]: elapsed };
    setTimings(prev => ({ ...prev, [idx]: elapsed }));
    setQuestionTimer(0);
    questionStartRef.current = Date.now();
  }, []);

  const selectAnswer = (optIdx: number) => {
    const idx = currentIdxRef.current;
    answersRef.current = { ...answersRef.current, [idx]: optIdx };
    setAnswers(prev => ({ ...prev, [idx]: optIdx }));
  };

  const goNext = () => {
    if (currentIdx < questions.length - 1) {
      recordTime();
      setCurrentIdx(currentIdx + 1);
      currentIdxRef.current = currentIdx + 1;
    } else {
      recordTime();
      submitTest();
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      recordTime();
      setCurrentIdx(currentIdx - 1);
      currentIdxRef.current = currentIdx - 1;
    }
  };

  // ── Submit & analyze ───────────────────────────────────────────────
  const submitTest = async () => {
    setPhase("analyzing");
    setAnalyzingStep(0);

    const steps = [
      "يقرأ المعلم إجاباتك...",
      "يحلل نقاط قوتك وضعفك...",
      "يبني مسارك التعليمي...",
      "يُعدّ توصياته الشخصية...",
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < steps.length) setAnalyzingStep(step);
    }, 1200);

    try {
      // Use refs to get the absolute latest values (avoids stale closure bug)
      const latestAnswers = answersRef.current;
      const latestTimings = { ...timingsRef.current };
      const latestQuestions = questionsRef.current;
      const latestExamType = examTypeRef.current;
      const latestIdx = currentIdxRef.current;

      // The last question timing was just recorded by recordTime() before submitTest()
      // If somehow not captured, compute it now
      if (latestTimings[latestIdx] === undefined) {
        latestTimings[latestIdx] = Math.floor((Date.now() - questionStartRef.current) / 1000);
      }

      const payload = {
        examType: latestExamType,
        questions: latestQuestions.map(q => ({ text: q.text, options: q.options, correctOptionIndex: q.correctOptionIndex, category: q.category, subcategory: q.subcategory })),
        answers: Object.fromEntries(Object.entries(latestAnswers).map(([k, v]) => [k, v ?? null])),
        timings: latestTimings,
      };

      const res = await fetch("/api/teacher/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      clearInterval(interval);
      setPlan(data.plan);
      setCorrectCount(data.correctCount ?? 0);

      // Seed teacher greeting
      setChatHistory([{
        role: "teacher",
        content: `أهلاً بك! لقد أنهيت الاختبار التشخيصي بدرجة ${data.plan?.scorePercent ?? 0}%. ${data.plan?.encouragement ?? "أنا هنا لمساعدتك في رحلتك التعليمية."} 📚`,
      }]);

      setTimeout(() => setPhase("results"), 600);
    } catch (err) {
      clearInterval(interval);
      toast({ title: "خطأ", description: "تعذّر التحليل، يُرجى المحاولة مرة أخرى.", variant: "destructive" });
      setPhase("test");
    }
  };

  // ── Chat with teacher ──────────────────────────────────────────────
  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", content: msg }]);
    setChatLoading(true);
    try {
      const context = plan
        ? `الدرجة: ${plan.scorePercent}%, التقييم: ${plan.overallGrade}, نقاط الضعف: ${plan.weaknesses.join("، ")}, نقاط القوة: ${plan.strengths.join("، ")}`
        : "";
      const res = await fetch("/api/teacher/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, context, history: chatHistory.slice(-8) }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: "teacher", content: data.reply }]);
    } catch {
      setChatHistory(prev => [...prev, { role: "teacher", content: "عذراً، لم أتمكن من الرد الآن. يُرجى المحاولة مرة أخرى." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const analyzingSteps = [
    "يقرأ المعلم إجاباتك...",
    "يحلل نقاط قوتك وضعفك...",
    "يبني مسارك التعليمي...",
    "يُعدّ توصياته الشخصية...",
  ];

  const q = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  // Pre-compute random positions once (avoids re-render on every frame)
  const scoreCardCircles = useMemo(() =>
    Array.from({ length: 6 }, () => ({ top: Math.random() * 100, left: Math.random() * 100 })),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <>
      <SEO title="نظام المعلم — منصة قدراتك" description="اختبار تشخيصي مخصص يُعدّ لك مساراً تعليمياً شاملاً" url="/teacher" />

      <div className="min-h-screen bg-background" dir="rtl">

        {/* ══════════════ INTRO ══════════════ */}
        {phase === "intro" && (
          <div className="max-w-lg mx-auto px-4 py-8 space-y-6 pb-24">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-teal-600 to-blue-600 p-7 text-white shadow-2xl">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/5 rounded-full -translate-x-16 -translate-y-16 blur-2xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-8 translate-y-8 blur-xl" />
              <div className="relative z-10 space-y-3 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-black">نظام المعلم</h1>
                <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
                  اختبار تشخيصي يرسم مساراً تعليمياً مخصصاً لك — يعرف نقاط قوتك وضعفك ويبني خطة احترافية
                </p>
                <div className="flex items-center justify-center gap-4 pt-1 text-xs text-white/70">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 20 سؤال</span>
                  <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> ~15 دقيقة</span>
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> مسار مخصص</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Target, title: "تشخيص دقيق", desc: "يحلل 8 مهارات مختلفة", color: "text-teal-700", bg: "bg-teal-100/10 border-teal-400/20" },
                { icon: Calendar, title: "مسار أسابيع", desc: "خطة 4 أسابيع مخصصة", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                { icon: Timer, title: "تحليل الوقت", desc: "يكشف أسرع طرق الحل", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { icon: MessageSquare, title: "اسأل مباشرة", desc: "أسئلة لا محدودة", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              ].map((f, i) => (
                <div key={i} className={cn("rounded-2xl border p-4 space-y-2", f.bg)}>
                  <f.icon className={cn("w-5 h-5", f.color)} />
                  <div>
                    <p className="text-sm font-bold text-foreground">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Exam type selection */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground px-1">اختر نوع الاختبار التشخيصي:</p>
              <div className="space-y-2.5">
                <button
                  onClick={() => startTest("qudrat")}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg hover:opacity-90 transition-opacity"
                  data-testid="btn-start-qudrat"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-black">قدرات</p>
                    <p className="text-xs text-white/70">10 لفظي + 10 كمي — اختبار قياس</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                </button>

                <button
                  onClick={() => startTest("tahsili")}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg hover:opacity-90 transition-opacity"
                  data-testid="btn-start-tahsili"
                >
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-black">تحصيلي</p>
                    <p className="text-xs text-white/70">فيزياء + كيمياء + أحياء + رياضيات</p>
                  </div>
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TEST ══════════════ */}
        {phase === "test" && q && (
          <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase("intro"); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                خروج
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Timer className="w-3.5 h-3.5" />
                <span className={cn(questionTimer > 60 ? "text-red-400 font-bold" : "")}>{questionTimer}ث</span>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">السؤال {currentIdx + 1} من {questions.length}</span>
                <span className="text-muted-foreground">أُجيب على {answeredCount}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-teal-100/10 border border-teal-400/20 flex items-center justify-center flex-shrink-0 text-teal-700 text-xs font-black">
                  {currentIdx + 1}
                </div>
                <p className="text-sm font-semibold text-foreground leading-relaxed flex-1">{q.text}</p>
              </div>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isSelected = answers[currentIdx] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 rounded-xl border text-right text-sm transition-all duration-150",
                        isSelected
                          ? "border-teal-400 bg-teal-100/10 text-foreground font-semibold"
                          : "border-border bg-background hover:bg-muted/50 text-foreground"
                      )}
                      data-testid={`btn-option-${i}`}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[10px] font-black",
                        isSelected ? "border-teal-400 bg-teal-100 text-white" : "border-border text-muted-foreground"
                      )}>
                        {["أ", "ب", "ج", "د"][i]}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick navigation dots */}
            <div className="flex items-center gap-1 flex-wrap justify-center">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    recordTime();
                    setCurrentIdx(i);
                    currentIdxRef.current = i;
                  }}
                  className={cn(
                    "w-6 h-6 rounded-md text-[10px] font-bold transition-all",
                    i === currentIdx ? "bg-teal-100 text-white" :
                    answers[i] !== undefined && answers[i] !== null ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" :
                    "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={goPrev}
                disabled={currentIdx === 0}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                data-testid="btn-prev"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={goNext}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  data-testid="btn-next"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  data-testid="btn-submit"
                >
                  <Sparkles className="w-4 h-4" />
                  إنهاء وتحليل
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ ANALYZING ══════════════ */}
        {phase === "analyzing" && (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center space-y-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-2xl animate-pulse">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-foreground">المعلم يراجع نتائجك</h2>
              <p className="text-sm text-muted-foreground">{analyzingSteps[analyzingStep]}</p>
            </div>

            <div className="w-full max-w-xs space-y-2">
              {analyzingSteps.map((step, i) => (
                <div key={i} className={cn("flex items-center gap-3 text-sm transition-all duration-500", i <= analyzingStep ? "opacity-100" : "opacity-30")}>
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", i < analyzingStep ? "bg-emerald-500" : i === analyzingStep ? "bg-teal-100 animate-pulse" : "bg-muted")}>
                    {i < analyzingStep ? <CheckCircle className="w-3 h-3 text-white" /> : <Circle className="w-3 h-3 text-white" />}
                  </div>
                  <span className={i <= analyzingStep ? "text-foreground" : "text-muted-foreground"}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ RESULTS ══════════════ */}
        {phase === "results" && plan && (
          <div className="max-w-lg mx-auto px-4 py-5 pb-28 space-y-5">

            {/* Score card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-teal-600 to-blue-700 p-6 text-white shadow-2xl">
              <div className="absolute inset-0 opacity-10">
                {scoreCardCircles.map((pos, i) => (
                  <div key={i} className="absolute w-20 h-20 rounded-full bg-white" style={{ top: `${pos.top}%`, left: `${pos.left}%`, transform: "translate(-50%,-50%)" }} />
                ))}
              </div>
              <div className="relative z-10 flex items-center gap-5">
                <div className="text-center">
                  <div className="text-5xl font-black">{plan.scorePercent}%</div>
                  <div className="text-xs text-white/70 mt-1">{correctCount}/{questions.length} صحيح</div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-300" />
                    <span className="font-black text-lg">{plan.overallGrade}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{plan.summary}</p>
                  <p className="text-xs text-white/60 italic mt-1">{plan.encouragement}</p>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold">نقاط القوة</span>
                </div>
                <ul className="space-y-1">
                  {(plan.strengths.length ? plan.strengths : ["لا توجد حتى الآن"]).map((s, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-xs font-bold">تحتاج تحسين</span>
                </div>
                <ul className="space-y-1">
                  {(plan.weaknesses.length ? plan.weaknesses : ["لا توجد"]).map((w, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border">
              {([
                { key: "path", label: "المسار التعليمي", icon: Calendar },
                { key: "timing", label: "نصائح الوقت", icon: Timer },
                { key: "chat", label: "اسأل المعلم", icon: MessageSquare },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200",
                    activeTab === t.key ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`tab-${t.key}`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Learning Path */}
            {activeTab === "path" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground px-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                  مسارك التعليمي المخصص — 4 أسابيع
                </p>
                {plan.roadmap.map((week) => (
                  <div key={week.week} className={cn("rounded-2xl border p-4 space-y-3", PRIORITY_COLOR[week.priority])}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-black">
                          {week.week}
                        </div>
                        <span className="text-sm font-bold">{week.title}</span>
                      </div>
                      <span className="text-[10px] font-medium opacity-80">{PRIORITY_LABEL[week.priority]}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {week.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Star className="w-3 h-3 mt-0.5 flex-shrink-0 opacity-70" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Timing Tips */}
            {activeTab === "timing" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground px-1 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  كيف تحل الأسئلة أسرع؟
                </p>
                {plan.timingTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400 font-black text-xs">
                      {i + 1}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed flex-1">{tip}</p>
                  </div>
                ))}

                {/* Timing analysis */}
                <div className="rounded-2xl border bg-card p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
                    تحليل وقتك لكل سؤال
                  </p>
                  <div className="space-y-2">
                    {Object.entries(timings).slice(0, 10).map(([idx, secs]) => {
                      const q = questions[Number(idx)];
                      const pct = Math.min(100, (secs / 120) * 100);
                      const isLong = secs > 90;
                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="truncate w-40">{q?.text?.slice(0, 35)}...</span>
                            <span className={isLong ? "text-red-400 font-bold" : "text-muted-foreground"}>{secs}ث</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", isLong ? "bg-red-500" : "bg-teal-100")}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Chat */}
            {activeTab === "chat" && (
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card overflow-hidden">
                  {/* Chat messages */}
                  <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                        {msg.role === "teacher" && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-teal-100 text-white rounded-tl-sm"
                            : "bg-muted text-foreground rounded-tr-sm border border-border"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-muted border border-border px-4 py-2.5 rounded-2xl rounded-tr-sm flex items-center gap-1.5">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-border p-3 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendChat()}
                      placeholder="اسأل عن أي سؤال أو موضوع..."
                      className="flex-1 bg-muted/50 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-teal-400 transition-colors"
                      data-testid="input-chat"
                    />
                    <button
                      onClick={sendChat}
                      disabled={!chatInput.trim() || chatLoading}
                      className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center hover:bg-teal-100 disabled:opacity-40 transition-colors flex-shrink-0"
                      data-testid="btn-send-chat"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Quick questions */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground px-1">أسئلة سريعة:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "كيف أحسّن في المتضادات؟",
                      "ما أسرع طريقة لحل الجبر؟",
                      "كيف أدير وقتي؟",
                      "ما أهم المواضيع التي أراجعها؟",
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setChatInput(q); }}
                        className="text-xs px-3 py-1.5 rounded-full border border-teal-400/30 bg-teal-100/5 text-teal-700 hover:bg-teal-100/10 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Restart button */}
            <button
              onClick={() => { setPhase("intro"); setPlan(null); setChatHistory([]); }}
              className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
              data-testid="btn-restart"
            >
              <RotateCcw className="w-4 h-4" />
              إعادة الاختبار التشخيصي
            </button>
          </div>
        )}

      </div>
    </>
  );
}
