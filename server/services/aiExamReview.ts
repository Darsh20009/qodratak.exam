import { IExamBooking, ISectionResult } from '../mongodb/models';
import { Question } from '../mongodb/models';

const MAX_EXPERIMENTAL_QUESTIONS = 5;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const AI_MODEL = 'openai/gpt-4o-mini';

interface QuestionReview {
  questionId: string;
  hasError: boolean;
  studentIsRight: boolean;
  correctOptionIndex: number;
  explanation?: string;
}

interface AiReviewResult {
  correctedSectionResults: ISectionResult[];
  correctedTotalScore: number;
  correctedVerbalScore: number;
  correctedQuantScore: number;
  correctedTotalScoreOutOf100: number;
  correctedVerbalPercent: number;
  correctedQuantPercent: number;
  correctedCorrectAnswers: number;
  correctedWrongAnswers: number;
  correctedSkippedAnswers: number;
}

async function reviewQuestionsWithAI(questionsForReview: {
  questionId: string;
  text: string;
  options: string[];
  systemCorrectIndex: number;
  studentAnswerIndex: number | null;
  category: string;
}[]): Promise<QuestionReview[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[AI Review] OPENAI_API_KEY not set — skipping AI review');
    return questionsForReview.map(q => ({
      questionId: q.questionId,
      hasError: false,
      studentIsRight: q.studentAnswerIndex !== null && q.studentAnswerIndex === q.systemCorrectIndex,
      correctOptionIndex: q.systemCorrectIndex,
    }));
  }

  const prompt = `أنت محكّم اختبارات متخصص في مراجعة أسئلة اختبار القدرات السعودي (قياس). مهمتك مراجعة الأسئلة التالية والتحقق من صحتها.

لكل سؤال، حدد:
1. هل السؤال يحتوي على خطأ أو غموض أو إجابة صحيحة مثيرة للجدل؟ (hasError: true/false)
2. ما هو رقم الإجابة الصحيحة الفعلية؟ (correctOptionIndex: 0/1/2/3)
3. هل إجابة الطالب صحيحة بناءً على تقييمك؟ (studentIsRight: true/false)

الأسئلة بصيغة JSON:
${JSON.stringify(questionsForReview.map(q => ({
  questionId: q.questionId,
  text: q.text,
  options: q.options,
  systemAnswer: q.systemCorrectIndex,
  studentAnswer: q.studentAnswerIndex,
  category: q.category,
})), null, 2)}

أجب بصيغة JSON array فقط بدون أي نص إضافي، مثال:
[{"questionId":"123","hasError":false,"studentIsRight":true,"correctOptionIndex":2,"explanation":"السبب"},...]`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://qodratak.site',
        'X-Title': 'Qodratak Exam Review',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AI Review] API error:', response.status, errText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data?.choices?.[0]?.message?.content ?? '';
    let parsed: any;
    try {
      const trimmed = content.trim();
      const cleanedJson = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      if (cleanedJson.startsWith('[')) {
        parsed = JSON.parse(cleanedJson);
      } else {
        const match = cleanedJson.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          const obj = JSON.parse(cleanedJson);
          const arrVal = obj.reviews || obj.questions || obj.results || obj.data;
          if (Array.isArray(arrVal)) {
            parsed = arrVal;
          } else {
            const firstVal = Object.values(obj)[0];
            parsed = Array.isArray(firstVal) ? firstVal : [obj];
          }
        }
      }
    } catch {
      console.error('[AI Review] Failed to parse AI response:', content.slice(0, 500));
      throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array');
    }

    return parsed.map((r: any) => ({
      questionId: String(r.questionId),
      hasError: Boolean(r.hasError),
      studentIsRight: Boolean(r.studentIsRight),
      correctOptionIndex: Number(r.correctOptionIndex ?? r.systemAnswer ?? 0),
      explanation: r.explanation,
    }));
  } catch (err) {
    console.error('[AI Review] Error calling AI:', err);
    return questionsForReview.map(q => ({
      questionId: q.questionId,
      hasError: false,
      studentIsRight: q.studentAnswerIndex !== null && q.studentAnswerIndex === q.systemCorrectIndex,
      correctOptionIndex: q.systemCorrectIndex,
    }));
  }
}

