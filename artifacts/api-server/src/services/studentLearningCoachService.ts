import mongoose from "mongoose";
import { Question } from "../mongodb/models";
import {
  LearningAttempt,
} from "../mongodb/learningProfileModels";
import {
  StudentLearningCoachCache,
  type AdaptiveTestCategory,
} from "../mongodb/learningCoachModels";
import { logger } from "../lib/logger";

const QUDRAT_SUBJECTS = [
  "subject.qudrat.verbal",
  "subject.qudrat.quantitative",
];
const PROFILE_ATTEMPT_LIMIT = 600;
const PROFILE_WINDOW_DAYS = 180;
const STUDY_MODEL = process.env.OPENAI_STUDY_MODEL?.trim() || "gpt-4o-mini";

type LearningAttemptRecord = {
  questionId: string;
  isCorrect: boolean;
  selectedAnswer?: string | number | null;
  subjectId?: string;
  createdAt?: Date;
};

type QuestionRecord = {
  _id: mongoose.Types.ObjectId;
  questionId: number;
  category: "verbal" | "quantitative" | "general";
  subcategory?: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  studentTip?: string;
  difficulty?: string;
  answerStatus?: string;
};

type AreaStat = {
  category: "verbal" | "quantitative";
  subcategory: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  repeatedWrongQuestions: number;
};

type CoachReport = {
  generatedAt: string;
  evidence: {
    trustedAttempts: number;
    repeatedWrongAnswers: number;
    confidence: "low" | "medium" | "high";
  };
  strengths: AreaStat[];
  focusAreas: AreaStat[];
  guide: {
    title: string;
    summary: string;
    steps: string[];
    markdown: string;
  };
  aiAvailable: boolean;
  note: string;
};

type QuestionFeedbackInput = {
  questionId: string;
  category: string;
  subcategory: string;
  text: string;
  options: string[];
  selectedIndex: number;
  correctIndex: number;
  explanation: string;
};

function currentFingerprint(
  attempts: LearningAttemptRecord[],
  areas: AreaStat[],
) {
  const latest = attempts[0]?.createdAt
    ? new Date(attempts[0].createdAt).toISOString()
    : "none";
  return [
    attempts.length,
    latest,
    areas.map((area) =>
      `${area.category}:${area.subcategory}:${area.totalAttempts}:${area.correctAttempts}`,
    ).join("|"),
  ].join(":");
}

