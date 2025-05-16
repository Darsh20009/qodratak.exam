import React from "react";
import { TestDifficulty, TestType } from "@shared/types";
import { formatDifficulty } from "@/lib/formatters";
import { BookOpen, Calculator, GraduationCap } from "lucide-react";

interface TestSelectionProps {
  currentDifficulty: TestDifficulty;
  onSelectLevel: (level: TestDifficulty) => void;
  onStartTest: (type: TestType) => void;
}

const TestSelection: React.FC<TestSelectionProps> = ({
  currentDifficulty,
  onSelectLevel,
  onStartTest,
}) => {
  const examTypes = [
    {
      title: "الاختبار التأهيلي الشامل",
      description: "اختبار تأهيلي يتكون من 7 أقسام",
      type: "qualification" as const,
      icon: GraduationCap,
      requiresSubscription: true,
    },
    {
      title: "اختبار قدرات لفظي",
      description: "اختبر قدراتك في الجزء اللفظي",
      type: "verbal" as const,
      icon: BookOpen,
    },
    {
      title: "اختبار قدرات كمي",
      description: "اختبر قدراتك في الجزء الكمي",
      type: "quantitative" as const,
      icon: Calculator,
    },
  ];
  return (
    <div className="p-6 overflow-y-auto custom-scrollbar h-full">
      <h3 className="text-xl font-bold text-primary dark:text-blue-400 mb-6">
        اختبار قدراتك
      </h3>

      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
          اختر مستواك
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(["beginner", "intermediate", "advanced"] as TestDifficulty[]).map(
            (level) => (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className={`py-2 px-4 border-2 rounded-lg font-semibold transition-colors ${
                  currentDifficulty === level
                    ? "border-primary/30 dark:border-blue-400/30 text-primary dark:text-blue-400 hover:bg-primary/5 dark:hover:bg-blue-400/5"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {formatDifficulty(level)}
              </button>
            )
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
          اختر نوع الاختبار
        </h4>

        {/* Verbal Test Card */}
        {examTypes.map((exam) => (
          <div
            onClick={() => onStartTest(exam.type)}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-blue-400/10 flex items-center justify-center text-primary dark:text-blue-400 text-xl">
                <exam.icon className="h-6 w-6" />
              </div>
              <h5 className="text-lg font-bold">{exam.title}</h5>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              {exam.description}
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                10 أسئلة
              </span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-primary dark:bg-blue-400"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestSelection;