export type FoundationProgram = "qudrat" | "tahsili";
export type FoundationSubject = "verbal" | "quantitative" | "math" | "physics" | "chemistry" | "biology";

export type FoundationSection = {
  key: FoundationSubject;
  title: string;
  shortTitle: string;
  description: string;
  explanation: string;
  questionCategory?: "verbal" | "quantitative";
  questionSubcategories?: string[];
  tahsiliSubject?: "رياضيات" | "فيزياء" | "كيمياء" | "أحياء";
};

export const foundationSections: Record<FoundationProgram, FoundationSection[]> = {
  qudrat: [
    {
      key: "verbal",
      title: "القدرات اللفظية",
      shortTitle: "اللفظي",
      description: "التناظر اللفظي، إكمال الجمل، الخطأ السياقي، واستيعاب المقروء.",
      explanation: "تدرّب على فهم العلاقة بين الكلمات، قراءة السياق كاملًا، واستخراج الفكرة والدليل من النص قبل اختيار الإجابة.",
      questionCategory: "verbal",
      questionSubcategories: ["التناظر اللفظي", "إكمال الجمل", "الخطأ السياقي", "استيعاب المقروء"],
    },
    {
      key: "quantitative",
      title: "القدرات الكمية",
      shortTitle: "الكمي",
      description: "الحساب، النسبة والتناسب، الجبر، الهندسة، والمقارنات.",
      explanation: "ابدأ بتحديد المطلوب والمعطيات، ثم اختر أقصر قاعدة مناسبة. راجع الوحدات والإشارة والتقدير قبل اعتماد الناتج.",
      questionCategory: "quantitative",
      questionSubcategories: [
        "العمليات الحسابية",
        "النسبة والتناسب وأفكار أخرى",
        "النسبة المئوية",
        "المعادلات",
        "الحركة والانماط",
        "الهندسة",
        "هندسة",
        "المقارنات",
        "أفكار متنوعة",
        "الإحصاء",
        "الاحصاء",
      ],
    },
  ],
  tahsili: [
    {
      key: "math",
      title: "التحصيلي: الرياضيات",
      shortTitle: "الرياضيات",
      description: "مفاهيم الرياضيات والتطبيقات التي تتكرر في أسئلة التحصيلي.",
      explanation: "حوّل المسألة إلى معطيات ورموز، اكتب القانون قبل التعويض، ثم افحص منطق الناتج ووحدته.",
      tahsiliSubject: "رياضيات",
    },
    {
      key: "physics",
      title: "التحصيلي: الفيزياء",
      shortTitle: "الفيزياء",
      description: "الحركة والقوى والطاقة والكهرباء والمفاهيم الفيزيائية الأساسية.",
      explanation: "حدّد الكميات المعروفة والمطلوبة وارسم الحالة عند الحاجة. لا تخلط بين المتجهات والوحدات قبل تطبيق القانون.",
      tahsiliSubject: "فيزياء",
    },
    {
      key: "chemistry",
      title: "التحصيلي: الكيمياء",
      shortTitle: "الكيمياء",
      description: "المادة والتفاعلات والمحاليل والاتزان والمفاهيم الكيميائية الأساسية.",
      explanation: "وازن المعادلة أولًا، ثم تتبّع النسب المولية والشحنات. في الأسئلة المفاهيمية ابحث عن السبب لا عن الحفظ المجرد.",
      tahsiliSubject: "كيمياء",
    },
    {
      key: "biology",
      title: "التحصيلي: الأحياء",
      shortTitle: "الأحياء",
      description: "الخلايا والوراثة والأنظمة الحيوية والتنوع والتكامل بين وظائف الكائن الحي.",
      explanation: "اربط المصطلح بوظيفته ومكانه وتسلسله داخل النظام الحيوي، ثم استبعد الخيارات التي تخلط بين الوظيفة والبنية.",
      tahsiliSubject: "أحياء",
    },
  ],
};

export function getFoundationSection(
  program: FoundationProgram,
  subject: string | null | undefined,
) {
  const sections = foundationSections[program];
  return sections.find((section) => section.key === subject) || sections[0];
}