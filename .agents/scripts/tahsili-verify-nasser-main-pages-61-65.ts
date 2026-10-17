import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6163cd9c24f9f409b6", page: 61, number: 37, topic: "حساب المثلثات - المتطابقات", text: "ما المتطابقة المكافئة لـ cos⁴θ−sin⁴θ؟", options: ["cos4θ", "sin4θ", "cos2θ", "sin2θ"], answer: 2, explanation: "نحلل فرق مربعين: (cos²θ−sin²θ)(cos²θ+sin²θ). وبما أن cos²θ+sin²θ=1، تصبح العبارة cos²θ−sin²θ=cos2θ." },
  { id: "6ad00e6163cd9c24f9f409b7", page: 61, number: 39, topic: "حساب المثلثات - نصف الزاوية", text: "إذا كان cosθ=1/2 و0°<θ<90°، فما قيمة cos(θ/2)؟", options: ["√3/2", "√2/2", "√3/4", "3/4"], answer: 0, explanation: "ضمن الربع الأول، cosθ=1/2 يعني θ=60°. إذن θ/2=30°، وcos30°=√3/2." },
  { id: "6ad00e6163cd9c24f9f409b8", page: 62, number: 41, topic: "حساب المثلثات - الدوال العكسية", text: "ما قياس الزاوية sin⁻¹(√2/2)؟", options: ["−45°", "45°", "90°", "180°"], answer: 1, explanation: "قيمة sin45° تساوي √2/2، و45° تقع ضمن المجال الرئيس لدالة الجيب العكسية؛ إذن الناتج 45°." },
  { id: "6ad00e6163cd9c24f9f409b9", page: 63, number: 1, topic: "تحليل الدوال - قراءة الرسم البياني", text: "يمثل الشكل منحنى الدالة y=f(x). ما قيمة f(2)؟", options: ["10", "1", "4", "2"], answer: 2, explanation: "نقرأ قيمة y من الرسم عند x=2؛ يمر المنحنى بالنقطة (2,4)، لذلك f(2)=4." },
  { id: "6ad00e6163cd9c24f9f409bb", page: 63, number: 3, topic: "تحليل الدوال - مدى الدالة", text: "ما مدى الدالة الممثلة في الشكل؟", options: ["[0,4]", "(0,4]", "(0,4)", "(-4,4)−{0}"], answer: 1, explanation: "طرفا المنحنى عند y=0 مفتوحان فلا تدخل الصفر في المدى، بينما يصل المنحنى إلى القيمة 4؛ لذا المدى (0,4]." },
  { id: "6ad00e6163cd9c24f9f409bd", page: 63, number: 5, topic: "تحليل الدوال - أصفار الدالة", text: "إذا كانت f(x)=x²−3، فعند أي نقطتين تقطع الدالة محور x؟", options: ["(0,−3)", "(−3,0)", "(3,0)", "(−√3,0) و(√3,0)"], answer: 3, explanation: "نجد نقاط التقاطع بحل x²−3=0؛ ومنه x=±√3، فتكون النقطتان (−√3,0) و(√3,0)." },
  { id: "6ad00e6163cd9c24f9f409be", page: 63, number: 6, topic: "تحليل الدوال - المقطع الصادي", text: "من الرسم البياني، ما نقطة تقاطع الدالة مع محور y؟", options: ["(0,2)", "(2,0)", "(0,1)", "(1,0)"], answer: 2, explanation: "يقطع المنحنى محور y عندما x=0؛ ومن الرسم تكون قيمة y عند هذه النقطة 1، إذن نقطة التقاطع (0,1)." },
  { id: "6ad00e6163cd9c24f9f409bf", page: 64, number: 8, topic: "تحليل الدوال - الزوجية والفردية", text: "ما تصنيف الدالة الممثلة في الشكل من حيث الزوجية والفردية؟", options: ["فردية", "ليست فردية ولا زوجية", "زوجية", "متماثلة حول محور x"], answer: 2, explanation: "الرسم متماثل حول محور y؛ لذلك f(−x)=f(x)، وهذا تعريف الدالة الزوجية." },
  { id: "6ad00e6163cd9c24f9f409c1", page: 65, number: 17, topic: "تحليل الدوال - القيم القصوى المحلية", text: "في الشكل، ما نوع القيمة f(c) ضمن الفترة [a,b]؟", options: ["صغرى مطلقة", "صغرى محلية", "عظمى محلية", "عظمى مطلقة"], answer: 2, explanation: "يظهر الرسم قمة محلية عند x=c، لكنها ليست أعلى قيمة في الفترة؛ توجد قمة أعلى قرب b. إذن f(c) قيمة عظمى محلية." },
  { id: "6ad00e6163cd9c24f9f409c2", page: 65, number: 18, topic: "تحليل الدوال - القيم القصوى المحلية", text: "دالة f متصلة على R، ولها قيمة صغرى محلية وحيدة عند x=3 وقيمة عظمى محلية وحيدة عند x=−2. أي العبارات التالية صحيحة؟", options: ["القيمة العظمى المحلية أكبر من القيمة الصغرى المحلية", "lim(x→−∞) f(x)=−∞", "للدالة صفر في الفترة [−2,3]", "الدالة زوجية"], answer: 0, explanation: "عند −2 تكون الدالة عند قمة محلية، وعند 3 عند قاع محلي. وبحسب المعطى أن هاتين النقطتين هما القمتان والقاعان المحليان الوحيدان، تكون قيمة القمة أعلى من قيمة القاع. لا تفرض المعطيات حدًا عند −∞ ولا عبورًا للصفر ولا تماثلًا زوجيًا." },
  { id: "6ad00e6163cd9c24f9f409c3", page: 65, number: 19, topic: "التفاضل - متوسط معدل التغير", text: "ما متوسط معدل التغير للدالة f(x)=x² على الفترة [1,3]؟", options: ["−2", "2", "4", "8"], answer: 2, explanation: "متوسط معدل التغير = (f(3)−f(1))/(3−1)=(9−1)/2=4." },
  { id: "6ad00e6163cd9c24f9f409c4", page: 65, number: 20, topic: "التفاضل - متوسط معدل التغير", text: "ما متوسط معدل التغير للدالة f(x)=x²+2x+5 على الفترة [−5,3]؟", options: ["10", "5", "0", "2"], answer: 2, explanation: "f(3)=20 وf(−5)=20؛ لذلك متوسط معدل التغير=(20−20)/(3−(−5))=0." },
] as const;
const rejected = [
  { id: "6ad00e6163cd9c24f9f409b5", page: 61, note: "رُفض من النشر: التعبير الظاهر في المصدر لا يساوي أيًا من الخيارات كما كُتب، ولا توجد قيمة للزاوية تحدد ناتجًا ثابتًا؛ السؤال وخياراته متعارضان." },
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
