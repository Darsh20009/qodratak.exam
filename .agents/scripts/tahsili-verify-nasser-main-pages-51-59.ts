import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6163cd9c24f9f4099d", page: 51, number: 15, topic: "الاحتمالات الهندسية", text: "على القطعة المستقيمة AD، الأطوال AB=4 وBC=6 وCD=8. إذا اختيرت نقطة عشوائيًا على AD، فما احتمال وقوعها على BC؟", options: ["1/3", "1/2", "2/5", "2/3"], answer: 0, explanation: "طول AD يساوي 4+6+8=18، والجزء BC طوله 6؛ لذلك الاحتمال 6/18=1/3." },
  { id: "6ad00e6163cd9c24f9f4099e", page: 51, number: 20, topic: "الاحتمالات - الاحتمال الشرطي", text: "صندوق فيه كرتان حمراوان وثلاث كرات زرقاء. إذا سُحبت كرة زرقاء أولًا دون إرجاع، فما احتمال سحب كرة زرقاء ثانية؟", options: ["0.3", "0.5", "0.7", "0.8"], answer: 1, explanation: "بعد سحب كرة زرقاء يبقى كرتان زرقاوان من أصل أربع كرات؛ الاحتمال 2/4=0.5." },
  { id: "6ad00e6163cd9c24f9f4099f", page: 52, number: 22, topic: "الاحتمالات - أحداث مستقلة", text: "عند رمي مكعب مرقم من 1 إلى 6 وإلقاء قطعة نقد مرة واحدة، ما احتمال ظهور عدد أكبر من 4 وظهور الشعار؟", options: ["1/4", "1/6", "1/8", "1/12"], answer: 1, explanation: "احتمال عدد أكبر من 4 هو 2/6=1/3، واحتمال ظهور الشعار 1/2. الحدثان مستقلان، فالاحتمال المشترك 1/3×1/2=1/6." },
  { id: "6ad00e6163cd9c24f9f409a0", page: 53, number: 29, topic: "الإحصاء - تصميم الدراسات", text: "اختير 200 طالب عشوائيًا وقُسّموا إلى مجموعتين: خضعت إحداهما لبرنامج تدريبي، ولم تخضع الأخرى له. ما نوع الدراسة؟", options: ["دراسة تجريبية", "دراسة مسحية", "دراسة بالملاحظة", "دراسة ارتباط"], answer: 0, explanation: "الباحث فرض معالجة على مجموعة (البرنامج التدريبي) وقارنها بمجموعة ضابطة؛ لذلك هذه دراسة تجريبية." },
  { id: "6ad00e6163cd9c24f9f409a1", page: 53, number: 33, topic: "الإحصاء - المدرج التكراري", text: "يبين المدرج التكراري أطوال طلاب الصف الرابع في مدرسة. التكرارات للفئات 101–105، 106–110، 111–115، 116–120، 121–125 هي على الترتيب 16،12،12،12،2. ما النسبة المئوية للطلاب الذين أطوالهم 115 أو أقل؟", options: ["22%", "48%", "52%", "74%"], answer: 3, explanation: "عدد الطلاب حتى طول 115 هو 16+12+12=40، ومجموع الطلاب 16+12+12+12+2=54. النسبة 40/54≈74%." },
  { id: "6ad00e6163cd9c24f9f409a4", page: 55, number: 43, topic: "الإحصاء - التوزيع الطبيعي", text: "يتوزع متغير توزيعًا طبيعيًا بمتوسط 34 وانحراف معياري 5. وفق قاعدة 68–95–99.7 التقريبية، ما احتمال أن تكون قيمة مختارة أقل من 49؟", options: ["87%", "68%", "99.85%", "100%"], answer: 2, explanation: "49 يساوي المتوسط زائد 3 انحرافات معيارية. وفق القاعدة التقريبية، يقع نحو 99.7% بين −3σ و+3σ؛ أي يبقى نحو 0.15% في الطرف الأيمن، فتكون المساحة إلى يسار +3σ نحو 99.85%. صُحح الخيار الوارد في المصدر لأنه لم يتضمن قيمة صحيحة." },
  { id: "6ad00e6163cd9c24f9f409a5", page: 55, number: 45, topic: "الإحصاء - التوزيع الطبيعي", text: "تتوزع أعمار 10000 بطارية توزيعًا طبيعيًا بمتوسط 300 يوم وانحراف معياري 40 يومًا. كم بطارية يُتوقع أن يقع عمرها بين 260 و340 يومًا؟", options: ["6800", "5000", "3400", "2500"], answer: 0, explanation: "الفترة 260–340 تساوي المتوسط ± انحراف معياري واحد، ويقع فيها نحو 68% من القيم؛ 0.68×10000=6800 بطارية." },
  { id: "6ad00e6163cd9c24f9f409a6", page: 55, number: 46, topic: "الإحصاء - التوزيع الطبيعي", text: "تتوزع البيانات طبيعيًا بمتوسط 25 وانحراف معياري 2. ما احتمال أن تكون قيمة مختارة عشوائيًا أقل من 27؟", options: ["84%", "97%", "16%", "25%"], answer: 0, explanation: "27 يساوي المتوسط زائد انحراف معياري واحد. المساحة إلى يسار +1σ تساوي تقريبًا 50%+34%=84%." },
  { id: "6ad00e6163cd9c24f9f409a7", page: 55, number: 47, topic: "الإحصاء - التوزيع الطبيعي", text: "تتوزع البيانات طبيعيًا بمتوسط 2 وانحراف معياري 1. ما النسبة التقريبية للقيم الأكبر من 3؟", options: ["84%", "97%", "16%", "25%"], answer: 2, explanation: "3 يساوي المتوسط زائد انحراف معياري واحد؛ المساحة الواقعة إلى يمينه نحو 16% وفق قاعدة التوزيع الطبيعي التقريبية." },
  { id: "6ad00e6163cd9c24f9f409a8", page: 56, number: 49, topic: "الإحصاء - التوزيع ذي الحدين", text: "يفوز لاعب في 50% من مبارياته. ما احتمال أن يفوز في 3 مباريات بالضبط من بين 5 مباريات قادمة؟", options: ["5/16", "1/2", "3/5", "1"], answer: 0, explanation: "نستخدم توزيع ذي الحدين: C(5،3)(0.5)³(0.5)²=10/32=5/16." },
  { id: "6ad00e6163cd9c24f9f409a9", page: 57, number: 1, topic: "حساب المثلثات - القياس الدائري", text: "ما القياس الدائري للزاوية 30°؟", options: ["π/6 rad", "π/3 rad", "2π/3 rad", "π rad"], answer: 0, explanation: "نحوّل الدرجات إلى راديان بالضرب في π/180: 30×π/180=π/6 راديان." },
  { id: "6ad00e6163cd9c24f9f409aa", page: 57, number: 2, topic: "حساب المثلثات - القياس الدائري", text: "إذا دارت الأرض دورة كاملة، فما قياس زاوية الدوران بالراديان؟", options: ["π/2 rad", "π rad", "3π/2 rad", "2π rad"], answer: 3, explanation: "الدورة الكاملة 360°، وتساوي 2π راديان." },
  { id: "6ad00e6163cd9c24f9f409ab", page: 57, number: 3, topic: "حساب المثلثات - تحويل الراديان إلى درجات", text: "ما القياس الستيني للزاوية 3π/2 راديان؟", options: ["90°", "180°", "270°", "360°"], answer: 2, explanation: "نحوّل إلى درجات بالضرب في 180/π: (3π/2)×(180/π)=270°." },
  { id: "6ad00e6163cd9c24f9f409ac", page: 57, number: 4, topic: "حساب المثلثات - النسب المثلثية", text: "في مثلث قائم أضلاعه 3 و4 و5، والزاوية θ مقابلة للضلع 3، ما قيمة sec θ−tan θ؟", options: ["1/2", "3/4", "5/4", "2"], answer: 0, explanation: "بالنسبة إلى θ: secθ=5/4 وtanθ=3/4؛ إذن secθ−tanθ=2/4=1/2." },
  { id: "6ad00e6163cd9c24f9f409af", page: 59, number: 18, topic: "الهندسة - الدائرة وطول القوس", text: "طول قوس في دائرة 88 cm ويقابله زاوية مركزية 2π/3 راديان. ما طول قطر الدائرة إذا كان π≈22/7؟", options: ["88 cm", "84 cm", "42 cm", "21 cm"], answer: 1, explanation: "طول القوس s=rθ؛ لذا r=88÷(2π/3)=132/π=42 cm باستخدام π=22/7. القطر يساوي 2r=84 cm." },
  { id: "6ad00e6163cd9c24f9f409b0", page: 59, number: 19, topic: "الهندسة - مساحة المثلث", text: "في المثلث ABC، AB=3 cm وBC=4 cm والزاوية المحصورة بينهما 30°. ما مساحة المثلث؟", options: ["12 cm²", "6 cm²", "4 cm²", "3 cm²"], answer: 3, explanation: "المساحة =1/2×AB×BC×sin30°=1/2×3×4×1/2=3 cm²." },
  { id: "6ad00e6163cd9c24f9f409b1", page: 59, number: 21, topic: "الهندسة - مساحة المثلث", text: "مساحة مثلث 15 cm²، وطول AB=6 cm والزاوية المحصورة عند B تساوي 30°. ما طول BC؟", options: ["14 cm", "10 cm", "8 cm", "6 cm"], answer: 1, explanation: "15=1/2×6×BC×sin30°=1.5×BC؛ إذن BC=10 cm." },
  { id: "6ad00e6163cd9c24f9f409b3", page: 59, number: 23, topic: "الجبر والهندسة - المعادلات النسبية", text: "طولا ضلعي مثلث قائم هما (x−1)/(x−5) و(2x−2)/(x−1)، ومساحته 5. ما قيمة x؟", options: ["1", "6", "23/3", "26/4"], answer: 1, explanation: "المساحة تساوي نصف حاصل ضرب الضلعين: 1/2×((x−1)/(x−5))×((2x−2)/(x−1))=(x−1)/(x−5)=5. بحل المعادلة x−1=5x−25 فنحصل على x=6، وهو لا يصفر أي مقام." },
] as const;
const rejected = [
  { id: "6ad00e6163cd9c24f9f409a2", page: 54, note: "رُفض من النشر: الاستخراج جمع شرح مقاييس النزعة المركزية ومحتوى عدة أسئلة في سجل واحد؛ لا يمثل سؤالًا مستقلًا صالحًا للتصحيح." },
  { id: "6ad00e6163cd9c24f9f409ad", page: 58, note: "رُفض من النشر: الاستخراج دمج عنوان الدرس وشرح الوضع القياسي مع أجزاء سؤال وخيارات؛ لا يمثل سؤالًا مستقلًا صالحًا للتصحيح." },
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
