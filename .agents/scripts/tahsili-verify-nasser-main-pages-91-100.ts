import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6363cd9c24f9f40a10", page: 95, number: 1, topic: "الفيزياء والطريقة العلمية - تعريف الفيزياء", text: "ما فرع العلم الذي يدرس الطاقة والمادة وكيفية ارتباطهما؟", options: ["الكيمياء", "الأحياء", "الفيزياء", "الجيولوجيا"], answer: 2, explanation: "الفيزياء هي العلم الذي يدرس الطاقة والمادة والعلاقات بينهما." },
  { id: "6ad00e6363cd9c24f9f40a11", page: 96, number: 11, topic: "الكميات الفيزيائية - الكميات القياسية والمتجهة", text: "أي الكميات التالية كمية قياسية ما عدا؟", options: ["الزمن", "القوة", "درجة الحرارة", "الحجم"], answer: 1, explanation: "القوة كمية متجهة لها مقدار واتجاه، أما الزمن ودرجة الحرارة والحجم فكميات قياسية." },
  { id: "6ad00e6363cd9c24f9f40a12", page: 96, number: 12, topic: "الوحدات الأساسية - النظام الدولي", text: "بأي اختصار يُرمز إلى النظام الدولي للوحدات؟", options: ["SI", "MI", "Tr", "GI"], answer: 0, explanation: "الاختصار المعتمد للنظام الدولي للوحدات هو SI، من الاسم الفرنسي Système international." },
  { id: "6ad00e6363cd9c24f9f40a14", page: 96, number: 17, topic: "الوحدات والبادئات - التحويل بين الوحدات", text: "كم تساوي 0.6 MHz بوحدة Hz؟", options: ["6×10⁷ Hz", "6×10⁶ Hz", "6×10⁵ Hz", "0.6×10⁵ Hz"], answer: 2, explanation: "1 MHz=10⁶ Hz؛ لذا 0.6 MHz=0.6×10⁶=6×10⁵ Hz." },
  { id: "6ad00e6363cd9c24f9f40a16", page: 98, number: 6, topic: "الحركة - تعريف التسارع", text: "ما تعريف التسارع؟", options: ["التغير في الموقع مقسومًا على زمن التغير", "التغير في السرعة المتجهة مقسومًا على زمن التغير", "التغير الذي يحدث لموقع الجسم في اتجاه معين", "التغير في إزاحة الجسم مقسومًا على الزمن"], answer: 1, explanation: "التسارع المتوسط هو التغير في السرعة المتجهة مقسومًا على الفترة الزمنية التي حدث خلالها التغير." },
  { id: "6ad00e6363cd9c24f9f40a17", page: 98, number: 7, topic: "الحركة - حساب التسارع", text: "تغيرت سرعة جسم بمعدل 30 m/s خلال 2 s؛ فما تسارعه؟", options: ["60 m/s²", "30 m/s²", "15 m/s²", "5 m/s²"], answer: 2, explanation: "التسارع=التغير في السرعة÷الزمن=30÷2=15 m/s²." },
  { id: "6ad00e6363cd9c24f9f40a18", page: 98, number: 8, topic: "الحركة - تفسير التسارع", text: "تزداد سرعة جسم بمقدار 2 m/s كل ثانية. أي العبارات التالية صحيحة؟", options: ["المسافة الكلية 2 m", "السرعة تساوي 2 m/s", "التسارع يساوي 2 m/s²", "الزمن الكلي يساوي 2 s"], answer: 2, explanation: "التغير في السرعة 2 m/s يحدث في كل ثانية؛ لذلك التسارع يساوي 2 m/s لكل ثانية، أي 2 m/s²." },
  { id: "6ad00e6363cd9c24f9f40a19", page: 98, number: 9, topic: "الحركة - حساب التسارع", text: "ازدادت سرعة سيارة سباق من 4 m/s إلى 36 m/s خلال 4 s. ما تسارعها؟", options: ["7 m/s²", "8 m/s²", "9 m/s²", "10 m/s²"], answer: 1, explanation: "a=(v₂−v₁)/Δt=(36−4)/4=8 m/s²." },
  { id: "6ad00e6363cd9c24f9f40a1a", page: 98, number: 10, topic: "الحركة - مقارنة التسارع", text: "ازدادت سرعة السيارة A من 10 m/s إلى 30 m/s خلال 4 s، وازدادت سرعة السيارة B من 22 m/s إلى 33 m/s خلال 11 s. تسارع A مقارنة بتسارع B هو:", options: ["أكبر من", "أصغر من", "يساوي", "نصف"], answer: 0, explanation: "تسارع A=(30−10)/4=5 m/s²، وتسارع B=(33−22)/11=1 m/s²؛ لذلك تسارع A أكبر." },
  { id: "6ad00e6363cd9c24f9f40a1d", page: 100, number: 25, topic: "الحركة في مجال الجاذبية - القذف الرأسي", text: "نافورة تقذف الماء رأسيًا إلى أعلى بسرعة 30 m/s. ما الزمن اللازم ليعود الماء إلى نقطة انطلاقه؟ (g=10 m/s²)", options: ["0.5 s", "3 s", "6 s", "12 s"], answer: 2, explanation: "زمن الصعود v₀/g=30/10=3 s. وللعودة إلى مستوى الانطلاق يساوي الزمن الكلي ضعفي زمن الصعود: 6 s." },
  { id: "6ad00e6363cd9c24f9f40a1e", page: 100, number: 26, topic: "القوى - قوى التلامس", text: "أي القوى التالية من قوى التلامس؟", options: ["قوة الاحتكاك", "القوى المغناطيسية", "قوى المجال", "القوى الكهربائية"], answer: 0, explanation: "تنشأ قوة الاحتكاك عند تلامس سطحين؛ أما القوى المغناطيسية والكهربائية وقوى المجال فيمكن أن تؤثر عن بُعد." },
  { id: "6ad00e6363cd9c24f9f40a1f", page: 100, number: 27, topic: "القوى - قوى المجال", text: "أي قوة تؤثر في الأجسام بغض النظر عن وجود تلامس بينها؟", options: ["قوى التلامس", "قوى التماسك", "قوى التلاصق", "قوى المجال"], answer: 3, explanation: "قوى المجال، مثل الجاذبية والمغناطيسية والكهربائية، تؤثر عن بُعد دون اشتراط تلامس مباشر." },
] as const;
const rejected = [
  { id: "6ad00e6363cd9c24f9f40a13", page: 96, note: "رُفض من النشر: 180 km تساوي 180×10³ m كما تساوي 18×10⁴ m؛ ويعرض السؤال الخيارين معًا، لذا لا توجد إجابة وحيدة." },
  { id: "6ad00e6363cd9c24f9f40a1c", page: 100, note: "رُفض من النشر: الخيارات لا تتضمن أن تسارع الجسم المقذوف إلى أعلى ثابت ومتجه إلى الأسفل؛ ولا يمكن اعتماد خيار من الخيارات المعروضة." },
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
    if (await TahsiliQuestion.exists({ subject: "فيزياء", sourcePage: item.page, sourceQuestionNumber, sourceKey: { $ne: draft?.sourceKey } })) failures.push(`q${item.number} p${item.page}: source question-number collision`);
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
      subject: "فيزياء", subcategory: item.topic, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.topic, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number,
      ...(draft.sourceBlockIndex != null ? { sourceBlockIndex: draft.sourceBlockIndex } : {}),
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: SOURCE_BOOK, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: "pending_review" }, { $set: {
      sourceOrdinal: SOURCE_ORDINAL, status: "approved", subject: "فيزياء", subcategory: item.topic,
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
