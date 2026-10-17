import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  {
    id: "6ad0150c63cd9c24f9f41972", page: 80, number: 49, subject: "كيمياء",
    text: "عنصر عدده الذري 19 وعدده الكتلي 39. كم عدد النيوترونات في نواته؟",
    options: ["19", "20", "39", "48"], answer: 1,
    explanation: "عدد النيوترونات=العدد الكتلي−العدد الذري=39−19=20.",
  },
  {
    id: "6ad0150c63cd9c24f9f41973", page: 80, number: 50, subject: "كيمياء",
    text: "أي المواد الآتية مخلوط متجانس؟",
    options: ["الدم", "الحليب", "السبيكة", "الدخان"], answer: 2,
    explanation: "السبيكة محلول صلب متجانس من فلزات أو من فلز وعنصر آخر؛ أما الدم والحليب والدخان فمخاليط غير متجانسة/غروية.",
  },
  {
    id: "6ad0150c63cd9c24f9f41974", page: 80, number: 51, subject: "كيمياء",
    text: "ما مولارية محلول يحتوي 2mol من المذاب في حجم نهائي مقداره 0.5L؟",
    options: ["4mol/L", "1mol/L", "2mol/L", "0.5mol/L"], answer: 0,
    explanation: "المولارية=عدد مولات المذاب/حجم المحلول باللتر=2/0.5=4mol/L.",
  },
  {
    id: "6ad0150c63cd9c24f9f41976", page: 81, number: 53, subject: "كيمياء",
    text: "ما اسم التغير الذي يغيّر الخواص الفيزيائية للمادة دون تكوين مادة جديدة؟",
    options: ["التغير الفيزيائي", "التغير الكيميائي", "الخاصية الكيميائية", "الخاصية الفيزيائية"], answer: 0,
    explanation: "في التغير الفيزيائي قد تتغير الحالة أو الهيئة، لكن لا تتكون مادة جديدة ولا يتغير التركيب الكيميائي.",
  },
  {
    id: "6ad0150c63cd9c24f9f41977", page: 81, number: 54, subject: "كيمياء",
    text: "ما الاسم النظامي للمركب CH₃CH=CHCH₃؟",
    options: ["بيوت-2-ين", "بيوتاين", "بيوت-3-ين", "بروب-2-ين"], answer: 0,
    explanation: "السلسلة الرئيسة أربع ذرات كربون، والرابطة المزدوجة تبدأ عند الكربون 2 عند الترقيم من الطرف الأقرب؛ الاسم بيوت-2-ين.",
  },
] as const;
const rejected = [
  {
    id: "6ad0150c63cd9c24f9f41975", page: 81, number: 52,
    note: "حُجب السؤال: يقارن ذوبانية فئات كاملة (كحول وألكان وألدهيد وكيتون) من دون تحديد مركبات أو أحجام جزيئية؛ الذوبانية تعتمد على طول السلسلة وبنية كل مركب، فلا توجد إجابة وحيدة موثوقة.",
  },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const items = [...approvals, ...rejected];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: items.map((item) => item.id) }, sourceId: SOURCE_ID, status: "pending_review" })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook difficulty topic").lean() as any[];
  const byId = new Map(drafts.map((d) => [String(d._id), d]));
  const failures: string[] = [];
  if (drafts.length !== items.length) failures.push(`expected ${items.length} pending rows, found ${drafts.length}`);
  for (const item of items) if (!byId.has(item.id) || byId.get(item.id).sourcePage !== item.page) failures.push(`q${item.number}: source/page mismatch`);
  for (const item of approvals) if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid options/key`);
  const existing = await TahsiliQuestion.find({ sourceKey: { $in: drafts.map((d) => d.sourceKey) } }).select("sourceKey").lean();
  if (existing.length) failures.push(`found ${existing.length} already-published rows`);
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, reviewed: drafts.length, approved: approvals.length, rejected: rejected.length, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const d = byId.get(item.id)!;
    await TahsiliQuestion.create({
      questionId: d.questionId, sourceId: d.sourceId, sourceKey: d.sourceKey, sourceOrdinal: d.sourceOrdinal,
      subject: item.subject, subcategory: item.subject, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: d.difficulty || "intermediate", topic: d.topic || item.subject, explanation: item.explanation,
      sourcePage: d.sourcePage, sourceQuestionNumber: d.sourceOrdinal * 100_000 + d.sourcePage * 100 + d.sourceBlockIndex,
      printedQuestionNumber: item.number, sourceBlockIndex: d.sourceBlockIndex, sourceBook: d.sourceBook,
      answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, createdAt: reviewedAt, updatedAt: reviewedAt,
    });
    await TahsiliQuestionDraft.updateOne({ _id: d._id, status: "pending_review" }, {
      $set: { status: "approved", subject: item.subject, text: item.text, options: [...item.options], correctOptionIndex: item.answer, explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تم التحقق من الحساب والمفتاح العلمي وإضافة شرح.", updatedAt: reviewedAt },
    });
  }
  for (const item of rejected) await TahsiliQuestionDraft.updateOne(
    { _id: item.id, sourceId: SOURCE_ID, sourcePage: item.page, status: "pending_review" },
    { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt } },
  );
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
