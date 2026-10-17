import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  {
    id: "6ad0150c63cd9c24f9f41980", page: 85, number: 65, subject: "فيزياء",
    text: "ما المقصود بالموائع؟",
    options: ["السوائل فقط", "الغازات فقط", "البلازما فقط", "السوائل والغازات"],
    answer: 3,
    explanation: "الموائع مواد قابلة للجريان والتشكل وفق الوعاء، وتشمل السوائل والغازات.",
  },
  {
    id: "6ad0150c63cd9c24f9f41981", page: 85, number: 66, subject: "كيمياء",
    text: "ما عدد تأكسد النيتروجين في حمض النيتريك HNO₃؟",
    options: ["+6", "−2", "+5", "−5"],
    answer: 2,
    explanation: "في جزيء متعادل: (+1)+x+3(−2)=0؛ إذن عدد تأكسد النيتروجين x=+5.",
  },
  {
    id: "6ad0150c63cd9c24f9f41982", page: 86, number: 67, subject: "كيمياء",
    text: "ما أقصى عدد من الإلكترونات التي يستوعبها مستوى الطاقة الرئيس الثالث؟",
    options: ["2", "8", "18", "32"],
    answer: 2,
    explanation: "السعة القصوى لمستوى رئيس رقمه n تساوي 2n²؛ وعند n=3 تكون 2×3²=18 إلكترونًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f41983", page: 86, number: 68, subject: "كيمياء",
    text: "إلى أي مجموعة وظيفية ينتمي المركب CH₃NH₂؟",
    options: ["أميد", "أمين", "إيثر", "كحول"],
    answer: 1,
    explanation: "يحتوي CH₃NH₂ على مجموعة أمين −NH₂ مرتبطة بمجموعة ألكيل، لذا يصنف أمينًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f41984", page: 86, number: 69, subject: "كيمياء",
    text: "لتحويل الإيثانول CH₃CH₂OH إلى ألكين، ما التغير المناسب؟",
    options: ["إضافة جزيء ماء", "حذف جزيء ماء", "إضافة جزيء هيدروجين", "حذف جزيء هيدروجين"],
    answer: 1,
    explanation: "نزع الماء من الإيثانول (تفاعل حذف/تجفيف) يكوّن الإيثين، وهو ألكين.",
  },
  {
    id: "6ad0150c63cd9c24f9f41985", page: 87, number: 71, subject: "كيمياء",
    text: "يوضح الشكل المركب CH₃CONH₂. إلى أي فئة ينتمي؟",
    options: ["أميد", "كحول", "أمين", "بلازما"],
    answer: 0,
    explanation: "تحتوي البنية على مجموعة كربونيل مرتبطة مباشرة بذرة نيتروجين (−CONH₂)، لذا تصنف أميدًا لا أمينًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f41986", page: 88, number: 73, subject: "كيمياء",
    text: "يقع الفسفور P، وعدده الذري 15، في أي دورة من الجدول الدوري؟",
    options: ["الأولى", "الثالثة", "الثانية", "الرابعة"],
    answer: 1,
    explanation: "التوزيع الإلكتروني للفسفور 2،8،5؛ لذلك لديه ثلاثة مستويات طاقة مشغولة ويقع في الدورة الثالثة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41987", page: 88, number: 74, subject: "كيمياء",
    text: "ما نوع التفاعل العام: حمض + قاعدة → ملح + ماء؟",
    options: ["احتراق", "إحلال بسيط", "إحلال مزدوج/تعادل", "تفكك"],
    answer: 2,
    explanation: "يتفاعل الحمض مع القاعدة بتبادل الأيونات، فتتكون أملاح وماء؛ وهو تفاعل تعادل من نوع الإحلال المزدوج.",
  },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = approvals.map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: ids }, sourceId: SOURCE_ID, status: "pending_review" })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook difficulty topic").lean() as any[];
  const byId = new Map(drafts.map((d) => [String(d._id), d]));
  const failures: string[] = [];
  if (drafts.length !== approvals.length) failures.push(`expected ${approvals.length} pending rows, found ${drafts.length}`);
  for (const item of approvals) if (!byId.has(item.id) || byId.get(item.id).sourcePage !== item.page) failures.push(`q${item.number}: source/page mismatch`);
  for (const item of approvals) if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid options/key`);
  const existing = await TahsiliQuestion.find({ sourceKey: { $in: drafts.map((d) => d.sourceKey) } }).select("sourceKey").lean();
  if (existing.length) failures.push(`found ${existing.length} already-published rows`);
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, reviewed: drafts.length, approved: approvals.length, rejected: 0, changed: false };
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
      $set: { status: "approved", subject: item.subject, text: item.text, options: [...item.options], correctOptionIndex: item.answer, explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال المصور أو المعلومة العلمية وإضافة شرح توضيحي.", updatedAt: reviewedAt },
    });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
