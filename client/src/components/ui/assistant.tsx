import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MessageCircleIcon,
  SendIcon,
  ChevronRightIcon,
  XIcon,
  BookIcon,
  BrainCircuitIcon,
  GraduationCapIcon,
  FolderIcon,
  HelpCircleIcon
} from "lucide-react";
import { useLocation } from "wouter";

interface AssistantProps {
  className?: string;
}

interface ChatMessage {
  type: "user" | "assistant";
  content: string;
  options?: ChatOption[];
}

interface ChatOption {
  label: string;
  action: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

const Assistant = ({ className }: AssistantProps) => {
  const [, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: "assistant",
      content: "مرحبا! أنا مساعدك في استخدام المنصة. كيف يمكنني مساعدتك اليوم؟",
      options: [
        {
          label: "طرق التواصل معنا",
          action: () => handleSelectOption("كيف يمكنني التواصل معكم؟"),
          icon: MessageCircleIcon
        },
        {
          label: "ما هي اختبارات قياس؟",
          action: () => handleSelectOption("ما هي اختبارات قياس؟"),
          icon: GraduationCapIcon
        },
        {
          label: "كيف أختبر قدراتي؟",
          action: () => handleSelectOption("كيف أختبر قدراتي؟"),
          icon: BrainCircuitIcon
        },
        {
          label: "كيف أستخدم المكتبة؟",
          action: () => handleSelectOption("كيف أستخدم المكتبة؟"),
          icon: BookIcon
        }
      ]
    }
  ]);
  
  const [userInput, setUserInput] = useState("");
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Add user message
    setMessages([...messages, { type: "user", content: userInput }]);
    
    // Process response
    setTimeout(() => {
      respondToUserQuery(userInput);
      setUserInput("");
    }, 500);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };
  
  const handleSelectOption = (optionText: string) => {
    // Add the selected option as a user message
    setMessages([...messages, { type: "user", content: optionText }]);
    
    // Process response
    setTimeout(() => {
      respondToUserQuery(optionText);
    }, 500);
  };
  
  const respondToUserQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("قياس") || lowerQuery.includes("اختبار")) {
      setMessages(msgs => [...msgs, {
        type: "assistant",
        content: "اختبارات قياس هي محاكاة لاختبار القدرات العامة الذي تقدمه هيئة تقويم التعليم والتدريب. يتكون الاختبار من 7 أقسام مختلفة تغطي المهارات اللفظية والكمية، ويستغرق الاختبار حوالي 120 دقيقة لإكماله.",
        options: [
          {
            label: "انتقل إلى اختبارات قياس",
            action: () => setLocation("/qiyas"),
            icon: GraduationCapIcon
          },
          {
            label: "إنشاء اختبار مخصص",
            action: () => setLocation("/custom-exam"),
            icon: FolderIcon
          }
        ]
      }]);
    }
    else if (lowerQuery.includes("قدرات") || lowerQuery.includes("اختبر")) {
      setMessages(msgs => [...msgs, {
        type: "assistant",
        content: "يمكنك اختبار قدراتك من خلال تمارين مصممة خصيصًا لقياس مهاراتك اللفظية والكمية. ستحصل على نقاط عند إكمال الاختبارات بنجاح، وستتمكن من فتح مستويات أعلى كلما تقدمت.",
        options: [
          {
            label: "انتقل إلى اختبار القدرات",
            action: () => setLocation("/abilities"),
            icon: BrainCircuitIcon
          }
        ]
      }]);
    }
    else if (lowerQuery.includes("مكتبة") || lowerQuery.includes("مجلد") || lowerQuery.includes("أسئلة")) {
      setMessages(msgs => [...msgs, {
        type: "assistant",
        content: "المكتبة تحتوي على آلاف الأسئلة المصنفة حسب النوع والمستوى والموضوع. يمكنك حفظ الأسئلة في مجلدات خاصة للمراجعة لاحقًا، وإنشاء اختبارات مخصصة من الأسئلة المحفوظة.",
        options: [
          {
            label: "استعرض المكتبة",
            action: () => setLocation("/library"),
            icon: BookIcon
          },
          {
            label: "اسأل سؤالًا",
            action: () => setLocation("/ask"),
            icon: HelpCircleIcon
          }
        ]
      }]);
    }
    else if (lowerQuery.includes("تواصل") || lowerQuery.includes("اتصال") || lowerQuery.includes("تليجرام") || lowerQuery.includes("الموقع")) {
      setMessages(msgs => [...msgs, {
        type: "assistant",
        content: "يمكنك التواصل معنا من خلال:",
        options: [
          {
            label: "تليجرام - Qodratak",
            action: () => window.open("https://t.me/qodratak2030", "_blank"),
            icon: MessageCircleIcon
          },
          {
            label: "نموذج التواصل عبر الموقع",
            action: () => window.open("https://www.qodratak.space/contactus", "_blank"),
            icon: HelpCircleIcon
          }
        ]
      }]);
    }
    else if (lowerQuery.includes("مساعدة") || lowerQuery.includes("مساعد")) {
      setMessages(msgs => [...msgs, {
        type: "assistant",
        content: "أنا المساعد الآلي وسأساعدك في استخدام منصة قدراتي. يمكنني الإجابة عن أسئلتك حول كيفية استخدام المنصة، ومساعدتك في العثور على الاختبارات والموارد المناسبة.",
        options: [
          {
            label: "خيارات رئيسية",
            action: () => {
              setMessages(msgs => [...msgs, {
                type: "assistant",
                content: "ما الذي تود معرفته عن المنصة؟",
                options: [
                  {
                    label: "ما هي اختبارات قياس؟",
                    action: () => handleSelectOption("ما هي اختبارات قياس؟"),
                    icon: GraduationCapIcon
                  },
                  {
                    label: "كيف أختبر قدراتي؟",
                    action: () => handleSelectOption("كيف أختبر قدراتي؟"),
                    icon: BrainCircuitIcon
                  },
                  {
                    label: "كيف أستخدم المكتبة؟",
                    action: () => handleSelectOption("كيف أستخدم المكتبة؟"),
                    icon: BookIcon
                  }
                ]
              }]);
            },
            icon: HelpCircleIcon
          }
        ]
      }]);
    }
    else {
      setMessages(msgs => [...msgs, {
        type: "assistant",
        content: "عذرًا، لم أفهم استفسارك. هل يمكنك توضيح ما تبحث عنه؟",
        options: [
          {
            label: "خيارات رئيسية",
            action: () => {
              setMessages(msgs => [...msgs, {
                type: "assistant",
                content: "هذه بعض الخيارات التي قد تساعدك:",
                options: [
                  {
                    label: "ما هي اختبارات قياس؟",
                    action: () => handleSelectOption("ما هي اختبارات قياس؟"),
                    icon: GraduationCapIcon
                  },
                  {
                    label: "كيف أختبر قدراتي؟",
                    action: () => handleSelectOption("كيف أختبر قدراتي؟"),
                    icon: BrainCircuitIcon
                  },
                  {
                    label: "كيف أستخدم المكتبة؟",
                    action: () => handleSelectOption("كيف أستخدم المكتبة؟"),
                    icon: BookIcon
                  }
                ]
              }]);
            },
            icon: HelpCircleIcon
          }
        ]
      }]);
    }
  };
  
  if (!isVisible) return null;

