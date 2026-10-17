import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6163cd9c24f9f40922", page: 11, number: 24, topic: "الهندسة - الزوايا والمستقيمات المتوازية", text: "في الشكل، المستقيمان ℓ وm متوازيان، والخط الأخضر عمودي على ℓ. إذا كانت الزاوية بين القاطع الأزرق والمستقيم m تساوي 30°، فما قيمة x بين القاطع والخط الأخضر؟", options: ["15°", "30°", "60°", "80°"], answer: 2, explanation: "بما أن الخط الأخضر عمودي على المستقيمين المتوازيين، فالزاوية بينه وبين m تساوي 90°. الزاوية بين القاطع وm هي 30°، لذا x = 90° − 30° = 60°." },
  { id: "6ad00e6163cd9c24f9f40923", page: 11, number: 25, topic: "الهندسة - الزوايا والمستقيمات المتوازية", text: "في الشكل، ℓ ∥ m. إذا كانت إحدى الزاويتين اللتين يصنعهما القاطع الأزرق مع m تساوي 110°، وكانت الزاوية بين القاطع الأحمر وℓ تساوي 60°، فما قيمة z بين القاطعين عند ℓ؟", options: ["30°", "50°", "60°", "110°"], answer: 1, explanation: "الزاوية المناظرة عند ℓ بين القاطع الأزرق واتجاه المستقيم إلى اليسار تساوي 110°. والزاوية بين القاطع الأحمر والاتجاه نفسه تساوي 60°؛ إذن z = 110° − 60° = 50°." },
  { id: "6ad00e6163cd9c24f9f40925", page: 11, number: 27, topic: "الجبر - ميل المستقيم", text: "ما ميل المستقيم المار بالنقطتين (1، 1) و(−2، 6)؟", options: ["5/4", "−5/3", "−3/5", "3/5"], answer: 1, explanation: "الميل = (تغير y) ÷ (تغير x) = (6−1) ÷ (−2−1) = 5÷(−3) = −5/3." },
  { id: "6ad00e6163cd9c24f9f40927", page: 12, number: 30, topic: "الجبر - الميل والمستقيمات المتعامدة", text: "ما ميل المستقيم العمودي على المستقيم y = 3x − 3؟", options: ["−3", "−1/3", "1/3", "3"], answer: 1, explanation: "ميل المستقيم المعطى 3. ميل مستقيم عمودي عليه هو المعكوس السالب، أي −1/3." },
  { id: "6ad00e6163cd9c24f9f40928", page: 13, number: 1, topic: "الهندسة - تصنيف المثلثات", text: "مثلث قياسات زواياه 50° و50° و80°. ما نوعه بحسب أضلاعه؟", options: ["قائم الزاوية", "منفرج الزاوية", "متطابق الأضلاع", "متطابق الضلعين"], answer: 3, explanation: "تساوي زاويتين في المثلث يعني تساوي الضلعين المقابلين لهما؛ لذلك المثلث متطابق الضلعين." },
  { id: "6ad00e6163cd9c24f9f4092b", page: 13, number: 4, topic: "الهندسة - المثلثات", text: "المثلث ABC قائم الزاوية ومتطابق الضلعين. ما قياس كل زاوية من زاويتيه الحادتين؟", options: ["60°", "45°", "30°", "20°"], answer: 1, explanation: "مجموع الزاويتين الحادتين في المثلث القائم 90°. ولأن المثلث متطابق الضلعين فهما متساويتان، فتكون كل منهما 90° ÷ 2 = 45°." },
  { id: "6ad00e6163cd9c24f9f4092d", page: 13, number: 6, topic: "الهندسة - الزوايا الداخلية والخارجية للمثلث", text: "في الشكل، ما قياس ∠1؟", options: ["170°", "150°", "100°", "70°"], answer: 1, explanation: "الزاوية الداخلية عند القاعدة اليسرى تساوي 180°−100°=80°. والزاوية المقابلة بالرأس للزاوية 70° تساوي 70°، لذلك زاوية رأس المثلث الداخلية 30°. ∠1 خارجية ومكملة لها، فتساوي 180°−30°=150°." },
  { id: "6ad00e6163cd9c24f9f4092f", page: 14, number: 9, topic: "الهندسة - الزوايا الخارجية للمثلث", text: "مثلث قياسات زاويتين فيه 40° و110°. أي قياس مما يأتي لا يمكن أن يكون قياس زاوية خارجية لهذا المثلث؟", options: ["160°", "150°", "140°", "70°"], answer: 0, explanation: "الزاوية الثالثة 180°−40°−110°=30°. الزوايا الخارجية الممكنة (المجاورة لكل زاوية داخلية) هي 140° و70° و150°؛ لذا 160° غير ممكنة." },
] as const;
const rejected = [
  { id: "6ad00e6163cd9c24f9f4092e", page: 13, note: "رُفض من النشر: لا يمكن الجزم بالمطلوب وموقع الزاوية x من الرسم منخفض الوضوح دون تخمين؛ لم تُنسب إجابة غير موثقة." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const items = [...approved, ...rejected];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: items.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceQuestionNumber sourceBlockIndex sourceBook difficulty status subject")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== items.length) failures.push(`expected ${items.length} source rows, found ${drafts.length}`);
  for (const item of items) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || draft.sourceId !== SOURCE_ID || draft.status !== "pending_review" || !draft.sourceKey?.startsWith(`${SOURCE_ID}:`)) failures.push(`${item.id}: source/page/status mismatch`);
    if (draft?.sourceOrdinal && draft.sourceOrdinal !== SOURCE_ORDINAL) failures.push(`${item.id}: unexpected source ordinal`);
  }
  for (const item of approved) {
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) failures.push(`${item.id}: invalid cleaned options/key`);
    const draft = byId.get(item.id);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`${item.id}: published record already exists`);
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    if (await TahsiliQuestion.exists({ subject: "رياضيات", sourcePage: item.page, sourceQuestionNumber, sourceKey: { $ne: draft?.sourceKey } })) failures.push(`${item.id}: source question-number collision`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: items.length, approved: approved.length, rejected: rejected.length, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approved) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: SOURCE_ID, sourceKey: draft.sourceKey, sourceOrdinal: SOURCE_ORDINAL,
      subject: "رياضيات", subcategory: item.topic, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.topic, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number,
      ...(draft.sourceBlockIndex != null ? { sourceBlockIndex: draft.sourceBlockIndex } : {}),
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: SOURCE_BOOK, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: "pending_review" }, { $set: {
      sourceOrdinal: SOURCE_ORDINAL, status: "approved", subject: "رياضيات", subcategory: item.topic,
      text: item.text, options: [...item.options], explanation: item.explanation, sourceQuestionNumber,
      printedQuestionNumber: item.number, sourceBook: SOURCE_BOOK,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تم التحقق من السؤال والإجابة من صفحة المصدر وحساب الحل يدويًا.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejected) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: "pending_review" }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
