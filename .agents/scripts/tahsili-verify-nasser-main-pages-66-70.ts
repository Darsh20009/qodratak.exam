import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6163cd9c24f9f409c7", page: 67, number: 1, topic: "العلاقات والدوال الأسية - المقطع الصادي", text: "منحنى الدالة الأسية f(x)=(1/2)^x يقطع محور y عند أي نقطة؟", options: ["(0,0)", "(0,1)", "(1,0)", "(1,1)"], answer: 1, explanation: "المقطع الصادي يحدث عند x=0؛ وبالتعويض f(0)=(1/2)^0=1، فتكون نقطة التقاطع (0,1)." },
  { id: "6ad00e6163cd9c24f9f409c8", page: 67, number: 3, topic: "العلاقات والدوال الأسية - المعادلات", text: "إذا كانت 9^(x+2)=3^(x+7)، فما قيمة x؟", options: ["2", "3", "4", "5"], answer: 1, explanation: "نكتب 9=3²؛ فيصبح 3^(2x+4)=3^(x+7). بمساواة الأسس: 2x+4=x+7، ومنه x=3." },
  { id: "6ad00e6163cd9c24f9f409c9", page: 67, number: 4, topic: "العلاقات والدوال الأسية - المعادلات", text: "ما قيمة x التي تحقق المعادلة 7^(x−1)+7=8؟", options: ["−1", "0", "1", "2"], answer: 2, explanation: "بطرح 7 من الطرفين نحصل على 7^(x−1)=1=7^0؛ إذن x−1=0 ومنها x=1." },
  { id: "6ad00e6163cd9c24f9f409ca", page: 67, number: 5, topic: "العلاقات والدوال الأسية - المعادلات", text: "ما قيمة x التي تحقق 2/[−4^(1−x)]=−2؟", options: ["2", "1", "−1", "−2"], answer: 1, explanation: "من 2/[−4^(1−x)]=−2 ينتج 4^(1−x)=1=4^0؛ لذا 1−x=0 وx=1." },
  { id: "6ad00e6163cd9c24f9f409cb", page: 67, number: 7, topic: "المتباينات الأسية", text: "ما قيم x التي تحقق المتباينة (1/2)^x−1/8<0؟", options: ["x<−8", "x<−3", "x>1/2", "x>3"], answer: 3, explanation: "(1/2)^x<1/8=(1/2)^3. ولأن الأساس بين صفر وواحد، تنعكس المقارنة بين الأسس، فنحصل على x>3." },
  { id: "6ad00e6163cd9c24f9f409cc", page: 67, number: 8, topic: "المتباينات الأسية", text: "ما قيم x التي تحقق المتباينة 9^(x−2)>(1/27)^x؟", options: ["x<−2", "x>3", "x>4/5", "x<5/4"], answer: 2, explanation: "نحوّل الطرفين إلى أساس 3: 3^(2x−4)>3^(−3x). ولأن الأساس أكبر من 1 نقارن الأسس: 2x−4>−3x، ومنه x>4/5." },
  { id: "6ad00e6163cd9c24f9f409cd", page: 68, number: 9, topic: "اللوغاريتمات - التحويل بين الصيغ", text: "إذا كان log₂(x)=3، فما قيمة x؟", options: ["2", "3", "5", "8"], answer: 3, explanation: "من تعريف اللوغاريتم log₂(x)=3 يكافئ x=2³؛ إذن x=8." },
  { id: "6ad00e6163cd9c24f9f409ce", page: 69, number: 18, topic: "اللوغاريتمات - خصائص اللوغاريتمات", text: "ما قيمة المقدار log₃(13)−log₃(5) بصيغة لوغاريتم واحد؟", options: ["log₅(13)", "log₃(13/5)", "log₁₃(5)", "13/5"], answer: 1, explanation: "خاصية القسمة: log₃(13)−log₃(5)=log₃(13/5)." },
  { id: "6ad00e6163cd9c24f9f409cf", page: 69, number: 19, topic: "اللوغاريتمات - تعريف اللوغاريتم", text: "ما قيمة log_(1/6)(1/216)؟", options: ["1", "2", "3", "6"], answer: 2, explanation: "(1/6)^3=1/216؛ لذلك log_(1/6)(1/216)=3." },
  { id: "6ad00e6163cd9c24f9f409d0", page: 69, number: 20, topic: "اللوغاريتمات - خصائص اللوغاريتمات", text: "ما قيمة log₂(log₂(2^24))−log₂(log₂(2^3))؟", options: ["2", "3", "4", "8"], answer: 1, explanation: "العبارة تساوي log₂(24)−log₂(3)=log₂(24/3)=log₂(8)=3." },
  { id: "6ad00e6163cd9c24f9f409d1", page: 69, number: 21, topic: "اللوغاريتمات - خصائص اللوغاريتمات", text: "ما قيمة 3log₃(9)−log₅(1/25)؟", options: ["12", "10", "8", "4"], answer: 2, explanation: "log₃(9)=2 وlog₅(1/25)=−2؛ إذن 3×2−(−2)=8." },
  { id: "6ad00e6163cd9c24f9f409d2", page: 69, number: 22, topic: "اللوغاريتمات - خصائص اللوغاريتمات", text: "بسّط المقدار log₅(x+1)+log₅(x)−2log₅(1+x)، حيث تكون اللوغاريتمات معرفة.", options: ["3log₅(x)−log₅(1)", "3log₅(x)", "log₅(x³)", "log₅(x/(1+x))"], answer: 3, explanation: "لأن 1+x=x+1، نجمع الحدود: log₅(x+1)+log₅(x)−2log₅(x+1)=log₅(x)−log₅(x+1)=log₅(x/(1+x))." },
  { id: "6ad00e6163cd9c24f9f409d3", page: 69, number: 23, topic: "اللوغاريتمات - تعريف اللوغاريتم", text: "ما قيمة log₁₀₀(10)؟", options: ["1", "−1", "1/2", "2"], answer: 2, explanation: "100^(1/2)=10؛ لذلك log₁₀₀(10)=1/2." },
  { id: "6ad00e6163cd9c24f9f409d4", page: 69, number: 24, topic: "اللوغاريتمات - مدى الدالة", text: "إذا كانت f(x)=log(x) (أساس 10) حيث 1≤x≤10، فأي مدى يحقق f؟", options: ["1≤f(x)≤10", "0≤f(x)≤1", "0≤f(x)≤10", "10≤f(x)≤100"], answer: 1, explanation: "الدالة اللوغاريتمية متزايدة؛ f(1)=0 وf(10)=1، لذا 0≤f(x)≤1." },
  { id: "6ad00e6163cd9c24f9f409d5", page: 70, number: 1, topic: "القطوع المخروطية - القطع المكافئ", text: "ما طول الوتر البؤري للقطع المكافئ (y−5)²=8(x−3)؟", options: ["3 وحدات", "5 وحدات", "8 وحدات", "10 وحدات"], answer: 2, explanation: "الصيغة القياسية (y−k)²=4p(x−h)، وطول الوتر البؤري |4p|. هنا 4p=8؛ لذلك الطول 8 وحدات." },
] as const;
const rejected = [
  { id: "6ad00e6163cd9c24f9f409c6", page: 66, note: "رُفض من النشر: السجل يخلط شرح الدوال الأم والتحويلات مع عدة أسئلة من الصفحة؛ لا يمكن فصله إلى سؤال واحد وخيارات صحيحة دون إنشاء أسئلة جديدة من سجل مدمج." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = [...approved, ...rejected].map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: ids }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceQuestionNumber sourceBlockIndex sourceBook difficulty status subject sourceImageObjectKey")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== ids.length) failures.push(`expected ${ids.length} source rows, found ${drafts.length}`);
  for (const item of approved) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || draft.sourceId !== SOURCE_ID || draft.status !== "pending_review" || !draft.sourceKey?.startsWith(`${SOURCE_ID}:`)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (draft?.sourceOrdinal && draft.sourceOrdinal !== SOURCE_ORDINAL) failures.push(`q${item.number} p${item.page}: unexpected source ordinal`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: published record already exists`);
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    if (await TahsiliQuestion.exists({ subject: "رياضيات", sourcePage: item.page, sourceQuestionNumber, sourceKey: { $ne: draft?.sourceKey } })) failures.push(`q${item.number} p${item.page}: source question-number collision`);
  }
  for (const item of rejected) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || draft.sourceId !== SOURCE_ID || draft.status !== "pending_review") failures.push(`rejection p${item.page}: source/page/status mismatch`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approved.length, rejected: rejected.length, changed: false };
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
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تم التحقق من نص السؤال وخياراته وحلّه يدويًا من صفحة المصدر.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejected) {
    await TahsiliQuestionDraft.updateOne({ _id: item.id, sourceId: SOURCE_ID, status: "pending_review" }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
