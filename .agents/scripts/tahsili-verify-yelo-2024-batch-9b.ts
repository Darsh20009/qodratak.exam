import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  {
    id: "6ad0150c63cd9c24f9f41978", page: 82, number: 55, subject: "كيمياء",
    text: "أي المعادلات الآتية تمثل احتراقًا كاملًا للميثان؟",
    options: ["H₂+Cl₂→2HCl", "Mg+2HCl→MgCl₂+H₂", "CH₄+2O₂→CO₂+2H₂O", "KOH+HNO₃→KNO₃+H₂O"],
    answer: 2,
    explanation: "الاحتراق الكامل للهيدروكربون يحدث مع الأكسجين وينتج ثاني أكسيد الكربون والماء؛ والمعادلة المعطاة موزونة.",
  },
  {
    id: "6ad0150c63cd9c24f9f4197a", page: 82, number: 57, subject: "كيمياء",
    text: "ما الاسم النظامي للمركب CH₃CH₂CH₂CH₂CH₃؟",
    options: ["بنتان", "هكسان", "بنتين", "هكسين"],
    answer: 0,
    explanation: "يتكون المركب من خمس ذرات كربون وروابط أحادية فقط، لذا فهو الألكان بنتان.",
  },
  {
    id: "6ad0150c63cd9c24f9f4197c", page: 83, number: 59, subject: "كيمياء",
    text: "تحتوي نواة النيتروجين-14 على:",
    options: ["14 نيوترونًا", "14 بروتونًا", "7 بروتونات و7 نيوترونات", "14 بروتونًا و7 إلكترونات"],
    answer: 2,
    explanation: "العدد الذري للنيتروجين 7، أي سبعة بروتونات. والعدد الكتلي 14، فيكون عدد النيوترونات 14−7=7.",
  },
  {
    id: "6ad0150c63cd9c24f9f4197d", page: 84, number: 61, subject: "كيمياء",
    text: "ما الصيغة الصحيحة لمركب كربونات الصوديوم الناتج من اتحاد أيونات الصوديوم مع أيون الكربونات CO₃²⁻؟",
    options: ["NaCO₃", "Na₂(CO₃)₂", "Na₂CO₂", "Na₂CO₃"],
    answer: 3,
    explanation: "شحنة أيون الكربونات −2، وشحنة كل أيون صوديوم +1؛ لذا يلزم أيونا صوديوم لمعادلة الشحنة، وتكون الصيغة Na₂CO₃.",
  },
  {
    id: "6ad0150c63cd9c24f9f4197e", page: 84, number: 62, subject: "كيمياء",
    text: "لا يحدث التفاعل Br₂+NaF→NR لأن:",
    options: ["الفلور أنشط من البروم", "البروم جزيء تساهمي", "التفاعل يفتقد الحرارة", "المتفاعلات غير متجانسة"],
    answer: 0,
    explanation: "لا يستطيع البروم إزاحة الفلوريد من مركبه؛ فالفلور أعلى نشاطًا من البروم في سلسلة الهالوجينات.",
  },
  {
    id: "6ad0150c63cd9c24f9f4197f", page: 84, number: 63, subject: "فيزياء",
    text: "ما الجهاز المستخدم لقياس الضغط الجوي؟",
    options: ["البارومتر", "المانومتر", "النانومتر", "الترمومتر"],
    answer: 0,
    explanation: "يقيس البارومتر الضغط الجوي؛ أما المانومتر فيقيس ضغط غاز محصور، والنانومتر وحدة طول، والترمومتر يقيس الحرارة.",
  },
] as const;
const rejected = [
  { id: "6ad0150c63cd9c24f9f41979", page: 82, number: 56, note: "حُجب السؤال لتكراره سؤال الحرارة الكامنة النوعية للتبخر المعتمد سابقًا في هذا المصدر." },
  { id: "6ad0150c63cd9c24f9f4197b", page: 83, number: 58, note: "حُجب السؤال لتكراره سؤال اختبار الفرضية بالتجربة المعتمد سابقًا في هذا المصدر." },
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
      $set: { status: "approved", subject: item.subject, text: item.text, options: [...item.options], correctOptionIndex: item.answer, explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تم التحقق من الإجابة العلمية وإضافة شرح.", updatedAt: reviewedAt },
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
