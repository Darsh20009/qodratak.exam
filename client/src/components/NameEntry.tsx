import React from "react";

interface NameEntryProps {
  userName: string;
  nameError: string;
  onUserNameChange: (name: string) => void;
  onStartChat: () => void;
}

const NameEntry: React.FC<NameEntryProps> = ({
  userName,
  nameError,
  onUserNameChange,
  onStartChat,
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onStartChat();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
      <h3 className="text-primary dark:text-blue-400 text-xl font-semibold mb-3">
        مرحباً بك!
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
        أنا مساعدك الذكي الشخصي. يمكنني مساعدتك في الإجابة على أسئلتك واختبار قدراتك.
      </p>
      <div className="w-full mb-2">
        <input
          type="text"
          placeholder="أدخل اسمك هنا..."
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary dark:focus:border-blue-400 focus:ring-2 focus:ring-primary/20 dark:focus:ring-blue-400/20"
        />
      </div>
      <button
        onClick={onStartChat}
        className="w-full py-3 px-6 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-all hover:-translate-y-0.5"
      >
        بدء المحادثة
      </button>
      {nameError && (
        <div className="text-red-500 text-sm h-4 mt-2">{nameError}</div>
      )}
    </div>
  );
};

export default NameEntry;
