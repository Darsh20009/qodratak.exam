interface Props {
  subcategory: string;
  onContinue: () => void;
}

const subcategoryInfo: Record<
  string,
  { title: string; description: string }
> = {
  comparison: {
    title: "أسئلة المقارنة",
    description:
      "في السؤال الآتي قيمتان. المطلوب هو: المقارنة بين القيمتين ثم اختيار الإجابة الصحيحة من الاختيارات الأربعة المعطاة أدناه.",
  },
  analogy: {
    title: "التناظر اللفظي",
    description:
      "في هذا السؤال كلمتان ترتبطان بعلاقة معينة، تتبعها أربعة أزواج من الكلمات، أحدها ترتبط فيه الكلمتان بعلاقة مشابهة للعلاقة بين الكلمتين في بداية السؤال. المطلوب، هو: اختيار الإجابة الصحيحة.",
  },
  contextual_error: {
    title: "الخطأ السياقي",
    description:
      "في الجملة الآتية أربعة كلمات كل منها مكتوبة بخط غليظ. المطلوب، هو: تحديد الكلمة التي لا يتفق معناها مع المعنى العام للجملة. (الخطأ ليس إملائياً ولا نحوياً).",
  },
  sentence_completion: {
    title: "إكمال الجمل",
    description:
      "تلي الجملة الآتية أربعة اختيارات، أحدها يُكمل الفراغ أو الفراغات في الجملة إكمالاً صحيحاً. المطلوب، هو: اختيار الإجابة الصحيحة.",
  },
  reading_comprehension: {
    title: "استيعاب المقروء",
    description:
      "السؤال التالي يتعلق بالنص المرفق، بعد السؤال هناك أربعة اختيارات، واحد منها صحيح. المطلوب، هو: قراءة النص بعناية، ثم اختيار الإجابة الصحيحة.",
  },
  multiple_choice: {
    title: "أسئلة الاختيار من متعدد",
    description:
      "فيما يلي سؤال يتبعه أربعة اختيارات. المطلوب، هو: اختيار الإجابة الصحيحة.",
  },
  geometry: {
    title: "أسئلة الهندسة",
    description:
      "فيما يلي سؤال في الهندسة يتبعه أربعة اختيارات. المطلوب، هو: اختيار الإجابة الصحيحة.",
  },
  arithmetic: {
    title: "العمليات الحسابية",
    description:
      "فيما يلي سؤال في العمليات الحسابية يتبعه أربعة اختيارات. المطلوب، هو: اختيار الإجابة الصحيحة.",
  },
  algebra: {
    title: "الجبر",
    description:
      "فيما يلي سؤال في الجبر يتبعه أربعة اختيارات. المطلوب، هو: اختيار الإجابة الصحيحة.",
  },
  word_problems: {
    title: "المسائل الحسابية",
    description:
      "فيما يلي مسألة رياضية تتبعها أربعة اختيارات. المطلوب، هو: اختيار الإجابة الصحيحة.",
  },
};

function normalizeSubcategory(raw?: string): string {
  if (!raw) return "multiple_choice";
  const r = raw.toLowerCase().trim();
  if (r.includes("مقارن") || r.includes("comparison")) return "comparison";
  if (r.includes("تناظر") || r.includes("analogy")) return "analogy";
  if (r.includes("سياقي") || r.includes("contextual")) return "contextual_error";
  if (r.includes("إكمال") || r.includes("اكمال") || r.includes("completion")) return "sentence_completion";
  if (r.includes("استيعاب") || r.includes("مقروء") || r.includes("reading")) return "reading_comprehension";
  if (r.includes("هندسة") || r.includes("geometry")) return "geometry";
  if (r.includes("حساب") || r.includes("arithmetic")) return "arithmetic";
  if (r.includes("جبر") || r.includes("algebra")) return "algebra";
  if (r.includes("مسألة") || r.includes("مسائل") || r.includes("word")) return "word_problems";
  return "multiple_choice";
}

export default function SubSectionIntroOverlay({ subcategory, onContinue }: Props) {
  const key = normalizeSubcategory(subcategory);
  const info = subcategoryInfo[key] || subcategoryInfo["multiple_choice"];

  return (
    <div
      dir="rtl"
      className="fixed top-0 left-0 right-0 z-50 font-arabic"
      style={{ animation: "slideDown 0.3s ease-out" }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="bg-white border-b border-[#02a89f]/30 shadow-lg px-4 py-3 flex items-center gap-4">
        <div className="w-8 h-8 bg-[#02a89f]/10 rounded-full flex items-center justify-center shrink-0">
          <div className="w-4 h-4 bg-[#02a89f] rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[#02a89f] font-bold text-sm">{info.title}:&nbsp;</span>
          <span className="text-gray-700 text-sm leading-snug">{info.description}</span>
        </div>

        <button
          onClick={onContinue}
          className="shrink-0 bg-[#02a89f] hover:bg-[#028a82] text-white font-semibold py-1.5 px-5 rounded-lg transition-colors text-sm"
        >
          ابدأ
        </button>
      </div>
    </div>
  );
}

export { normalizeSubcategory };
