import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6363cd9c24f9f409f5", page: 81, number: 18, topic: "الأعداد المركبة - نظرية ديموافر", text: "ما قيمة [2(cos22.5°+i sin22.5°)]⁴؟", options: ["−16", "−16i", "16", "16i"], answer: 3, explanation: "باستخدام مبرهنة ديموافر: نرفع المقياس 2 إلى القوة الرابعة فنحصل على 16، ونضرب الزاوية 22.5° في 4 فنحصل على 90°. إذن الناتج 16(cos90°+i sin90°)=16i." },
  { id: "6ad00e6363cd9c24f9f409f6", page: 81, number: 19, topic: "الأعداد المركبة - نظرية ديموافر", text: "ما قيمة (cos15°+i cos75°)⁶؟", options: ["1", "−1", "i", "−i"], answer: 2, explanation: "cos75°=sin15°، لذلك الأساس cos15°+i sin15° مقداره 1 وزاويته 15°. برفعه للقوة السادسة تصبح الزاوية 90°، والناتج i." },
  { id: "6ad00e6363cd9c24f9f409f7", page: 81, number: 20, topic: "الأعداد المركبة - الجذور التكعيبية", text: "عند إيجاد الجذور التكعيبية للعدد المركب 8(cos(π/2)+i sin(π/2))، فما مقياس الجذر الثاني؟", options: ["1", "2", "4", "8"], answer: 1, explanation: "مقياس كل جذر تكعيبي يساوي الجذر التكعيبي لمقياس العدد الأصلي: ∛8=2؛ فجميع الجذور، ومنها الثاني، مقياسها 2." },
  { id: "6ad00e6363cd9c24f9f409f8", page: 81, number: 21, topic: "الأعداد المركبة - الجذور الخامسية", text: "عند إيجاد الجذور الخامسية للعدد 3(cosπ+i sinπ)، ما سعة الجذر الأول؟", options: ["π/5", "π/3", "π", "5π"], answer: 0, explanation: "سعة الجذر الأول تساوي سعة العدد مقسومة على 5: π/5." },
  { id: "6ad00e6363cd9c24f9f409f9", page: 81, number: 22, topic: "الأعداد المركبة - الجذور الرباعية", text: "عند إيجاد الجذور الرباعية للعدد 1، فما مقياس الجذر الثالث؟", options: ["1", "2", "3", "4"], answer: 0, explanation: "مقياس كل جذر رابع يساوي الجذر الرابع لمقياس العدد: ⁴√1=1." },
  { id: "6ad00e6363cd9c24f9f409fa", page: 82, number: 1, topic: "النهايات - القراءة من التمثيل البياني", text: "من التمثيل البياني، ما قيمة lim(x→−2) f(x)؟", options: ["−2", "−1", "0", "غير موجودة"], answer: 1, explanation: "عند اقتراب x من −2 من اليمين واليسار تقترب قيم f(x) من −1؛ لذلك النهاية تساوي −1 حتى لو لم تكن قيمة الدالة عند النقطة −1." },
  { id: "6ad00e6363cd9c24f9f409fe", page: 83, number: 13, topic: "النهايات - النهايات الجبرية", text: "ما قيمة lim(x→4)(4x−1)؟", options: ["4", "8", "12", "15"], answer: 3, explanation: "الدالة كثيرة حدود متصلة، لذا نعوض مباشرة: 4(4)−1=15." },
  { id: "6ad00e6363cd9c24f9f409ff", page: 83, number: 14, topic: "النهايات - النهايات الجبرية", text: "ما قيمة lim(x→5)(3x³−5x²−3x−10)؟", options: ["125", "225", "275", "−225"], answer: 1, explanation: "نعوض x=5: 3(125)−5(25)−3(5)−10=375−125−15−10=225." },
  { id: "6ad00e6363cd9c24f9f40a00", page: 83, number: 15, topic: "النهايات - النهايات الجبرية", text: "ما قيمة lim(x→0)(4ˣ−cos x+2x−1)؟", options: ["−2", "−1", "1", "2"], answer: 1, explanation: "بالتعويض المباشر: 4⁰−cos(0)+2(0)−1=1−1+0−1=−1." },
  { id: "6ad00e6363cd9c24f9f40a01", page: 84, number: 18, topic: "النهايات - التعويض المباشر", text: "ما قيمة lim(x→5)(x+1)/(x²+3)؟", options: ["5", "5/28", "3/14", "28"], answer: 2, explanation: "المقام عند x=5 لا يساوي صفرًا، لذا نعوض مباشرة: (5+1)/(25+3)=6/28=3/14." },
  { id: "6ad00e6363cd9c24f9f40a02", page: 85, number: 27, topic: "النهايات - النهايات عند اللانهاية", text: "ما قيمة lim(x→∞)(3x−1)/(2x+5)؟", options: ["−1/5", "0", "3/2", "∞"], answer: 2, explanation: "درجتا البسط والمقام متساويتان؛ النهاية تساوي نسبة معاملي الحدين الرئيسين 3/2." },
  { id: "6ad00e6363cd9c24f9f40a03", page: 85, number: 28, topic: "النهايات - النهايات عند اللانهاية", text: "ما قيمة lim(x→∞)(10x⁴−2)/(5x⁴+3x³−2x)؟", options: ["10", "5", "2", "0"], answer: 2, explanation: "درجتا البسط والمقام متساويتان، فنأخذ نسبة معاملي x⁴: 10/5=2." },
  { id: "6ad00e6363cd9c24f9f40a04", page: 85, number: 29, topic: "النهايات - النهايات عند اللانهاية", text: "إذا كان lim(x→∞) Ax²/(3+x|x|)=2، فما قيمة A؟", options: ["6", "2", "−2", "−6"], answer: 1, explanation: "عندما x→∞ يكون |x|=x، فيصبح المقام 3+x². بقسمة البسط والمقام على x² تؤول النهاية إلى A؛ وبما أنها 2، إذن A=2." },
  { id: "6ad00e6363cd9c24f9f40a05", page: 85, number: 30, topic: "النهايات - النهايات عند اللانهاية", text: "ما قيمة lim(x→∞)(10x³−12x)/(5+3x²−2x³)؟", options: ["−5", "−2", "2", "5"], answer: 0, explanation: "درجتا البسط والمقام متساويتان، ونسبة معاملي x³ هي 10/(−2)=−5." },
  { id: "6ad00e6363cd9c24f9f40a06", page: 86, number: 1, topic: "الاشتقاق - مشتقة الثابت", text: "إذا كانت f(x)=√7، فما قيمة f′(x)؟", options: ["√7", "√7/2", "0", "1/(2√7)"], answer: 2, explanation: "√7 ثابت لا يعتمد على x، ومشتقة أي ثابت تساوي صفرًا." },
  { id: "6ad00e6363cd9c24f9f40a07", page: 87, number: 9, topic: "الاشتقاق - قاعدة الضرب", text: "إذا كانت f(x)=(x²−4)(2x−5)، فما f′(x)؟", options: ["4x²−10x", "x²−8", "6x²−10x−8", "2x²−10x−4"], answer: 2, explanation: "باستخدام قاعدة الضرب: f′=2x(2x−5)+2(x²−4)=4x²−10x+2x²−8=6x²−10x−8." },
  { id: "6ad00e6363cd9c24f9f40a08", page: 87, number: 10, topic: "الاشتقاق - قاعدة الضرب", text: "إذا كان f₁(x)=sin x وf₂(x)=cos x، فما المشتقة الأولى لحاصل الضرب f₁(x)f₂(x)؟", options: ["sin²x", "sin²x+cos²x", "−cos²x", "cos²x−sin²x"], answer: 3, explanation: "بقاعدة الضرب: (sin x cos x)′=cos²x−sin²x." },
  { id: "6ad00e6363cd9c24f9f40a09", page: 87, number: 11, topic: "الاشتقاق - قاعدة القسمة", text: "إذا كانت f(x)=7/(x+5)، فما f′(x)؟", options: ["−7/(x+5)", "7/(x+5)", "−7/(x+5)²", "7/(x+5)²"], answer: 2, explanation: "نكتب f(x)=7(x+5)⁻¹؛ وبقاعدة القوة f′(x)=−7(x+5)⁻²=−7/(x+5)²." },
  { id: "6ad00e6363cd9c24f9f40a0a", page: 87, number: 13, topic: "الاشتقاق - القيم القصوى المحلية", text: "باستخدام اختبار المشتقة الثانية، ما إحداثيا نقطتي القيمة العظمى والصغرى (بالترتيب) للدالة f(x)=2+3x−x³؟", options: ["(+1,−1)", "(−1,+1)", "(+3,−3)", "(−3,+3)"], answer: 0, explanation: "f′(x)=3−3x²=0 عند x=±1. وبما أن f″(x)=−6x، فالنقطة عند x=1 عظمى محلية وعند x=−1 صغرى محلية؛ والترتيب المطلوب (+1,−1)." },
  { id: "6ad00e6363cd9c24f9f40a0b", page: 88, number: 15, topic: "التكامل - التطبيقات الحركية", text: "قذف حارس مرمى الكرة إلى أعلى، وكان ارتفاعها بعد t ثانية s(t)=20t−2t²+3 مترًا. ما أقصى ارتفاع تصل إليه قبل أن تسقط؟", options: ["153 مترًا", "53 مترًا", "50 مترًا", "5 أمتار"], answer: 1, explanation: "الارتفاع دالة تربيعية مفتوحة إلى الأسفل، وتبلغ أقصاها عند t=−b/(2a)=−20/(2×−2)=5 ثوانٍ. بالتعويض s(5)=100−50+3=53 مترًا." },
  { id: "6ad00e6363cd9c24f9f40a0c", page: 89, number: 22, topic: "التكامل غير المحدد - قاعدة القوة", text: "ما قيمة ∫(3/2)√x dx؟", options: ["√x+C", "(9/4)√x+C", "x√x+C", "(3/2)x√x+C"], answer: 2, explanation: "∫(3/2)x^(1/2)dx=(3/2)×(2/3)x^(3/2)+C=x^(3/2)+C=x√x+C." },
  { id: "6ad00e6363cd9c24f9f40a0d", page: 89, number: 23, topic: "التكامل المحدد - مبرهنة القيم الأساسية", text: "ما قيمة ∫ من 2 إلى 3 (4x+1) dx؟", options: ["10", "11", "20", "21"], answer: 1, explanation: "مضاد الاشتقاق 2x²+x. بالتعويض: [2x²+x]₂³=(18+3)−(8+2)=11." },
  { id: "6ad00e6363cd9c24f9f40a0e", page: 89, number: 25, topic: "التكامل المحدد - إيجاد حد التكامل", text: "إذا كان ∫ من 1 إلى n 4x³ dx=15، فما قيمة n؟", options: ["1/4", "2", "4", "8"], answer: 1, explanation: "∫₁ⁿ4x³dx=[x⁴]₁ⁿ=n⁴−1. إذن n⁴−1=15، فيكون n⁴=16؛ والحد الموجب n=2." },
  { id: "6ad00e6363cd9c24f9f40a0f", page: 89, number: 26, topic: "التكامل المحدد - إيجاد ثابت", text: "إذا كان ∫ من 0 إلى 4 (x+k) dx=20، فما قيمة k؟", options: ["−7", "−3", "3", "7"], answer: 2, explanation: "قيمة التكامل [x²/2+kx]₀⁴=8+4k. وبمساواتها بـ20: 4k=12، ومنه k=3." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = approved.map((item) => item.id);
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
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approved.length, rejected: 0, changed: false };
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
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
