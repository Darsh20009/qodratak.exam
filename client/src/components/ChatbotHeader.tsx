import React from "react";

interface ChatbotHeaderProps {
  title: string;
  isDarkMode: boolean;
  isExpanded: boolean;
  onClose: () => void;
  onToggleDarkMode: () => void;
  onToggleExpand: () => void;
}

const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  title,
  isDarkMode,
  isExpanded,
  onClose,
  onToggleDarkMode,
  onToggleExpand,
}) => {
  return (
    <div className="bg-gradient-to-r from-primary to-secondary text-white px-5 py-4 flex justify-between items-center border-b border-opacity-10 border-white">
      <div className="font-bold text-xl">{title}</div>
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleDarkMode}
          className="text-white opacity-80 hover:opacity-100 text-xl"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"}`}></i>
        </button>
        <button
          onClick={onToggleExpand}
          className="text-white opacity-80 hover:opacity-100 text-xl"
          aria-label={isExpanded ? "Collapse window" : "Expand window"}
        >
          <i className={`fas ${isExpanded ? "fa-compress-alt" : "fa-expand-alt"}`}></i>
        </button>
        <button
          onClick={onClose}
          className="text-white opacity-80 hover:opacity-100 text-2xl transition-transform hover:rotate-90"
          aria-label="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatbotHeader;
