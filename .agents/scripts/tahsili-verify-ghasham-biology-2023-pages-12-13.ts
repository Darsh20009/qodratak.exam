import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103063cd9c24f9f40c6e", page: 12, number: 2, text: "أي نوع من البدائيات يُتوقع وجوده في مياه الصرف الصحي؟", options: ["البدائيات المحبة للحرارة", "البدائيات المنتجة للميثان", "البدائيات المحبة للحموضة", "البدائيات المحبة للملوحة"], answer: 1, explanation: "تعيش البدائيات المنتجة للميثان في بيئات لاهوائية غنية بالمواد العضوية، ومنها بعض مرافق معالجة مياه الصرف." },
  { id: "6ad0103063cd9c24f9f40c6f", page: 12, number: 3, text: "أي الخصائص الآتية تنطبق على البدائيات المنتجة للميثان؟", options: ["يمكن استخدامها في معالجة مياه الصرف الصحي", "تتنفس بوجود الأكسجين", "نواتها محاطة بغشاء نووي", "تقوم بالبناء الضوئي"], answer: 0, explanation: "تُستخدم بعض البدائيات المنتجة للميثان في معالجة مياه الصرف؛ وهي لاهوائية وخلاياها بدائية النواة، ولا تقوم بالبناء الضوئي." },
  { id: "6ad0103063cd9c24f9f40c70", page: 12, number: 4, text: "إذا احتوى جدار خلية بكتيرية على طبقة سميكة من الببتيدوجلايكان، فما لونها بعد صبغة جرام؟", options: ["الوردي", "البنفسجي (القرمزي)", "الأصفر", "الأزرق"], answer: 1, explanation: "تحتفظ البكتيريا موجبة جرام ذات طبقة الببتيدوجلايكان السميكة بصبغة الكريستال البنفسجي فتظهر بنفسجية؛ أما سالبة جرام فتظهر وردية." },
  { id: "6ad0103063cd9c24f9f40c71", page: 12, number: 5, text: "إذا فُحصت عينة ماء من مستنقع تحت المجهر، فأي المخلوقات يُتوقع العثور عليه؟", options: ["حيوانات أولية", "نباتات وعائية", "نباتات لا بذرية", "حيوانات ثانوية"], answer: 0, explanation: "تعيش في مياه المستنقعات طلائعيات وحيوانات أولية مجهرية؛ أما النباتات الوعائية واللابذرية فتُرى بوصفها نباتات وليست حيوانات مجهرية." },
  { id: "6ad0103063cd9c24f9f40c72", page: 12, number: 6, text: "ما العامل الشائع الذي يسهم في ظهور بكتيريا مقاومة للمضادات الحيوية؟", options: ["تأخر علاج الحالة المرضية", "الإفراط في تناول المضادات الحيوية", "استخدام مضادات حيوية مقاومة للفيروسات", "معالجة الجسم بالاتزان الغذائي"], answer: 1, explanation: "الاستخدام المفرط أو غير المناسب للمضادات يفرض ضغطًا انتقائيًا؛ فتنجو البكتيريا المقاومة وتتكاثر." },
  { id: "6ad0103063cd9c24f9f40c73", page: 12, number: 7, text: "بدأت خلية سالمونيلا واحدة بالانقسام كل 20 دقيقة في ظروف مناسبة. كم خلية تنتج بعد ساعتين؟", options: ["16", "32", "64", "128"], answer: 2, explanation: "الساعتان تساويان 120 دقيقة؛ أي ستة أجيال من الانقسام. العدد = 1×2⁶ = 64 خلية." },
  { id: "6ad0103063cd9c24f9f40c74", page: 12, number: 8, text: "أي المجموعات الآتية تضم كائنات يستخدم بعضها ثاني أكسيد الكربون في التنفس اللاهوائي؟", options: ["البدائيات", "الإنسان", "الفأر", "الأسماك"], answer: 0, explanation: "تستخدم بعض البدائيات المنتجة للميثان ثاني أكسيد الكربون في الأيض اللاهوائي وتنتج الميثان." },
  { id: "6ad0103063cd9c24f9f40c75", page: 12, number: 9, text: "عُثر على بكتيريا إشريشيا كولاي في مزرعة. أي مصدر محتمل يدل عليه وجودها؟", options: ["مخلفات طبية", "أمطار حمضية", "مياه الصرف الصحي", "اللعاب"], answer: 2, explanation: "توجد بكتيريا E. coli في أمعاء الإنسان والحيوانات، وقد يشير وجودها في الماء أو البيئة إلى تلوث برازي أو بمياه الصرف الصحي." },
  { id: "6ad0103063cd9c24f9f40c76", page: 12, number: 10, text: "أي الخلايا الآتية لا يمكن رؤية غشاء نووي فيها عند فحصها بالمجهر؟", options: ["خلية برنشيمية في ورقة شجر", "بكتيريا", "خلية من أنسجة أرنب", "خلية فطر"], answer: 1, explanation: "البكتيريا بدائية النواة ولا تمتلك نواة محاطة بغشاء؛ أما الخلايا النباتية والحيوانية والفطرية فحقيقية النواة." },
  { id: "6ad0103063cd9c24f9f40c77", page: 13, number: 11, text: "اكتشف باحث مخلوقًا جديدًا ولاحظ أن خلاياه بدائية النواة. أي صفة خلوية تدعم هذا التصنيف؟", options: ["احتواء الخلية على فجوات صغيرة", "وجود رايبوسومات في السيتوبلازم", "وجود جدار خلوي", "عدم وجود عضيات محاطة بأغشية"], answer: 3, explanation: "الخلايا بدائية النواة تفتقر إلى النواة والعضيات المحاطة بأغشية؛ وهذه سمة تميزها عن الخلايا حقيقية النواة." },
  { id: "6ad0103063cd9c24f9f40c78", page: 13, number: 12, text: "كيف تتغذى البكتيريا الخضراء المزرقة (السيانوبكتيريا)؟", options: ["غير ذاتية التغذية", "تغذية كيميائية", "تغذية ضوئية", "ترمم"], answer: 2, explanation: "السيانوبكتيريا ذاتية التغذية ضوئيًا؛ تستخدم الطاقة الضوئية لتكوين مواد عضوية من مواد غير عضوية." },
  { id: "6ad0103063cd9c24f9f40c79", page: 13, number: 13, text: "تختلف القطط المنزلية عن الثعالب في أي مستوى تصنيفي؟", options: ["الرتبة", "الطائفة", "الفصيلة", "النوع"], answer: 2, explanation: "تنتمي القطط والثعالب إلى رتبة اللواحم وطائفة الثدييات وشعبة الحبليات، لكن القطط من الفصيلة السنورية والثعالب من الكلبية." },
  { id: "6ad0103063cd9c24f9f40c7a", page: 13, number: 14, text: "يعرض الجدول نوع الخلايا وتركيب الجدار لمجموعات تصنيفية. أي صف صحيح؟", options: ["الصف 1", "الصف 2", "الصف 3", "الصف 4"], answer: 1, explanation: "البكتيريا بدائية النواة، ويحتوي جدار معظمها على الببتيدوجلايكان؛ لذا يطابق ذلك الصف الثاني في الجدول." },
  { id: "6ad0103063cd9c24f9f40c7c", page: 13, number: 16, text: "عندما تتغذى البكتيريا ذاتيًا مستخدمةً مركبات غير عضوية بوصفها مصدرًا للطاقة، فما نمط التغذية المقصود؟", options: ["التطفل", "التمثيل الكيميائي", "التمثيل الضوئي", "الترمم"], answer: 1, explanation: "تستمد البكتيريا ذاتية التغذية كيميائيًا الطاقة من أكسدة مركبات غير عضوية لتكوين مواد عضوية؛ وقد صُححت كلمة «عضوية» في المسودة إلى «غير عضوية» اتساقًا مع مفهوم السؤال وشرح المصدر." },
  { id: "6ad0103063cd9c24f9f40c7d", page: 13, number: 17, text: "ما الصفة المشتركة بين البدائيات والبكتيريا؟", options: ["عدم وجود جدار خلوي", "عدم وجود غشاء نووي", "غير ذاتية التغذية", "وجود الببتيدوجلايكان في جدارها"], answer: 1, explanation: "كلتاهما من بدائيات النوى؛ مادتهما الوراثية غير محاطة بغشاء نووي. ولا تمتلك البدائيات جدارًا من الببتيدوجلايكان." },
  { id: "6ad0103063cd9c24f9f40c7f", page: 13, number: 19, text: "أي مرض بكتيري يصيب الرئتين وقد يضعف انتقال الأكسجين إلى الدم؟", options: ["السل الرئوي", "الربو", "الزهري", "السيلان"], answer: 0, explanation: "السل الرئوي عدوى بكتيرية تصيب أنسجة الرئة وقد تضعف تبادل الغازات؛ أما الربو فليس مرضًا بكتيريًا." },
  { id: "6ad0103063cd9c24f9f40c80", page: 13, number: 20, text: "أي عاملين قد يسهمان في مقاومة البكتيريا لبعض المضادات الحيوية؟", options: ["تأخر معالجتها فقط", "استعمال المضادات الحيوية فقط", "الطفرات وتغيرات تركيب الخلية أو جدارها", "التكاثر اللاجنسي وحده"], answer: 2, explanation: "قد تمنح الطفرات أو انتقال جينات المقاومة البكتيريا صفات تقلل تأثرها بالمضاد، كما يمكن أن يحد اختلاف نفاذية الجدار أو غشائها من تأثير بعض الأدوية." },
  { id: "6ad0103063cd9c24f9f40c81", page: 13, number: 21, text: "أي عملية تنقل فيها بكتيريا مادة وراثية مباشرة إلى خلية بكتيرية أخرى؟", options: ["الاقتران", "الانشطار الثنائي", "التبرعم", "التجدد"], answer: 0, explanation: "في الاقتران البكتيري تنتقل مادة وراثية من خلية إلى أخرى عبر اتصال مباشر؛ وهو نقل أفقي للمادة الوراثية وليس انقسامًا لزيادة عدد الخلايا." },
] as const;

