import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Search, Clock, Zap, ChevronDown, ChevronUp,
  Play, Target, Lightbulb, CheckCircle2, ArrowLeft,
  Brain, Calculator, BarChart2, Triangle, Hash,
  MessageSquare, Eye, List, Shuffle, BookMarked
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Strategy data ────────────────────────────────────────────────────────────
interface StrategyExample {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

interface Strategy {
  id: string;
  title: string;
  category: "verbal" | "quantitative";
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  timePerQ: number;
  subcategoryKey: string;
  tagline: string;
  mainStrategy: string;
  steps: string[];
  example: StrategyExample;
  tips: string[];
  commonMistakes: string[];
}

const STRATEGIES: Strategy[] = [
  // ── VERBAL ──────────────────────────────────────────────────────────────────
  {
    id: "analogy",
    title: "التناظر اللفظي",
    category: "verbal",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-100",
    timePerQ: 30,
    subcategoryKey: "التناظر اللفظي",
    tagline: "اكتشف العلاقة السرية بين الكلمتين",
    mainStrategy:
      "أنشئ جملة قصيرة تصف العلاقة بين الكلمتين الأولى (أ → ب)، ثم طبّق نفس الجملة على خيارات الإجابة. الخيار الذي يكمل نفس العلاقة بدقة هو الجواب الصحيح.",
    steps: [
      "اقرأ الزوج الأصلي (أ : ب) وحدّد نوع العلاقة",
      "صُغ جملة: «أ هو/هي _____ لـ ب» أو «ب يُستخدم في _____»",
      "طبّق نفس الجملة على كل خيار واحذف الخيارات التي لا تنطبق",
      "إذا بقي أكثر من خيار، ضيّق العلاقة أكثر (نوع، درجة، اتجاه)",
      "انتبه لاتجاه العلاقة — قد تكون معكوسة في الخيارات",
    ],
    example: {
      question: "قلم : كتابة = ؟ : ؟",
      options: ["سكين : حادّة", "مطرقة : مسمار", "مشرط : جراحة", "قلم رصاص : ممحاة"],
      answerIndex: 2,
      explanation:
        "القلم أداة تُستخدم للكتابة. المشرط أداة تُستخدم للجراحة. نفس العلاقة: (أداة : وظيفتها). الخيار ج هو الصحيح.",
    },
    tips: [
      "العلاقات الشائعة: أداة/وظيفة، جزء/كل، عكس، درجة، مكان، جنس/نوع",
      "احذر من الجاذبية الموضوعية — قد يكون الخيار «مرتبطاً» لكنه لا يكمل نفس العلاقة",
      "إذا كان الزوج الأصلي جزئي←كلي، ابحث عن نفس الاتجاه في الخيارات",
    ],
    commonMistakes: [
      "اختيار كلمة «مرتبطة بالموضوع» بدلاً من «نفس العلاقة»",
      "تجاهل اتجاه العلاقة (جزء←كل ≠ كل←جزء)",
    ],
  },
  {
    id: "completion",
    title: "إكمال الجمل",
    category: "verbal",
    icon: <List className="w-5 h-5" />,
    color: "text-teal-700",
    bgColor: "bg-teal-100 border-teal-400",
    timePerQ: 35,
    subcategoryKey: "إكمال الجمل",
    tagline: "ضع كلمتك أنت قبل أن تنظر للخيارات",
    mainStrategy:
      "قبل النظر للخيارات، اقرأ الجملة وضع في ذهنك الكلمة التي تكملها. ثم ابحث عن الخيار الأقرب لكلمتك. هذا يمنعك من الانخداع بالخيارات المشتتة.",
    steps: [
      "اقرأ الجملة كاملة وضع إشارة على الفراغ",
      "حدّد الفكرة الرئيسية للجملة: إيجابية أم سلبية؟",
      "انتبه لكلمات الربط: (لكنّ / رغم = تحوّل)، (لذا / لأن = سبب)، (بالإضافة = تعزيز)",
      "ضع كلمتك المقترحة قبل النظر للخيارات",
      "قارن خيارات الإجابة بكلمتك، واختر الأقرب معنىً",
      "أعد قراءة الجملة كاملة مع خيارك للتأكد",
    ],
    example: {
      question:
        "رغم ضخامة الأبحاث التي أجراها العلماء، لا يزال فيروس السرطان _______ على كثير من المختصين.",
      options: ["واضحاً", "مُتاحاً", "غامضاً", "مفيداً"],
      answerIndex: 2,
      explanation:
        "كلمة «رغم» تشير إلى تناقض: رغم الأبحاث ← لا يزال (شيء سلبي). الكلمة المناسبة هي «غامضاً».",
    },
    tips: [
      "كلمات الربط هي مفتاح الفهم — رغم / لكن / بينما = عكس الجملة الأولى",
      "إذا كانت الجملة تصف شخصاً «مشهوراً بكرمه» فالفراغ يكمّل صفة إيجابية",
      "الخيارات قريبة المعنى — المتطابق مع السياق هو الصحيح",
    ],
    commonMistakes: [
      "النظر للخيارات أولاً — يؤدي للتشتت والتخمين",
      "تجاهل كلمات الربط التي تقلب معنى الجملة",
    ],
  },
  {
    id: "reading",
    title: "الاستيعاب والفهم القرائي",
    category: "verbal",
    icon: <Eye className="w-5 h-5" />,
    color: "text-sky-600",
    bgColor: "bg-sky-50 border-sky-100",
    timePerQ: 50,
    subcategoryKey: "الاستيعاب والفهم",
    tagline: "اقرأ الأسئلة أولاً ثم النص",
    mainStrategy:
      "اقرأ الأسئلة قبل النص حتى تعرف ما الذي تبحث عنه. ثم اقرأ النص بسرعة لتحديد الفقرة المرتبطة بكل سؤال. الإجابة دائماً مذكورة صراحةً أو ضمنياً في النص.",
    steps: [
      "اقرأ جميع الأسئلة أولاً (30 ثانية) لتعرف ما تبحث عنه",
      "اقرأ النص بتركيز على الفكرة الرئيسية لكل فقرة",
      "ضع إشارة ذهنية على الفقرة المرتبطة بكل سؤال",
      "للأسئلة النصية: ابحث عن الكلمات المحورية في النص",
      "للأسئلة الاستنتاجية: الإجابة يجب أن يدعمها النص — لا تستنتج من رأيك",
      "إذا كان في النص عبارة «ومع ذلك» أو «في المقابل» — هذه غالباً موضع سؤال",
    ],
    example: {
      question: "ما الفكرة الرئيسية التي يطرحها الكاتب في الفقرة الأولى؟",
      options: [
        "أهمية التكنولوجيا في التعليم",
        "التكنولوجيا لا تُغني عن المعلم",
        "المعلمون يستخدمون التكنولوجيا بشكل خاطئ",
        "التعليم أصبح أسهل مع التكنولوجيا",
      ],
      answerIndex: 1,
      explanation:
        "الفقرة تتحدث عن أن التكنولوجيا «أداة مساعدة» لا بديل. الجملة الأخيرة «لا يمكن أن يحلّ الحاسوب محلّ المعلم» تؤكد الخيار ب.",
    },
    tips: [
      "«وفقاً للنص» = الإجابة في النص حرفياً",
      "«يستنتج من النص» = معنى ضمني — لا تذهب بعيداً",
      "«الغرض من النص» = الجملة الأولى أو الأخيرة غالباً",
      "اختر الإجابة المدعومة بالنص، ليس التي تبدو منطقية عاماً",
    ],
    commonMistakes: [
      "الإجابة بناءً على معلوماتك العامة لا على النص",
      "اختيار الإجابة «الصحيحة عاماً» وليس الموجودة في النص",
    ],
  },

  // ── QUANTITATIVE ────────────────────────────────────────────────────────────
  {
    id: "arithmetic",
    title: "الأعداد والعمليات الحسابية",
    category: "quantitative",
    icon: <Calculator className="w-5 h-5" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 border-orange-100",
    timePerQ: 40,
    subcategoryKey: "عمليات حسابية",
    tagline: "قدّر أولاً، احسب ثانياً",
    mainStrategy:
      "قبل الحساب الدقيق، قدّر الإجابة تقريبياً وقارنها بالخيارات — كثيراً ما يكفي هذا لحذف خيارين أو ثلاثة. ثم احسب بدقة فقط للتمييز بين الخيارات المتبقية.",
    steps: [
      "قدّر الإجابة تقريبياً وارسم حدوداً (أكبر من؟ أصغر من؟)",
      "احذف الخيارات خارج النطاق التقريبي",
      "تذكّر: الكسر من الأكبر = ناتج أكبر من ضرب في كسر",
      "للأعداد الكبيرة: اختصر بقسمة الكل على نفس الرقم",
      "استخدم الاستبدال: ضع خيار الوسط (ج) ثم ارَ هل هو أكبر أم أصغر",
      "للمئوية: 10% = ÷10، 1% = ÷100، 50% = ÷2",
    ],
    example: {
      question: "ما قيمة: 125% من 240؟",
      options: ["280", "300", "320", "340"],
      answerIndex: 1,
      explanation:
        "125% = 100% + 25% = 240 + (240÷4) = 240 + 60 = 300. الجواب ب.",
    },
    tips: [
      "10% من أي رقم = حرّك الفاصلة يساراً خطوة واحدة",
      "لحساب X% من Y، احسب Y% من X (النتيجة واحدة!)",
      "أعداد مركّبة: 125% = 1.25 = 5/4",
      "للإجابة السريعة على أسئلة الكسور: اجعل المقامات متساوية",
    ],
    commonMistakes: [
      "الخلط بين النسبة المئوية من الأصل والزيادة عليه",
      "نسيان أن 125% = 1.25 مرة الأصل (ليس 0.25)",
    ],
  },
  {
    id: "algebra",
    title: "الجبر والمعادلات",
    category: "quantitative",
    icon: <Hash className="w-5 h-5" />,
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-100",
    timePerQ: 45,
    subcategoryKey: "الجبر والمعادلات",
    tagline: "المجهول يُحلّ بالعزل — عزل س في خطوتين",
    mainStrategy:
      "في معادلات القياس، عزل المجهول هو المفتاح. انقل الأرقام لجهة الثوابت والمجاهيل لجهة المجاهيل. إذا كان لديك معادلتان بمجهولين، استخدم التعويض أو الطرح.",
    steps: [
      "اقرأ المسألة وعرّف المجهول: س = ؟",
      "حوّل المسألة النصية إلى معادلة رياضية",
      "عزل المجهول: انقل الأرقام عبر إجراء عملية عكسية",
      "تحقق: عوّض الإجابة في المعادلة الأصلية",
      "للمعادلتين: اجعل معاملات أحد المجهولين متساوية ثم اطرح",
    ],
    example: {
      question: "إذا كان 3س + 7 = 22، ما قيمة 2س - 1؟",
      options: ["8", "9", "10", "11"],
      answerIndex: 1,
      explanation:
        "3س = 22 - 7 = 15، إذاً س = 5. ثم 2×5 - 1 = 9. الجواب ب.",
    },
    tips: [
      "لا تحل المعادلة أكثر مما تحتاج — السؤال قد يطلب 2س لا س",
      "للمعادلات التربيعية: جرّب الخيارات بالتعويض",
      "إذا ظهر س² و ليس س: الجذر التربيعي أو التحليل",
      "مسائل العمل: 1 وظيفة ÷ وقت = معدل الإنجاز في الوحدة",
    ],
    commonMistakes: [
      "حل إيجاد س بينما السؤال يطلب 2س أو س+3",
      "نسيان تطبيق عملية القسمة على طرفي المعادلة",
    ],
  },
  {
    id: "ratio",
    title: "النسبة والتناسب",
    category: "quantitative",
    icon: <Shuffle className="w-5 h-5" />,
    color: "text-teal-600",
    bgColor: "bg-teal-50 border-teal-100",
    timePerQ: 40,
    subcategoryKey: "النسبة والتناسب",
    tagline: "حوّل النسبة لأجزاء، ثم احسب كل جزء",
    mainStrategy:
      "عندما تُعطى نسبة مثل 2:3، تخيّل أن الكمية الكلية تنقسم لـ(2+3=5) أجزاء متساوية. ثم احسب قيمة كل جزء = الكمية الكلية ÷ مجموع الأجزاء.",
    steps: [
      "اجمع حدود النسبة: 2:3 ← 2+3 = 5 أجزاء",
      "احسب قيمة كل جزء = المجموع الكلي ÷ عدد الأجزاء",
      "احسب نصيب كل طرف = عدد أجزائه × قيمة الجزء",
      "للمسائل العكسية: إذا عرفت نصيب أحدهم، احسب قيمة الجزء ثم الكل",
      "للنسب المتعددة: اجعل حداً مشتركاً بين جميع النسب",
    ],
    example: {
      question:
        "قُسمت مبلغ 1500 ريال بين أحمد وسعد وخالد بنسبة 2:3:5. كم نصيب سعد؟",
      options: ["300", "400", "450", "500"],
      answerIndex: 2,
      explanation:
        "المجموع = 2+3+5 = 10 أجزاء. قيمة الجزء = 1500÷10 = 150. نصيب سعد = 3×150 = 450. الجواب ج.",
    },
    tips: [
      "نسبة أ:ب = أ÷ب كسراً — 3:4 يعني أ/ب = 3/4",
      "للمقارنة بين نسبتين: اجعل أحد الحدين متساوياً",
      "نسبة متسلسلة: أ:ب:ج — إذا أُعطي أ:ب وب:ج ابحث عن ب المشترك",
    ],
    commonMistakes: [
      "نسيان جمع الأجزاء الكلي قبل القسمة",
      "الخلط بين نصيب الشخص والجزء الواحد",
    ],
  },
  {
    id: "geometry",
    title: "الهندسة والأشكال",
    category: "quantitative",
    icon: <Triangle className="w-5 h-5" />,
    color: "text-rose-600",
    bgColor: "bg-rose-50 border-rose-100",
    timePerQ: 50,
    subcategoryKey: "الهندسة",
    tagline: "ارسم الشكل دائماً — الرسم يفتح الحل",
    mainStrategy:
      "ارسم الشكل دائماً حتى لو كان مبسطاً. ضع القيم المعطاة على الشكل. ثم طبّق القانون المناسب. معظم مسائل الهندسة تعتمد على 5 قوانين رئيسية فقط.",
    steps: [
      "ارسم الشكل الهندسي وضع المعطيات عليه",
      "حدّد المطلوب: مساحة؟ محيط؟ زاوية؟ طول؟",
      "اختر القانون المناسب من القوانين الأساسية",
      "عوّض القيم وأجرِ الحساب",
      "تحقق: هل الإجابة منطقية مع حجم الشكل؟",
    ],
    example: {
      question: "مستطيل طوله ضعف عرضه. إذا كان محيطه 60 سم، فما مساحته؟",
      options: ["150 سم²", "200 سم²", "250 سم²", "300 سم²"],
      answerIndex: 1,
      explanation:
        "ع = س، ط = 2س. المحيط = 2(ط+ع) = 2(2س+س) = 6س = 60 ← س = 10. المساحة = 10×20 = 200. الجواب ب.",
    },
    tips: [
      "القوانين الضرورية: مساحة مثلث = ½×قاعدة×ارتفاع",
      "دائرة: المساحة = πر²، المحيط = 2πر",
      "مستطيل: المساحة = ط×ع، المحيط = 2(ط+ع)",
      "مثلث قائم: ج² = أ² + ب² (فيثاغورس)",
      "مثلثات متشابهة: النسب بين الأضلاع المقابلة متساوية",
    ],
    commonMistakes: [
      "الخلط بين المساحة والمحيط",
      "نسيان تربيع الوحدة في المساحة (سم² لا سم)",
    ],
  },
  {
    id: "statistics",
    title: "الإحصاء وتحليل البيانات",
    category: "quantitative",
    icon: <BarChart2 className="w-5 h-5" />,
    color: "text-teal-700",
    bgColor: "bg-teal-100 border-teal-400",
    timePerQ: 45,
    subcategoryKey: "الإحصاء والبيانات",
    tagline: "المتوسط هو مجموع الأرقام ÷ عددها",
    mainStrategy:
      "أسئلة الإحصاء في القياس تتمحور حول المتوسط الحسابي والوسيط والمنوال. معظمها يُحلّ في خطوتين. للبيانات المرسومة: اقرأ الجدول أو الرسم بعناية قبل الحساب.",
    steps: [
      "حدّد المطلوب: متوسط؟ وسيط؟ منوال؟ مدى؟",
      "المتوسط = مجموع الأرقام ÷ عددها",
      "الوسيط = الرقم الأوسط بعد الترتيب تصاعدياً",
      "المنوال = الرقم الأكثر تكراراً",
      "المدى = أكبر قيمة - أصغر قيمة",
      "للمتوسط المجهول: مجموع الكل = متوسط × عدد",
    ],
    example: {
      question:
        "متوسط درجات 4 طلاب هو 75. انضم طالب خامس وأصبح المتوسط 77. ما درجة الطالب الخامس؟",
      options: ["79", "83", "85", "87"],
      answerIndex: 2,
      explanation:
        "مجموع الـ4 = 4×75 = 300. مجموع الـ5 = 5×77 = 385. درجة الخامس = 385-300 = 85. الجواب ج.",
    },
    tips: [
      "إضافة عنصر أعلى من المتوسط → المتوسط يرتفع",
      "للوسيط: إذا كان عدد الأرقام زوجياً، خذ متوسط الرقمين الأوسطين",
      "ارسم جدول البيانات على الورقة إذا كانت معقدة",
    ],
    commonMistakes: [
      "حساب الوسيط قبل ترتيب الأرقام",
      "نسيان أن المتوسط × العدد = المجموع (مفيد عكسياً)",
    ],
  },
  {
    id: "probability",
    title: "الاحتمالات",
    category: "quantitative",
    icon: <Zap className="w-5 h-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100",
    timePerQ: 45,
    subcategoryKey: "الاحتمالات",
    tagline: "الاحتمال = الحالات المواتية ÷ الحالات الكلية",
    mainStrategy:
      "احتمال الحدث = عدد الحالات المواتية ÷ إجمالي الحالات الممكنة. الاحتمال دائماً بين 0 و1. إذا طُلب احتمال عدم حدوث حدث = 1 - احتمال حدوثه.",
    steps: [
      "حدّد الفضاء العيني (كل الحالات الممكنة)",
      "حدّد الحالات المواتية للحدث المطلوب",
      "احسب: الاحتمال = المواتية ÷ الكلية",
      "لحدثين مستقلين: الاحتمال = ح1 × ح2",
      "لحدثين متنافيين: الاحتمال = ح1 + ح2",
      "احتمال «لا يحدث أ» = 1 - احتمال «يحدث أ»",
    ],
    example: {
      question:
        "كيس فيه 5 كرات حمراء و3 خضراء و2 زرقاء. ما احتمال سحب كرة ليست حمراء؟",
      options: ["1/2", "2/5", "1/5", "3/10"],
      answerIndex: 0,
      explanation:
        "الكرات الكلية = 10. الحمراء = 5. غير الحمراء = 5. الاحتمال = 5/10 = 1/2. الجواب أ.",
    },
    tips: [
      "الاحتمال المكمّل: اجمع الكل ثم اطرح المطلوب — أسرع أحياناً",
      "«على الأقل واحدة» = 1 - احتمال (لا شيء)",
      "«معاً» أو «متتالي» لأحداث مستقلة = ضرب الاحتمالات",
    ],
    commonMistakes: [
      "جمع الاحتمالات عند الضرب أو العكس",
      "نسيان أن الاحتمال لا يتجاوز 1",
    ],
  },
  {
    id: "logic",
    title: "المنطق والاستدلال الكمي",
    category: "quantitative",
    icon: <Brain className="w-5 h-5" />,
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-400",
    timePerQ: 50,
    subcategoryKey: "المنطق والاستدلال",
    tagline: "ابنِ جدولاً — الترتيب يحلّ المشكلة",
    mainStrategy:
      "مسائل الترتيب والتنظيم تُحلّ بجدول الحالات. ابنِ جدولاً بالعناصر والشروط، وعبّئه شرطاً شرطاً. ما يبقى في النهاية هو الإجابة.",
    steps: [
      "اقرأ المسألة وحدّد العناصر (أشخاص، أماكن، أوقات)",
      "ارسم جدولاً: العناصر في الأعمدة، الشروط في الصفوف",
      "ابدأ بالشروط القاطعة (حتماً / لا يمكن أبداً)",
      "طبّق شرطاً شرطاً وأكمل الجدول",
      "تحقق من الإجابة بإعادة تطبيق جميع الشروط",
    ],
    example: {
      question:
        "أ قبل ب. ج ليس أولاً. د بعد ب مباشرة. من الأول؟",
      options: ["أ", "ب", "ج", "د"],
      answerIndex: 0,
      explanation:
        "أ قبل ب ← أ يمكن أن يكون أولاً. ج ليس أولاً. إذاً إما أ أو ب أول. لكن أ قبل ب ← أ أول. الجواب أ.",
    },
    tips: [
      "ابدأ بما هو مؤكد 100% — الشروط القاطعة",
      "لمسائل السرعة والمسافة: الزمن = المسافة ÷ السرعة",
      "في مسائل الترتيب: ابحث عن الثابت (الشرط الذي لا يتغير)",
    ],
    commonMistakes: [
      "قفز للإجابة قبل بناء الجدول",
      "تطبيق شرط واحد وتجاهل الباقي",
    ],
  },
];

// ── Sub components ────────────────────────────────────────────────────────────
const OPTION_LABELS = ["أ", "ب", "ج", "د"];

function ExampleCard({ example, expanded }: { example: StrategyExample; expanded: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  if (!expanded) return null;

  return (
    <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookMarked className="w-4 h-4 text-green-600" />
        <span className="text-sm font-bold text-gray-700">مثال محلول</span>
      </div>
      <p className="text-sm text-gray-800 leading-relaxed mb-3">{example.question}</p>
      <div className="flex flex-col gap-2 mb-3">
        {example.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === example.answerIndex;
          const showResult = revealed;
          return (
            <button
              key={i}
              onClick={() => { setSelected(i); setRevealed(true); }}
              className={cn(
                "flex items-center gap-2.5 text-sm p-2.5 rounded-lg border text-right transition-all",
                !showResult && "border-gray-100 bg-gray-50 hover:bg-gray-100",
                showResult && isCorrect && "border-green-300 bg-green-50 text-green-800",
                showResult && isSelected && !isCorrect && "border-red-300 bg-red-50 text-red-800",
                showResult && !isSelected && !isCorrect && "border-gray-100 bg-gray-50 text-gray-400"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                !showResult && "bg-gray-200 text-gray-600",
                showResult && isCorrect && "bg-green-500 text-white",
                showResult && isSelected && !isCorrect && "bg-red-500 text-white",
                showResult && !isSelected && !isCorrect && "bg-gray-200 text-gray-400",
              )}>
                {OPTION_LABELS[i]}
              </span>
              {opt}
              {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500 mr-auto" />}
            </button>
          );
        })}
      </div>
      {revealed && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-3">
          <p className="text-xs text-green-800 leading-relaxed">
            <span className="font-bold">💡 الشرح: </span>{example.explanation}
          </p>
        </div>
      )}
      {!revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="text-xs text-green-600 hover:underline"
        >
          عرض الإجابة مباشرة
        </button>
      )}
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();

