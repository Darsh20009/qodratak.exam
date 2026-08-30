interface Props {
  sectionName: string;
  sectionNumber: number;
  totalSections: number;
  questionCount: number;
  timeLimit: number;
  category: string;
  onStart: () => void;
}

export default function ExamSectionIntro({
  sectionName,
  sectionNumber,
  totalSections,
  questionCount,
  timeLimit,
  category,
  onStart,
}: Props) {
  const categoryLabel =
    category === "verbal"
      ? "قدرات لفظية"
      : category === "quantitative"
      ? "قدرات كمية"
      : "مختلط (لفظي وكمي)";

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-arabic"
    >
      <div className="bg-white border border-gray-200 rounded-lg p-8 w-full max-w-md text-center">
        <div className="text-xs text-gray-400 mb-2">
          {sectionNumber} / {totalSections}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{sectionName}</h2>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between border border-gray-200 rounded p-3 bg-gray-50">
            <span className="text-gray-600 text-sm">نوع القسم</span>
            <span className="font-semibold text-gray-900 text-sm">{categoryLabel}</span>
          </div>
          <div className="flex items-center justify-between border border-gray-200 rounded p-3 bg-gray-50">
            <span className="text-gray-600 text-sm">عدد الأسئلة</span>
            <span className="font-semibold text-gray-900 text-sm">{questionCount} سؤال</span>
          </div>
          <div className="flex items-center justify-between border border-gray-200 rounded p-3 bg-gray-50">
            <span className="text-gray-600 text-sm">الزمن للقسم</span>
            <span className="font-semibold text-gray-900 text-sm">{timeLimit} دقيقة</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          بعد الضغط على "ابدأ" سيبدأ العداد ولن تتمكن من العودة للقسم السابق.
        </p>

        <button
          onClick={onStart}
          className="w-full bg-[#02a89f] hover:bg-[#028a82] text-white font-bold py-3 px-8 rounded transition-colors text-base"
        >
          ابدأ القسم
        </button>
      </div>
    </div>
  );
}
