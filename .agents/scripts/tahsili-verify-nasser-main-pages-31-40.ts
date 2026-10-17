import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const reviews = [
  { id: "6ad00e6163cd9c24f9f4095e", page: 31, number: 10, topic: "الأعداد الحقيقية - المجموعات", text: "ما الصفة المميزة للمجموعة {x | −3 ≤ x ≤ 2، x ∈ Z}؟", options: ["{−2،−1،0،1،2}", "{−3،−2،−1،0،1،2}", "{−3،−2،−1،1،2}", "{−2،−1،0،1}"], answer: 1, explanation: "نأخذ كل الأعداد الصحيحة من −3 إلى 2 شاملًا الطرفين، فتكون المجموعة {−3،−2،−1،0،1،2}." },
  { id: "6ad00e6163cd9c24f9f4095f", page: 31, number: 11, topic: "الجبر - المتباينات والفترات", text: "ما مجموعة حل المتباينة 2 < x على صورة فترة؟", options: ["[2،∞)", "(2،∞)", "(−∞،2]", "(−∞،2)"], answer: 1, explanation: "القيم أكبر من 2 دون أن تشمل 2؛ لذلك نمثلها بالفترة المفتوحة (2،∞)." },
  { id: "6ad00e6163cd9c24f9f40960", page: 31, number: 12, topic: "الجبر - المتباينات", text: "مصروف فهد اليومي x ريال يمثله 52 ≤ x ≤ 242. ما أكبر قيمة ممكنة لمصروفه اليومي؟", options: ["242 ريالًا", "241 ريالًا", "52 ريالًا", "51 ريالًا"], answer: 0, explanation: "المتباينة تحدد القيم من 52 إلى 242 شاملًا؛ أكبر قيمة هي الحد الأعلى 242 ريالًا." },
  { id: "6ad00e6163cd9c24f9f40961", page: 31, number: 13, topic: "الجبر - العلاقات والدوال", text: "ما مجال العلاقة {(1،2)، (3،4)، (4،5)}؟", options: ["{2،4،6}", "{1،3،4}", "{3،5}", "{1،4،5}"], answer: 1, explanation: "مجال العلاقة هو مجموعة الإحداثيات الأولى في الأزواج المرتبة؛ إذن المجال {1،3،4}." },
  { id: "6ad00e6163cd9c24f9f40962", page: 31, number: 14, topic: "الجبر - العلاقات والدوال", text: "في مخطط الدالة: 2↦−6، و4↦−4، و−8↦14. ما مدى الدالة؟", options: ["{−6،14}", "{2،4،−8}", "{−6،−4،5،14}", "{−6،−4،14}"], answer: 3, explanation: "مدى الدالة هو مجموعة المخرجات؛ وهي −6 و−4 و14، من دون تكرار." },
  { id: "6ad00e6163cd9c24f9f40963", page: 31, number: 15, topic: "الجبر - الدوال", text: "إذا كانت f(x)=2x−4، فما قيمة f(8)؟", options: ["8", "12", "14", "16"], answer: 1, explanation: "نعوض x=8: f(8)=2×8−4=16−4=12." },
  { id: "6ad00e6163cd9c24f9f40964", page: 33, number: 28, topic: "الجبر - المصفوفات", text: "ما رتبة المصفوفة التي لها 3 صفوف و4 أعمدة؟", options: ["3×4", "4×3", "3×3", "3×2"], answer: 0, explanation: "رتبة المصفوفة تكتب بعدد الصفوف ثم عدد الأعمدة؛ لذلك رتبتها 3×4." },
  { id: "6ad00e6163cd9c24f9f40965", page: 33, number: 29, topic: "الجبر - المصفوفات", text: "في المصفوفة [[1،2،5،0]، [5،9،7،0]، [3،−4،8،0]]، ما العنصر الواقع في الصف الثالث والعمود الرابع؟", options: ["0", "7", "−4", "8"], answer: 0, explanation: "الصف الثالث هو [3،−4،8،0]، والعنصر الرابع فيه يساوي 0." },
  { id: "6ad00e6163cd9c24f9f40966", page: 33, number: 31, topic: "الجبر - المصفوفات", text: "إذا كانت [[5، x−3]، [1،−2]] = [[5،7]، [1،−2]]، فما قيمة x؟", options: ["5", "10", "4", "21"], answer: 1, explanation: "تتساوى العناصر المتناظرة؛ لذا x−3=7، ومنه x=10." },
  { id: "6ad00e6163cd9c24f9f40967", page: 33, number: 35, topic: "الجبر - عمليات المصفوفات", text: "إذا كان A=[[2،1]، [0،5]] وB=[[-1،3]، [1،−2]]، فما قيمة 2A−B؟", options: ["[[-5،−1]، [1،12]]", "[[5،−1]، [−1،12]]", "[[5،1]، [−1،−12]]", "[[0،4]، [4،2]]"], answer: 1, explanation: "2A=[[4،2]، [0،10]]. بطرح B عنصرًا عنصرًا نحصل على [[4−(−1)،2−3]، [0−1،10−(−2)]]=[[5،−1]، [−1،12]]." },
  { id: "6ad00e6163cd9c24f9f40968", page: 35, number: 1, topic: "الأعداد المركبة - الجذور", text: "ما أبسط صورة للعدد √(−18)؟", options: ["−9", "3i√2", "2i√3", "3√2"], answer: 1, explanation: "√(−18)=i√18=i√(9×2)=3i√2." },
  { id: "6ad00e6163cd9c24f9f40969", page: 35, number: 2, topic: "الأعداد المركبة - قوى الوحدة التخيلية", text: "ما قيمة i¹⁴+i¹⁵+i¹⁶+i¹⁷؟", options: ["0", "1", "2i", "2i+1"], answer: 0, explanation: "تتكرر قوى i كل أربع قوى: i¹⁴=−1، i¹⁵=−i، i¹⁶=1، i¹⁷=i. مجموعها صفر." },
  { id: "6ad00e6163cd9c24f9f4096a", page: 35, number: 3, topic: "الأعداد المركبة - العمليات", text: "ما ناتج ضرب 2i في 5i؟", options: ["−10", "−10i", "10i", "10"], answer: 0, explanation: "2i×5i=10i²، وبما أن i²=−1 فإن الناتج −10." },
  { id: "6ad00e6163cd9c24f9f4096b", page: 35, number: 4, topic: "الأعداد المركبة - قوى الوحدة التخيلية", text: "ما قيمة (1−i)⁸؟", options: ["16", "−16", "16i", "−16i"], answer: 0, explanation: "(1−i)²=−2i، ومنه (1−i)⁴=−4 و(1−i)⁸=16." },
  { id: "6ad00e6163cd9c24f9f4096c", page: 35, number: 5, topic: "الأعداد المركبة - ضرب المرافق", text: "ما ناتج ضرب (4+i)(4−i)؟", options: ["15", "16−i", "17", "17−i"], answer: 2, explanation: "العددان مترافقان؛ (4+i)(4−i)=4²−i²=16−(−1)=17." },
  { id: "6ad00e6163cd9c24f9f4096d", page: 35, number: 6, topic: "الأعداد المركبة - العمليات", text: "ما ناتج ضرب (2+3i)(3+2i)؟", options: ["12", "13i", "12−13i", "12+13i"], answer: 1, explanation: "نوسع حاصل الضرب: 6+4i+9i+6i²=6+13i−6=13i." },
  { id: "6ad00e6163cd9c24f9f4096e", page: 35, number: 7, topic: "الأعداد المركبة - جمع وطرح", text: "بسط العبارة (4+6i)−(−1+2i).", options: ["−4i", "5+4i", "5", "4i"], answer: 1, explanation: "(4+6i)−(−1+2i)=4+6i+1−2i=5+4i." },
  { id: "6ad00e6163cd9c24f9f4096f", page: 36, number: 10, topic: "الأعداد المركبة - تساوي عددين مركبين", text: "إذا كان (5+4i)−(x+yi)=−1−3i، فما قيمتا x وy؟", options: ["x=6، y=7", "x=4، y=5", "x=6، y=5", "x=4، y=7"], answer: 0, explanation: "بمساواة الجزأين الحقيقيين: 5−x=−1 فيكون x=6. وبمساواة الجزأين التخيليين: 4−y=−3 فيكون y=7." },
  { id: "6ad00e6163cd9c24f9f40970", page: 37, number: 18, topic: "الجبر - الأسس", text: "بسط المقدار (2a²b²)/(6ba⁵)، حيث a وb غير صفرين.", options: ["3a⁷b⁴", "b/(3a³)", "4b⁵/a⁶", "3a⁷b²"], answer: 1, explanation: "نبسط المعامل 2/6=1/3، ونطرح الأسس للمتغيرات المتشابهة: a²/a⁵=1/a³ وb²/b=b؛ فيكون الناتج b/(3a³)." },
  { id: "6ad00e6163cd9c24f9f40971", page: 37, number: 20, topic: "الجبر - كثيرات الحدود", text: "ما أبسط صورة للعبارة 5x²+2y−3x−2y؟", options: ["0", "4y", "10x²+4y", "5x²−3x"], answer: 3, explanation: "الحدان 2y و−2y يتلاشيان، وتبقى 5x²−3x." },
  { id: "6ad00e6163cd9c24f9f40972", page: 37, number: 21, topic: "الجبر - كثيرات الحدود", text: "ما المعامل الرئيس لكثيرة الحدود 2x⁴−3x²−x؟", options: ["−3", "2", "4", "12"], answer: 1, explanation: "الحد الرئيس هو 2x⁴، ومعامله العددي 2." },
  { id: "6ad00e6163cd9c24f9f40973", page: 37, number: 23, topic: "الجبر - جمع كثيرات الحدود", text: "ما أبسط صورة للعبارة (−x²+3x+4)+(x²−x)؟", options: ["x−1", "4", "2x+4", "2x²−4x+4"], answer: 2, explanation: "نجمع الحدود المتشابهة: −x²+x²=0، و3x−x=2x، ويبقى الثابت 4؛ إذن الناتج 2x+4." },
  { id: "6ad00e6163cd9c24f9f40974", page: 37, number: 25, topic: "الجبر - ضرب كثيرات الحدود", text: "ما أبسط صورة للعبارة (1/3)x²(6x²+9x−3)؟", options: ["2x⁴+3x³−x²", "2x⁴−3x³−1", "2x⁴−3x³", "x⁴−x³−x²"], answer: 0, explanation: "نوزع (1/3)x² على كل حد: 2x⁴+3x³−x²." },
  { id: "6ad00e6163cd9c24f9f40975", page: 38, number: 28, topic: "الجبر - تحليل كثيرات الحدود", text: "أي عبارة تكافئ (x²+x−6)(2−x)⁻¹؟", options: ["x+3", "−x−1", "−x+1", "−x−3"], answer: 3, explanation: "نحلل x²+x−6=(x+3)(x−2)، كما أن 2−x=−(x−2). بعد الاختصار تكون النتيجة −(x+3)=−x−3، مع x≠2." },
  { id: "6ad00e6163cd9c24f9f40976", page: 39, number: 37, topic: "الجبر - أصفار كثيرات الحدود", text: "أي وصف للتمثيل البياني الآتي يطابق دالة لها ثلاثة أصفار حقيقية مختلفة؟", options: ["منحنى يقطع محور x في أربع نقاط", "منحنى يقطع محور x في ثلاث نقاط", "منحنى يقطع محور x في نقطة واحدة", "منحنى يقطع محور x في خمس نقاط"], answer: 1, explanation: "الأصفار الحقيقية للدالة هي قيم x التي تجعل f(x)=0، وتمثل نقاط تقاطع منحناها مع محور x؛ الوصف الذي فيه ثلاثة تقاطعات يمثل ثلاثة أصفار حقيقية." },
  { id: "6ad00e6163cd9c24f9f40977", page: 39, number: 38, topic: "الجبر - النظرية الأساسية في الجبر", text: "بحسب النظرية الأساسية في الجبر، كم جذرًا مركبًا لكثيرة الحدود f(x)=3x⁵+2x³−5x+1 مع احتساب التكرار؟", options: ["2", "3", "4", "5"], answer: 3, explanation: "درجة كثيرة الحدود 5، وتنص النظرية الأساسية في الجبر على أن لها خمسة جذور مركبة عند العد مع التكرار." },
  { id: "6ad00e6163cd9c24f9f40978", page: 39, number: 39, topic: "الجبر - الجذور المركبة", text: "لكثيرة حدود جذران هما 1+2i و−1. إذا كانت معاملات كثيرة الحدود حقيقية، فما أقل درجة ممكنة لها؟", options: ["الأولى", "الثانية", "الثالثة", "الرابعة"], answer: 2, explanation: "معاملات كثيرة الحدود الحقيقية تفرض أن يكون مرافق الجذر المركب 1−2i جذرًا أيضًا. ومع الجذر −1 يصبح لدينا ثلاثة جذور على الأقل، فالدرجة الدنيا 3." },
  { id: "6ad00e6163cd9c24f9f40979", page: 40, number: 1, topic: "الجبر - تركيب الدوال", text: "إذا كانت f={(3،5)،(−1،6)} وg={(4،3)،(2،−1)}، فما f∘g؟", options: ["{(3،5)،(−1،6)}", "{(3،4)،(6،2)}", "{(4،3)،(2،−1)}", "{(4،5)،(2،6)}"], answer: 3, explanation: "نطبق g أولًا ثم f: g(4)=3 وf(3)=5، كما أن g(2)=−1 وf(−1)=6؛ لذلك f∘g={(4،5)،(2،6)}." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: reviews.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceQuestionNumber sourceBlockIndex sourceBook difficulty status subject sourceImageObjectKey")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviews.length) failures.push(`expected ${reviews.length} source rows, found ${drafts.length}`);
  for (const item of reviews) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || draft.sourceId !== SOURCE_ID || draft.status !== "pending_review" || !draft.sourceKey?.startsWith(`${SOURCE_ID}:`)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (draft?.sourceOrdinal && draft.sourceOrdinal !== SOURCE_ORDINAL) failures.push(`q${item.number} p${item.page}: unexpected source ordinal`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: published record already exists`);
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    if (await TahsiliQuestion.exists({ subject: "رياضيات", sourcePage: item.page, sourceQuestionNumber, sourceKey: { $ne: draft?.sourceKey } })) failures.push(`q${item.number} p${item.page}: source question-number collision`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: reviews.length, rejected: 0, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of reviews) {
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
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
