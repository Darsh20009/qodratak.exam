export const QUANTITATIVE_BOOK_ID = "qudrat-quantitative-pilot";
export const QUANTITATIVE_BOOK_PASSING_SCORE = 75;
export const QUANTITATIVE_BOOK_SOURCE_KEY = "qudrat-quantitative-pilot";

export const QUANTITATIVE_BOOK_SOURCES: Record<
  string,
  { id: string; title: string; organization: string; url: string }
> = {
  "etec-sample": {
    id: "etec-sample",
    title: "اختبار القدرات العامة العلمي — اختبار تجريبي",
    organization: "هيئة تقويم التعليم والتدريب",
    url: "https://media.etec.gov.sa/media/wu5lwhvf/%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1-%D8%A7%D9%84%D9%82%D8%AF%D8%B1%D8%A7%D8%AA-%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9-%D8%A7%D9%84%D8%B9%D9%84%D9%85%D9%8A-%D8%A7%D8%AE%D8%AA%D8%A8%D8%A7%D8%B1-%D8%AA%D8%AC%D8%B1%D9%8A%D8%A8%D9%8A.pdf",
  },
  "os-index": {
    id: "os-index",
    title: "Prealgebra 2e Index",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/index",
  },
  "os-factors": {
    id: "os-factors",
    title: "2.4 Find Multiples and Factors",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/2-4-find-multiples-and-factors",
  },
  "os-primes": {
    id: "os-primes",
    title: "2.5 Prime Factorization and the Least Common Multiple",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/2-5-prime-factorization-and-the-least-common-multiple",
  },
  "os-add-integers": {
    id: "os-add-integers",
    title: "3.2 Add Integers",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/3-2-add-integers",
  },
  "os-subtract-integers": {
    id: "os-subtract-integers",
    title: "3.3 Subtract Integers",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/3-3-subtract-integers",
  },
  "os-integers": {
    id: "os-integers",
    title: "3.4 Multiply and Divide Integers",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/3-4-multiply-and-divide-integers",
  },
  "os-fractions": {
    id: "os-fractions",
    title: "4.1 Visualize Fractions",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/4-1-visualize-fractions",
  },
  "os-fraction-add-same-denominator": {
    id: "os-fraction-add-same-denominator",
    title: "4.4 Add and Subtract Fractions with Common Denominators",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/4-4-add-and-subtract-fractions-with-common-denominators",
  },
  "os-fraction-add-different-denominator": {
    id: "os-fraction-add-different-denominator",
    title: "4.5 Add and Subtract Fractions with Different Denominators",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/4-5-add-and-subtract-fractions-with-different-denominators",
  },
  "os-proportions": {
    id: "os-proportions",
    title: "6.5 Solve Proportions and their Applications",
    organization: "OpenStax",
    url: "https://openstax.org/books/prealgebra-2e/pages/6-5-solve-proportions-and-their-applications",
  },
  "im-ratio-6": {
    id: "im-ratio-6",
    title: "Grade 6 Ratios and Proportional Relationships",
    organization: "Illustrative Mathematics",
    url: "https://tasks.illustrativemathematics.org/content-standards/6/RP/A",
  },
};

export type QuantitativeQuestion = {
  id: string;
  skillCode: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  optionFeedback: Array<string | null>;
};

export type QuantitativeLesson = {
  id: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  sections: Array<{
    id: string;
    kind: "concept" | "rule" | "example" | "warning";
    title: string;
    paragraphs: string[];
    workedExample?: {
      question: string;
      steps: string[];
      answer: string;
    };
  }>;
  sources: string[];
  assessmentQuestions: QuantitativeQuestion[];
  remedialQuestions: QuantitativeQuestion[];
};

export const QUANTITATIVE_CHAPTERS = [
  {
    id: "numbers",
    title: "العدد والعمليات",
    topics: [
      ["multiples-factors", "المضاعفات والعوامل"],
      ["prime-factorization", "التحليل إلى عوامل أولية"],
      ["gcd-lcm", "القاسم والمضاعف المشتركان"],
      ["integer-operations", "العمليات على الأعداد الصحيحة"],
      ["order-of-operations", "ترتيب العمليات"],
      ["divisibility", "قواعد القسمة"],
      ["estimation", "التقدير والحساب الذهني"],
      ["powers", "القوى والأسس"],
      ["square-roots", "الجذور التربيعية"],
      ["number-comparison", "مقارنة الأعداد والقيم"],
    ],
  },
  {
    id: "fractions-ratios-percent",
    title: "الكسور والنسب والمئوية",
    topics: [
      ["fraction-meaning", "معنى الكسر والكسور المتكافئة"],
      ["fraction-comparison", "مقارنة الكسور وترتيبها"],
      ["fraction-operations", "عمليات الكسور"],
      ["decimal-operations", "الأعداد العشرية"],
      ["fraction-decimal-percent", "التحويل بين الكسر والعشري والمئوي"],
      ["ratios", "النسبة"],
      ["unit-rates", "المعدل ومعدل الوحدة"],
      ["proportions", "التناسب"],
      ["unit-conversion", "تحويل الوحدات"],
      ["percent-change", "التغير المئوي والخصم"],
    ],
  },
  {
    id: "algebra-patterns",
    title: "الجبر والمعادلات والأنماط",
    topics: [
      ["variables", "المتغيرات والتعابير"],
      ["evaluate-expressions", "التعويض في التعبير الجبري"],
      ["simplify-expressions", "تبسيط التعابير"],
      ["one-step-equations", "المعادلات ذات الخطوة الواحدة"],
      ["multi-step-equations", "المعادلات متعددة الخطوات"],
      ["distributive-property", "خاصية التوزيع"],
      ["inequalities", "المتباينات"],
      ["word-problems", "ترجمة المسائل اللفظية"],
      ["sequences", "المتتابعات العددية"],
      ["linear-patterns", "الأنماط الخطية"],
    ],
  },
  {
    id: "geometry-measurement",
    title: "الهندسة والقياس",
    topics: [
      ["angles", "الزوايا والعلاقات بينها"],
      ["triangles", "المثلثات ومجموع الزوايا"],
      ["quadrilaterals", "الأشكال الرباعية"],
      ["polygons", "المضلعات"],
      ["perimeter", "المحيط"],
      ["area", "المساحة"],
      ["circles", "الدائرة"],
      ["composite-shapes", "الأشكال المركبة"],
      ["volume", "الحجم"],
      ["surface-area", "المساحة السطحية"],
    ],
  },
  {
    id: "data-probability-reasoning",
    title: "البيانات والاحتمال والتفكير",
    topics: [
      ["tables", "قراءة الجداول"],
      ["graphs", "قراءة الرسوم البيانية"],
      ["mean", "المتوسط الحسابي"],
      ["median-mode", "الوسيط والمنوال"],
      ["range", "المدى وتشتت البيانات"],
      ["weighted-mean", "المتوسط المرجح"],
      ["probability", "الاحتمال"],
      ["counting", "مبدأ العد"],
      ["rates-of-work", "معدل الإنجاز والعمل"],
      ["mixed-strategies", "اختيار الاستراتيجية والتحقق"],
    ],
  },
] as const;

