import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40eec", page: 121, number: 1, topic: "الوراثة - الاضطرابات الوراثية", text: "أي اضطراب وراثي يؤثر في بروتين ينظم إفراز المخاط والعرق؟", options: ["المهاق", "الهيموفيليا", "التليف الكيسي", "الجالكتوسيميا"], answer: 2, explanation: "ينتج التليف الكيسي غالبًا عن تغيرات في جين CFTR الذي يشفّر بروتينًا غشائيًا ينظم انتقال الأيونات، ما يؤثر في إفرازات المخاط والعرق." },
  { id: "6ad0103163cd9c24f9f40eed", page: 121, number: 2, topic: "الوراثة - الاضطرابات الوراثية", text: "أي حيوان من الخيارات يُذكر مثالًا على تعدد المجموعة الكروموسومية؟", options: ["العلق الطبي", "البلاناريا", "دودة الأرض", "الدودة الشوكية"], answer: 2, explanation: "توجد حالات تعدد للمجموعة الكروموسومية في بعض اللافقاريات، ويذكر المصدر دودة الأرض مثالًا عليها." },
  { id: "6ad0103163cd9c24f9f40eee", page: 121, number: 3, topic: "الوراثة - الاضطرابات الوراثية", text: "ما الأثر المحتمل لتعدد المجموعة الكروموسومية في بعض أصناف القمح؟", options: ["لا يحدث أي تأثير", "تموت النباتات دائمًا", "تقل حيوية النبات", "قد تزداد قوة النبات وصلابته"], answer: 3, explanation: "قد يرتبط تعدد المجموعة الكروموسومية في بعض النباتات، ومنها القمح، بزيادة حجم الخلايا أو بعض صفات القوة والصلابة." },
  { id: "6ad0103163cd9c24f9f40eef", page: 121, number: 4, topic: "الوراثة - الاضطرابات الوراثية", text: "ما السبب الجيني الشائع للمهاق؟", options: ["تعطل جين بروتين غشائي مسؤول عن المخاط", "غياب إنزيم تحليل الدهون", "غياب إنزيم تحليل الجالكتوز", "تغير جيني يقلل إنتاج الميلانين أو يمنعه"], answer: 3, explanation: "ينتج المهاق عن تغيرات جينية تؤثر في إنتاج صبغة الميلانين، وقد تقللها بشدة أو تمنع إنتاجها." },
  { id: "6ad0103163cd9c24f9f40ef0", page: 121, number: 5, topic: "الوراثة - الاضطرابات الوراثية", text: "ما الاضطراب الذي يسبب نقصًا واضحًا في صبغة الميلانين بالجلد والشعر؟", options: ["التليف الكيسي", "المهاق", "مرض تاي ساكس", "الجالكتوسيميا"], answer: 1, explanation: "المهاق اضطراب وراثي يؤثر في تكوين الميلانين، لذلك قد يظهر نقص الصبغة في الجلد والشعر والعينين." },
  { id: "6ad0103163cd9c24f9f40ef1", page: 121, number: 6, topic: "الوراثة - مخططات السلالة", text: "في مخطط السلالة، يدل التظليل النصفي على حمل الأليل المرتبط بالمرض. كم عدد الإناث والذكور الحاملين في المخطط، مع احتساب الأبوين؟", options: ["أنثى واحدة وذكر واحد", "أنثيان وذكران", "أنثى واحدة وذكران", "ثلاث إناث وذكر واحد"], answer: 1, explanation: "يظهر في المخطط تظليل نصفي للأم ولأحد الأبناء الإناث، وكذلك للأب ولأحد الأبناء الذكور؛ فيكون العدد أنثيين وذكرين." },
  { id: "6ad0103163cd9c24f9f40ef2", page: 121, number: 7, topic: "الوراثة - مخططات السلالة", text: "لخلية جنسية أربعة أزواج من الجينات المستقلة. كم تركيبًا جينيًا مختلفًا يمكن أن تنتجه بسبب التوزيع المستقل؟", options: ["8", "12", "14", "16"], answer: 3, explanation: "عدد تراكيب الأمشاج الناتجة عن التوزيع المستقل يساوي 2ⁿ؛ وعند n = 4 يكون 2⁴ = 16." },
  { id: "6ad0103163cd9c24f9f40ef3", page: 121, number: 8, topic: "الوراثة - البصمة الوراثية", text: "بمقارنة نمط أشرطة عينة البصمة الوراثية مع الأشرطة في المخطط، أي مشتبه به يطابق العينة؟", options: ["المشتبه به 1", "المشتبه به 2", "المشتبه به 3", "المشتبه به 4"], answer: 2, explanation: "تطابق عينة البصمة مجموعة الأشرطة الخاصة بالمشتبه به الثالث في المخطط." },
  { id: "6ad0103163cd9c24f9f40ef4", page: 121, number: 9, topic: "الوراثة - مخططات السلالة", text: "يظهر في الجيل الثاني من مخطط السلالة حاملان للصفة من أصل أربعة أفراد، وفردان غير حاملين. ما نسبة الحاملين إلى غير الحاملين؟", options: ["1 : 3", "2 : 1", "1 : 1", "3 : 1"], answer: 2, explanation: "عدد الحاملين اثنان وعدد غير الحاملين اثنان؛ وبعد التبسيط تكون النسبة 1:1." },
  { id: "6ad0103163cd9c24f9f40ef5", page: 121, number: 10, topic: "الوراثة - الاضطرابات الوراثية", text: "أي مما يأتي لا يُعد سببًا مباشرًا شائعًا لاختلالات عدد الكروموسومات؟", options: ["زيادة عدد الكروموسومات", "نقص عدد الكروموسومات", "بقاء العدد الكروموسومي الطبيعي المتوازن", "طفرة جينية"], answer: 2, explanation: "الزيادة أو النقص في عدد الكروموسومات قد يسبب اختلالًا عدديًا. أما بقاء العدد الطبيعي المتوازن فلا يمثل زيادة أو نقصًا كروموسوميًا." },
  { id: "6ad0103163cd9c24f9f40ef6", page: 121, number: 11, topic: "الوراثة - الاضطرابات الوراثية", text: "أي تغير جيني يفسر غالبًا حدوث التليف الكيسي؟", options: ["غياب جين إنزيم تحليل الجالكتوز", "انخفاض إنتاج صبغة الميلانين", "غياب إنزيم تحليل الدهون", "تغير في جين يشفّر بروتينًا غشائيًا منظمًا لنقل الأيونات"], answer: 3, explanation: "يرتبط التليف الكيسي بتغيرات في جين CFTR، الذي يشفّر بروتينًا غشائيًا ينظم نقل أيونات الكلوريد والماء." },
  { id: "6ad0103163cd9c24f9f40ef7", page: 122, number: 12, topic: "الوراثة - مخططات السلالة", text: "في مخطط السلالة، الفرد II-2 ممثل بمربع مظلل بالكامل. ماذا يدل ذلك؟", options: ["أنثى حاملة للمرض", "ذكر مصاب بالمرض", "أنثى سليمة", "ذكر حامل للمرض"], answer: 1, explanation: "يمثل المربع ذكرًا، ويشير التظليل الكامل في مفتاح المخطط إلى الإصابة؛ لذلك الفرد II-2 ذكر مصاب." },
  { id: "6ad0103163cd9c24f9f40ef8", page: 122, number: 13, topic: "الوراثة - الاضطرابات الوراثية", text: "أي مرض ينتج عن نقص إنزيمات تحلل بعض الدهون في الخلايا؟", options: ["تاي ساكس", "الجالكتوسيميا", "التليف الكيسي", "المهاق"], answer: 0, explanation: "ينتج مرض تاي ساكس عن نقص إنزيم يسبب تراكم مادة دهنية معينة، خصوصًا في الخلايا العصبية." },
  { id: "6ad0103163cd9c24f9f40ef9", page: 122, number: 14, topic: "الوراثة - الاضطرابات الوراثية", text: "أي اضطراب يصيب بروتينًا غشائيًا ويؤثر في إفراز المخاط والعرق؟", options: ["التليف الكيسي", "المهاق", "مرض تاي ساكس", "الجالكتوسيميا"], answer: 0, explanation: "يؤثر التليف الكيسي في بروتين CFTR الغشائي، فيغيّر حركة الأملاح والماء ويؤثر في خصائص المخاط والعرق." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40efa", page: 122, number: 15, reason: "السؤال يطلب اختيار مخطط سلالة «صحيح» من دون تحديد نمط وراثي أو صفة أو مفتاح رموز يُحكم به على صحة المخططات؛ أكثر من رسم قد يكون ممكنًا، لذا لا توجد إجابة وحيدة قابلة للتحقق." },
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
      subject: "أحياء", subcategory: item.topic, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.topic, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject: "أحياء", subcategory: item.topic, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة مفتاح الإجابة والشرح مع المصدر، وفحص الرسومات أو الجداول ذات الصلة وتنقيح الصياغة عند الحاجة.", updatedAt: reviewedAt,
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
