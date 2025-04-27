import { useState, useCallback, useEffect } from "react";
import { ChatMessage, QuestionItem, SuggestedQuestion } from "@shared/types";
import { findSimilarQuestions } from "@/lib/fuzzySearch";
import { apiRequest } from "@/lib/queryClient";

export function useChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [userName, setUserName] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [nameError, setNameError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestedQuestion[]>([]);
  const [allQuestions, setAllQuestions] = useState<QuestionItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Fetch all questions when component mounts
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await fetch('/api/questions');
        if (response.ok) {
          const data = await response.json();
          setAllQuestions(data);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    }

    fetchQuestions();
  }, []);

  // Toggle chatbot visibility
  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Close chatbot
  const closeChatbot = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
    // Apply dark mode to document
    document.documentElement.classList.toggle('dark');
  }, []);

  // Toggle expanded view
  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Handle user name submission
  const handleStartChat = useCallback(async () => {
    if (userName.trim().length < 2) {
      setNameError('الرجاء إدخال اسم صحيح');
      return;
    }

    setNameError('');
    setIsNameEntered(true);

    try {
      const response = await apiRequest('POST', '/api/users', { username: userName });
      const userData = await response.json();
      setCurrentUserId(userData.id);
    } catch (error) {
      console.error('Error creating user:', error);
    }

    // Add welcome message
    setMessages([
      {
        text: `مرحباً بك ${userName}! كيف يمكنني مساعدتك اليوم؟`,
        sender: 'assistant'
      }
    ]);
  }, [userName]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      text: inputMessage,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setSuggestedQuestions([]);
    
    // Clear input
    setInputMessage('');

    try {
      // Search for similar questions
      const response = await fetch(`/api/questions/search?query=${encodeURIComponent(inputMessage)}`);
      
      if (response.ok) {
        const questionsData = await response.json();
        
        if (questionsData && questionsData.length > 0) {
          // Direct match found
          const matchedQuestion = questionsData[0];
          
          // Respond with the matched question's answer
          const answerMessage: ChatMessage = {
            text: matchedQuestion.options[matchedQuestion.correctOptionIndex],
            sender: 'assistant'
          };
          
          setMessages(prev => [...prev, answerMessage]);
        } else {
          // No direct match, find similar questions
          const similarQuestions = findSimilarQuestions(inputMessage, allQuestions);
          
          if (similarQuestions.length > 0) {
            setSuggestedQuestions(similarQuestions);
            
            // Send a message suggesting alternatives
            const suggestMessage: ChatMessage = {
              text: 'آسف، لم أفهم سؤالك بشكل كامل. هل تقصد أحد الأسئلة التالية؟',
              sender: 'assistant'
            };
            
            setMessages(prev => [...prev, suggestMessage]);
          } else {
            // No similar questions found
            const fallbackMessage: ChatMessage = {
              text: 'عذراً، لا أملك إجابة على هذا السؤال. يمكنك تجربة سؤال آخر أو الانتقال إلى قسم اختبار القدرات.',
              sender: 'assistant'
            };
            
            setMessages(prev => [...prev, fallbackMessage]);
          }
        }
      } else {
        throw new Error('Failed to search questions');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Error message
      const errorMessage: ChatMessage = {
        text: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى.',
        sender: 'assistant'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, allQuestions]);

  // Handle selection of a suggested question
  const handleSuggestedQuestionClick = useCallback((question: string) => {
    setInputMessage(question);
    // Auto send the suggested question
    const userMessage: ChatMessage = {
      text: question,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setSuggestedQuestions([]);
    
    // Find the answer to this question
    const matchedQuestion = allQuestions.find(q => q.text === question);
    
    if (matchedQuestion) {
      const answerMessage: ChatMessage = {
        text: matchedQuestion.options[matchedQuestion.correctOptionIndex],
        sender: 'assistant'
      };
      
      setMessages(prev => [...prev, answerMessage]);
    } else {
      // Fallback if question not found
      const fallbackMessage: ChatMessage = {
        text: 'عذراً، لا أملك إجابة محددة على هذا السؤال.',
        sender: 'assistant'
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    }
  }, [allQuestions]);

  return {
    isOpen,
    isDarkMode,
    isExpanded,
    userName,
    isNameEntered,
    nameError,
    messages,
    inputMessage,
    isLoading,
    suggestedQuestions,
    currentUserId,
    toggleChatbot,
    closeChatbot,
    toggleDarkMode,
    toggleExpand,
    setUserName,
    handleStartChat,
    setInputMessage,
    handleSendMessage,
    handleSuggestedQuestionClick
  };
}