export const QUANTITATIVE_LESSONS: QuantitativeLesson[] = [
  {
    id: "multiples-factors",
    title: "المضاعفات والعوامل",
    summary: "ميّز بين العدد الذي يقسم عددًا آخر والعدد الناتج من ضربه، واستخدم ذلك في مسائل الترتيب والتجميع.",
    estimatedMinutes: 12,
    sources: ["os-factors", "os-index", "etec-sample"],
    sections: [
      {
        id: "meaning",
        kind: "concept",
        title: "كيف نقرأ العلاقة بين عددين؟",
        paragraphs: [
          "إذا كان 24 ÷ 6 عددًا صحيحًا، فالعدد 6 عامل من عوامل 24، والعدد 24 من مضاعفات 6. كلمة «عامل» تركّز على القسمة دون باقٍ، وكلمة «مضاعف» تركّز على نواتج الضرب.",
          "العوامل تأتي في أزواج حاصل ضربها العدد نفسه؛ لذلك يكفي أن نبحث حتى الجذر التقريبي للعدد، ثم نكتب العامل المقابل لكل عامل نجده.",
        ],
        workedExample: {
          question: "ما عوامل العدد 24؟",
          steps: [
            "ابدأ بالزوج 1 × 24.",
            "جرّب القسمة: 24 ÷ 2 = 12، ثم 24 ÷ 3 = 8، ثم 24 ÷ 4 = 6.",
            "توقف بعد 4؛ لأن الأزواج بعدها ستعيد العوامل التي ظهرت.",
          ],
          answer: "العوامل هي 1، 2، 3، 4، 6، 8، 12، 24.",
        },
      },
      {
        id: "divisibility",
        kind: "rule",
        title: "اختبارات قسمة سريعة",
        paragraphs: [
          "العدد يقبل القسمة على 2 إذا كان رقم آحاده زوجيًا، وعلى 5 إذا انتهى بـ0 أو 5، وعلى 10 إذا انتهى بـ0.",
          "لقسمة عدد على 3، اجمع أرقامه: إذا كان مجموعها يقبل القسمة على 3 فالعدد يقبل القسمة عليه. هذه الاختبارات تختصر الحساب لكنها لا تغيّر معنى العامل: يجب أن تكون نتيجة القسمة عددًا صحيحًا.",
        ],
      },
      {
        id: "common-mixup",
        kind: "warning",
        title: "انتبه لاتجاه العلاقة",
        paragraphs: [
          "في 4 × 6 = 24، العددان 4 و6 عاملان للعدد 24، أما 24 فهو مضاعف لكل منهما. الخلط بين الاسمين لا يغيّر الحساب، لكنه قد يقلب المطلوب في سؤال لفظي.",
        ],
      },
    ],
    assessmentQuestions: [
      {
        id: "mf-a1",
        skillCode: "multiple-vs-factor",
        prompt: "أي عدد مما يأتي من مضاعفات 6؟",
        options: ["20", "18", "21", "25"],
        correctOptionIndex: 1,
        explanation: "18 = 6 × 3؛ إذن هو ناتج ضرب 6 في عدد صحيح.",
        optionFeedback: [
          "20 لا يساوي 6 مضروبة في عدد صحيح.",
          null,
          "21 من مضاعفات 7، وليس 6.",
          "25 لا يساوي 6 مضروبة في عدد صحيح.",
        ],
      },
      {
        id: "mf-a2",
        skillCode: "identify-factor",
        prompt: "أي عدد مما يأتي عامل للعدد 42؟",
        options: ["8", "9", "7", "11"],
        correctOptionIndex: 2,
        explanation: "42 ÷ 7 = 6 دون باقٍ، لذلك 7 عامل للعدد 42.",
        optionFeedback: [
          "42 ÷ 8 ليس عددًا صحيحًا.",
          "42 ÷ 9 ليس عددًا صحيحًا.",
          null,
          "42 ÷ 11 ليس عددًا صحيحًا.",
        ],
      },
      {
        id: "mf-a3",
        skillCode: "divisibility-by-three",
        prompt: "هل يقبل العدد 5,712 القسمة على 3؟",
        options: ["نعم؛ مجموع أرقامه 15", "لا؛ لأنه عدد زوجي", "لا؛ لأن آحاده 2", "نعم؛ لأن آحاده أكبر من 1"],
        correctOptionIndex: 0,
        explanation: "5 + 7 + 1 + 2 = 15، و15 يقبل القسمة على 3.",
        optionFeedback: [
          null,
          "الزوجية تختبر القسمة على 2 ولا تمنع القسمة على 3.",
          "رقم الآحاد وحده لا يحدد القسمة على 3.",
          "الحكم يعتمد على مجموع الأرقام، لا على كبر رقم الآحاد.",
        ],
      },
      {
        id: "mf-a4",
        skillCode: "factor-pairs",
        prompt: "وُزّعت 48 قطعة بالتساوي في صفوف، في كل صف 6 قطع. كم صفًا؟",
        options: ["6", "7", "8", "9"],
        correctOptionIndex: 2,
        explanation: "عدد الصفوف = 48 ÷ 6 = 8؛ لأننا نبحث عن العامل المقابل لـ6.",
        optionFeedback: [
          "6 هو عدد القطع في الصف، وليس عدد الصفوف.",
          "48 ÷ 6 لا يساوي 7.",
          null,
          "48 ÷ 6 لا يساوي 9.",
        ],
      },
    ],
    remedialQuestions: [
      {
        id: "mf-r1",
        skillCode: "multiple-vs-factor",
        prompt: "أي عدد من مضاعفات 8؟",
        options: ["30", "40", "42", "50"],
        correctOptionIndex: 1,
        explanation: "40 = 8 × 5.",
        optionFeedback: ["30 ليس ناتجًا صحيحًا لضرب 8.", null, "42 لا يقبل القسمة على 8 دون باقٍ.", "50 لا يقبل القسمة على 8 دون باقٍ."],
      },
      {
        id: "mf-r2",
        skillCode: "identify-factor",
        prompt: "أي عدد عامل للعدد 36؟",
        options: ["5", "7", "9", "11"],
        correctOptionIndex: 2,
        explanation: "36 ÷ 9 = 4 دون باقٍ.",
        optionFeedback: ["36 ليس من مضاعفات 5.", "36 ÷ 7 ليس عددًا صحيحًا.", null, "36 ÷ 11 ليس عددًا صحيحًا."],
      },
      {
        id: "mf-r3",
        skillCode: "divisibility-by-five",
        prompt: "أي عدد يقبل القسمة على 5؟",
        options: ["3,714", "3,716", "3,715", "3,718"],
        correctOptionIndex: 2,
        explanation: "العدد يقبل القسمة على 5 إذا انتهى بـ0 أو 5.",
        optionFeedback: ["آحاده 4.", "آحاده 6.", null, "آحاده 8."],
      },
      {
        id: "mf-r4",
        skillCode: "factor-pairs",
        prompt: "في 45 صفحة، كم مجموعة من 5 صفحات يمكن تكوينها؟",
        options: ["8", "9", "10", "40"],
        correctOptionIndex: 1,
        explanation: "45 ÷ 5 = 9 مجموعات.",
        optionFeedback: ["8 × 5 = 40، فيتبقى 5 صفحات.", null, "10 × 5 = 50 وهو أكثر من 45.", "40 هو ناتج 8 × 5 وليس عدد المجموعات."],
      },
    ],
  },
  {
    id: "prime-factorization",
    title: "التحليل إلى عوامل أولية",
    summary: "فكّك العدد إلى حاصل ضرب أعداد أولية لتبسيط الحسابات الكبيرة وفهم بنية العدد.",
    estimatedMinutes: 12,
    sources: ["os-primes", "os-factors"],
    sections: [
      {
        id: "prime-idea",
        kind: "concept",
        title: "ما العدد الأولي؟",
        paragraphs: [
          "العدد الأولي أكبر من 1 وله عاملان موجبان فقط: 1 والعدد نفسه. العدد 1 ليس أوليًا؛ لأنه يملك عاملًا موجبًا واحدًا فقط.",
          "التحليل إلى عوامل أولية يعني كتابة العدد على صورة ضرب أعداد أولية. نكرر القسمة على عدد أولي صغير في كل مرة، ثم نتوقف عندما تصبح النتيجة أولية.",
        ],
        workedExample: {
          question: "حلّل 60 إلى عوامل أولية.",
          steps: [
            "60 = 2 × 30، ثم 30 = 2 × 15.",
            "15 = 3 × 5، والعددان 3 و5 أوليان.",
            "اجمع العوامل المتكررة بالأسس: يظهر العدد 2 مرتين.",
          ],
          answer: "60 = 2² × 3 × 5.",
        },
      },
      {
        id: "factor-tree",
        kind: "rule",
        title: "طريقة شجرة العوامل",
        paragraphs: [
          "ابدأ بكتابة العدد كحاصل ضرب عاملين، ثم فكك كل عامل غير أولي. اختلاف بداية الشجرة لا يغيّر النتيجة النهائية بعد ترتيب العوامل.",
          "تحقق من التحليل بضرب العوامل الأولية من جديد. إذا لم تحصل على العدد الأصلي، فهناك عامل مفقود أو خطأ في الأس.",
        ],
      },
      {
        id: "exponent-meaning",
        kind: "warning",
        title: "الأس يعدّ التكرار",
        paragraphs: [
          "2³ تعني 2 × 2 × 2 = 8، وليست 2 × 3. اكتب العوامل كاملة أولًا ثم اختصرها بالأس؛ هذه الخطوة تمنع الخلط بين الأس والضرب.",
        ],
      },
    ],
    assessmentQuestions: [
      {
        id: "pf-a1",
        skillCode: "prime-factorization",
        prompt: "ما التحليل الأولي الصحيح للعدد 72؟",
        options: ["2³ × 3²", "2² × 3³", "2 × 36", "8 × 9"],
        correctOptionIndex: 0,
        explanation: "72 = 8 × 9 = 2³ × 3²، وجميع العوامل في الصورة الأولى أولية.",
        optionFeedback: [
          null,
          "2² × 3³ = 108، وليس 72؛ راجع عدد مرات ظهور كل عامل.",
          "36 ليس عددًا أوليًا، لذلك لم يكتمل التحليل.",
          "8 و9 ليسا أوليين؛ فكّكهما إلى عوامل أولية.",
        ],
      },
      {
        id: "pf-a2",
        skillCode: "prime-definition",
        prompt: "أي عدد مما يأتي أولي؟",
        options: ["21", "27", "29", "33"],
        correctOptionIndex: 2,
        explanation: "29 لا يقبل القسمة دون باقٍ على 2 أو 3 أو 5، ولا يوجد عامل أولي أصغر من جذره.",
        optionFeedback: [
          "21 = 3 × 7.",
          "27 = 3 × 9.",
          null,
          "33 = 3 × 11.",
        ],
      },
      {
        id: "pf-a3",
        skillCode: "exponent-as-repeated-factor",
        prompt: "ما قيمة 3⁴؟",
        options: ["12", "27", "64", "81"],
        correctOptionIndex: 3,
        explanation: "3⁴ = 3 × 3 × 3 × 3 = 81.",
        optionFeedback: [
          "12 ناتج 3 × 4؛ الأس يعني تكرار العامل لا ضرب الأساس في الأس.",
          "27 = 3³، وقد نُقص عامل واحد.",
          "64 = 4³، تغير الأساس والأس.",
          null,
        ],
      },
      {
        id: "pf-a4",
        skillCode: "verify-factorization",
        prompt: "أي تحليل يساوي 90؟",
        options: ["2 × 3² × 5", "2² × 3 × 5", "3² × 5", "2 × 3 × 5²"],
        correctOptionIndex: 0,
        explanation: "2 × 9 × 5 = 90.",
        optionFeedback: [
          null,
          "2² × 3 × 5 = 60.",
          "3² × 5 = 45، وينقصه العامل 2.",
          "2 × 3 × 25 = 150.",
        ],
      },
    ],
    remedialQuestions: [
      {
        id: "pf-r1",
        skillCode: "prime-factorization",
        prompt: "ما التحليل الأولي للعدد 48؟",
        options: ["2⁴ × 3", "2³ × 3²", "4 × 12", "2 × 24"],
        correctOptionIndex: 0,
        explanation: "48 = 16 × 3 = 2⁴ × 3.",
        optionFeedback: [null, "2³ × 3² = 72.", "4 و12 ليسا أوليين.", "24 ليس أوليًا."],
      },
      {
        id: "pf-r2",
        skillCode: "prime-definition",
        prompt: "أي عدد أولي؟",
        options: ["35", "37", "39", "49"],
        correctOptionIndex: 1,
        explanation: "37 لا يقبل القسمة على 2 أو 3 أو 5؛ وهذه تكفي للفحص حتى جذره.",
        optionFeedback: ["35 = 5 × 7.", null, "39 = 3 × 13.", "49 = 7 × 7."],
      },
      {
        id: "pf-r3",
        skillCode: "exponent-as-repeated-factor",
        prompt: "ما قيمة 2⁵؟",
        options: ["10", "16", "32", "25"],
        correctOptionIndex: 2,
        explanation: "2⁵ = 2 × 2 × 2 × 2 × 2 = 32.",
        optionFeedback: ["10 = 2 × 5.", "16 = 2⁴؛ ينقص عامل 2.", null, "25 = 5²."],
      },
      {
        id: "pf-r4",
        skillCode: "verify-factorization",
        prompt: "أي تحليل يساوي 84؟",
        options: ["2² × 3 × 7", "2 × 3² × 7", "2² × 3 × 5", "2 × 42"],
        correctOptionIndex: 0,
        explanation: "4 × 3 × 7 = 84، وكل العوامل أولية.",
        optionFeedback: [null, "2 × 9 × 7 = 126.", "4 × 3 × 5 = 60.", "42 ليس عددًا أوليًا؛ التحليل غير مكتمل."],
      },
    ],
  },
  {
    id: "gcd-lcm",
    title: "القاسم والمضاعف المشتركان",
    summary: "اختر القاسم المشترك الأكبر للتقسيم إلى مجموعات، والمضاعف المشترك الأصغر لمواعيد التكرار.",
    estimatedMinutes: 14,
    sources: ["os-primes", "os-factors"],
    sections: [
      {
        id: "choose-gcd-lcm",
        kind: "concept",
        title: "حدّد المطلوب من سياق المسألة",
        paragraphs: [
          "القاسم المشترك الأكبر (ق.م.أ) هو أكبر عدد يقسم الأعداد كلها دون باقٍ؛ يظهر غالبًا عند تقسيم كميات إلى أكبر مجموعات متساوية.",
          "المضاعف المشترك الأصغر (م.م.أ) هو أصغر عدد موجب يظهر ضمن مضاعفات الأعداد كلها؛ يفيد عند البحث عن أول وقت تتزامن فيه دورات أو مواعيد متكررة.",
        ],
        workedExample: {
          question: "ما ق.م.أ للعددين 24 و36؟",
          steps: [
            "24 = 2³ × 3، و36 = 2² × 3².",
            "للقاسم المشترك نأخذ العوامل الأولية المشتركة بأسسها الأصغر: 2² و3.",
            "نضرب العوامل المختارة: 4 × 3.",
          ],
          answer: "ق.م.أ(24، 36) = 12.",
        },
      },
      {
        id: "prime-powers-method",
        kind: "rule",
        title: "طريقة الأسس الأولية",
        paragraphs: [
          "لإيجاد ق.م.أ، خذ العوامل المشتركة فقط بأصغر أس. ولإيجاد م.م.أ، خذ كل عامل يظهر في أي عدد بأكبر أس.",
          "افحص الناتج في سياق السؤال: ق.م.أ يجب أن يقسم كل كمية، وم.م.أ يجب أن يكون مضاعفًا لكل عدد.",
        ],
      },
      {
        id: "context-clue",
        kind: "warning",
        title: "لا تختَر القانون من الاسم وحده",
        paragraphs: [
          "كلمة «أكبر» لا تعني دائمًا ق.م.أ، و«أول مرة معًا» غالبًا تعني م.م.أ. حوّل الجملة إلى فعل: تقسيم متساوٍ أم تزامن؟ ثم اختر.",
        ],
      },
    ],
    assessmentQuestions: [
      {
        id: "gl-a1",
        skillCode: "greatest-common-factor",
        prompt: "ما ق.م.أ للعددين 30 و42؟",
        options: ["3", "6", "12", "210"],
        correctOptionIndex: 1,
        explanation: "عوامل 30 المشتركة مع 42 تشمل 1 و2 و3 و6؛ وأكبرها 6.",
        optionFeedback: ["3 قاسم مشترك لكنه ليس الأكبر.", null, "12 لا يقسم 30 دون باقٍ.", "210 مضاعف مشترك، لا قاسم."],
      },
      {
        id: "gl-a2",
        skillCode: "least-common-multiple",
        prompt: "ما م.م.أ للعددين 8 و12؟",
        options: ["4", "16", "24", "96"],
        correctOptionIndex: 2,
        explanation: "24 هو أصغر عدد يقبل القسمة على 8 وعلى 12.",
        optionFeedback: ["4 قاسم مشترك وليس مضاعفًا للعددين.", "16 لا يقبل القسمة على 12.", null, "96 مضاعف مشترك لكنه ليس الأصغر."],
      },
      {
        id: "gl-a3",
        skillCode: "select-gcd-or-lcm",
        prompt: "جرسان يرنّان كل 6 دقائق و8 دقائق. بعد كم دقيقة يرنّان معًا أول مرة بعد البداية؟",
        options: ["2", "14", "24", "48"],
        correctOptionIndex: 2,
        explanation: "نبحث عن أول زمن مشترك، أي م.م.أ(6، 8) = 24 دقيقة.",
        optionFeedback: ["2 ليس مضاعفًا لأي من الفترتين.", "14 ليس من مضاعفات 6 ولا 8.", null, "48 زمن مشترك لكنه ليس الأول."],
      },
      {
        id: "gl-a4",
        skillCode: "prime-power-exponents",
        prompt: "إذا كان 18 = 2 × 3² و30 = 2 × 3 × 5، فما ق.م.أ؟",
        options: ["2 × 3", "2 × 3² × 5", "3 × 5", "2 × 5"],
        correctOptionIndex: 0,
        explanation: "العوامل المشتركة هي 2 و3، ونأخذ الأس الأصغر لكل منهما؛ الناتج 6.",
        optionFeedback: [null, "هذا يأخذ أسسًا أكبر وعاملًا غير مشترك؛ يساوي 90.", "5 ليس عاملًا في 18.", "5 ليس عاملًا في 18."],
      },
    ],
    remedialQuestions: [
      {
        id: "gl-r1",
        skillCode: "greatest-common-factor",
        prompt: "ما ق.م.أ للعددين 18 و30؟",
        options: ["3", "6", "9", "90"],
        correctOptionIndex: 1,
        explanation: "العوامل المشتركة تشمل 1 و2 و3 و6، وأكبرها 6.",
        optionFeedback: ["3 مشترك لكنه ليس الأكبر.", null, "9 لا يقسم 30 دون باقٍ.", "90 مضاعف مشترك، لا قاسم."],
      },
      {
        id: "gl-r2",
        skillCode: "least-common-multiple",
        prompt: "ما م.م.أ للعددين 10 و15؟",
        options: ["5", "25", "30", "150"],
        correctOptionIndex: 2,
        explanation: "30 هو أصغر عدد يقبل القسمة على 10 و15.",
        optionFeedback: ["5 قاسم مشترك وليس مضاعفًا.", "25 لا يقبل القسمة على 15.", null, "150 مضاعف مشترك لكنه ليس الأصغر."],
      },
      {
        id: "gl-r3",
        skillCode: "select-gcd-or-lcm",
        prompt: "مصباح يومض كل 4 ثوانٍ وآخر كل 6 ثوانٍ. متى يضيئان معًا أول مرة؟",
        options: ["2", "10", "12", "24"],
        correctOptionIndex: 2,
        explanation: "التزامن الأول بعد البداية هو م.م.أ(4، 6) = 12 ثانية.",
        optionFeedback: ["2 ليست مضاعفًا مشتركًا.", "10 لا يقبل القسمة على 4 أو 6.", null, "24 زمن مشترك لكنه ليس الأصغر."],
      },
      {
        id: "gl-r4",
        skillCode: "prime-power-exponents",
        prompt: "إذا كان 12 = 2² × 3 و20 = 2² × 5، فما ق.م.أ؟",
        options: ["2²", "2² × 3 × 5", "3 × 5", "2 × 3"],
        correctOptionIndex: 0,
        explanation: "العامل الأولي المشترك الوحيد هو 2، وأصغر أس له هو 2؛ إذن الناتج 4.",
        optionFeedback: [null, "هذا يضرب جميع العوامل ويعطي 60؛ ليس قاسمًا مشتركًا.", "3 و5 ليسا مشتركين.", "2 × 3 = 6 ولا يقسم 20."],
      },
    ],
  },
  {
    id: "integer-operations",
    title: "العمليات على الأعداد الصحيحة",
    summary: "استخدم خط الأعداد للجمع والطرح، وقاعدة الإشارات للضرب والقسمة.",
    estimatedMinutes: 13,
    sources: ["os-add-integers", "os-subtract-integers", "os-integers"],
    sections: [
      {
        id: "number-line",
        kind: "concept",
        title: "الإشارة تحدد الموقع والاتجاه",
        paragraphs: [
          "الأعداد الموجبة تقع يمين الصفر على خط الأعداد، والسالبة تقع يساره. في الجمع، تحرك باتجاه العدد المضاف؛ وفي الطرح، تحرك بعكس اتجاه العدد المطروح.",
          "عند جمع عددين مختلفي الإشارة، اطرح القيمتين المطلقين وخذ إشارة العدد ذي القيمة المطلقة الأكبر. وعند تساويهما يكون الناتج صفرًا.",
        ],
        workedExample: {
          question: "احسب −8 + 13.",
          steps: [
            "القيمتان المطلقـتان 8 و13؛ اطرح الأصغر من الأكبر: 13 − 8 = 5.",
            "إشارة العدد الأكبر قيمةً مطلقة هي موجبة؛ لأن 13 موجب.",
          ],
          answer: "−8 + 13 = 5.",
        },
      },
      {
        id: "subtract-negative",
        kind: "rule",
        title: "الطرح هو جمع المعكوس",
        paragraphs: [
          "حوّل الطرح إلى جمع، وبدّل إشارة العدد المطروح: a − b = a + (−b). لذلك 7 − (−4) تصبح 7 + 4، لا 7 − 4.",
          "في الضرب والقسمة: إشارتان متماثلتان تعطيان موجبًا، وإشارتان مختلفتان تعطيان سالبًا. احسب القيم المطلقة أولًا ثم أعد الإشارة.",
        ],
      },
      {
        id: "sign-check",
        kind: "warning",
        title: "افصل الإشارة عن مقدار العدد",
        paragraphs: [
          "قبل اختيار الإجابة، توقّع الإشارة: حاصل ضرب عددين مختلفي الإشارة سالب، وجمع عدد موجب مع سالب يقع بين العددين. التوقع يكشف أخطاء الإشارة قبل الحساب الدقيق.",
        ],
      },
    ],
    assessmentQuestions: [
      {
        id: "io-a1",
        skillCode: "add-opposite-signs",
        prompt: "احسب −8 + 13.",
        options: ["−21", "−5", "5", "21"],
        correctOptionIndex: 2,
        explanation: "نطرح 13 − 8 = 5، ونأخذ إشارة الأكبر قيمة مطلقة، وهي موجبة.",
        optionFeedback: ["جمعت القيمتين المطلقـتين وأبقيت السالب؛ الإشارتان مختلفتان.", "الإشارة هنا يجب أن تكون موجبة لأن 13 أكبر قيمة مطلقة.", null, "لم تطرح المقدارين عند اختلاف الإشارتين."],
      },
      {
        id: "io-a2",
        skillCode: "subtract-negative",
        prompt: "احسب 7 − (−4).",
        options: ["3", "−3", "11", "−11"],
        correctOptionIndex: 2,
        explanation: "طرح السالب يتحول إلى جمع: 7 + 4 = 11.",
        optionFeedback: ["طرحت 4 من 7، لكن طرح السالب يغيّر إلى جمع.", "الإشارة السالبة لا تنتج من طرح عدد سالب هنا.", null, "جمعت المقدارين لكن وضعت إشارة سالبة دون داعٍ."],
      },
      {
        id: "io-a3",
        skillCode: "multiply-signs",
        prompt: "ما ناتج (−6) × 5؟",
        options: ["−30", "−11", "11", "30"],
        correctOptionIndex: 0,
        explanation: "الإشارتان مختلفتان فيكون الناتج سالبًا، و6 × 5 = 30.",
        optionFeedback: [null, "الضرب ليس جمعًا؛ اضرب المقدارين.", "الضرب ليس جمعًا؛ اضرب المقدارين ثم حدّد الإشارة.", "مقدار الناتج صحيح لكن إشارته خاطئة؛ الإشارتان مختلفتان."],
      },
      {
        id: "io-a4",
        skillCode: "divide-signs",
        prompt: "احسب (−42) ÷ (−7).",
        options: ["−6", "6", "−35", "35"],
        correctOptionIndex: 1,
        explanation: "إشارتان متماثلتان تعطيان موجبًا، و42 ÷ 7 = 6.",
        optionFeedback: ["الإشارتان متماثلتان؛ الناتج موجب.", null, "القسمة ليست طرحًا.", "الإشارة موجبة لكن المقدار ليس 35."],
      },
    ],
    remedialQuestions: [
      {
        id: "io-r1",
        skillCode: "add-opposite-signs",
        prompt: "احسب −15 + 9.",
        options: ["−24", "−6", "6", "24"],
        correctOptionIndex: 1,
        explanation: "15 − 9 = 6، وإشارة الأكبر قيمة مطلقة هي السالبة.",
        optionFeedback: ["جمعت المقدارين بدل طرحهما.", null, "المقدار صحيح لكن إشارة 15 السالبة هي الغالبة.", "جمعت المقدارين بدل طرحهما."],
      },
      {
        id: "io-r2",
        skillCode: "subtract-negative",
        prompt: "احسب 5 − (−3).",
        options: ["2", "−2", "8", "−8"],
        correctOptionIndex: 2,
        explanation: "5 − (−3) = 5 + 3 = 8.",
        optionFeedback: ["تعاملت مع −3 كأنه موجب مطروح.", "الإشارة موجبة بعد تحويل الطرح إلى جمع.", null, "طرح السالب لا ينتج عددًا سالبًا هنا."],
      },
      {
        id: "io-r3",
        skillCode: "multiply-signs",
        prompt: "ما ناتج (−4) × (−7)؟",
        options: ["−28", "−11", "11", "28"],
        correctOptionIndex: 3,
        explanation: "الإشارتان متماثلتان فيكون الناتج موجبًا، و4 × 7 = 28.",
        optionFeedback: ["الإشارتان متماثلتان؛ الناتج موجب.", "الضرب ليس جمعًا.", "الضرب ليس جمعًا؛ احسب حاصل ضرب المقدارين.", null],
      },
      {
        id: "io-r4",
        skillCode: "divide-signs",
        prompt: "احسب 56 ÷ (−8).",
        options: ["−7", "7", "−48", "48"],
        correctOptionIndex: 0,
        explanation: "الإشارتان مختلفتان فيكون الناتج سالبًا، و56 ÷ 8 = 7.",
        optionFeedback: [null, "المقدار صحيح لكن الإشارتين مختلفتان؛ الناتج سالب.", "القسمة ليست طرحًا.", "القسمة ليست جمعًا."],
      },
    ],
  },
  {
    id: "order-of-operations",
    title: "ترتيب العمليات",
    summary: "رتّب الأقواس والأسس والضرب والقسمة والجمع والطرح لتصل إلى قيمة التعبير دون تغيير معناه.",
    estimatedMinutes: 12,
    sources: ["os-index", "os-integers", "etec-sample"],
    sections: [
      {
        id: "operation-order",
        kind: "rule",
        title: "الترتيب المتفق عليه",
        paragraphs: [
          "ابدأ بما داخل الأقواس، ثم الأسس والجذور، ثم الضرب والقسمة من اليسار إلى اليمين، ثم الجمع والطرح من اليسار إلى اليمين.",
          "الضرب لا يسبق القسمة دائمًا؛ العمليتان في مرتبة واحدة. وكذلك الجمع والطرح. لذلك لا تتجاوز عملية على اليسار لمجرد أن نوع العملية في الطرف الآخر مختلف.",
        ],
        workedExample: {
          question: "احسب 6 + 3 × 4.",
          steps: [
            "لا توجد أقواس أو أسس.",
            "أنجز الضرب أولًا: 3 × 4 = 12.",
            "اجمع بعد ذلك: 6 + 12 = 18.",
          ],
          answer: "الناتج 18، وليس 36.",
        },
      },
      {
        id: "left-to-right",
        kind: "concept",
        title: "عند تساوي الأولوية",
        paragraphs: [
          "احسب الضرب والقسمة بالترتيب من اليسار إلى اليمين، ثم انتقل إلى الجمع والطرح بالترتيب نفسه. في 20 ÷ 5 × 2 نبدأ بالقسمة اليسرى: 20 ÷ 5 = 4، ثم 4 × 2 = 8.",
          "الأقواس تغيّر ترتيب التنفيذ عمدًا؛ تعامل مع ما بداخلها كوحدة قبل متابعة بقية التعبير.",
        ],
      },
      {
        id: "common-mixup",
        kind: "warning",
        title: "لا تحسب التعبير كما يُقرأ لفظيًا",
        paragraphs: [
          "في مسائل الخيارات، قد ينتج أحد المشتتات من جمع الأعداد قبل الضرب أو من تجاهل الأقواس. اكتب خطوة واحدة في كل سطر، ثم أعد التعويض في التعبير للتحقق.",
        ],
      },
    ],
    assessmentQuestions: [
      {
        id: "oo-a1",
        skillCode: "multiplication-before-addition",
        prompt: "احسب 6 + 3 × 4.",
        options: ["36", "18", "24", "15"],
        correctOptionIndex: 1,
        explanation: "نحسب الضرب أولًا: 3 × 4 = 12، ثم 6 + 12 = 18.",
        optionFeedback: ["جمعت 6 + 3 قبل تنفيذ الضرب.", null, "حسبت الضرب فقط وأهملت إضافة 6.", "جمعت الأعداد الثلاثة دون مراعاة ترتيب العمليات."],
      },
      {
        id: "oo-a2",
        skillCode: "parentheses-first",
        prompt: "احسب (12 − 4) ÷ 2 + 5.",
        options: ["5", "9", "11", "13"],
        correctOptionIndex: 1,
        explanation: "الأقواس أولًا: 8. ثم 8 ÷ 2 = 4، وأخيرًا 4 + 5 = 9.",
        optionFeedback: ["توقفت بعد القسمة ولم تضف 5.", null, "أضفت 5 قبل إتمام القسمة.", "لم تنفذ ترتيب العمليات داخل التعبير."],
      },
      {
        id: "oo-a3",
        skillCode: "exponents-before-multiplication",
        prompt: "احسب 2³ + 5 × 2.",
        options: ["26", "18", "16", "40"],
        correctOptionIndex: 1,
        explanation: "2³ = 8 و5 × 2 = 10؛ ثم 8 + 10 = 18.",
        optionFeedback: ["أضيفت قيمة غير صحيحة؛ افصل الأس عن الضرب ثم اجمع.", null, "أُهمل أحد الحدين بعد حسابه.", "ضربت الحدود كلها معًا رغم وجود جمع."],
      },
      {
        id: "oo-a4",
        skillCode: "parentheses-first",
        prompt: "احسب 24 ÷ (3 × 2).",
        options: ["4", "8", "16", "48"],
        correctOptionIndex: 0,
        explanation: "نحسب داخل القوس: 3 × 2 = 6، ثم 24 ÷ 6 = 4.",
        optionFeedback: [null, "قسّمت على 3 ثم ضربت في 2؛ الأقواس تجعل 3 × 2 مقامًا واحدًا.", "هذا ينتج من تجاهل الأقواس وترتيب القسمة والضرب.", "ضربت بدل القسمة بعد حساب القوس."],
      },
    ],
    remedialQuestions: [
      {
        id: "oo-r1",
        skillCode: "multiplication-before-addition",
        prompt: "احسب 7 + 2 × 5.",
        options: ["45", "17", "35", "19"],
        correctOptionIndex: 1,
        explanation: "2 × 5 = 10، ثم 7 + 10 = 17.",
        optionFeedback: ["جمعت قبل الضرب.", null, "أهملت إضافة 7.", "نفّذت الجمع والضرب بترتيب غير صحيح."],
      },
      {
        id: "oo-r2",
        skillCode: "parentheses-first",
        prompt: "احسب (15 − 9) × 3.",
        options: ["18", "−12", "33", "6"],
        correctOptionIndex: 0,
        explanation: "نحسب القوس أولًا: 6 × 3 = 18.",
        optionFeedback: [null, "أُهمل القوس أو عومل الطرح بإشارة خاطئة.", "ضُرب 9 أو 15 بدل ناتج القوس.", "توقفت بعد حل القوس ولم تضرب في 3."],
      },
      {
        id: "oo-r3",
        skillCode: "exponents-before-multiplication",
        prompt: "احسب 3² + 2 × 4.",
        options: ["25", "17", "44", "13"],
        correctOptionIndex: 1,
        explanation: "3² = 9، و2 × 4 = 8، ثم 9 + 8 = 17.",
        optionFeedback: ["جمعت أو ضربت الحدود بترتيب غير صحيح.", null, "تعاملت مع الجمع كأنه ضرب لكل التعبير.", "أُهمل أحد الحدين أو حُسب الأس خطأ."],
      },
      {
        id: "oo-r4",
        skillCode: "left-to-right",
        prompt: "احسب 18 ÷ 3 × 2.",
        options: ["3", "6", "12", "18"],
        correctOptionIndex: 2,
        explanation: "القسمة والضرب في مرتبة واحدة؛ نبدأ من اليسار: 18 ÷ 3 = 6، ثم 6 × 2 = 12.",
        optionFeedback: ["قسّمت على حاصل ضرب 3 × 2 رغم عدم وجود أقواس.", "توقفت بعد أول عملية.", null, "لم تنفذ القسمة والضرب بالترتيب من اليسار."],
      },
    ],
  },
  {
    id: "fraction-operations",
    title: "الكسور وعملياتها",
    summary: "افهم البسط والمقام، كوّن كسورًا متكافئة، واختر طريقة الجمع أو الضرب أو القسمة.",
    estimatedMinutes: 15,
    sources: ["os-fractions", "os-fraction-add-same-denominator", "os-fraction-add-different-denominator"],
    sections: [
      {
        id: "fraction-meaning",
        kind: "concept",
        title: "الكسر جزء من وحدات متساوية",
        paragraphs: [
          "في الكسر 3/5، المقام 5 يبيّن أن الوحدة قُسمت إلى خمسة أجزاء متساوية، والبسط 3 يبيّن عدد الأجزاء المستخدمة. تكافؤ الكسور يعني تمثيل المقدار نفسه، مثل 1/2 = 2/4.",
          "عند جمع أو طرح كسرين، يجب أن تمثل الأجزاء وحدة الحجم نفسها؛ لذلك نوحّد المقامات أولًا إذا اختلفت.",
        ],
        workedExample: {
          question: "احسب 1/3 + 1/4.",
          steps: [
            "المضاعف المشترك الأصغر للمقامين 3 و4 هو 12.",
            "حوّل 1/3 إلى 4/12، و1/4 إلى 3/12.",
            "اجمع البسطين فقط بعد توحيد المقام: 4 + 3 = 7.",
          ],
          answer: "1/3 + 1/4 = 7/12.",
        },
      },
      {
        id: "fraction-operation-rules",
        kind: "rule",
        title: "قواعد العمليات",
        paragraphs: [
          "في الضرب، اضرب البسط في البسط والمقام في المقام، ثم اختصر إن أمكن. في القسمة، اضرب الكسر الأول في مقلوب الكسر الثاني.",
          "لا تجمع المقامين عند جمع الكسور. أما في الضرب والقسمة فلا تحتاج إلى توحيد المقامات قبل تنفيذ القاعدة.",
        ],
      },
      {
        id: "simplify-check",
        kind: "warning",
        title: "اختصر مع الحفاظ على القيمة",
        paragraphs: [
          "الاختصار هو قسمة البسط والمقام على العامل المشترك نفسه؛ لا تحذف رقمًا من البسط وآخر من المقام لمجرد تشابه شكلهما. بعد الحل، افحص أن الكسر في أبسط صورة.",
        ],
      },
    ],
    assessmentQuestions: [
      {
        id: "fo-a1",
        skillCode: "add-fractions-unlike-denominators",
        prompt: "احسب 2/3 + 1/6.",
        options: ["3/9", "5/6", "1/2", "3/6"],
        correctOptionIndex: 1,
        explanation: "2/3 = 4/6، ثم 4/6 + 1/6 = 5/6.",
        optionFeedback: ["جُمعت المقامات مباشرة؛ وحّد المقامات أولًا.", null, "طُرح أحد البسطين بدل جمعهما بعد التوحيد.", "عومل البسطان أو المقامان بطريقة غير صحيحة."],
      },
      {
        id: "fo-a2",
        skillCode: "multiply-fractions",
        prompt: "احسب 3/4 × 2/5.",
        options: ["6/20 = 3/10", "5/9", "3/20", "6/9"],
        correctOptionIndex: 0,
        explanation: "نضرب البسطين والمقامين: 3 × 2 = 6 و4 × 5 = 20؛ ثم نختصر إلى 3/10.",
        optionFeedback: [null, "جُمعت البسوط والمقامات كما في الجمع.", "أُهمل عامل من البسط.", "جُمعت المقامات بدل ضربها."],
      },
      {
        id: "fo-a3",
        skillCode: "compare-fractions",
        prompt: "أي الكسرين أكبر: 5/8 أم 2/3؟",
        options: ["5/8", "2/3", "متساويان", "لا يمكن المقارنة"],
        correctOptionIndex: 1,
        explanation: "5/8 = 15/24 و2/3 = 16/24؛ إذن 2/3 أكبر.",
        optionFeedback: ["المقارنة بالبسط وحده لا تكفي؛ وحّد المقامين.", null, "المقامات المتساوية بعد التحويل تكشف أن البسطين مختلفان.", "يمكن المقارنة بتوحيد المقامات أو التحويل إلى عشري."],
      },
      {
        id: "fo-a4",
        skillCode: "divide-fractions",
        prompt: "احسب 3/4 ÷ 1/2.",
        options: ["3/8", "2/3", "3/2", "4/3"],
        correctOptionIndex: 2,
        explanation: "نضرب في مقلوب المقسوم عليه: 3/4 × 2/1 = 6/4 = 3/2.",
        optionFeedback: ["ضُرب الكسران مباشرة بدل قلب الكسر الثاني.", "قُلب الكسر الأول بدل الثاني.", null, "قُلب الكسر الأول وأُهمل ترتيب القسمة."],
      },
    ],
    remedialQuestions: [
      {
        id: "fo-r1",
        skillCode: "add-fractions-unlike-denominators",
        prompt: "احسب 1/2 + 1/3.",
        options: ["2/5", "5/6", "1/6", "2/6"],
        correctOptionIndex: 1,
        explanation: "1/2 = 3/6 و1/3 = 2/6؛ المجموع 5/6.",
        optionFeedback: ["جُمعت المقامات بدل توحيدها.", null, "طُرح أحد الكسرين بدل جمعهما.", "جُمعت المقامات أو أُهمل تحويل البسط."],
      },
      {
        id: "fo-r2",
        skillCode: "multiply-fractions",
        prompt: "احسب 2/3 × 3/5.",
        options: ["6/15 = 2/5", "5/8", "5/15", "6/8"],
        correctOptionIndex: 0,
        explanation: "2 × 3 = 6، و3 × 5 = 15؛ ثم 6/15 = 2/5.",
        optionFeedback: [null, "جُمعت البسوط والمقامات.", "أُهمل أحد البسطين.", "جُمعت المقامات بدل ضربها."],
      },
      {
        id: "fo-r3",
        skillCode: "compare-fractions",
        prompt: "أي الكسرين أكبر: 3/5 أم 5/8؟",
        options: ["3/5", "5/8", "متساويان", "لا يمكن المقارنة"],
        correctOptionIndex: 1,
        explanation: "3/5 = 24/40 و5/8 = 25/40؛ إذن 5/8 أكبر قليلًا.",
        optionFeedback: ["قارن بعد توحيد المقام؛ 24 أصغر من 25.", null, "القيمتان متقاربتان لكنهما غير متساويتين.", "يمكن المقارنة بتوحيد المقامات."],
      },
      {
        id: "fo-r4",
        skillCode: "divide-fractions",
        prompt: "احسب 2/3 ÷ 4/5.",
        options: ["8/15", "5/6", "6/5", "10/15"],
        correctOptionIndex: 1,
        explanation: "2/3 × 5/4 = 10/12 = 5/6.",
        optionFeedback: ["ضُرب الكسران مباشرة ولم يُقلب المقسوم عليه.", null, "قُلب الكسر الأول بدل الثاني.", "حُسب البسط أو المقام بطريقة غير صحيحة؛ الناتج قبل الاختصار هو 10/12."],
      },
    ],
  },
];

