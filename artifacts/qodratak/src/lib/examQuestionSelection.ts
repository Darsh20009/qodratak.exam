import { generateBalancedQuestionSet } from "../shared/examUtils";
import type { TestType } from "../shared/types";

interface SelectionSection {
  name: string;
  category: TestType;
  questionCount: number;
  verbalCount?: number;
  quantitativeCount?: number;
}

export function validExamPool<T extends { id: number; options: string[]; correctOptionIndex: number; category: string; answerStatus?: string }>(pool: T[]): T[] {
  const unique = new Map<number, T>();
  for (const question of pool) {
    if (!Number.isSafeInteger(question.id) || question.id <= 0 ||
        !Array.isArray(question.options) || question.options.length < 4 ||
        !Number.isInteger(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 || question.correctOptionIndex >= question.options.length ||
        question.answerStatus === "review" ||
        !["verbal", "quantitative"].includes(question.category)) continue;
    if (!unique.has(question.id)) unique.set(question.id, question);
  }
  return [...unique.values()];
}

export function selectExamSection<T extends { id: number; options: string[]; correctOptionIndex: number; category: string; answerStatus?: string }>(
  pool: T[], section: SelectionSection, used: Set<number>,
): T[] {
  const available = validExamPool(pool).filter(question => !used.has(question.id));
  let selected: T[];
  if (section.category === "mixed" && section.verbalCount !== undefined && section.quantitativeCount !== undefined) {
    if (section.verbalCount + section.quantitativeCount !== section.questionCount) {
      throw new Error("توزيع الأسئلة لا يطابق عدد أسئلة القسم.");
    }
    const verbal = generateBalancedQuestionSet(available.filter(q => q.category === "verbal"), "verbal", section.verbalCount);
    const quantitative = generateBalancedQuestionSet(available.filter(q => q.category === "quantitative"), "quantitative", section.quantitativeCount);
    if (verbal.length !== section.verbalCount || quantitative.length !== section.quantitativeCount) {
      throw new Error(`لا توجد أسئلة معتمدة وفريدة كافية لقسم «${section.name}» بالتوزيع المحدد.`);
    }
    selected = [...quantitative, ...verbal];
  } else {
    selected = generateBalancedQuestionSet(available, section.category, section.questionCount);
  }
  if (selected.length !== section.questionCount || new Set(selected.map(q => q.id)).size !== selected.length) {
    throw new Error(`لا توجد أسئلة معتمدة وفريدة كافية لقسم «${section.name}». اختر اختبارًا أقصر.`);
  }
  selected.forEach(question => used.add(question.id));
  return selected;
}
