import { useState, useCallback, useEffect } from "react";
import { TestType, TestDifficulty, TestQuestion } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";
import { 
  formatScorePercentage, 
  getPerformanceMessage, 
  getNextDifficulty 
} from "@/lib/formatters";

export function useAbilitiesTest(userId: number | null) {
  const [currentTab, setCurrentTab] = useState<'chat' | 'abilities'>('chat');
  const [currentView, setCurrentView] = useState<'selection' | 'inProgress' | 'results'>('selection');
  const [currentTestType, setCurrentTestType] = useState<TestType | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<TestDifficulty>('beginner');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  
  // Fetch questions for the current test
  const fetchQuestions = useCallback(async (type: TestType, difficulty: TestDifficulty) => {
    try {
      // Fetch all questions for this type and difficulty
      const response = await fetch(`/api/questions?category=${type}&difficulty=${difficulty}`);
      if (response.ok) {
        const allQuestions = await response.json();
        
        // Group questions by section
        const questionsBySection = allQuestions.reduce((acc: any, q: any) => {
          const section = q.section || 1;
          if (!acc[section]) acc[section] = [];
          acc[section].push(q);
          return acc;
        }, {});
        
        // Select one random question from each section until we have 10
        const selectedQuestions = [];
        const sections = Object.keys(questionsBySection);
        
        while (selectedQuestions.length < 10 && sections.length > 0) {
          // Get random section
          const randomSectionIndex = Math.floor(Math.random() * sections.length);
          const sectionQuestions = questionsBySection[sections[randomSectionIndex]];
          
          // Get random question from section
          if (sectionQuestions.length > 0) {
            const randomIndex = Math.floor(Math.random() * sectionQuestions.length);
            selectedQuestions.push(sectionQuestions[randomIndex]);
            // Remove used question
            sectionQuestions.splice(randomIndex, 1);
          }
          
          // If section is empty, remove it
          if (sectionQuestions.length === 0) {
            sections.splice(randomSectionIndex, 1);
          }
          
          // If we've used all sections but need more questions, reset sections
          if (sections.length === 0 && selectedQuestions.length < 10) {
            sections.push(...Object.keys(questionsBySection));
          }
        }
        
        setQuestions(selectedQuestions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    }
  }, []);

  // Switch between tabs
  const switchTab = useCallback((tab: 'chat' | 'abilities') => {
    setCurrentTab(tab);
  }, []);

  // Select difficulty level
  const selectLevel = useCallback((level: TestDifficulty) => {
    setCurrentDifficulty(level);
  }, []);

  // Start a new test
  const startTest = useCallback((type: TestType) => {
    setCurrentTestType(type);
    setCurrentView('inProgress');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerIndex(null);
    setIsAnswerLocked(false);
    
    fetchQuestions(type, currentDifficulty);
    setTimeLeft(30);
    setTimerActive(true);
  }, [currentDifficulty, fetchQuestions]);

  // Handle answer selection
  const selectAnswer = useCallback((optionIndex: number) => {
    if (isAnswerLocked) return;
    
    setSelectedAnswerIndex(optionIndex);
    setIsAnswerLocked(true);
    setTimerActive(false);
    
    const currentQuestion = questions[currentQuestionIndex];
    
    // Check if answer is correct
    if (currentQuestion && optionIndex === currentQuestion.correctOptionIndex) {
      setScore(prev => prev + 1);
    }
    
    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswerIndex(null);
        setIsAnswerLocked(false);
        setTimeLeft(30);
        setTimerActive(true);
      } else {
        // End of test
        endTest();
      }
    }, 1500);
  }, [currentQuestionIndex, isAnswerLocked, questions]);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      // Time's up, force selection of wrong answer
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion) {
        // Select a wrong answer (or the first option if none is available)
        const wrongOptionIndex = currentQuestion.correctOptionIndex === 0 ? 1 : 0;
        selectAnswer(wrongOptionIndex);
      }
    }
    
    return () => clearTimeout(timer);
  }, [timerActive, timeLeft, questions, currentQuestionIndex, selectAnswer]);

  // End current test and show results
  const endTest = useCallback(async () => {
    setCurrentView('results');
    setTimerActive(false);
    
    // Save test results to server if userId exists
    if (userId !== null && currentTestType) {
      try {
        await apiRequest('POST', '/api/test-results', {
          userId,
          testType: currentTestType,
          difficulty: currentDifficulty,
          score,
          totalQuestions: questions.length,
          completedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error saving test results:", error);
      }
    }
  }, [userId, currentTestType, currentDifficulty, score, questions.length]);

  // Return to test selection screen
  const returnToTestSelection = useCallback(() => {
    setCurrentView('selection');
    setTimerActive(false);
  }, []);

  // Retry current test
  const retryTest = useCallback(() => {
    if (currentTestType) {
      startTest(currentTestType);
    }
  }, [currentTestType, startTest]);

  // Go to next level
  const goToNextLevel = useCallback(() => {
    const scorePercentage = formatScorePercentage(score, questions.length);
    
    // Only allow level up if score is 70% or better
    if (scorePercentage >= 70 && currentDifficulty !== "advanced") {
      setShowLevelCompleteModal(true);
      
      const nextLevel = getNextDifficulty(currentDifficulty);
      setCurrentDifficulty(nextLevel);
    } else {
      // Not enough score to level up, just retry
      retryTest();
    }
  }, [score, questions.length, currentDifficulty, retryTest]);

  // Hide level complete modal
  const hideCompletionModal = useCallback(() => {
    setShowLevelCompleteModal(false);
    returnToTestSelection();
  }, [returnToTestSelection]);

  // Calculate percentage for progress bar
  const calculateProgress = useCallback(() => {
    if (questions.length === 0) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  }, [currentQuestionIndex, questions.length]);

  // Get performance data for results view
  const getPerformanceData = useCallback(() => {
    const percentage = formatScorePercentage(score, questions.length);
    const message = getPerformanceMessage(percentage, currentDifficulty);
    const canLevelUp = percentage >= 70 && currentDifficulty !== "advanced";
    
    return { percentage, message, canLevelUp };
  }, [score, questions.length, currentDifficulty]);

  return {
    currentTab,
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
    switchTab,
    selectLevel,
    startTest,
    selectAnswer,
    returnToTestSelection,
    retryTest,
    goToNextLevel,
    hideCompletionModal,
    calculateProgress,
    getPerformanceData
  };
}
