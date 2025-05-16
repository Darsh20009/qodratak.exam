import { useState, useEffect, useCallback } from "react";
import { useChatbot } from "@/hooks/useChatbot";
import { useAbilitiesTest } from "@/hooks/useAbilitiesTest";
import ChatbotHeader from "./ChatbotHeader";
import NameEntry from "./NameEntry";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import AbilitiesTest from "./AbilitiesTest";
import { ChatMessage } from "@/types/chatbot";

const Chatbot = () => {
  const {
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
    setMessages,
    handleSuggestedQuestionClick
  } = useChatbot();

  const abilitiesTest = useAbilitiesTest(currentUserId);

  const [activeTab, setActiveTab] = useState<"chat" | "abilities">("chat");

  // Switch tabs
  const handleTabChange = (tab: "chat" | "abilities") => {
    setActiveTab(tab);
    abilitiesTest.switchTab(tab);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 font-cairo" dir="rtl">
      {/* Toggle Button */}
      <button
        onClick={toggleChatbot}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow-lg cursor-pointer text-2xl"
        style={{ animation: "pulse-glow 2.5s infinite ease-in-out" }}
      >
        <i className="fas fa-comments"></i>
      </button>

      {/* Chatbot Window */}
      <div
        className={`w-[370px] h-[580px] bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 absolute bottom-24 left-0 transition-all duration-300 flex flex-col overflow-hidden ${
          isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-5 scale-95 pointer-events-none"
        } ${isExpanded ? "w-[90vw] h-[90vh] bottom-[5vh] left-[5vw]" : ""}`}
        style={{ backdropFilter: "blur(15px)", WebkitBackdropFilter: "blur(15px)" }}
      >
        {/* Header */}
        <ChatbotHeader
          title="ذكائي - مساعدك الشخصي"
          isDarkMode={isDarkMode}
          isExpanded={isExpanded}
          onClose={closeChatbot}
          onToggleDarkMode={toggleDarkMode}
          onToggleExpand={toggleExpand}
        />

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => handleTabChange("chat")}
            className={`flex-1 py-3 px-4 font-semibold ${
              activeTab === "chat"
                ? "text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <i className="fas fa-comments ml-2"></i>المحادثة
          </button>
          <button
            onClick={() => handleTabChange("abilities")}
            className={`flex-1 py-3 px-4 font-semibold ${
              activeTab === "abilities"
                ? "text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <i className="fas fa-brain ml-2"></i>اختبار قدراتك
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Name Entry Section */}
              {!isNameEntered && (
                <NameEntry
                  userName={userName}
                  nameError={nameError}
                  onUserNameChange={setUserName}
                  onStartChat={handleStartChat}
                />
              )}

              {/* Chat Messages */}
              {isNameEntered && (
                <>
                  <ChatMessages
                    messages={messages}
                    isLoading={isLoading}
                  />

                  {/* Suggested Queries */}
                  {suggestedQuestions.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        هل تقصد:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestedQuestionClick(question.text)}
                            className="bg-gray-100 dark:bg-gray-800 text-primary dark:text-blue-400 px-3 py-1 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            {question.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Input */}
                  <ChatInput
                    value={inputMessage}
                    onChange={setInputMessage}
                    onSend={handleSendMessage}
                    isLoading={isLoading}
                  />
                </>
              )}
            </div>
          )}

          {/* Abilities Test Tab */}
          {activeTab === "abilities" && (
            <AbilitiesTest {...abilitiesTest} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;