import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6163cd9c24f9f4097a", page: 41, number: 9, topic: "الجذور - ترشيد المقام", text: "ما أبسط صورة للعبارة 2/(√6−2)؟", options: ["√6−2", "√6+2", "√6", "4"], answer: 1, explanation: "نضرب البسط والمقام في المرافق √6+2؛ يصبح المقام 6−4=2، فيختصر العامل 2 ويكون الناتج √6+2." },
  { id: "6ad00e6163cd9c24f9f4097b", page: 41, number: 10, topic: "الأسس والجذور - الصورة الجذرية", text: "ما الصورة الجذرية للعبارة a^(2/3)؟", options: ["∛(a²)", "∛a", "⁵√a", "√(a³)"], answer: 0, explanation: "الأس 2/3 يعني أن المقام 3 هو دليل الجذر والبسط 2 هو أسّ ما تحت الجذر؛ لذا a^(2/3)=∛(a²)." },
  { id: "6ad00e6163cd9c24f9f4097c", page: 41, number: 11, topic: "الأسس والجذور - الأسس النسبية", text: "ما الصورة الأسية للعبارة ⁷√(x⁵)؟", options: ["x^(7/5)", "x^(5/7)", "x^(1/5)", "x^(1/7)"], answer: 1, explanation: "الجذر السابع يكتب أسًا مقامه 7، والقوة الخامسة تبقى في البسط؛ إذن ⁷√(x⁵)=x^(5/7)." },
  { id: "6ad00e6163cd9c24f9f4097d", page: 41, number: 12, topic: "الجذور - تبسيط الجذور", text: "ما أبسط صورة لـ √(36a⁴b¹⁶)؟", options: ["18a²b⁴", "18a²b⁸", "6a²b⁴", "6a²b⁸"], answer: 3, explanation: "√36=6، و√(a⁴)=a²، و√(b¹⁶)=b⁸؛ لذلك الناتج 6a²b⁸." },
  { id: "6ad00e6163cd9c24f9f4097e", page: 41, number: 13, topic: "الجذور - الجذور الزوجية", text: "بسط المقدار ⁴√(16(x−3)¹²).", options: ["2|x−3|", "4|x−3|³", "2|x−3|³", "2(x−3)³"], answer: 2, explanation: "الجذر الرابع لـ16 يساوي 2، و⁴√((x−3)¹²)=|(x−3)³|=|x−3|³ لأن دليل الجذر زوجي." },
  { id: "6ad00e6163cd9c24f9f4097f", page: 41, number: 14, topic: "الأسس - ضرب القوى", text: "ما ناتج 5^(2/3) × 5^(4/3)؟", options: ["5", "25", "125", "625"], answer: 1, explanation: "عند ضرب قوتين لهما الأساس نفسه نجمع الأسين: 5^(2/3+4/3)=5²=25." },
  { id: "6ad00e6163cd9c24f9f40980", page: 41, number: 15, topic: "الجذور - المعادلات الجذرية", text: "ما حل المعادلة √(x+1)=2؟", options: ["x=−3", "x=1", "x=3", "x=5"], answer: 2, explanation: "بتربيع الطرفين: x+1=4، ومنه x=3. وبالتعويض تحقق √4=2." },
  { id: "6ad00e6163cd9c24f9f40981", page: 41, number: 16, topic: "الجبر - أصفار الدوال", text: "إذا كانت f(x)=√(x²−6)−6، ففي أي فترة يقع الصفر الموجب للدالة؟", options: ["[4،5]", "[5،6]", "[6،7]", "[7،8]"], answer: 2, explanation: "نحل f(x)=0: √(x²−6)=6، فينتج x²=42، والجذر الموجب √42≈6.48 يقع في [6،7]." },
  { id: "6ad00e6163cd9c24f9f40983", page: 43, number: 28, topic: "الجبر - الدالة المقلوب", text: "للدالة f(x)=1/(x−1)+5، عند أي قيمة لـx يكون خط التقارب الرأسي؟", options: ["x=−1", "x=0", "x=1", "x=5"], answer: 2, explanation: "يكون خط التقارب الرأسي عند القيمة التي تصفر المقام: x−1=0، أي x=1." },
  { id: "6ad00e6163cd9c24f9f40984", page: 43, number: 29, topic: "الجبر - مجال الدالة النسبية", text: "إذا كانت f(x)=(3x+4)/(5−x)، فما مجالها؟", options: ["R", "R\\{−2}", "R\\{5}", "R\\{−5}"], answer: 2, explanation: "المقام 5−x لا يساوي صفرًا، ولذلك x≠5. المجال هو مجموعة الأعداد الحقيقية عدا 5." },
  { id: "6ad00e6163cd9c24f9f40985", page: 43, number: 31, topic: "الجبر - مجال الدالة النسبية", text: "ما قيمة x التي تجعل الدالة 1/(x²−4x+4) غير معرفة؟", options: ["x=4", "x=−2", "x=2", "x=−4"], answer: 2, explanation: "المقام x²−4x+4=(x−2)²؛ يساوي صفرًا عند x=2، وعندها لا تكون الدالة معرفة." },
  { id: "6ad00e6163cd9c24f9f40986", page: 44, number: 43, topic: "الجبر - المعادلات النسبية", text: "ما قيمة x التي تحقق (3x+4)/5=(2x−1)/3؟", options: ["17", "12", "25", "20"], answer: 0, explanation: "نضرب تبادليًا: 3(3x+4)=5(2x−1)، أي 9x+12=10x−5؛ ومنه x=17." },
  { id: "6ad00e6163cd9c24f9f40987", page: 45, number: 1, topic: "المتتابعات الحسابية - الحد العام", text: "في المتتابعة الحسابية 43،39،35،…، ما رقم الحد الذي قيمته 7؟", options: ["5", "7", "10", "13"], answer: 2, explanation: "الفرق المشترك −4. نحل 43+(n−1)(−4)=7؛ فنحصل على n=10." },
  { id: "6ad00e6163cd9c24f9f40988", page: 45, number: 2, topic: "المتتابعات الحسابية - تطبيقات", text: "كانت قيمة سهم 90 ريالًا عند الاكتتاب، ثم أصبحت 96 ريالًا بعد 3 أشهر. إذا تغيرت القيمة شهريًا بمتتابعة حسابية، فما القيمة المتوقعة بعد 7 أشهر من الاكتتاب؟", options: ["100 ريال", "102 ريال", "104 ريالات", "106 ريالات"], answer: 2, explanation: "الزيادة خلال 3 أشهر هي 6 ريالات، أي 2 ريال شهريًا. بعد 7 أشهر تكون القيمة 90+7×2=104 ريالات." },
  { id: "6ad00e6163cd9c24f9f40989", page: 45, number: 3, topic: "المتتابعات الحسابية - الأساس", text: "متتابعة حسابية حدها العاشر 15 وحدها الأول −3. ما أساسها؟", options: ["2", "3", "4", "5"], answer: 0, explanation: "a₁₀=a₁+9d؛ لذلك 15=−3+9d، ومنه d=2." },
  { id: "6ad00e6163cd9c24f9f4098a", page: 45, number: 4, topic: "المتتابعات الحسابية - الحد الأول", text: "في متتابعة حسابية a₉=76 وa₁₀=83. ما حدها الأول؟", options: ["27", "20", "13", "7"], answer: 1, explanation: "الأساس d=83−76=7. ثم a₁=a₉−8d=76−56=20." },
  { id: "6ad00e6163cd9c24f9f4098b", page: 45, number: 5, topic: "المتتابعات الحسابية - الحد العام", text: "في متتابعة حسابية a₅=22 وa₂=13. ما قيمة a₁₃؟", options: ["44", "46", "48", "50"], answer: 1, explanation: "من a₅−a₂=3d نحصل على 9=3d، أي d=3. ثم a₁₃=a₂+11d=13+33=46." },
  { id: "6ad00e6163cd9c24f9f4098c", page: 45, number: 6, topic: "المتتابعات الحسابية - مجموع المتسلسلة", text: "ما مجموع المتسلسلة 2+4+6+…+100؟", options: ["100", "550", "2000", "2550"], answer: 3, explanation: "المتسلسلة تضم 50 عددًا زوجيًا من 2 إلى 100. المجموع =50(2+100)/2=2550." },
  { id: "6ad00e6163cd9c24f9f4098d", page: 46, number: 9, topic: "المتسلسلات - رمز سيجما", text: "أي صيغة برمز سيجما تكافئ 1+√2+∛3؟", options: ["Σ(k=1 إلى 3) k^(1/k)", "Σ(k=1 إلى 3) k^(−k)", "Σ(k=1 إلى 3) k^k", "Σ(k=1 إلى 3) √k"], answer: 0, explanation: "عند k=1،2،3 تكون الحدود k^(1/k) هي 1 و√2 و∛3 على الترتيب؛ لذا تمثل العبارة المطلوبة." },
  { id: "6ad00e6163cd9c24f9f4098e", page: 47, number: 17, topic: "المتتابعات الهندسية - الحد العام", text: "متتابعة هندسية حدودها …،−27،18،−12. ما الحد الرابع؟", options: ["−9", "−8", "9", "8"], answer: 3, explanation: "النسبة المشتركة 18/(−27)=−2/3، وكذلك (−12)/18=−2/3. الحد التالي هو −12×(−2/3)=8." },
  { id: "6ad00e6163cd9c24f9f4098f", page: 47, number: 18, topic: "المتتابعات الهندسية - الحد العام", text: "ما الحد الرابع في المتتابعة الهندسية 12،8،16/3،…؟", options: ["25/6", "25/12", "23/6", "32/9"], answer: 3, explanation: "النسبة المشتركة 8/12=2/3؛ لذا الحد الرابع=(16/3)×(2/3)=32/9." },
  { id: "6ad00e6163cd9c24f9f40990", page: 47, number: 20, topic: "المتتابعات الهندسية - الأساس", text: "مجموع الحدود الثلاثة الأولى لمتتابعة هندسية 26، ومجموع الحدود الثلاثة التالية 702. ما أساسها؟", options: ["27", "3", "1/3", "1/27"], answer: 1, explanation: "الحدود الثلاثة التالية تنتج من ضرب الحدود الثلاثة الأولى في r³؛ لذا r³=702/26=27، ومنه r=3." },
  { id: "6ad00e6163cd9c24f9f40991", page: 47, number: 21, topic: "المتسلسلات الهندسية - رمز سيجما", text: "ما قيمة Σ من k=1 إلى 11 للحد 3·4^(k−1)؟", options: ["4¹¹−1", "4¹⁰−1", "3¹¹−1", "3¹⁰−1"], answer: 0, explanation: "هذه متسلسلة هندسية حدها الأول 3 وأساسها 4 وعدد حدودها 11؛ مجموعها 3(4¹¹−1)/(4−1)=4¹¹−1." },
  { id: "6ad00e6163cd9c24f9f40992", page: 47, number: 23, topic: "المتسلسلات الهندسية اللانهائية - التقارب", text: "متى تكون المتسلسلة الهندسية اللانهائية متقاربة؟", options: ["|r|<1", "|r|>1", "|r|=1", "r=0 فقط"], answer: 0, explanation: "تتقارب المتسلسلة الهندسية اللانهائية عندما تكون القيمة المطلقة لأساسها أقل من 1." },
  { id: "6ad00e6163cd9c24f9f40993", page: 47, number: 24, topic: "المتسلسلات الهندسية اللانهائية", text: "ما مجموع متسلسلة هندسية لانهائية حدها الأول 25 وأساسها 1/2؟", options: ["25", "50", "60", "100"], answer: 1, explanation: "بما أن |r|<1 فالمجموع يساوي a₁/(1−r)=25/(1−1/2)=50." },
  { id: "6ad00e6163cd9c24f9f40994", page: 48, number: 26, topic: "الجبر - مفكوك ذات الحدين", text: "كم حدًا في مفكوك (a+b)⁹؟", options: ["9", "10", "11", "12"], answer: 1, explanation: "عدد حدود مفكوك (a+b)^n يساوي n+1؛ لذلك عدد الحدود في (a+b)^9 هو 10." },
  { id: "6ad00e6163cd9c24f9f40995", page: 49, number: 1, topic: "الاحتمالات - مبدأ العد الأساسي", text: "يريد أحمد شراء ثوب، ولديه 3 ألوان و4 أشكال وطولان للاختيار بينها. كم خيارًا مختلفًا لديه؟", options: ["9", "12", "24", "50"], answer: 2, explanation: "نضرب عدد الخيارات المستقلة: 3 ألوان×4 أشكال×2 طولين=24 خيارًا." },
  { id: "6ad00e6163cd9c24f9f40996", page: 49, number: 2, topic: "الاحتمالات - مبدأ العد الأساسي", text: "في معرض سيارات يوجد 3 أنواع للسيارات و4 ألوان وفئتان. كم خيارًا ممكنًا لسيارة واحدة؟", options: ["7", "9", "12", "24"], answer: 3, explanation: "عدد التركيبات الممكنة هو 3×4×2=24 خيارًا." },
  { id: "6ad00e6163cd9c24f9f40997", page: 49, number: 3, topic: "الاحتمالات - مبدأ العد الأساسي", text: "يريد أحمد السفر مع أحد أبنائه الثلاثة إلى إحدى ثلاث مدن متاحة. كم ناتجًا ممكنًا لاختيار الابن والمدينة؟", options: ["6", "9", "10", "18"], answer: 1, explanation: "لكل واحد من الأبناء الثلاثة ثلاث مدن ممكنة؛ إذن عدد النواتج 3×3=9." },
  { id: "6ad00e6163cd9c24f9f40998", page: 49, number: 4, topic: "الاحتمالات - فضاء العينة", text: "ما عدد عناصر فضاء العينة عند إلقاء قطعة نقد ومكعب مرقم من 1 إلى 6 معًا؟", options: ["2", "4", "6", "12"], answer: 3, explanation: "لقطعة النقد نتيجتان وللمكعب 6 نتائج؛ فضاء العينة يحوي 2×6=12 ناتجًا." },
  { id: "6ad00e6163cd9c24f9f40999", page: 49, number: 5, topic: "الاحتمالات - احتمال حدث", text: "مكعب مرقم من 1 إلى 6 ألقي مرتين. ما احتمال أن يكون مجموع الرقمين 8؟", options: ["5/36", "9/40", "2/25", "4/30"], answer: 0, explanation: "النواتج المرتبة التي مجموعها 8 هي (2،6)،(3،5)،(4،4)،(5،3)،(6،2)، أي 5 من أصل 36 ناتجًا متساوية الاحتمال." },
  { id: "6ad00e6163cd9c24f9f4099a", page: 49, number: 6, topic: "الاحتمالات - التباديل", text: "إذا كان n!=120، فما قيمة (n−1)!؟", options: ["60", "24", "50", "25"], answer: 1, explanation: "من n!=120 نعرف أن n=5؛ وبالتالي (n−1)!=4!=24." },
] as const;
const rejected = [
  { id: "6ad00e6163cd9c24f9f40982", page: 42, note: "رُفض من النشر: السجل المستخرج يخلط شرح الدرس ومثالًا مع نص سؤال وخيارات من الصفحة؛ لا يمكن اعتماده كسؤال مستقل دون إعادة استخراج موثوقة." },
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
