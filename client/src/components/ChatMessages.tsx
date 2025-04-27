import React, { useRef, useEffect } from "react";
import { ChatMessage } from "@shared/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Chat animation keyframes
  const fadeInUpAnimation = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  return (
    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-3">
      <style>{fadeInUpAnimation}</style>
      
      {messages.map((message, index) => (
        <div
          key={index}
          className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
            message.sender === "user"
              ? "bg-gradient-to-r from-secondary to-primary text-white mr-auto rounded-br-md"
              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
          }`}
          style={{
            animation: "fadeInUp 0.4s ease-out forwards",
            animationDelay: `${index * 0.1}s`,
          }}
        >
          {message.text}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex-none bg-gray-100 dark:bg-gray-800 text-gray-400 p-4 rounded-2xl rounded-bl-md max-w-[85%] shadow-sm animate-pulse">
          <div className="flex space-x-2 rtl:space-x-reverse">
            <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