const rejections = [
  { id: "6ad0103063cd9c24f9f40c6d", page: 12, number: 1, note: "حُجب السؤال: مرض لايم والتيتانوس قد يصيبان الجهاز العصبي، لذلك لا تنفرد إجابة واحدة رغم مفتاح المصدر." },
  { id: "6ad0103063cd9c24f9f40c7b", page: 13, number: 15, note: "حُجب السؤال: البدائيات المنتجة للميثان كائنات من العتائق وليست بكتيريا؛ لذلك لا يقدم السؤال خيارًا علميًا صحيحًا بصيغته." },
  { id: "6ad0103063cd9c24f9f40c7e", page: 13, number: 18, note: "حُجب السؤال لتكراره سؤال 17 عن اشتراك البدائيات والبكتيريا في غياب الغشاء النووي." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const reviewed = [...approvals, ...rejections];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: reviewed.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey sourceBook subcategory topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: published record conflicts with this review`);
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !["pending_review", "rejected"].includes(draft.status)) failures.push(`q${item.number}: rejection source/page/status mismatch`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number}: rejected item unexpectedly exists in published bank`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: rejections.length, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate(
      { sourceKey: draft.sourceKey },
      { $set: {
        questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
        subject: "أحياء", subcategory: "بدائيات النوى والبكتيريا", text: item.text, options: [...item.options], correctOptionIndex: item.answer,
        difficulty: draft.difficulty || "intermediate", topic: draft.topic || "بدائيات النوى والبكتيريا", explanation: item.explanation,
        sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
        ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
        sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
      }, $setOnInsert: { createdAt: reviewedAt } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } },
      { $set: { status: "approved", subject: "أحياء", subcategory: "بدائيات النوى والبكتيريا", text: item.text, options: [...item.options], explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة المفتاح والشرح مع المصدر وتصحيح المصطلحات العلمية عند الحاجة.", updatedAt: reviewedAt } },
    );
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } },
      { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt } },
    );
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
