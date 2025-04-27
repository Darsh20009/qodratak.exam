import React from "react";
import { TestDifficulty, TestType } from "@shared/types";
import { formatDifficulty } from "@/lib/formatters";

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
        <div
          onClick={() => onStartTest("verbal")}
          className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-blue-400/10 flex items-center justify-center text-primary dark:text-blue-400 text-xl">
              <i className="fas fa-book"></i>
            </div>
            <h5 className="text-lg font-bold">اختبار لفظي</h5>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            اختبر قدراتك اللغوية وفهم النصوص وإدراك العلاقات اللفظية
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

        {/* Quantitative Test Card */}
        <div
          onClick={() => onStartTest("quantitative")}
          className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-blue-400/10 flex items-center justify-center text-primary dark:text-blue-400 text-xl">
              <i className="fas fa-calculator"></i>
            </div>
            <h5 className="text-lg font-bold">اختبار كمي</h5>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            اختبر قدراتك الرياضية والمنطقية وحل المشكلات الكمية
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
      </div>
    </div>
  );
};

export default TestSelection;
