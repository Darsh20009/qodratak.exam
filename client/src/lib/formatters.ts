import { TestDifficulty, TestType } from "@shared/types";

// Format test type to Arabic
export function formatTestType(type: TestType): string {
  switch (type) {
    case "verbal":
      return "لفظي";
    case "quantitative":
      return "كمي";
    default:
      return type;
  }
}

// Format difficulty level to Arabic
export function formatDifficulty(difficulty: TestDifficulty): string {
  switch (difficulty) {
    case "beginner":
      return "مبتدئ";
    case "intermediate":
      return "متوسط";
    case "advanced":
      return "متقدم";
    default:
      return difficulty;
  }
}

// Format score as percentage
export function formatScorePercentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

// Get performance message based on score percentage
export function getPerformanceMessage(scorePercentage: number, difficulty: TestDifficulty): string {
  if (scorePercentage >= 80) {
    if (difficulty === "advanced") {
      return "أداء ممتاز! لقد أتقنت هذا المستوى";
    }
    return "أداء ممتاز! يمكنك الانتقال للمستوى التالي";
  } else if (scorePercentage >= 60) {
    return "أداء جيد! استمر في التدريب";
  } else if (scorePercentage >= 40) {
    return "أداء مقبول. تحتاج إلى مزيد من الممارسة";
  } else {
    return "تحتاج إلى المزيد من التدريب على هذا المستوى";
  }
}

// Get next difficulty level
export function getNextDifficulty(difficulty: TestDifficulty): TestDifficulty {
  switch (difficulty) {
    case "beginner":
      return "intermediate";
    case "intermediate":
      return "advanced";
    case "advanced":
      return "advanced"; // Already at max level
    default:
      return "beginner";
  }
}

// Format timestamp to Arabic friendly date format
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);

    // Options for Arabic-friendly date formatting
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return new Intl.DateTimeFormat('ar-SA', options).format(date);
  } catch (error) {
    return timestamp;
  }
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

import { cn } from "@/lib/utils";