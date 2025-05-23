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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-gradient-x"></div>
        
        {/* دائرة متحركة */}
        <div className="w-24 h-24 border-4 border-primary rounded-full animate-spin border-t-transparent mb-8"></div>
        
        {/* نص متحرك */}
        <div className="text-center space-y-4 relative z-10">
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 animate-pulse">
            جاري تحميل الأسئلة
          </h3>
          <p className="text-muted-foreground animate-bounce">
            نقوم بتجهيز تجربة تعليمية مميزة لك...
          </p>
        </div>

        {/* زر العودة المحسن */}
        <button
          onClick={onBackToSelection}
          className="mt-8 py-3 px-6 bg-gradient-to-r from-primary to-purple-600 text-white rounded-full 
                   hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/50"
        >
          العودة للقائمة الرئيسية
        </button>

        {/* زخارف متحركة */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
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

          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6 animate-fade-in-down">
            <div className="flex items-center gap-2">
              <span className="text-primary dark:text-blue-400">Q{currentQuestionIndex + 1}.</span>
              {question.text}
            </div>
          </h4>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !isAnswerLocked && onSelectAnswer(index)}
                disabled={isAnswerLocked}
                className={`w-full text-right py-3 px-4 border-2 rounded-lg font-medium transition-colors relative ${
                  selectedAnswerIndex === index && !isAnswerLocked
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : isAnswerLocked && index === question.correctOptionIndex
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : isAnswerLocked && index === selectedAnswerIndex && index !== question.correctOptionIndex
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center">
                  {isAnswerLocked && index === question.correctOptionIndex && (
                    <div className="absolute left-3 text-green-600 dark:text-green-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                  {isAnswerLocked && index === selectedAnswerIndex && index !== question.correctOptionIndex && (
                    <div className="absolute left-3 text-red-600 dark:text-red-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  )}
                  <span className="w-full text-right">{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInProgress;
