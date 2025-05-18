import React from "react";
import { TestDifficulty } from "@shared/types";
import { formatDifficulty } from "@/lib/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TestResultsProps {
  score: number;
  totalQuestions: number;
  currentDifficulty: TestDifficulty;
  performanceData: {
    percentage: number;
    message: string;
    canLevelUp: boolean;
  };
  onRetryTest: () => void;
  onNextLevel: () => void;
    questions: any[]; // Replace 'any' with the actual type of your questions
    answers: { [questionId: string]: number }; // Replace 'number' with the actual type of your answer index
}

const TestResults: React.FC<TestResultsProps> = ({
  score,
  totalQuestions,
  currentDifficulty,
  performanceData,
  onRetryTest,
  onNextLevel,
    questions,
    answers,
}) => {
  const { percentage, message, canLevelUp } = performanceData;

  return (
    <div className="p-6 overflow-y-auto custom-scrollbar">
      <div className="text-center mb-8">
        <div className="inline-block p-4 mb-4 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 dark:from-blue-400/20 dark:to-purple-400/20 animate-bounce-slow">
          <div className="relative">
            <i className="fas fa-trophy text-4xl text-primary dark:text-blue-400 animate-spin-slow"></i>
            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-white text-sm animate-ping-slow">
              <i className="fas fa-star"></i>
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          اكتملت الاختبار!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          لقد أجبت على{" "}
          <span className="font-bold text-primary dark:text-blue-400">
            {score}
          </span>{" "}
          من أصل <span>{totalQuestions}</span> أسئلة بشكل صحيح.
        </p>
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm mb-6">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
          نتيجتك
        </h4>
        <div className="h-6 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary text-xs text-white text-center leading-6"
            style={{ width: `${percentage}%` }}
          >
            {percentage}%
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Level Badge */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm mb-6 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
            مستوى الأداء
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {message}
          </p>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center text-xl mb-1">
            <i className="fas fa-star"></i>
          </div>
          <span className="text-sm font-semibold text-primary dark:text-blue-400">
            {formatDifficulty(currentDifficulty)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onRetryTest}
          className="py-3 px-4 bg-white dark:bg-gray-800 text-primary dark:text-blue-400 border border-primary dark:border-blue-400 rounded-lg font-semibold hover:bg-primary/5 dark:hover:bg-blue-400/5 transition-colors"
        >
          إعادة الاختبار
        </button>
        <button
          onClick={onNextLevel}
          className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
            canLevelUp
              ? "bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
              : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
          }`}
          disabled={!canLevelUp}
        >
          {canLevelUp ? "المستوى التالي" : "تحسين النتيجة أولاً"}
        </button>
      </div>

      {/* Questions Review */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>مراجعة الأسئلة والإجابات</CardTitle>
          <CardDescription>
            راجع إجاباتك وتعلم من أخطائك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">السؤال {index + 1}</span>
                  {answers[question.id] === question.correctOptionIndex ? (
                    <Badge variant="success">إجابة صحيحة</Badge>
                  ) : (
                    <Badge variant="destructive">إجابة خاطئة</Badge>
                  )}
                </div>
                <p className="mb-4">{question.text}</p>
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={cn(
                        "p-3 rounded-lg",
                        optIndex === question.correctOptionIndex && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                        answers[question.id] === optIndex && optIndex !== question.correctOptionIndex && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                        "border"
                      )}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{option}</span>
                        {optIndex === question.correctOptionIndex && (
                          <span className="text-green-600 dark:text-green-400 text-sm mr-auto">
                            (الإجابة الصحيحة)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {question.explanation && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h5 className="font-medium mb-1 text-blue-800 dark:text-blue-200">الشرح:</h5>
                    <p className="text-sm">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default TestResults;