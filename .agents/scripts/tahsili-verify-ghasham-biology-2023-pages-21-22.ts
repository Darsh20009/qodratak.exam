import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103063cd9c24f9f40ca0", page: 21, number: 1, text: "أي طلائعي دقيق يُستخدم لمكافحة بعض الحشرات بوصفه عاملًا حيويًا؟", options: ["الميكروسبوريديا", "الأميبا", "البراميسيوم", "اليوجلينا"], answer: 0, explanation: "تُستخدم بعض أنواع الميكروسبوريديا، وهي طفيليات دقيقة، في المكافحة الحيوية لبعض الحشرات." },
  { id: "6ad0103063cd9c24f9f40ca1", page: 21, number: 2, text: "ما المرض الذي ينتشر في المناطق التي تتكاثر فيها بعوضة الأنوفيلس؟", options: ["الملاريا", "مرض النوم", "الإنفلونزا", "التسمم الغذائي"], answer: 0, explanation: "تنقل إناث بعوض الأنوفيلس طفيلي البلازموديوم المسبب للملاريا." },
  { id: "6ad0103063cd9c24f9f40ca2", page: 21, number: 3, text: "فُحصت عينة ماء مستنقع فوجد فيها مخلوق وحيد الخلية يمتلك نواتين. أي المخلوقات الآتية يُرجح أن يكون؟", options: ["الأميبا", "البراميسيوم", "البلازموديوم", "فيروس"], answer: 1, explanation: "يمتلك البراميسيوم نواة كبيرة وأخرى صغيرة، ويعيش في البيئات المائية." },
  { id: "6ad0103063cd9c24f9f40ca3", page: 21, number: 4, text: "أي المخلوقات الآتية لا يمتلك عضوًا متخصصًا للحركة، لكنه يتحرك بالانزلاق؟", options: ["الأميبا", "البراميسيوم", "البلازموديوم", "التريبانوسوما"], answer: 2, explanation: "تتحرك أطوار البلازموديوم بالانزلاق؛ ولا يستخدم أهدابًا أو أقدامًا كاذبة مثل بعض الطلائعيات الأخرى." },
  { id: "6ad0103063cd9c24f9f40ca4", page: 21, number: 5, text: "ما الوظيفة الأساسية للفجوة المنقبضة في اليوجلينا؟", options: ["البناء الضوئي", "الحركة والتغذية", "هضم الغذاء", "طرد الماء الزائد"], answer: 3, explanation: "تجمع الفجوة المنقبضة الماء الزائد وتطرده، فتساعد اليوجلينا على تنظيم الاتزان المائي." },
  { id: "6ad0103063cd9c24f9f40ca5", page: 21, number: 6, text: "مرض النوم الأمريكي (داء شاغاس) يسببه كائن من أي مجموعة؟", options: ["الفيروسات", "الفطريات", "الطلائعيات", "البكتيريا"], answer: 2, explanation: "يسبب داء شاغاس الطفيلي الأولي Trypanosoma cruzi، وهو من الطلائعيات." },
  { id: "6ad0103063cd9c24f9f40ca6", page: 21, number: 7, text: "ما الطفيل المسبب لمرض النوم الأفريقي؟", options: ["التريبانوسوما", "البلازموديوم", "الأنوفيلس", "ذبابة تسي تسي"], answer: 0, explanation: "يسبب مرض النوم الأفريقي طفيلي التريبانوسوما؛ أما ذبابة تسي تسي فتنقله." },
  { id: "6ad0103063cd9c24f9f40ca7", page: 21, number: 8, text: "أي عملية حيوية تقوم بها الطحالب الخضراء عادة؟", options: ["تكوين بقعة عينية", "تكوين هيكل سيليكي", "تكوين مستعمرات", "البناء الضوئي"], answer: 3, explanation: "تحتوي الطحالب الخضراء على أصباغ وبلاستيدات تمكّنها من إجراء البناء الضوئي." },
  { id: "6ad0103063cd9c24f9f40ca8", page: 21, number: 9, text: "أي المخلوقات الآتية يمكنه القيام بالبناء الضوئي؟", options: ["الأميبا", "اليوجلينا", "البراميسيوم", "البلازموديوم"], answer: 1, explanation: "تحتوي اليوجلينا على بلاستيدات خضراء، لذا يمكنها إجراء البناء الضوئي." },
  { id: "6ad0103063cd9c24f9f40ca9", page: 21, number: 10, text: "إذا انتشرت بعوضة الأنوفيلس في قرية، فما وسيلة المكافحة المباشرة المناسبة للحد من أعدادها؟", options: ["مبيد حشري مخصص", "معقم الأيدي", "الكمامات", "المضادات الحيوية"], answer: 0, explanation: "الأنوفيلس بعوضة؛ وتُحد أعدادها بإجراءات مكافحة نواقل الأمراض المعتمدة، ومنها استخدام مبيد حشري مناسب وفق تعليمات السلامة." },
  { id: "6ad0103063cd9c24f9f40caa", page: 21, number: 11, text: "تحارب دولة أفريقية البعوض للحد من انتشار أي مرض؟", options: ["الملاريا", "الأميبا", "اليوجلينا", "البراميسيوم"], answer: 0, explanation: "تساعد مكافحة بعوض الأنوفيلس على الحد من انتقال طفيلي الملاريا." },
  { id: "6ad0103063cd9c24f9f40cab", page: 21, number: 12, text: "أي الطلائعيات الآتية تُستخدم بقاياها السيليكية في تلميع الفلزات؟", options: ["اليوجلينا", "الطحالب البنية", "الدياتومات", "الطحالب الذهبية"], answer: 2, explanation: "تتراكم أصداف الدياتومات الغنية بالسيليكا في التراب الدياتومي، الذي يدخل في مواد كاشطة وتلميع." },
  { id: "6ad0103063cd9c24f9f40cac", page: 22, number: 13, text: "أي مجموعة من الطلائعيات تتغذى بتحليل مواد عضوية، وقد يكون جدارها الخلوي من السليلوز؟", options: ["الطحالب", "الطلائعيات الشبيهة بالفطريات", "النباتات", "الحيوانات"], answer: 1, explanation: "تضم الطلائعيات الشبيهة بالفطريات كائنات محللة؛ وتحتوي جدران بعض العفن المائي على السليلوز." },
  { id: "6ad0103063cd9c24f9f40cad", page: 22, number: 14, text: "أي إجراء مباشر يحد من انتقال الملاريا؟", options: ["طهي اللحم جيدًا", "عدم تناول طعام مكشوف", "مكافحة البعوض الناقل", "تعقيم مياه الشرب"], answer: 2, explanation: "تنتقل الملاريا إلى الإنسان عبر أنثى بعوض الأنوفيلس؛ لذا تقلل مكافحة البعوض الناقل من خطر انتقالها." },
  { id: "6ad0103063cd9c24f9f40cae", page: 22, number: 16, text: "تُستخدم بعض أنواع الميكروسبوريديا في صناعة:", options: ["المنظفات", "المواد الكيميائية", "الدهانات", "المبيدات الحشرية الحيوية"], answer: 3, explanation: "تُستخدم أنواع من الميكروسبوريديا بوصفها عوامل مكافحة حيوية لبعض الحشرات والآفات." },
  { id: "6ad0103063cd9c24f9f40caf", page: 22, number: 17, text: "أي مرض يسببه الطلائعي البلازموديوم؟", options: ["التسمم", "داء الفيل", "مرض النوم", "الملاريا"], answer: 3, explanation: "يسبب طفيلي البلازموديوم مرض الملاريا، وينتقل إلى الإنسان بواسطة أنثى بعوض الأنوفيلس." },
  { id: "6ad0103063cd9c24f9f40cb0", page: 22, number: 18, text: "أي استخدام غذائي معروف لبعض الطحالب الحمراء؟", options: ["معجون الأسنان", "الطعام", "التصفية والترشيح", "تلميع الفلزات"], answer: 1, explanation: "تُستخدم أنواع من الطحالب الحمراء غذاءً، كما تُستخرج منها مواد تدخل في تصنيع الأغذية." },
  { id: "6ad0103063cd9c24f9f40cb1", page: 22, number: 19, text: "أين تتم عملية البناء الضوئي في اليوجلينا؟", options: ["البلاستيدات الخضراء", "النواة", "البقعة العينية", "القشيرة"], answer: 0, explanation: "تتم عملية البناء الضوئي في البلاستيدات الخضراء التي تحتوي على أصباغ تمتص الضوء." },
  { id: "6ad0103063cd9c24f9f40cb2", page: 22, number: 21, text: "ما المجموعة التي تسبب بعض أنواعها ظاهرة المد الأحمر؟", options: ["الطحالب الدوارة", "الطحالب البنية", "الدياتومات", "الطحالب الخضراء"], answer: 0, explanation: "قد تتكاثر بعض الطحالب الدوارة بكثافة فتسبب ظاهرة المد الأحمر، وقد تنتج أنواع منها سمومًا." },
  { id: "6ad0103063cd9c24f9f40cb3", page: 22, number: 22, text: "أي الأمراض الآتية ينقله البعوض؟", options: ["السل", "الملاريا", "البق", "الفراش"], answer: 1, explanation: "ينقل بعوض الأنوفيلس طفيلي البلازموديوم المسبب للملاريا." },
  { id: "6ad0103063cd9c24f9f40cb4", page: 22, number: 23, text: "ما التركيب الذي ينظم توازن الماء في البراميسيوم عند عيشه في المياه العذبة؟", options: ["النواة الكبيرة", "الفجوة المنقبضة", "النواة الصغيرة", "الأهداب"], answer: 1, explanation: "يدخل الماء إلى البراميسيوم بالخاصية الأسموزية في البيئة العذبة؛ وتطرد الفجوة المنقبضة الماء الزائد. صُححت صياغة المسودة التي ربطت وجود خلل بالانكماش." },
  { id: "6ad0103063cd9c24f9f40cb5", page: 22, number: 24, text: "لماذا قد تُحذر الجهات الصحية من تناول بعض المحار بعد حدوث المد الأحمر؟", options: ["لأن المحار قد يتغذى على الطحالب الدوارة المنتجة للسموم", "لأنه يتغذى على الطحالب الحمراء فقط", "لأنه يتغذى على الدياتومات", "لأنه يتغذى على الطحالب الخضراء"], answer: 0, explanation: "قد تتراكم سموم بعض الطحالب الدوارة في المحار الذي يتغذى عليها، فيصبح تناوله خطرًا." },
  { id: "6ad0103063cd9c24f9f40cb6", page: 22, number: 25, text: "أي طلائعي يمكنه القيام بالبناء الضوئي والتغذي بطرائق أخرى، فيشبه النباتات والحيوانات معًا؟", options: ["اليوجلينا", "البراميسيوم", "الإسبيروجيرا", "الأميبا"], answer: 0, explanation: "تقوم اليوجلينا بالبناء الضوئي عند توفر الضوء، ويمكنها أيضًا الحصول على الغذاء بطرائق غير ذاتية؛ لذلك تجمع صفات نباتية وحيوانية." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: approvals.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey sourceBook subcategory topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== approvals.length) failures.push(`expected ${approvals.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: published record conflicts with this review`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: 0, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate(
      { sourceKey: draft.sourceKey },
      { $set: {
        questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
        subject: "أحياء", subcategory: "الطلائعيات", text: item.text, options: [...item.options], correctOptionIndex: item.answer,
        difficulty: draft.difficulty || "intermediate", topic: draft.topic || "الطلائعيات", explanation: item.explanation,
        sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
        ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
        sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
      }, $setOnInsert: { createdAt: reviewedAt } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } },
      { $set: { status: "approved", subject: "أحياء", subcategory: "الطلائعيات", text: item.text, options: [...item.options], explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مطابقة الإجابة والشرح مع المصدر وتصحيح الصياغة العلمية عند الحاجة.", updatedAt: reviewedAt } },
    );
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