  const practiceUrl = `/question-bank?category=${strategy.category === "verbal" ? "verbal" : "quantitative"}&subcategory=${encodeURIComponent(strategy.subcategoryKey)}`;

  return (
    <div className={cn("rounded-2xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow", expanded && "shadow-md")}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-right p-5 flex items-start gap-4"
        data-testid={`strategy-card-${strategy.id}`}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", strategy.bgColor, strategy.color)}>
          {strategy.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-gray-900 text-base">{strategy.title}</span>
            <span className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full",
              strategy.category === "verbal" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
            )}>
              {strategy.category === "verbal" ? "لفظي" : "كمي"}
            </span>
          </div>
          <p className="text-xs text-gray-500 italic">{strategy.tagline}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock className="w-3 h-3" />{strategy.timePerQ}ث / سؤال
            </span>
          </div>
        </div>
        <div className={cn("text-gray-400 transition-transform duration-200 mt-1", expanded && "rotate-180")}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-50">
          {/* Main strategy */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mt-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-800">الاستراتيجية الذهبية</span>
            </div>
            <p className="text-sm text-green-900 leading-relaxed">{strategy.mainStrategy}</p>
          </div>

          {/* Steps */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-gray-700">خطوات الحل</span>
            </div>
            <ol className="flex flex-col gap-1.5">
              {strategy.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Interactive example */}
          <ExampleCard example={strategy.example} expanded={expanded} />

          {/* Quick tips */}
          <div className="mt-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-700">نصائح سريعة</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {strategy.tips.map((tip, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full leading-tight">{tip}</span>
              ))}
            </div>
          </div>

          {/* Common mistakes */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-red-600 flex items-center gap-1.5">
                ⚠️ الأخطاء الشائعة
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              {strategy.commonMistakes.map((m, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                  <span className="shrink-0 mt-0.5">•</span>{m}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <a
              href={`https://www.youtube.com/results?search_query=استراتيجية+${encodeURIComponent(strategy.title)}+قياس+قدرات`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              data-testid={`btn-youtube-${strategy.id}`}
            >
              <Play className="w-3.5 h-3.5 text-red-500" />
              فيديو شرح
            </a>
            <button
              onClick={() => navigate("/question-bank")}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors"
              data-testid={`btn-practice-${strategy.id}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              تدرّب على {strategy.title}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StrategyLibraryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | "verbal" | "quantitative">("all");
  const [expandAll, setExpandAll] = useState(false);

  const filtered = useMemo(() =>
    STRATEGIES.filter(s => {
      if (category !== "all" && s.category !== category) return false;
      if (search && !s.title.includes(search) && !s.tagline.includes(search) && !s.mainStrategy.includes(search)) return false;
      return true;
    }),
    [category, search]
  );

  const verbalCount = STRATEGIES.filter(s => s.category === "verbal").length;
  const quantCount = STRATEGIES.filter(s => s.category === "quantitative").length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">مكتبة استراتيجيات الحل</h1>
              <p className="text-xs text-gray-500">أسرع طريقة لحل كل نوع من أسئلة القياس</p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {[
              { label: "استراتيجيات", value: STRATEGIES.length, color: "bg-green-50 text-green-700 border-green-100" },
              { label: "لفظي", value: verbalCount, color: "bg-blue-50 text-blue-700 border-blue-100" },
              { label: "كمي", value: quantCount, color: "bg-orange-50 text-orange-700 border-orange-100" },
              { label: "أمثلة تفاعلية", value: STRATEGIES.length, color: "bg-green-100 text-green-700 border-green-400" },
            ].map((s, i) => (
              <div key={i} className={`shrink-0 border rounded-xl px-3 py-2 text-center ${s.color}`}>
                <div className="text-lg font-black">{s.value}</div>
                <div className="text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col gap-3 mb-5">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن استراتيجية..."
              className="w-full pr-9 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 bg-white"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: `الكل (${STRATEGIES.length})` },
              { key: "verbal", label: `لفظي (${verbalCount})` },
              { key: "quantitative", label: `كمي (${quantCount})` },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setCategory(f.key as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                  category === f.key ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
                data-testid={`filter-${f.key}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">لا توجد استراتيجيات بهذا البحث</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(strategy => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        )}

        {/* Bottom tip */}
        <div className="mt-6 bg-white border border-green-100 rounded-2xl p-4 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            <span className="font-bold text-gray-800">نصيحة: </span>
            لا تحاول إتقان كل الاستراتيجيات دفعةً واحدة. ابدأ بالنوع الذي تجد فيه صعوبة وطبّق استراتيجيته على 10 أسئلة متتالية حتى تتحول لعادة تلقائية.
          </p>
        </div>
      </div>
    </div>
  );
}
