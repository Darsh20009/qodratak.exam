import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const reviews = [
  { id: "6ad00e6163cd9c24f9f40931", page: 15, number: 19, topic: "الهندسة - مركز المثلث", text: "في المثلث ABC، النقطة D هي مركز المثلث وتقع على المتوسط AF. إذا كان AF = 12، فما طول AD؟", options: ["4", "6", "8", "12"], answer: 2, explanation: "يقسم مركز المثلث المتوسط بنسبة 2:1 من جهة الرأس؛ لذلك AD = (2/3) × 12 = 8." },
  { id: "6ad00e6163cd9c24f9f40932", page: 15, number: 20, topic: "الهندسة - مقارنة زوايا المثلث", text: "في مثلث، طول الضلع المقابل للزاوية x هو 14، والمقابل للزاوية z هو 15، والمقابل للزاوية y هو 13. أي العبارات صحيحة؟", options: ["x = z", "x < z", "x > z", "y > x"], answer: 1, explanation: "في المثلث تقابل الضلع الأطول الزاوية الأكبر. بما أن 14 < 15، فإن x < z." },
  { id: "6ad00e6163cd9c24f9f40933", page: 15, number: 22, topic: "الهندسة - متباينة المثلث", text: "مثلث متطابق الضلعين طول كل ضلع من ضلعيه المتطابقين 10 cm. أي طول مما يأتي يمكن أن يكون طول ضلعه الثالث؟", options: ["18 cm", "20 cm", "22 cm", "24 cm"], answer: 0, explanation: "يجب أن يكون طول الضلع الثالث أقل من مجموع الضلعين الآخرين، أي أقل من 20 cm. ومن الخيارات، 18 cm وحده يحقق شرط متباينة المثلث." },
  { id: "6ad00e6163cd9c24f9f40934", page: 15, number: 23, topic: "الهندسة - متباينة المثلث", text: "إذا كان طولا ضلعين في مثلث 7 cm و9 cm، فما أصغر عدد صحيح موجب يمكن أن يمثل طول الضلع الثالث؟", options: ["2 cm", "3 cm", "4 cm", "9 cm"], answer: 1, explanation: "إذا كان طول الضلع الثالث t، فمتباينة المثلث تعطي |9−7| < t < 9+7، أي 2 < t < 16؛ وأصغر عدد صحيح موجب يحقق ذلك هو 3." },
  { id: "6ad00e6163cd9c24f9f40935", page: 16, number: 24, topic: "الجبر - البرهان غير المباشر", text: "لإثبات العبارة «إذا كان 3x < 12 فإن x < 4» بالبرهان غير المباشر، ما الافتراض الذي نبدأ به؟", options: ["x ≤ 4", "x ≥ 4", "3x < 12", "3x > 12"], answer: 1, explanation: "في البرهان غير المباشر نفترض نفي النتيجة. نفي x < 4 هو x ≥ 4، ثم نصل باستخدام الفرض إلى تناقض." },
  { id: "6ad00e6163cd9c24f9f40936", page: 17, number: 1, topic: "الهندسة - متوازي الأضلاع", text: "في متوازي أضلاع، قُسم أحد القطرين إلى جزأين طولهما x−5 و8. ما قيمة x؟", options: ["3", "5", "8", "13"], answer: 3, explanation: "قطرا متوازي الأضلاع ينصف كل منهما الآخر؛ لذلك x−5 = 8، ومنه x = 13." },
  { id: "6ad00e6163cd9c24f9f40937", page: 17, number: 3, topic: "الهندسة - زوايا متوازي الأضلاع", text: "قياس زاويتين متحالفتين في متوازي أضلاع هو (2x + 20)° و3x°. ما قياس الزاوية الكبرى؟", options: ["42°", "84°", "96°", "148°"], answer: 2, explanation: "الزاويتان المتحالفتان متكاملتان: (2x+20)+3x=180، فيكون x=32. قياساهما 84° و96°، والكبرى 96°." },
  { id: "6ad00e6163cd9c24f9f40938", page: 17, number: 4, topic: "الهندسة التحليلية - منتصف القطر", text: "رؤوس متوازي الأضلاع ABCD هي A(1،3)، B(0،0)، C(5،−1)، D(6،2). ما إحداثيا نقطة تقاطع قطريه؟", options: ["(−2،2)", "(3،2)", "(2،1)", "(3،1)"], answer: 3, explanation: "قطرا متوازي الأضلاع ينصف كل منهما الآخر. منتصف AC هو ((1+5)/2، (3−1)/2) = (3،1)." },
  { id: "6ad00e6163cd9c24f9f40939", page: 17, number: 5, topic: "الهندسة التحليلية - متوازي الأضلاع", text: "النقاط A(−2،3)، B(3،5)، C(4،1) هي رؤوس متتالية لمتوازي الأضلاع ABCD. ما إحداثيا D؟", options: ["(−3،7)", "(7،−3)", "(−1،−1)", "(−1،3)"], answer: 2, explanation: "في متوازي الأضلاع ABCD: D = A + C − B. إذن D = (−2+4−3، 3+1−5) = (−1،−1)." },
  { id: "6ad00e6163cd9c24f9f4093b", page: 18, number: 12, topic: "الهندسة - الأشكال الرباعية", text: "أي شكل رباعي من الآتي تكون أقطاره متعامدة؟", options: ["متوازي الأضلاع", "المستطيل", "المربع", "شبه المنحرف"], answer: 2, explanation: "قطرا المربع متعامدان. أما متوازي الأضلاع والمستطيل وشبه المنحرف فلا تكون أقطارها متعامدة بالضرورة." },
  { id: "6ad00e6163cd9c24f9f4093c", page: 19, number: 17, topic: "الهندسة - القطعة المتوسطة في شبه المنحرف", text: "في شبه منحرف، طول القاعدة الكبرى 30 وطول القطعة المتوسطة 20. ما طول القاعدة الصغرى x؟", options: ["10", "20", "30", "40"], answer: 0, explanation: "طول القطعة المتوسطة يساوي نصف مجموع القاعدتين: 20=(x+30)/2، ومنه x=10." },
  { id: "6ad00e6163cd9c24f9f4093d", page: 19, number: 18, topic: "الهندسة - القطعة المتوسطة في شبه المنحرف", text: "قاعدتا شبه منحرف طولهما 6 وx، وطول القطعة المتوسطة 7. ما قيمة x؟", options: ["13", "11", "9", "8"], answer: 3, explanation: "7=(6+x)/2، لذلك 14=6+x ومنه x=8." },
  { id: "6ad00e6163cd9c24f9f4093e", page: 19, number: 19, topic: "الهندسة التحليلية - إحداثيات المستطيل", text: "في مستطيل محاذٍ لمحوري الإحداثيات، إحداثيا الرأس العلوي الأيسر (0،3) والرأس السفلي الأيمن (5،0). ما إحداثيا الرأس العلوي الأيمن C؟", options: ["(3،5)", "(5،3)", "(0،5)", "(3،0)"], answer: 1, explanation: "في المستطيل المحاذي للمحورين، يشترك الرأس العلوي الأيمن مع العلوي الأيسر في الإحداثي y=3، ومع السفلي الأيمن في الإحداثي x=5؛ لذا C=(5،3)." },
  { id: "6ad00e6163cd9c24f9f4093f", page: 19, number: 21, topic: "الهندسة التحليلية - متوازي الأضلاع", text: "في متوازي الأضلاع، A=(0،0)، وB=(b،0)، وC=(b+c،a) هي رؤوس متتالية. ما إحداثيا الرأس D؟", options: ["(b،c)", "(b−c،c)", "(c،a)", "(b+c،a)"], answer: 2, explanation: "في متوازي الأضلاع يكون المتجه AD مساويًا للمتجه BC. وبطرح إحداثيي B من C نحصل على (c،a)، لذلك D=(c،a)." },
  { id: "6ad00e6163cd9c24f9f40940", page: 19, number: 22, topic: "الهندسة التحليلية - شبه المنحرف متطابق الساقين", text: "شبه منحرف متطابق الساقين قاعدتاه أفقيتان. إذا كان A=(0،a)، وL=(a،0)، وT=(b،0)، وكان ترتيب الرؤوس A-M-T-L، فما إحداثيا M؟", options: ["(b+a،a)", "(b−a،a)", "(b،a)", "(a،b)"], answer: 1, explanation: "ارتفاع شبه المنحرف a. إزاحة الساق اليسرى الأفقية من A إلى L مقدارها a، وبما أن الساقين متطابقتان فالإزاحة الأفقية للساق اليمنى مساوية لها؛ لذلك M=(b−a،a)." },
  { id: "6ad00e6163cd9c24f9f40941", page: 19, number: 23, topic: "الهندسة - تشابه المثلثات", text: "إذا كان ΔABC ~ ΔEFG وفق ترتيب الرؤوس، فأي التطابقات الآتية صحيح؟", options: ["∠B ≅ ∠C", "∠A ≅ ∠G", "AC ≅ EF", "∠A ≅ ∠E"], answer: 3, explanation: "ترتيب التشابه يحدد الرؤوس المتناظرة: A↔E وB↔F وC↔G؛ لذلك ∠A ≅ ∠E." },
  { id: "6ad00e6163cd9c24f9f40942", page: 19, number: 24, topic: "الهندسة - تشابه المثلثات", text: "محيطا مثلثين متشابهين 24 cm و32 cm. إذا كان طول ضلع في المثلث الأكبر 8 cm، فما طول الضلع المناظر له في المثلث الأصغر؟", options: ["4 cm", "6 cm", "8 cm", "10 cm"], answer: 1, explanation: "نسبة التشابه من الأصغر إلى الأكبر هي 24/32=3/4. الضلع المناظر في الأصغر يساوي 8×3/4=6 cm." },
  { id: "6ad00e6163cd9c24f9f40943", page: 20, number: 25, topic: "الهندسة - تشابه المثلثات", text: "مثلثان متشابهان، والزاوية المحصورة في كل منهما 30°. في المثلث الأول، الضلعان المجاوران لهذه الزاوية 3 و6، وفي المثلث الثاني الضلعان المناظران 4 وx. ما قيمة x؟", options: ["2", "4", "6", "8"], answer: 3, explanation: "نسبة التشابه 4/3؛ لذا x هو الضلع المناظر لطول 6، ويحسب x=6×(4/3)=8." },
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
