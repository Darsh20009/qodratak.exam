import React from "react";
import TestSelection from "./TestSelection";
import TestInProgress from "./TestInProgress";
import TestResults from "./TestResults";
import LevelCompleteModal from "./LevelCompleteModal";

interface AbilitiesTestProps {
  currentView: "selection" | "inProgress" | "results";
  currentTestType: "verbal" | "quantitative" | null;
  currentDifficulty: "beginner" | "intermediate" | "advanced";
  questions: any[];
  currentQuestionIndex: number;
  score: number;
  timeLeft: number;
  showLevelCompleteModal: boolean;
  selectedAnswerIndex: number | null;
  isAnswerLocked: boolean;
  selectLevel: (level: "beginner" | "intermediate" | "advanced") => void;
  startTest: (type: "verbal" | "quantitative") => void;
  selectAnswer: (index: number) => void;
  returnToTestSelection: () => void;
  retryTest: () => void;
  goToNextLevel: () => void;
  hideCompletionModal: () => void;
  calculateProgress: () => number;
  getPerformanceData: () => {
    percentage: number;
    message: string;
    canLevelUp: boolean;
  };
}

const AbilitiesTest: React.FC<AbilitiesTestProps> = (props) => {
  const {
    currentView,
    currentTestType,
    currentDifficulty,
    questions,
    currentQuestionIndex,
    score,
    timeLeft,
    showLevelCompleteModal,
    selectedAnswerIndex,
    isAnswerLocked,
    selectLevel,
    startTest,
    selectAnswer,
    returnToTestSelection,
    retryTest,
    goToNextLevel,
    hideCompletionModal,
    calculateProgress,
    getPerformanceData,
  } = props;

  return (
    <div className="flex-1 overflow-hidden relative">
      {/* Test Selection View */}
      {currentView === "selection" && (
        <TestSelection
          currentDifficulty={currentDifficulty}
          onSelectLevel={selectLevel}
          onStartTest={startTest}
        />
      )}

      {/* Test In Progress View */}
      {currentView === "inProgress" && questions.length > 0 && (
        <TestInProgress
          currentTestType={currentTestType}
          currentDifficulty={currentDifficulty}
          question={questions[currentQuestionIndex]}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          timeLeft={timeLeft}
          progress={calculateProgress()}
          selectedAnswerIndex={selectedAnswerIndex}
          isAnswerLocked={isAnswerLocked}
          onSelectAnswer={selectAnswer}
          onBackToSelection={returnToTestSelection}
        />
      )}

      {/* Test Results View */}
      {currentView === "results" && (
        <TestResults
          score={score}
          totalQuestions={questions.length}
          currentDifficulty={currentDifficulty}
          performanceData={getPerformanceData()}
          onRetryTest={retryTest}
          onNextLevel={goToNextLevel}
        />
      )}

      {/* Level Complete Modal */}
      {showLevelCompleteModal && (
        <LevelCompleteModal
          currentDifficulty={currentDifficulty}
          onContinue={hideCompletionModal}
        />
      )}
    </div>
  );
};

export default AbilitiesTest;
