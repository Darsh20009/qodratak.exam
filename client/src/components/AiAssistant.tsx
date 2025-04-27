import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  BrainCircuitIcon, 
  Loader2, 
  MessageSquare, 
  SendIcon,
  RefreshCcw,
  BadgeHelp,
  BookOpenCheck,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TestQuestion } from "@shared/types";
import { cn } from "@/lib/utils";
import { smartSearch, findRelatedQuestions } from "@/lib/smartSearch";

interface AiAssistantProps {
  questions: TestQuestion[];
  userLevel?: number;
  onQuestionSelect?: (question: TestQuestion) => void;
  className?: string;
}

type MessageType = {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  relatedQuestions?: TestQuestion[];
};

// Predefined responses for common questions
const PREDEFINED_RESPONSES: Record<string, string> = {
  "مرحبا": "مرحباً بك! كيف يمكنني مساعدتك اليوم؟",
  "كيف حالك": "أنا بخير، شكراً للسؤال! كيف يمكنني مساعدتك؟",
  "ما هو هذا التطبيق": "هذا هو تطبيق قدراتي - منصة تعليمية تساعدك على التحضير لاختبارات القدرات العامة من خلال أكثر من 10,000 سؤال وتمارين تفاعلية ونصائح مخصصة.",
  "كيف استخدم التطبيق": "يمكنك استخدام التطبيق للبحث عن أسئلة، وممارسة اختبارات القدرات التفاعلية، والتحضير لاختبار قياس الرسمي. استكشف الأقسام المختلفة من القائمة الجانبية.",
  "ما هو اختبار قياس": "اختبار قياس (الاختبار العام) هو اختبار وطني تقدمه هيئة تقويم التعليم والتدريب في المملكة العربية السعودية، ويقيس القدرات التحليلية والاستدلالية لدى الطلاب في مجالي اللغة والرياضيات.",
  "كيف اذاكر لاختبار القدرات": "لتحضير فعال لاختبار القدرات، أنصحك بالآتي: 1) حل الكثير من الأسئلة التدريبية 2) التركيز على فهم المفاهيم بدلاً من الحفظ 3) تعلم استراتيجيات حل الأسئلة 4) إدارة وقتك بشكل صحيح 5) استخدم قسم 'اختبر قدراتك' في تطبيقنا للممارسة المنتظمة.",
  "ما هي أقسام الاختبار": "ينقسم اختبار القدرات العامة إلى قسمين رئيسيين: القسم اللفظي (يقيس القدرة اللغوية) والقسم الكمي (يقيس القدرة الرياضية والمنطقية).",
  "كم مدة الاختبار": "مدة اختبار القدرات حوالي ساعتين (120 دقيقة) موزعة على سبعة أقسام."
};

// Create regex patterns from the predefined responses
const RESPONSE_PATTERNS = Object.keys(PREDEFINED_RESPONSES).map(key => {
  const pattern = key
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape special characters
    .replace(/\s+/g, '\\s+');  // Make whitespace flexible
  return { pattern: new RegExp(`^\\s*${pattern}\\s*$`, 'i'), response: PREDEFINED_RESPONSES[key] };
});

