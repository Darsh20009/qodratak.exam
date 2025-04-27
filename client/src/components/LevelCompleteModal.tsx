import React, { useEffect } from "react";
import { TestDifficulty } from "@shared/types";
import { formatDifficulty } from "@/lib/formatters";

interface LevelCompleteModalProps {
  currentDifficulty: TestDifficulty;
  onContinue: () => void;
}

const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  currentDifficulty,
  onContinue,
}) => {
  // Get the previous difficulty level
  const getPreviousDifficulty = (current: TestDifficulty): TestDifficulty => {
    switch (current) {
      case "intermediate":
        return "beginner";
      case "advanced":
        return "intermediate";
      default:
        return "beginner";
    }
  };

  const previousDifficulty = getPreviousDifficulty(currentDifficulty);

  // Add celebration animation
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes celebrate {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-10/12 max-w-md text-center"
        style={{ animation: "celebrate 1s ease infinite" }}
      >
        <div className="mb-6">
          <i className="fas fa-medal text-6xl text-yellow-500"></i>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">
          تهانينا! 🎉
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          لقد أكملت المستوى {formatDifficulty(previousDifficulty)} بنجاح وأصبحت
          جاهزاً للانتقال إلى المستوى {formatDifficulty(currentDifficulty)}!
        </p>
        <button
          onClick={onContinue}
          className="py-3 px-6 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-colors"
        >
          استمرار
        </button>
      </div>
    </div>
  );
};

export default LevelCompleteModal;
