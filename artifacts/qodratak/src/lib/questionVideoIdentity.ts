type RecordLike = Record<string, unknown>;
const record = (value: unknown): RecordLike =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as RecordLike : {};

/** Resolve source identifiers only. An exam's display position is never a source ID. */
export function quantitativeVideoQuestion(value: unknown, quantitativeOnly = false) {
  const wrapper = record(value);
  const question = wrapper.question ? record(wrapper.question) : wrapper;
  const source = record(question.source);
  const categories = [question.category, question.type, question.subjectId, wrapper.category]
    .filter((category): category is string => typeof category === 'string')
    .map((category) => category.trim().toLowerCase());
  const verbal = categories.some((category) => /^(verbal|لفظي|اللفظي)$/.test(category));
  const quantitative = !verbal && (quantitativeOnly || categories.some((category) =>
    /^(quantitative|quant|كمي|الكمي|الكمّي|subject\.qudrat\.quantitative)$/.test(category))
    || (typeof source.questionId === 'string' && /^quantitative-computer-bank-\d+-\d+$/.test(source.questionId)));
  if (!quantitative) return null;
  const id = [wrapper.sourceQuestionId, question.sourceQuestionId, question._id, question.questionId, question.id]
    .map((candidate) => typeof candidate === 'number' && Number.isSafeInteger(candidate) && candidate > 0
      ? String(candidate) : typeof candidate === 'string' ? candidate : '')
    .find((candidate) => /^[a-f\d]{24}$/i.test(candidate) || /^[1-9]\d*$/.test(candidate)) || null;
  return { id, text: typeof question.text === 'string' ? question.text : '' };
}