export async function reviewExamBooking(booking: IExamBooking): Promise<AiReviewResult> {
  const sectionResults: ISectionResult[] = booking.sectionResults as ISectionResult[];

  const allQuestionsFlat: {
    sectionIndex: number;
    questionIndex: number;
    questionId: string;
    studentAnswer: string | null;
    correctAnswer: string;
    category: string;
  }[] = [];

  for (const section of sectionResults) {
    for (let qi = 0; qi < section.questions.length; qi++) {
      const q = section.questions[qi];
      allQuestionsFlat.push({
        sectionIndex: section.sectionIndex,
        questionIndex: qi,
        questionId: q.questionId,
        studentAnswer: q.studentAnswer,
        correctAnswer: q.correctAnswer,
        category: q.category || 'general',
      });
    }
  }

  const questionIds = allQuestionsFlat.map(q => q.questionId);
  const dbQuestions = await Question.find({ questionId: { $in: questionIds.map(Number) } }).lean();
  const questionMap = new Map<string, any>();
  for (const dbQ of dbQuestions) {
    questionMap.set(String(dbQ.questionId), dbQ);
  }

  const questionsForReview = allQuestionsFlat.map(q => {
    const dbQ = questionMap.get(q.questionId);
    return {
      questionId: q.questionId,
      text: dbQ?.text || `سؤال رقم ${q.questionId}`,
      options: dbQ?.options || [],
      systemCorrectIndex: parseInt(q.correctAnswer, 10),
      studentAnswerIndex: q.studentAnswer !== null ? parseInt(q.studentAnswer, 10) : null,
      category: q.category,
    };
  });

  const BATCH_SIZE = 50;
  const allReviews: QuestionReview[] = [];
  for (let i = 0; i < questionsForReview.length; i += BATCH_SIZE) {
    const batch = questionsForReview.slice(i, i + BATCH_SIZE);
    const batchReviews = await reviewQuestionsWithAI(batch);
    allReviews.push(...batchReviews);
  }

  const reviewMap = new Map<string, QuestionReview>();
  for (const review of allReviews) {
    reviewMap.set(review.questionId, review);
  }

  const errorQuestionIds = allReviews.filter(r => r.hasError).map(r => r.questionId);
  const errorCount = errorQuestionIds.length;
  const countErrorsAsExperimental = errorCount <= MAX_EXPERIMENTAL_QUESTIONS;

  const correctedSectionResults: ISectionResult[] = sectionResults.map(section => {
    const correctedQuestions = section.questions.map(q => {
      const review = reviewMap.get(q.questionId);
      if (!review) return q;

      if (review.hasError && countErrorsAsExperimental) {
        return {
          ...q,
          isExperimental: true,
          isCorrect: true,
          correctAnswer: q.studentAnswer ?? q.correctAnswer,
        };
      }

      if (review.hasError && !countErrorsAsExperimental) {
        return {
          ...q,
          isExperimental: true,
          isCorrect: true,
          correctAnswer: q.studentAnswer ?? q.correctAnswer,
        };
      }

      if (review.studentIsRight && !q.isCorrect) {
        return {
          ...q,
          isCorrect: true,
          correctAnswer: q.studentAnswer ?? String(review.correctOptionIndex),
        };
      }

      return {
        ...q,
        isCorrect: review.studentIsRight,
        correctAnswer: String(review.correctOptionIndex),
      };
    });

    const correctCount = correctedQuestions.filter(q => q.isCorrect && q.studentAnswer !== null).length;
    const wrongCount = correctedQuestions.filter(q => !q.isCorrect && q.studentAnswer !== null).length;
    const skippedCount = correctedQuestions.filter(q => q.studentAnswer === null).length;

    return {
      ...section,
      questions: correctedQuestions,
      correctCount,
      wrongCount,
      skippedCount,
    };
  });

  const totalCorrect = correctedSectionResults.reduce((s, r) => s + r.correctCount, 0);
  const totalWrong = correctedSectionResults.reduce((s, r) => s + r.wrongCount, 0);
  const totalSkipped = correctedSectionResults.reduce((s, r) => s + r.skippedCount, 0);

  let verbalCorrect = 0;
  let verbalTotal = 0;
  let quantCorrect = 0;
  let quantTotal = 0;

  for (const section of correctedSectionResults) {
    const sectionIdx = section.sectionIndex;
    for (const q of section.questions) {
      const cat = (q.category || '').toLowerCase();
      const isVerbal = cat.includes('verbal') || cat.includes('لفظ');
      const isQuant = cat.includes('quantitative') || cat.includes('quant') || cat.includes('كم');

      if (isVerbal) {
        verbalTotal++;
        if (q.isCorrect && q.studentAnswer !== null) verbalCorrect++;
      } else if (isQuant) {
        quantTotal++;
        if (q.isCorrect && q.studentAnswer !== null) quantCorrect++;
      } else {
        if (sectionIdx % 2 === 0) {
          verbalTotal++;
          if (q.isCorrect && q.studentAnswer !== null) verbalCorrect++;
        } else {
          quantTotal++;
          if (q.isCorrect && q.studentAnswer !== null) quantCorrect++;
        }
      }
    }
  }

  const verbalPercent = verbalTotal > 0 ? Math.round((verbalCorrect / verbalTotal) * 100) : 0;
  const quantPercent = quantTotal > 0 ? Math.round((quantCorrect / quantTotal) * 100) : 0;
  const totalScoreOutOf100 = Math.round((verbalPercent * 0.5) + (quantPercent * 0.5));
  const verbalScore = verbalPercent;
  const quantScore = quantPercent;
  const totalScore = totalCorrect;

  console.log(`[AI Review] Booking ${booking._id}: ${errorCount} errors found. Corrected score: ${totalScoreOutOf100} (was: ${booking.totalScoreOutOf100})`);

  return {
    correctedSectionResults,
    correctedTotalScore: totalScore,
    correctedVerbalScore: verbalScore,
    correctedQuantScore: quantScore,
    correctedTotalScoreOutOf100: totalScoreOutOf100,
    correctedVerbalPercent: verbalPercent,
    correctedQuantPercent: quantPercent,
    correctedCorrectAnswers: totalCorrect,
    correctedWrongAnswers: totalWrong,
    correctedSkippedAnswers: totalSkipped,
  };
}
