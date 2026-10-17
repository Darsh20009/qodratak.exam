import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6163cd9c24f9f409d6", page: 71, number: 9, topic: "القطع الناقص - المركز والرؤوس", text: "في القطع الناقص (x+2)²/16+(y−3)²/4=1، ما المسافة بين المركز والرأس؟", options: ["2 وحدتان", "4 وحدات", "8 وحدات", "16 وحدة"], answer: 1, explanation: "مركز القطع (−2,3)، وشبه المحور الأكبر a=√16=4؛ لذلك المسافة من المركز إلى الرأس تساوي 4 وحدات." },
  { id: "6ad00e6163cd9c24f9f409d7", page: 71, number: 10, topic: "القطع الناقص - البؤرتان", text: "في القطع الناقص x²/16+y²/k=1، إذا كانت إحدى البؤرتين (0,3)، فما قيمة k؟", options: ["7", "25", "13", "1"], answer: 1, explanation: "المحور الأكبر رأسي، لذا c²=k−16. وبما أن البؤرة (0,3) فإن c=3، ومنه 9=k−16، فتكون k=25." },
  { id: "6ad00e6163cd9c24f9f409d8", page: 71, number: 11, topic: "القطع الناقص - المحاور", text: "في القطع الناقص x²/9+(y−1)²/25=1، ما طول المحور الأصغر؟", options: ["3 وحدات", "5 وحدات", "6 وحدات", "10 وحدات"], answer: 2, explanation: "شبه المحور الأصغر b=√9=3؛ وطول المحور الأصغر الكامل 2b=6 وحدات." },
  { id: "6ad00e6163cd9c24f9f409d9", page: 71, number: 12, topic: "القطع الناقص - المحاور", text: "ما طول المحور الأكبر للقطع الناقص 4x²+9y²=1؟", options: ["1", "2", "3", "2/3"], answer: 0, explanation: "بالقسمة على 1 نكتب المعادلة x²/(1/4)+y²/(1/9)=1. شبه المحور الأكبر a=1/2، ومن ثم طوله 2a=1." },
  { id: "6ad00e6163cd9c24f9f409da", page: 71, number: 13, topic: "القطع الناقص - الاختلاف المركزي", text: "قطع ناقص المسافة بين بؤرتيه 10 وحدات وطول محوره الأكبر 16 وحدة؛ فما اختلافه المركزي e؟", options: ["5/8", "8/5", "6", "10"], answer: 0, explanation: "المسافة بين البؤرتين 2c=10، فيكون c=5. وطول المحور الأكبر 2a=16، فيكون a=8. إذن e=c/a=5/8." },
  { id: "6ad00e6163cd9c24f9f409db", page: 71, number: 14, topic: "القطع الناقص - الاختلاف المركزي", text: "في القطع الناقص، بين أي قيمتين يقع الاختلاف المركزي e؟", options: ["−2", "−1", "1", "2"], answer: 2, explanation: "اختلاف القطع الناقص المركزي يحقق 0≤e<1؛ لذلك الحد الأعلى المذكور هو 1." },
  { id: "6ad00e6163cd9c24f9f409dc", page: 71, number: 15, topic: "القطع الناقص - الاختلاف المركزي", text: "القطع الناقص الذي اختلافه المركزي e=0 يكون دائرة أم قطعًا زائدًا أم مربعًا؟", options: ["قطع ناقص غير دائري", "قطع زائد", "دائرة", "مربع"], answer: 2, explanation: "عندما e=0 تتساوى البؤرتان مع المركز، وتتساوى أنصاف المحاور؛ فيكون القطع دائرة." },
  { id: "6ad00e6163cd9c24f9f409dd", page: 72, number: 18, topic: "القطع الزائد - المركز والرأسان", text: "في القطع الزائد (x+2)²/4−(y−3)²/16=1، ما المسافة بين المركز والرأس؟", options: ["2 وحدتان", "4 وحدات", "8 وحدات", "16 وحدة"], answer: 0, explanation: "الصيغة القياسية أفقية وa²=4؛ إذن a=2، وهي المسافة من المركز إلى كل رأس." },
  { id: "6ad00e6163cd9c24f9f409de", page: 73, number: 1, topic: "المتجهات - الكميات المتجهة والقياسية", text: "أي الكميات التالية كمية متجهة؟", options: ["الزمن", "المسافة", "الإزاحة", "الكتلة"], answer: 2, explanation: "الإزاحة لها مقدار واتجاه، لذا فهي كمية متجهة؛ أما الزمن والمسافة والكتلة فكميات قياسية." },
  { id: "6ad00e6163cd9c24f9f409df", page: 73, number: 2, topic: "المتجهات - زاوية الاتجاه الحقيقي", text: "في الشكل، يصنع المتجه زاوية 35° فوق المحور الأفقي الموجب؛ فما زاوية اتجاهه الحقيقي؟", options: ["35°", "035°", "055°", "090°"], answer: 2, explanation: "الاتجاه الحقيقي يقاس مع عقارب الساعة ابتداءً من الشمال. وبما أن المتجه يميل 35° شمال الشرق، فزاويته 90°−35°=55°، وتكتب ثلاثيًا 055°." },
  { id: "6ad00e6163cd9c24f9f409e0", page: 73, number: 3, topic: "المتجهات - الاتجاه الربعي", text: "في الشكل، يقع المتجه بزاوية 35° شرق الشمال؛ فما اتجاهه الربعي؟", options: ["N 35° E", "N 55° E", "W 55° S", "N 35° W"], answer: 0, explanation: "الزاوية في الشكل مقاسة من محور الشمال باتجاه الشرق، لذلك يكتب الاتجاه الربعي N 35° E." },
  { id: "6ad00e6163cd9c24f9f409e1", page: 73, number: 4, topic: "المتجهات - التحويل إلى الاتجاه الربعي", text: "إذا كانت زاوية اتجاه متجه 120° (مقاسة عكس عقارب الساعة من المحور الأفقي الموجب)، فما اتجاهه الربعي؟", options: ["N 30° W", "N 30° E", "N 60° W", "N 60° E"], answer: 0, explanation: "الزاوية 120° تقع في الربع الثاني، وهي 30° بعد اتجاه الشمال نحو الغرب؛ لذا الاتجاه الربعي N 30° W." },
  { id: "6ad00e6363cd9c24f9f409e2", page: 73, number: 6, topic: "المتجهات - التحويل إلى الاتجاه الربعي", text: "إذا كانت زاوية الاتجاه الحقيقي لمتجه 155°، فما اتجاهه الربعي؟", options: ["N 55° E", "S 25° E", "W 55° S", "N 35° E"], answer: 1, explanation: "الاتجاه الحقيقي يقاس من الشمال مع عقارب الساعة؛ 155° يقع في الربع الجنوبي الشرقي، وزاويته من الجنوب 180°−155°=25°، أي S 25° E." },
  { id: "6ad00e6363cd9c24f9f409e4", page: 74, number: 9, topic: "المتجهات - المركبات", text: "ركل لاعب كرة بسرعة 40 ft/s وبزاوية 30° مع الأرض. ما مقدار المركبة الرأسية للسرعة؟", options: ["20 ft/s", "20√3 ft/s", "40 ft/s", "40√3 ft/s"], answer: 0, explanation: "المركبة الرأسية تساوي مقدار السرعة مضروبًا في جا الزاوية: 40 sin(30°)=40×1/2=20 ft/s." },
  { id: "6ad00e6363cd9c24f9f409e5", page: 75, number: 17, topic: "المتجهات - متجه الوحدة", text: "ما متجه الوحدة في اتجاه المتجه v=(3,−4)؟", options: ["(−1,0)", "(1,−1)", "(−3/5,4/5)", "(3/5,−4/5)"], answer: 3, explanation: "طول المتجه √(3²+(−4)²)=5. بقسمة مركبتيه على طوله نحصل على متجه الوحدة (3/5,−4/5)." },
  { id: "6ad00e6363cd9c24f9f409e6", page: 75, number: 18, topic: "المتجهات - متجهات الوحدة القياسية", text: "المتجه (2,3) بدلالة متجهي الوحدة القياسيين يساوي ماذا؟", options: ["2i+3j", "2i−3j", "5i+j", "i+5j"], answer: 0, explanation: "المركبة الأفقية 2 تضرب i، والمركبة الرأسية 3 تضرب j؛ لذا v=2i+3j." },
  { id: "6ad00e6363cd9c24f9f409e7", page: 75, number: 19, topic: "المتجهات - الصورة الإحداثية", text: "إذا كان v=5i−2j، فما صورته الإحداثية؟", options: ["(5,2)", "(2,5)", "(5,−2)", "(−2,5)"], answer: 2, explanation: "معامل i هو المركبة الأولى ومعامل j هو الثانية؛ إذن الصورة الإحداثية هي (5,−2)." },
  { id: "6ad00e6363cd9c24f9f409e8", page: 75, number: 20, topic: "المتجهات - الصورة الإحداثية من الطول والزاوية", text: "متجه طوله 14 وزاوية اتجاهه 210° مع الأفقي؛ فما صورته الإحداثية؟", options: ["(7,7√3)", "(−7√3,−7)", "(−7√3,7)", "(14,210)"], answer: 1, explanation: "المركبتان هما (14cos210°,14sin210°). وبما أن cos210°=−√3/2 وsin210°=−1/2، فالصورة (−7√3,−7)." },
  { id: "6ad00e6363cd9c24f9f409e9", page: 75, number: 21, topic: "المتجهات - الصورة الإحداثية من الطول والزاوية", text: "ما الصورة الإحداثية لمتجه طوله 6 وزاوية اتجاهه 150° مع الأفقي؟", options: ["(−3√3,3)", "(3,−3√3)", "(3,3√3)", "(3√3,−3)"], answer: 0, explanation: "المركبتان (6cos150°,6sin150°)؛ وباستخدام cos150°=−√3/2 وsin150°=1/2 نحصل على (−3√3,3)." },
  { id: "6ad00e6363cd9c24f9f409ea", page: 75, number: 22, topic: "المتجهات - الطول وزاوية الاتجاه", text: "أي المتجهات التالية طوله 2√2 وزاوية اتجاهه 45°؟", options: ["(2,−2)", "(−2,2)", "i+j", "2i+2j"], answer: 3, explanation: "المركبتان تساويان (2√2 cos45°,2√2 sin45°)=(2,2)، أي المتجه 2i+2j." },
  { id: "6ad00e6363cd9c24f9f409eb", page: 75, number: 24, topic: "المتجهات - التعامد والضرب الداخلي", text: "إذا كان u=(1,−2) وv=(3,k) متعامدين، فما قيمة k؟", options: ["−2", "−3/2", "2", "3/2"], answer: 3, explanation: "شرط التعامد أن يكون الضرب الداخلي صفرًا: (1)(3)+(−2)k=0؛ ومنه 3−2k=0، لذلك k=3/2." },
  { id: "6ad00e6363cd9c24f9f409ec", page: 77, number: 34, topic: "المتجهات في الفضاء - جمع المتجهات", text: "إذا كان a=(0,5,3) وb=(7,0,1)، فما قيمة a+b؟", options: ["(7,5,4)", "(4,5,7)", "(0,5,4)", "(11,5,1)"], answer: 0, explanation: "نجمع المركبات المتناظرة: (0+7,5+0,3+1)=(7,5,4)." },
  { id: "6ad00e6363cd9c24f9f409ed", page: 77, number: 35, topic: "المتجهات في الفضاء - طرح المتجهات", text: "إذا كان u=(8,3,5) وv=(7,3,2)، فما قيمة u−v؟", options: ["(−1,0,−3)", "(1,0,3)", "(2,0,−6)", "(15,6,6)"], answer: 1, explanation: "نطرح المركبات المناظرة: (8−7,3−3,5−2)=(1,0,3)." },
  { id: "6ad00e6363cd9c24f9f409ee", page: 77, number: 36, topic: "المتجهات في الفضاء - ضرب المتجه في عدد", text: "إذا كان v=(2,−1,3)، فما قيمة −2v؟", options: ["(−6,2,−4)", "(4,2,−6)", "(−4,2,−6)", "(−4,−1,3)"], answer: 2, explanation: "نضرب كل مركبة في −2: −2(2,−1,3)=(−4,2,−6)." },
  { id: "6ad00e6363cd9c24f9f409ef", page: 77, number: 38, topic: "المتجهات في الفضاء - الضرب الداخلي", text: "إذا كان a=(0,5,3) وb=(7,0,1)، فما قيمة a·b؟", options: ["3", "12", "21", "35"], answer: 0, explanation: "a·b=0×7+5×0+3×1=3." },
  { id: "6ad00e6363cd9c24f9f409f0", page: 77, number: 40, topic: "المتجهات في الفضاء - التعامد", text: "إذا كان u=(k,−3,1) وv=(−2,−1,3) متعامدين، فما قيمة k؟", options: ["−6", "−3", "3", "6"], answer: 2, explanation: "شرط التعامد u·v=0: −2k+3+3=0؛ إذن −2k+6=0 ومنه k=3." },
  { id: "6ad00e6363cd9c24f9f409f1", page: 78, number: 42, topic: "المتجهات في الفضاء - الضرب الاتجاهي", text: "أوجد حاصل الضرب الاتجاهي للمتجهين المحددين بالمصفوفة | i  j  k ; 1  −2  0 ; 2  0  −1 |.", options: ["2i+j+4k", "−2i+j−4k", "2i−j+4k", "−2i−j−4k"], answer: 0, explanation: "بالتوسع على الصف الأول: i[(-2)(-1)−0]−j[1(-1)−0]+k[0−(-2×2)]=2i+j+4k." },
  { id: "6ad00e6363cd9c24f9f409f2", page: 79, number: 1, topic: "الإحداثيات القطبية - تمثيل النقاط", text: "أي نقطة تمثل النقطة القطبية (2,50°) في المستوى القطبي؟", options: ["(50,2°)", "(2,130°)", "(−2,−50°)", "(−2,230°)"], answer: 3, explanation: "عند تغيير نصف القطر من 2 إلى −2 نضيف 180° إلى الزاوية: 50°+180°=230°؛ إذن النقطة المكافئة (−2,230°)." },
  { id: "6ad00e6363cd9c24f9f409f4", page: 79, number: 5, topic: "الإحداثيات القطبية - الرسوم البيانية", text: "المعادلة القطبية r=4 تمثل دائرة؛ فما طول قطرها؟", options: ["2", "3", "4", "8"], answer: 3, explanation: "المعادلة r=4 تمثل دائرة مركزها القطب ونصف قطرها 4؛ لذا طول القطر 2×4=8." },
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
