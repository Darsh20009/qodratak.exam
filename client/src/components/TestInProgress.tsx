import React from "react";
import { TestType, TestDifficulty, TestQuestion } from "@shared/types";
import { formatTestType, formatDifficulty } from "@/lib/formatters";

interface TestInProgressProps {
  currentTestType: TestType | null;
  currentDifficulty: TestDifficulty;
  question: TestQuestion;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  progress: number;
  selectedAnswerIndex: number | null;
  isAnswerLocked: boolean;
  onSelectAnswer: (index: number) => void;
  onBackToSelection: () => void;
}

const TestInProgress: React.FC<TestInProgressProps> = ({
  currentTestType,
  currentDifficulty,
  question,
  currentQuestionIndex,
  totalQuestions,
  timeLeft,
  progress,
  selectedAnswerIndex,
  isAnswerLocked,
  onSelectAnswer,
  onBackToSelection,
}) => {
  if (!question || !currentTestType) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          جاري تحميل الأسئلة...
        </p>
        <button
          onClick={onBackToSelection}
          className="mt-4 py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300"
        >
          العودة
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 dark:border-gray-800 py-3 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToSelection}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
            اختبار {formatTestType(currentTestType)} - مستوى{" "}
            {formatDifficulty(currentDifficulty)}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span>{currentQuestionIndex + 1}</span>/<span>{totalQuestions}</span>
          </div>
          <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
          <div className="mb-4 text-center">
            <span
              className={`inline-block py-1 px-4 rounded-full text-sm font-semibold ${
                timeLeft <= 10
                  ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  : "bg-primary/10 dark:bg-blue-400/10 text-primary dark:text-blue-400"
              }`}
            >
              <i className="fas fa-clock ml-1"></i>
              <span>{timeLeft}</span> ثانية
            </span>
          </div>

          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
            {question.text}
          </h4>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isAnswerLocked && onSelectAnswer(index)}
                disabled={isAnswerLocked}
                className={`w-full text-right py-3 px-4 border-2 rounded-lg font-medium transition-colors ${
                  isAnswerLocked && index === question.correctOptionIndex
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : isAnswerLocked && index === selectedAnswerIndex
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInProgress;