async function askOpenAI(
  systemPrompt: string,
  userContent: unknown,
): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: STUDY_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userContent) },
        ],
        max_tokens: 1200,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      logger.warn(
        { statusCode: response.status },
        "OpenAI learning-coach request failed; using deterministic fallback",
      );
      return null;
    }
    const payload = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch (error) {
    logger.warn(
      { errorName: error instanceof Error ? error.name : "UnknownError" },
      "OpenAI learning-coach unavailable; using deterministic fallback",
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getTrustedEvidence(studentId: string) {
  const cutoff = new Date(Date.now() - PROFILE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const attempts = await LearningAttempt.find({
    studentId,
    programId: "program.qudrat",
    subjectId: { $in: QUDRAT_SUBJECTS },
    sourceType: "mongo_question",
    isAnswered: true,
    createdAt: { $gte: cutoff },
  })
    .sort({ createdAt: -1 })
    .limit(PROFILE_ATTEMPT_LIMIT)
    .lean() as LearningAttemptRecord[];

  const questionIds = [...new Set(attempts.map((attempt) => attempt.questionId))];
  const numericIds = questionIds
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  const objectIds = questionIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const questionClauses: Record<string, unknown>[] = [];
  if (numericIds.length) questionClauses.push({ questionId: { $in: numericIds } });
  if (objectIds.length) questionClauses.push({ _id: { $in: objectIds } });
  const questions = questionClauses.length
    ? await Question.find({ $or: questionClauses })
        .select(
          "_id questionId category subcategory text options correctOptionIndex explanation studentTip difficulty answerStatus",
        )
        .lean() as unknown as QuestionRecord[]
    : [];

  const questionById = new Map<string, QuestionRecord>();
  for (const question of questions) {
    questionById.set(String(question._id), question);
    questionById.set(String(question.questionId), question);
  }

  const grouped = new Map<string, {
    category: "verbal" | "quantitative";
    subcategory: string;
    totalAttempts: number;
    correctAttempts: number;
    questionWrongCounts: Map<string, number>;
  }>();
  const enriched = attempts.flatMap((attempt) => {
    const question = questionById.get(String(attempt.questionId));
    if (!question || question.answerStatus === "review") return [];
    const category = question.category === "quantitative" ? "quantitative" : "verbal";
    const subcategory = String(question.subcategory || "عام").trim() || "عام";
    const key = `${category}:${subcategory}`;
    let stat = grouped.get(key);
    if (!stat) {
      stat = {
        category,
        subcategory,
        totalAttempts: 0,
        correctAttempts: 0,
        questionWrongCounts: new Map(),
      };
      grouped.set(key, stat);
    }
    stat.totalAttempts += 1;
    if (attempt.isCorrect) stat.correctAttempts += 1;
    else {
      const questionKey = String(question._id);
      stat.questionWrongCounts.set(
        questionKey,
        (stat.questionWrongCounts.get(questionKey) || 0) + 1,
      );
    }
    return [{
      attempt,
      question,
      category,
      subcategory,
    }];
  });

  const areas: AreaStat[] = [...grouped.values()].map((stat) => ({
    category: stat.category,
    subcategory: stat.subcategory,
    totalAttempts: stat.totalAttempts,
    correctAttempts: stat.correctAttempts,
    accuracy: Math.round((stat.correctAttempts / stat.totalAttempts) * 100),
    repeatedWrongQuestions: [...stat.questionWrongCounts.values()]
      .filter((count) => count >= 2).length,
  }));

  return { attempts, areas, enriched };
}

function fallbackGuide(areas: AreaStat[], attemptCount: number): CoachReport["guide"] {
  if (attemptCount < 3 || !areas.length) {
    const summary =
      "لا توجد إجابات موثوقة كافية لتحديد نقاط ضعف مؤكدة. ابدأ الاختبار التكيفي اليومي، وسيتحسن التحليل مع حفظ مزيد من الإجابات.";
    return {
      title: "ابدأ بقياس مستواك",
      summary,
      steps: [
        "أكمل اختبار اليوم في الكمي واللفظي.",
        "اقرأ شرح كل إجابة خاطئة بعد الاختبار.",
        "أعد التدريب على السؤال المشابه في الاختبار القادم.",
      ],
      markdown: `# ابدأ بقياس مستواك\n\n${summary}\n\n- أكمل اختبار اليوم.\n- راجع الإجابات الخاطئة وشرحها.\n- أعد التدريب على السؤال المشابه.`,
    };
  }

  const focus = areas
    .filter((area) => area.totalAttempts >= 2)
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 3);
  const focusLines = focus.map((area) =>
    `- ${area.category === "verbal" ? "لفظي" : "كمي"} — ${area.subcategory}: ${area.accuracy}% (${area.totalAttempts} إجابة).`,
  );
  const summary = focus.length
    ? `تظهر إجاباتك المسجلة حاجةً إلى مراجعة ${focus.map((area) => area.subcategory).join("، ")}. هذا استنتاج من الإجابات، وليس حكمًا نهائيًا على طريقة تفكيرك.`
    : "تُظهر الإجابات المسجلة أداءً متوازنًا حتى الآن، واستمر في الاختبار اليومي لتأكيد ذلك.";
  const steps = focus.length
    ? [
        `ابدأ بمراجعة ${focus[0].subcategory} ثم جرّب مثالًا محلولًا.`,
        "قبل اختيار الإجابة، اكتب العلاقة أو الخطوة التي تعتمد عليها.",
        "بعد التدريب، قارن إجابتك بالشرح الرسمي وسجّل سبب الخطأ إن وجد.",
      ]
    : [
        "حافظ على المراجعة في الكمي واللفظي.",
        "اقرأ الشرح الرسمي للأسئلة التي أخطأت فيها.",
        "تابع الاختبار اليومي لرصد أي تغير في الأداء.",
      ];
  const markdown = [
    "# خطة المراجعة الشخصية",
    "",
    summary,
    "",
    "## المجالات المرصودة",
    ...(focusLines.length ? focusLines : ["- لا توجد نقطة ضعف متكررة مؤكدة حاليًا."]),
    "",
    "## خطوات المراجعة",
    ...steps.map((step) => `- ${step}`),
  ].join("\n");
  return {
    title: "خطة مراجعة من إجاباتك",
    summary,
    steps,
    markdown,
  };
}

function normalizeText(value: unknown, maxLength: number, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\u0000/g, "").trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

export async function getStudentLearningCoachReport(studentId: string) {
  const evidence = await getTrustedEvidence(studentId);
  const fingerprint = currentFingerprint(evidence.attempts, evidence.areas);
  const cached = await StudentLearningCoachCache.findOne({ studentId }).lean();
  const canAttemptAi =
    Boolean(process.env.OPENAI_API_KEY?.trim()) && evidence.enriched.length > 0;
  if (cached?.fingerprint === fingerprint) {
    const cachedReport = cached.report as unknown as CoachReport;
    const retryAiAt = new Date(cached.generatedAt).getTime() + 5 * 60 * 1000;
    if (
      cachedReport.aiAvailable ||
      !canAttemptAi ||
      Date.now() < retryAiAt
    ) {
      return cachedReport;
    }
  }

  const weakAreas = evidence.areas
    .filter((area) => area.totalAttempts >= 2)
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 3);
  const strengths = evidence.areas
    .filter((area) => area.totalAttempts >= 4 && area.accuracy >= 75)
    .sort((left, right) => right.accuracy - left.accuracy)
    .slice(0, 3);
  const repeatedWrongAnswers = evidence.areas.reduce(
    (sum, area) => sum + area.repeatedWrongQuestions,
    0,
  );
  const confidence =
    evidence.attempts.length >= 20 ? "high"
      : evidence.attempts.length >= 6 ? "medium" : "low";
  let guide = fallbackGuide(evidence.areas, evidence.attempts.length);
  let aiAvailable = false;

  if (canAttemptAi) {
    const examples = evidence.enriched
      .filter(({ attempt }) => !attempt.isCorrect)
      .slice(0, 8)
      .map(({ attempt, question, category, subcategory }) => ({
        category,
        subcategory,
        question: question.text,
        selectedAnswer:
          typeof attempt.selectedAnswer === "number"
            ? question.options?.[attempt.selectedAnswer]
            : attempt.selectedAnswer,
        correctAnswer: question.options?.[question.correctOptionIndex],
        officialExplanation: question.explanation || question.studentTip || "",
      }));
    // The model only receives this student's verified question evidence, never
    // account details; observed wrong answers are not treated as certain intent.
    const generated = await askOpenAI(
      [
        "أنت مدرب قدرات سعودي. اكتب خطة مراجعة عربية قصيرة وعملية بناءً على بيانات الأسئلة الموثقة فقط.",
        "لا تدّع معرفة طريقة تفكير الطالب من إجابة واحدة؛ صغ الاستنتاجات كاحتمالات واذكر عندما تكون العينة صغيرة.",
        "اعتمد على الشرح الرسمي، ولا تخترع معلومة أو موضوعًا غير موجود في المدخلات.",
        "أعد JSON صالحًا فقط بالمفاتيح: title, summary, steps (array of strings), markdown.",
      ].join(" "),
      {
        sampleConfidence: confidence,
        trustedAttemptCount: evidence.attempts.length,
        focusAreas: weakAreas,
        strengths,
        incorrectAnswerEvidence: examples,
      },
    );
    if (generated) {
      const title = normalizeText(generated.title, 100, guide.title);
      const summary = normalizeText(generated.summary, 700, guide.summary);
      const steps = Array.isArray(generated.steps)
        ? generated.steps
            .filter((step): step is string => typeof step === "string")
            .slice(0, 6)
            .map((step) => step.replace(/\u0000/g, "").trim().slice(0, 240))
            .filter(Boolean)
        : guide.steps;
      const markdown = normalizeText(generated.markdown, 5000, guide.markdown);
      guide = { title, summary, steps: steps.length ? steps : guide.steps, markdown };
      aiAvailable = true;
    }
  }

  const report: CoachReport = {
    generatedAt: new Date().toISOString(),
    evidence: {
      trustedAttempts: evidence.attempts.length,
      repeatedWrongAnswers,
      confidence,
    },
    strengths,
    focusAreas: weakAreas,
    guide,
    aiAvailable,
    note: "التقييم مبني على الإجابات المحفوظة في المنصة؛ وقد تكون قلة البيانات سببًا في انخفاض دقته.",
  };
  await StudentLearningCoachCache.findOneAndUpdate(
    { studentId },
    { $set: { fingerprint, report, generatedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return report;
}

export async function generateAdaptiveQuestionFeedback(
  questions: QuestionFeedbackInput[],
) {
  if (!questions.length) return new Map<string, string>();
  const generated = await askOpenAI(
    [
      "أنت معلم قدرات تشرح بالعربية المبسطة. لكل سؤال خاطئ، وضح خطوتين أو ثلاثًا للوصول إلى الإجابة الصحيحة.",
      "اربط الشرح بالخيار الذي اختاره الطالب دون أن تجزم بنيته أو طريقة تفكيره.",
      "لا تغيّر الإجابة الصحيحة، ولا تضف حقائق غير موجودة في نص السؤال أو الشرح الرسمي.",
      "أعد JSON صالحًا فقط بالشكل {\"items\":[{\"questionId\":\"...\",\"feedback\":\"...\"}]}.",
    ].join(" "),
    {
      questions: questions.slice(0, 10).map((question) => ({
        questionId: question.questionId,
        category: question.category,
        subcategory: question.subcategory,
        text: question.text,
        options: question.options,
        studentSelected: question.options[question.selectedIndex],
        correctAnswer: question.options[question.correctIndex],
        officialExplanation: question.explanation,
      })),
    },
  );
  const items = Array.isArray(generated?.items) ? generated.items : [];
  return new Map<string, string>(
    items.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      if (typeof row.questionId !== "string" || typeof row.feedback !== "string") return [];
      return [[row.questionId, row.feedback.replace(/\u0000/g, "").trim().slice(0, 1200)]];
    }),
  );
}

export async function selectAdaptiveQuestions(
  studentId: string,
  limit = 10,
): Promise<{
  category: AdaptiveTestCategory;
  focusSubcategory?: string;
  questions: QuestionRecord[];
}> {
  const evidence = await getTrustedEvidence(studentId);
  const weakAreas = evidence.areas
    .filter((area) => area.totalAttempts >= 2)
    .sort((left, right) => left.accuracy - right.accuracy);
  const focus = weakAreas[0];
  const categories: Array<"verbal" | "quantitative"> = focus
    ? [focus.category]
    : ["quantitative", "verbal"];
  const alreadyAnswered = new Set(evidence.attempts.map((attempt) => attempt.questionId));

  const questionPool = async (category: "verbal" | "quantitative", unseenOnly: boolean) => {
    const filter: Record<string, unknown> = {
      category,
      answerStatus: "approved",
      options: { $type: "array", $ne: [] },
    };
    if (focus && focus.category === category) {
      filter.subcategory = focus.subcategory;
    }
    const rows = await Question.find(filter)
      .select(
        "_id questionId category subcategory text options correctOptionIndex difficulty explanation studentTip answerStatus imageUrl imageUrls source",
      )
      .limit(1200)
      .lean() as unknown as QuestionRecord[];
    return unseenOnly
      ? rows.filter((question) =>
          !alreadyAnswered.has(String(question.questionId)) &&
          !alreadyAnswered.has(String(question._id)),
        )
      : rows;
  };

  const pools = await Promise.all(
    categories.map(async (category) => ({
      category,
      unseen: await questionPool(category, true),
      fallback: await questionPool(category, false),
    })),
  );
  for (const pool of pools) {
    for (let index = pool.unseen.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool.unseen[index], pool.unseen[swapIndex]] =
        [pool.unseen[swapIndex], pool.unseen[index]];
    }
    for (let index = pool.fallback.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool.fallback[index], pool.fallback[swapIndex]] =
        [pool.fallback[swapIndex], pool.fallback[index]];
    }
  }

  const selected: QuestionRecord[] = [];
  for (let index = 0; selected.length < limit && pools.length; index += 1) {
    const pool = pools[index % pools.length];
    const candidates = pool.unseen.length ? pool.unseen : pool.fallback;
    const candidate = candidates.shift();
    if (!candidate || selected.some((question) => String(question._id) === String(candidate._id))) {
      if (pools.every((item) => item.unseen.length === 0 && item.fallback.length === 0)) break;
      continue;
    }
    if (
      !Array.isArray(candidate.options) ||
      candidate.options.length < 2 ||
      !Number.isInteger(candidate.correctOptionIndex) ||
      candidate.correctOptionIndex < 0 ||
      candidate.correctOptionIndex >= candidate.options.length
    ) {
      continue;
    }
    selected.push(candidate);
  }

  return {
    category: focus?.category || (selected.length
      ? selected.every((question) => question.category === selected[0].category)
        ? selected[0].category
        : "mixed"
      : "mixed"),
    focusSubcategory: focus?.subcategory,
    questions: selected,
  };
}
