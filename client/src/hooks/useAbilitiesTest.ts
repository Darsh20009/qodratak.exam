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
  const [isPremium, setIsPremium] = useState(false);
  const [examSections, setExamSections] = useState<any[]>([]);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [accumulateResults, setAccumulateResults] = useState<boolean>(false);
  const toast = (options: any) => {
    console.log(options.description);
  }

  // Fetch questions for the current test
  const fetchQuestions = useCallback(async (type: TestType, difficulty: TestDifficulty, isQiyasExam: boolean = false) => {
    try {
      const response = await fetch(`/api/questions?category=${type}&difficulty=${difficulty}`);
      if (response.ok) {
        const allQuestions = await response.json();

        if (isQiyasExam) {
          // For Qiyas exams, group by section and select randomly
          const questionsBySection = allQuestions.reduce((acc: any, q: any) => {
            const section = q.section || 1;
            if (!acc[section]) acc[section] = [];
            acc[section].push(q);
            return acc;
          }, {});

          // Select random questions from each section to match section requirements
          const selectedQuestions = [];
          const sections = Object.keys(questionsBySection);

          sections.forEach(section => {
            const sectionQuestions = questionsBySection[section];
            // Shuffle section questions
            const shuffled = [...sectionQuestions].sort(() => 0.5 - Math.random());
            // Take required number of questions for this section
            const questionsNeeded = section === "verbal" ? 13 : 11; // Based on Qiyas format
            selectedQuestions.push(...shuffled.slice(0, questionsNeeded));
          });

          setQuestions(selectedQuestions);
        } else {
          // For regular tests, just shuffle and take 10
          const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
          setQuestions(shuffled.slice(0, 10));
        }
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
  const startTest = useCallback(async (type: TestType) => {
    try {
      setCurrentTestType(type);

      if (type === 'qualification') {
        if (!isPremium) {
          toast({
            title: "اشتراك مطلوب",
            description: "هذا الاختبار متاح للمشتركين فقط",
            variant: "destructive",
          });
          return;
        }

        const sections = [
          { category: 'mixed', questionCount: 24, timeLimit: 24, verbalCount: 13, quantitativeCount: 11 },
          { category: 'mixed', questionCount: 24, timeLimit: 24, verbalCount: 13, quantitativeCount: 11 },
          { category: 'mixed', questionCount: 24, timeLimit: 24, verbalCount: 13, quantitativeCount: 11 },
          { category: 'quantitative', questionCount: 11, timeLimit: 11 },
          { category: 'verbal', questionCount: 13, timeLimit: 13 },
          { category: 'quantitative', questionCount: 11, timeLimit: 11 },
          { category: 'verbal', questionCount: 13, timeLimit: 13 }
        ];

        setExamSections(sections);
        setCurrentSection(0);
        setAccumulateResults(true);
      }

      setCurrentView("inProgress");

      // Fetch questions based on type and difficulty
      const response = await fetch(`/api/questions?category=${type}&difficulty=${currentDifficulty}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allQuestions = await response.json();

      // Handle question selection based on test type
      if (type === 'qualification') {
        // Initialize an array to hold selected questions for all sections
        const selectedQuestions = [];

        // Loop through each section configuration
        for (const sectionConfig of examSections) {
          const { category, questionCount } = sectionConfig;

          // Filter questions based on the section's category
          let sectionQuestions = allQuestions.filter((q: any) => q.category === category);

          // If there are not enough questions for the section, handle the error
          if (sectionQuestions.length < questionCount) {
            console.warn(`Not enough questions for category ${category}. Using available questions.`);
            questionCount = sectionQuestions.length; // Adjust questionCount to available questions
          }

          // Shuffle questions and select the required number
          sectionQuestions = [...sectionQuestions].sort(() => 0.5 - Math.random()).slice(0, questionCount);
          selectedQuestions.push(...sectionQuestions); // Add selected questions to the main array
        }

        // Set the selected questions to state
        setQuestions(selectedQuestions);
      } else {
        // For regular tests, just shuffle and take 10
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        setQuestions(shuffled.slice(0, 10));
      }
    } catch (error) {
      console.error("Error fetching or processing questions:", error);
      // Handle error appropriately, e.g., show an error message to the user
    } finally {
      // Common actions after the try-catch block, if needed
    }

    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerIndex(null);
    setIsAnswerLocked(false);

    setTimeLeft(30);
    setTimerActive(true);
  }, [currentDifficulty, fetchQuestions, examSections, isPremium]);

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