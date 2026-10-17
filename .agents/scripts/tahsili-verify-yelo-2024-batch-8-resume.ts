import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f4196c", page: 77, number: 41, subject: "أحياء",
    text: "أي اقتران يوضح الارتباط التكميلي الصحيح للقواعد في DNA؟",
    options: ["A–T وC–G", "G–T وA–C", "A–G وC–T", "U–C وA–G"],
    answer: 0,
    explanation: "في DNA يرتبط الأدينين بالثايمين (A–T)، ويرتبط السيتوسين بالجوانين (C–G).",
  },
  {
    id: "6ad0150c63cd9c24f9f4196d", page: 77, number: 42, subject: "كيمياء",
    text: "ما ناتج أكسدة الإيثانال CH₃CHO أكسدة مناسبة؟",
    options: ["حمض الإيثانويك CH₃COOH", "الإيثانول CH₃CH₂OH", "ثنائي إيثيل إيثر", "بروبانون"],
    answer: 0,
    explanation: "تؤكسد مجموعة الألدهيد −CHO إلى مجموعة كربوكسيل −COOH؛ لذلك يتحول الإيثانال إلى حمض الإيثانويك.",
  },
  {
    id: "6ad0150c63cd9c24f9f4196e", page: 78, number: 43, subject: "فيزياء",
    text: "عند ثبوت درجة الحرارة وكمية الغاز، كيف تتغير قيمة الحجم مع الضغط؟",
    options: ["تتناسب طرديًا", "تتناسب عكسيًا", "لا يتأثر الحجم بتغير الضغط", "لا تؤثر درجة الحرارة"],
    answer: 1,
    explanation: "وفق قانون بويل، عند ثبوت درجة الحرارة يكون حاصل ضرب الضغط في الحجم ثابتًا؛ لذلك يتناسب الحجم عكسيًا مع الضغط.",
  },
  {
    id: "6ad0150c63cd9c24f9f41970", page: 78, number: 45, subject: "كيمياء",
    text: "كيف يمكن فصل الماء إلى مكوّنيه، الهيدروجين والأكسجين؟",
    options: ["الترشيح", "التسامي", "التبلور", "التحليل الكهربائي"],
    answer: 3,
    explanation: "الماء مركب كيميائي؛ يُفكك إلى الهيدروجين والأكسجين بالتحليل الكهربائي، لا بطرق الفصل الفيزيائية مثل الترشيح.",
  },
  {
    id: "6ad0150c63cd9c24f9f41971", page: 79, number: 48, subject: "كيمياء",
    text: "لتفاعل يضم أربع مواد كيميائية مختلفة، كم نسبة مولية مرتبة يمكن كتابتها بين أزواج المواد المختلفة؟",
    options: ["12", "6", "20", "18"],
    answer: 0,
    explanation: "لكل مادة أولى توجد ثلاثة اختيارات لمادة ثانية مختلفة؛ إذن عدد النسب المولية المرتبة=4×3=12.",
  },
] as const;

const rejected = [
  { id: "6ad0150c63cd9c24f9f41960", page: 71, number: 24, note: "حُجب السؤال لتكراره سؤال مطياف الكتلة المعتمد سابقًا في هذا المصدر." },
  { id: "6ad0150c63cd9c24f9f41961", page: 72, number: 25, note: "حُجب السؤال: يخلط بين القواعد النيتروجينية والأحماض الأمينية؛ لا توجد إجابة صحيحة كما طُبع." },
  { id: "6ad0150c63cd9c24f9f41968", page: 75, number: 36, note: "حُجب السؤال لتكراره سؤال تعريف التأثير الكهروضوئي المعتمد سابقًا في هذا المصدر." },
  { id: "6ad0150c63cd9c24f9f41969", page: 76, number: 38, note: "حُجب السؤال لتكراره سؤال الإيثيلين ونضج الثمار المعتمد سابقًا في هذا المصدر." },
  { id: "6ad0150c63cd9c24f9f4196f", page: 78, number: 44, note: "حُجب السؤال لتكراره علاقة دي برولي ومعنى الطول الموجي المعتمد سابقًا في هذا المصدر." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const allItems = [...approvals, ...rejected];
  const drafts = await TahsiliQuestionDraft.find({
    _id: { $in: allItems.map((item) => item.id) },
    sourceId: SOURCE_ID,
    status: "pending_review",
  })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook difficulty topic")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== allItems.length) failures.push(`expected ${allItems.length} remaining pending rows, found ${drafts.length}`);
  for (const item of allItems) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) failures.push(`q${item.number}: source/page mismatch`);
  }
  for (const item of approvals) {
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) {
      failures.push(`q${item.number}: invalid options or answer`);
    }
  }
  const published = await TahsiliQuestion.find({ sourceKey: { $in: drafts.map((draft) => draft.sourceKey) } })
    .select("sourceKey").lean();
  if (published.length) failures.push(`found ${published.length} already-published remaining rows`);
  if (failures.length) {
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", reviewed: drafts.length, failures }, null, 2));
    throw new Error("Resume preflight failed; no records were changed.");
  }
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, reviewed: drafts.length, approved: approvals.length, rejected: rejected.length, changed: false };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const questionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.create({
      questionId: draft.questionId,
      sourceId: draft.sourceId,
      sourceKey: draft.sourceKey,
      sourceOrdinal: draft.sourceOrdinal,
      subject: item.subject,
      subcategory: item.subject,
      text: item.text,
      options: [...item.options],
      correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate",
      topic: draft.topic || item.subject,
      explanation: item.explanation,
      sourcePage: draft.sourcePage,
      sourceQuestionNumber: questionNumber,
      printedQuestionNumber: item.number,
      sourceBlockIndex: draft.sourceBlockIndex,
      sourceBook: draft.sourceBook,
      answerConfidence: "verified",
      reviewedBy: REVIEWER,
      reviewedAt,
      createdAt: reviewedAt,
      updatedAt: reviewedAt,
    });
    const result = await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      { $set: { status: "approved", subject: item.subject, text: item.text, options: [...item.options], correctOptionIndex: item.answer, explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال والحل ومفتاح الإجابة علميًا وإضافة شرح توضيحي.", updatedAt: reviewedAt } },
    );
    if (result.modifiedCount !== 1) throw new Error(`Question ${item.number} was published but its draft review status did not update.`);
  }
  for (const item of rejected) {
    const result = await TahsiliQuestionDraft.updateOne(
      { _id: item.id, sourceId: SOURCE_ID, sourcePage: item.page, status: "pending_review" },
      { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt } },
    );
    if (result.modifiedCount !== 1) throw new Error(`Could not reject question ${item.number}.`);
  }
  summary.changed = true;
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Resume batch failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromMongoDB();
  });
