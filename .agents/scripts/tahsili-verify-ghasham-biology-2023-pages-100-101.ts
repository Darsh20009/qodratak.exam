import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40e84", page: 100, number: 1, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "أي جزء من الزهرة يجذب كثيرًا من الحشرات الملقحة بألوانه؟", options: ["البتلات", "الميسم", "الكربلة", "السداة"], answer: 0, explanation: "تجذب بتلات كثير من الأزهار الحشرات بألوانها وروائحها، وقد تساعدها أيضًا الرحيق والعلامات المرئية." },
  { id: "6ad0103163cd9c24f9f40e85", page: 100, number: 2, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "أي صفة تساعد على تمييز الأزهار التي تلقحها الرياح عن الأزهار التي تلقحها الحيوانات؟", options: ["رائحة قوية", "ألوان بتلات زاهية", "رحيق وفير", "متوك بارزة خارج الزهرة لتطلق حبوب اللقاح"], answer: 3, explanation: "غالبًا تكون أزهار التلقيح بالرياح أقل لفتًا للحشرات، وتكون متوكها بارزة لتسهيل إطلاق حبوب اللقاح والتقاطها. صُححت صياغة الخيار التي كانت تعكس هذا التكيف." },
  { id: "6ad0103163cd9c24f9f40e86", page: 100, number: 3, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "تظهر في الزهرة المرسومة بتلات وسبلات وأسدية وكربلة. كيف تصنف من حيث الجنس والاكتمال؟", options: ["أحادية الجنس ناقصة", "أحادية الجنس كاملة", "ثنائية الجنس كاملة", "ثنائية الجنس ناقصة"], answer: 2, explanation: "تضم الزهرة المرسومة أعضاء التذكير والتأنيث، إضافة إلى البتلات والسبلات؛ لذلك فهي ثنائية الجنس كاملة." },
  { id: "6ad0103163cd9c24f9f40e87", page: 100, number: 4, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "على أي جزء من الزهرة تستقر حبة اللقاح عند حدوث التلقيح؟", options: ["الميسم", "القلم", "المبيض", "السداة"], answer: 0, explanation: "التلقيح هو انتقال حبوب اللقاح إلى الميسم، ثم قد ينبت أنبوب اللقاح متجهًا عبر القلم نحو البويضة." },
  { id: "6ad0103163cd9c24f9f40e88", page: 100, number: 5, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "ما التركيب الذكري في الزهرة؟", options: ["السبلات", "الكربلة", "البتلات", "الأسدية"], answer: 3, explanation: "تتكون السداة من متك وخيط، وتنتج حبوب اللقاح؛ ومجموع الأسدية يمثل الجزء الذكري للزهرة." },
  { id: "6ad0103163cd9c24f9f40e89", page: 100, number: 6, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "أي جزء من الزهرة يتحول إلى ثمرة بعد الإخصاب؟", options: ["الأسدية", "المبيض", "البتلات", "البويضة"], answer: 1, explanation: "يتطور المبيض عادة إلى ثمرة بعد الإخصاب، بينما تتطور البويضة المخصبة إلى بذرة." },
  { id: "6ad0103163cd9c24f9f40e8a", page: 100, number: 7, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "ما وظيفة البتلات في كثير من الأزهار؟", options: ["جذب الملقحات", "إنتاج البويضات", "استقبال حبوب اللقاح", "تكوين البذور مباشرة"], answer: 0, explanation: "تساعد البتلات في جذب الملقحات، كما تحيط بالأعضاء التكاثرية داخل الزهرة." },
  { id: "6ad0103163cd9c24f9f40e8b", page: 100, number: 8, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "ما اسم العضو الذكري للزهرة، المكوّن من المتك والخيط؟", options: ["البتلة", "الكربلة", "السداة", "السبلة"], answer: 2, explanation: "السداة هي العضو الذكري، وتتكون من المتك الذي ينتج حبوب اللقاح والخيط الذي يحمله." },
  { id: "6ad0103163cd9c24f9f40e8c", page: 100, number: 11, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "إذا كانت الأجزاء الزهرية في النبات تأتي غالبًا في مضاعفات العدد ثلاثة، فإلى أي مجموعة ينتمي غالبًا؟", options: ["ذوات الفلقة", "ذوات الفلقتين", "معراة البذور", "المخروطيات"], answer: 0, explanation: "تتميز كثير من ذوات الفلقة الواحدة بأن أجزاء أزهارها تأتي في مضاعفات ثلاثة." },
  { id: "6ad0103163cd9c24f9f40e8d", page: 100, number: 12, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "أي تكيف يميز عادة الأزهار التي تلقحها الرياح عن الأزهار التي تلقحها الحيوانات؟", options: ["بتلات كبيرة زاهية", "متوك بارزة خارج الزهرة", "رائحة قوية", "رحيق وفير"], answer: 1, explanation: "تكون متوك كثير من الأزهار التي تلقحها الرياح بارزة لتسهيل إطلاق حبوب اللقاح في الهواء. استُبدل الخيار غير الدقيق بوصف التكيف المعروف." },
  { id: "6ad0103163cd9c24f9f40e8e", page: 101, number: 13, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "غالبًا ما تدل الزهرة ذات الأجزاء في مضاعفات العدد خمسة على نبات من:", options: ["ذوات الفلقة", "ذوات الفلقتين", "أحادية الجنس", "ثنائية الجنس"], answer: 1, explanation: "تأتي أجزاء أزهار كثير من ذوات الفلقتين في مضاعفات أربعة أو خمسة، بخلاف ذوات الفلقة الواحدة التي تميل إلى مضاعفات ثلاثة." },
  { id: "6ad0103163cd9c24f9f40e8f", page: 101, number: 14, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "الزهرة التي تحتوي على أسدية وكرابل تُصنف بأنها:", options: ["ثنائية الجنس", "أحادية الجنس", "ذكرية فقط", "أنثوية فقط"], answer: 0, explanation: "تحتوي الزهرة ثنائية الجنس على أعضاء التذكير (الأسدية) وأعضاء التأنيث (الكرابل) معًا." },
  { id: "6ad0103163cd9c24f9f40e91", page: 101, number: 16, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "أين توجد البويضة، ويحدث الإخصاب في تركيب الزهرة؟", options: ["الميسم", "القلم", "البويضة داخل المبيض", "السداة"], answer: 2, explanation: "توجد البويضة داخل المبيض، ويحدث الإخصاب فيها بعد وصول الجاميت الذكري عبر أنبوب اللقاح." },
  { id: "6ad0103163cd9c24f9f40e92", page: 101, number: 17, subcategory: "النباتات - التكاثر في النباتات الزهرية", text: "أي النباتات تزهر عادة عندما تكون ساعات الظلام أقل من الفترة الحرجة؟", options: ["نباتات النهار المحايد", "نباتات النهار القصير", "نباتات النهار المتوسط", "نباتات النهار الطويل"], answer: 3, explanation: "تزهر نباتات النهار الطويل عادة عندما تكون فترة الظلام أقصر من الفترة الحرجة الخاصة بها." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40e90", page: 101, number: 15, reason: "لا يوضح الرسم سمة تشخيصية كافية لتحديد أحادية الفلقة أو ثنائيتها، مثل تعريق الأوراق أو عدد الأجزاء الزهرية بدقة؛ ومفتاح المصدر وحده لا يكفي لإثبات التصنيف." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = [...approvals.map((item) => item.id), ...rejections.map((item) => item.id)];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: ids }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== ids.length) failures.push(`expected ${ids.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: published record conflicts with this review`);
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "rejected"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: rejection source/page/status mismatch`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: rejected draft already has a published row`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: rejections.length, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
      subject: "أحياء", subcategory: item.subcategory, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.subcategory, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject: "أحياء", subcategory: item.subcategory, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة الإجابة مع المصدر والمفهوم العلمي، وصُححت الصياغة والخيارات أو أزيل الاعتماد غير الضروري على الرسم.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.reason, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