export const QUANTITATIVE_LESSON_BY_ID = new Map(
  QUANTITATIVE_LESSONS.map((lesson) => [lesson.id, lesson]),
);

export const QUANTITATIVE_TOPICS = QUANTITATIVE_CHAPTERS.flatMap(
  (chapter) => chapter.topics.map(([id, title]) => ({ id, title })),
);

export function getQuestionSet(
  lesson: QuantitativeLesson,
  mode: "assessment" | "remediation",
): QuantitativeQuestion[] {
  return mode === "remediation" ? lesson.remedialQuestions : lesson.assessmentQuestions;
}

export function publicQuestion(question: QuantitativeQuestion) {
  return {
    id: question.id,
    skillCode: question.skillCode,
    prompt: question.prompt,
    options: question.options,
  };
}

export function gradeQuantitativeQuiz(
  questions: QuantitativeQuestion[],
  answers: Map<string, number>,
) {
  const questionDetails = questions.map((question) => {
    const selectedOptionIndex = answers.get(question.id);
    const isCorrect = selectedOptionIndex === question.correctOptionIndex;
    return {
      questionId: question.id,
      skillCode: question.skillCode,
      prompt: question.prompt,
      selectedOptionIndex,
      selectedOptionText:
        selectedOptionIndex === undefined ? null : question.options[selectedOptionIndex],
      isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      correctAnswer: question.options[question.correctOptionIndex],
      explanation: question.explanation,
      selectedOptionFeedback: isCorrect
        ? null
        : selectedOptionIndex === undefined
          ? "لم تُحدَّد إجابة؛ أجب عن كل سؤال ثم أرسل المحاولة."
          : question.optionFeedback[selectedOptionIndex] ??
            "راجع الفكرة المرتبطة بالسؤال ثم جرّب مسألة مشابهة.",
    };
  });
  const correctAnswers = questionDetails.filter((detail) => detail.isCorrect).length;
  return {
    correctAnswers,
    totalQuestions: questions.length,
    score: questions.length ? Math.round((correctAnswers / questions.length) * 100) : 0,
    questionDetails,
  };
}