import React from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="اكتب سؤالك هنا..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-400"
        />
        <button
          onClick={onSend}
          disabled={isLoading}
          className={`bg-gradient-to-r from-primary to-secondary text-white p-3 rounded-lg ${
            isLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"
          }`}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