const AiAssistant: React.FC<AiAssistantProps> = ({ 
  questions, 
  userLevel = 1,
  onQuestionSelect,
  className 
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    const welcomeMessage: MessageType = {
      id: "welcome",
      text: "مرحبًا بك في مساعد قدراتي! أنا هنا لمساعدتك في العثور على أسئلة مشابهة والإجابة على استفساراتك. كيف يمكنني مساعدتك اليوم؟",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    try {
      // Check for predefined responses
      let response = checkPredefinedResponses(input);

      // No predefined response, try to search for related questions
      if (!response) {
        // Search for similar questions
        const searchResults = smartSearch(input, questions, { threshold: 0.35, maxResults: 5 });

        if (searchResults.length > 0) {
          const relatedQuestionsText = searchResults.map((result, index) => 
            `${index + 1}. ${result.question.text}`
          ).join('\n');

          response = `وجدت بعض الأسئلة التي قد تكون مفيدة:\n\n${relatedQuestionsText}\n\nهل ترغب في مزيد من المعلومات حول أي من هذه الأسئلة؟`;

          // Add related questions to the message
          const relatedQuestions = searchResults.map(result => result.question);
          
          const assistantMessage: MessageType = {
            id: Date.now().toString(),
            text: response,
            sender: "assistant",
            timestamp: new Date(),
            relatedQuestions
          };

          setMessages(prev => [...prev, assistantMessage]);
          setIsProcessing(false);
          return;
        }

        // If no related questions found, give a generic response
        response = generateGenericResponse(input);
      }

      // Send assistant response
      const assistantMessage: MessageType = {
        id: Date.now().toString(),
        text: response,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in AI response:', error);
      
      // Error message
      const errorMessage: MessageType = {
        id: Date.now().toString(),
        text: "عذرًا، حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        sender: "assistant",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for predefined responses
  const checkPredefinedResponses = (userInput: string): string | null => {
    for (const { pattern, response } of RESPONSE_PATTERNS) {
      if (pattern.test(userInput)) {
        return response;
      }
    }
    return null;
  };

  // Generate a generic response for inputs without matches
  const generateGenericResponse = (userInput: string): string => {
    // Detect question patterns
    if (/كيف|ماذا|لماذا|متى|أين|من|هل/.test(userInput)) {
      return "شكرًا على سؤالك. يمكنك العثور على إجابات لأسئلة مشابهة في قسم المكتبة، أو يمكنك تجربة البحث بكلمات مختلفة للحصول على نتائج أفضل.";
    }

    // Detect if input seems like a math problem
    if (/\d+|\+|\-|\*|\/|=/.test(userInput)) {
      return "يبدو أنك تسأل عن مسألة رياضية. يمكنك تجربة قسم القدرات الكمية للتدرب على مسائل مشابهة.";
    }

    // Default fallback
    return "شكرًا لرسالتك. يمكنك استخدام قسم البحث في المكتبة للعثور على أسئلة محددة، أو استخدام قسم 'اختبر قدراتك' لممارسة الأسئلة بشكل تفاعلي.";
  };

  // Handle pressing Enter to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleSend();
    }
  };

  // Handle selecting a related question
  const handleQuestionClick = (question: TestQuestion) => {
    if (onQuestionSelect) {
      onQuestionSelect(question);
      toast({
        title: "تم اختيار السؤال",
        description: "تم فتح السؤال في المكتبة",
      });
    } else {
      // Show the question details in the chat
      const details = `
السؤال: ${question.text}

الخيارات:
${question.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}

الإجابة الصحيحة: ${question.options[question.correctOptionIndex]}

${question.explanation ? `الشرح: ${question.explanation}` : ''}
      `;

      const detailsMessage: MessageType = {
        id: Date.now().toString(),
        text: details,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, detailsMessage]);
    }
  };

  // Copy message text to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast({
          title: "فشل في النسخ",
          description: "حدث خطأ أثناء محاولة نسخ النص",
          variant: "destructive",
        });
      });
  };

  // Clear all messages
  const clearMessages = () => {
    const welcomeMessage: MessageType = {
      id: "welcome",
      text: "تم مسح المحادثة. كيف يمكنني مساعدتك اليوم؟",
      sender: "assistant",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className={cn("flex flex-col h-full rounded-lg border bg-card shadow", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <BrainCircuitIcon className="h-5 w-5 text-primary" />
          <h3 className="font-medium">مساعد قدراتي</h3>
        </div>
        <div>
          <Button variant="ghost" size="icon" onClick={clearMessages} title="مسح المحادثة">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col max-w-[85%] rounded-lg p-3 relative group",
              message.sender === "user"
                ? "bg-primary text-primary-foreground mr-auto"
                : "bg-muted ml-auto"
            )}
          >
            <div className="whitespace-pre-wrap text-sm">{message.text}</div>
            
            {/* Related questions */}
            {message.relatedQuestions && message.relatedQuestions.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <Separator />
                <div className="text-xs font-medium flex items-center gap-1 mt-1">
                  <BadgeHelp className="h-3 w-3" />
                  <span>اضغط على سؤال لعرض التفاصيل:</span>
                </div>
                <div className="space-y-1.5">
                  {message.relatedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      onClick={() => handleQuestionClick(question)}
                      className={cn(
                        "text-xs p-2 rounded cursor-pointer flex items-start gap-1.5",
                        message.sender === "user"
                          ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                          : "bg-background hover:bg-accent"
                      )}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <BookOpenCheck className="h-3 w-3" />
                      </div>
                      <div>{question.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Message actions */}
            <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyToClipboard(message.text, message.id)}
              >
                {copied === message.id ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            
            {/* Timestamp */}
            <div className="text-xs opacity-50 mt-1 text-right">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-center">
            <div className="bg-muted px-4 py-2 rounded-lg flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              <span className="text-sm">جاري التفكير...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <Input
            placeholder="اكتب سؤالك هنا..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={isProcessing || !input.trim()}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground text-center">
          مساعد محلي يستخدم نظام البحث الذكي - لا تتم مشاركة البيانات
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;