return (
    <div className={cn("fixed bottom-20 md:bottom-6 left-6 z-50", className)}>
      {/* Chat button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center"
        title="إزالة المساعد"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <Button
        className="h-12 w-12 rounded-full"
        onClick={toggleChat}
        aria-label={isOpen ? "إغلاق المساعد" : "فتح المساعد"}
      >
        {isOpen ? (
          <XIcon className="h-5 w-5" />
        ) : (
          <MessageCircleIcon className="h-5 w-5" />
        )}
      </Button>
      
      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-80 md:w-96 rounded-lg shadow-lg bg-white dark:bg-gray-800 border">
          <div className="p-3 bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-5 w-5" />
              <h3 className="font-medium">مساعد قدراتي</h3>
            </div>
          </div>
          
          {/* Chat messages */}
          <div 
            className="h-96 overflow-y-auto p-4 space-y-4"
            ref={chatBoxRef}
          >
            {messages.map((message, index) => (
              <div 
                key={index}
                className={cn(
                  "flex flex-col",
                  message.type === "user" ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3",
                    message.type === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}
                >
                  {message.content}
                </div>
                
                {/* Options for assistant messages */}
                {message.type === "assistant" && message.options && (
                  <div className="mt-2 space-y-2 w-full">
                    {message.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        className="w-full flex items-center gap-2 text-sm p-2 text-right rounded-md border hover:bg-muted/50 transition-colors"
                        onClick={option.action}
                      >
                        {option.icon && <option.icon className="h-4 w-4" />}
                        <span className="flex-1">{option.label}</span>
                        <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Input area */}
          <div className="p-3 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 p-2 rounded-md border focus:ring-1 focus:ring-primary focus:outline-none"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                ref={inputRef}
              />
              <Button
                size="sm"
                className="h-9 w-9 p-0"
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                aria-label="إرسال الرسالة"
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { Assistant };