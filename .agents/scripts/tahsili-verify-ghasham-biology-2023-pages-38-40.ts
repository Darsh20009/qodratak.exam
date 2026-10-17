import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103063cd9c24f9f40cd8", page: 38, number: 1, text: "أي طبقة جنينية تتكون منها معظم أجهزة الإخراج والدوران والتنفس في الحيوانات ثلاثية الطبقات؟", options: ["الطبقة الوسطى", "الطبقة الخارجية", "الطبقة الداخلية", "جميع الطبقات"], answer: 0, explanation: "تتكون العضلات وأجهزة الدوران والتنفس والإخراج في الحيوانات ثلاثية الطبقات أساسًا من الأديم المتوسط (الطبقة الوسطى)." },
  { id: "6ad0103063cd9c24f9f40cd9", page: 38, number: 2, text: "أي المخلوقات الآتية لا يمتلك جهازًا عصبيًا؟", options: ["غزال", "سمكة", "إسفنج", "صقر"], answer: 2, explanation: "الإسفنج لا يمتلك أنسجة أو جهازًا عصبيًا؛ أما الحيوانات الأخرى المذكورة فلها أجهزة عصبية." },
  { id: "6ad0103063cd9c24f9f40cda", page: 38, number: 3, text: "أي المخلوقات الآتية يمتلك خلايا لاسعة؟", options: ["الهيدرا", "الأميبا", "البلاناريا", "الإسفنج"], answer: 0, explanation: "الهيدرا من اللاسعات، وتمتلك خلايا لاسعة تستخدمها للدفاع واصطياد الفرائس." },
  { id: "6ad0103063cd9c24f9f40cdb", page: 38, number: 4, text: "من أي حيوان بحري استُخرجت مادة هيدروكسي أباتيت المستخدمة في بعض مواد ترميم العظام؟", options: ["شقائق النعمان", "المرجان", "الإسفنج", "قنفذ البحر"], answer: 1, explanation: "يتكون الهيكل المرجاني أساسًا من كربونات الكالسيوم، ويمكن معالجة مادته للحصول على مواد حيوية شبيهة بهيدروكسي أباتيت المستخدم في تطبيقات ترميم العظام." },
  { id: "6ad0103063cd9c24f9f40cdc", page: 38, number: 5, text: "في الحيوانات أولية الفم، ماذا تصبح فتحة الجاسترولا الأولى غالبًا؟", options: ["التجويف الجسمي", "العرف العصبي", "الشرج", "الفم"], answer: 3, explanation: "في الحيوانات أولية الفم تتحول فتحة الجاسترولا الأولى إلى الفم؛ أما في ثانوية الفم فتتحول إلى الشرج." },
  { id: "6ad0103063cd9c24f9f40cdd", page: 38, number: 6, text: "ما نوع التناظر في قنديل البحر؟", options: ["عديم التناظر", "جانبي التناظر", "شعاعي التناظر", "متعدد التناظر"], answer: 2, explanation: "يمتلك قنديل البحر تناظرًا شعاعيًا؛ إذ تنتظم أجزاء جسمه حول محور مركزي." },
  { id: "6ad0103063cd9c24f9f40cde", page: 38, number: 7, text: "كيف يحصل الإسفنج على غذائه؟", options: ["بالترشيح", "بالبناء الضوئي", "بالترمم", "بالتطفل"], answer: 0, explanation: "الإسفنج حيوان مرشح؛ يمرر الماء عبر قنواته ويلتقط دقائق الغذاء والكائنات المجهرية." },
  { id: "6ad0103063cd9c24f9f40cdf", page: 38, number: 8, text: "دودة مسطحة لا يوجد بين جدار جسمها والقناة الهضمية تجويف جسمي مبطن بالكامل؛ كيف تصنف من حيث التجويف؟", options: ["ذات تجويف حقيقي", "ذات تجويف ثنائي", "ذات تجويف كاذب", "عديمة التجويف"], answer: 3, explanation: "الديدان المسطحة عديمة التجويف الجسمي؛ فلا يوجد فراغ جسمي بين جدار الجسم والقناة الهضمية." },
  { id: "6ad0103063cd9c24f9f40ce0", page: 38, number: 9, text: "ما التركيب الذي يحتوي على الخلايا اللاسعة في الهيدرا؟", options: ["الكيس الخيطي اللاسع", "الأوعية الدموية", "الأعضاء الإخراجية", "القنوات التنفسية"], answer: 0, explanation: "توجد الخلايا اللاسعة في الهيدرا، وبداخلها أكياس خيطية تطلق خيطًا لاسعًا عند التنبيه." },
  { id: "6ad0103063cd9c24f9f40ce1", page: 38, number: 10, text: "أي مقارنة تصف التناظر وصفًا صحيحًا؟", options: ["الفراشة جانبية التناظر وقنديل البحر شعاعي التناظر", "الفراشة شعاعية التناظر وقنديل البحر جانبي التناظر", "الفراشة عديمة التناظر وقنديل البحر شعاعي التناظر", "الفراشة جانبية التناظر وقنديل البحر عديم التناظر"], answer: 0, explanation: "الفراشة حيوان جانبي التناظر، بينما قنديل البحر شعاعي التناظر." },
  { id: "6ad0103063cd9c24f9f40ce2", page: 38, number: 11, text: "دودة أسطوانية يكون التجويف بين جدار الجسم والقناة الهضمية غير مبطن بالكامل بالأديم المتوسط. ما نوع تجويفها؟", options: ["تجويف حقيقي", "عديمة التجويف", "تجويف كاذب", "تجويف ثنائي"], answer: 2, explanation: "للديدان الأسطوانية تجويف جسمي كاذب؛ إذ لا تبطنه طبقة الأديم المتوسط بالكامل." },
  { id: "6ad0103063cd9c24f9f40ce3", page: 38, number: 12, text: "في الحيوانات أولية الفم، إلى ماذا تتحول الفتحة الأولى في مرحلة الجاسترولا؟", options: ["الفم", "الطبقة الوسطى", "عدد الخلايا", "الذيل"], answer: 0, explanation: "تتحول فتحة الجاسترولا الأولى في أوليات الفم إلى الفم." },
  { id: "6ad0103063cd9c24f9f40ce4", page: 38, number: 13, text: "ما نوع التكاثر الذي يحدث دون إخصاب؟", options: ["التبرعم", "التجدد", "الاقتران", "التكاثر العذري"], answer: 3, explanation: "في التكاثر العذري ينمو فرد من بويضة غير مخصبة." },
  { id: "6ad0103063cd9c24f9f40ce5", page: 39, number: 14, text: "إذا لم يكتمل تكوّن الطبقة الداخلية في الجنين، فأي جهاز يتأثر تكوّنه مباشرة؟", options: ["الأعصاب", "العظام", "القناة الهضمية", "الجلد"], answer: 2, explanation: "ينشأ معظم بطانة القناة الهضمية وأعضاء الهضم من الأديم الباطن، أي الطبقة الداخلية للجنين." },
  { id: "6ad0103063cd9c24f9f40ce6", page: 39, number: 15, text: "الإسفنج غالبًا عديم التناظر؛ أي وصف يطابق ذلك؟", options: ["لا يمكن تقسيم جسمه إلى نصفين متماثلين", "له تناظر شعاعي", "له تناظر جانبي", "له أكثر من مستوى تماثل"], answer: 0, explanation: "معظم الإسفنجيات لا تمتلك مستوى يقسم الجسم إلى نصفين متماثلين، لذا توصف بأنها عديمة التناظر." },
  { id: "6ad0103063cd9c24f9f40ce7", page: 39, number: 16, text: "في الهيدرا، ما الفتحة الوحيدة التي تؤدي وظيفتي تناول الغذاء وإخراج الفضلات؟", options: ["فتحة الفم الوحيدة", "فتحتا الفم والشرج المنفصلتان", "البلعوم", "فتحة الشرج"], answer: 0, explanation: "للهيدرا تجويف هضمي بفتحة واحدة؛ يدخل الغذاء منها وتخرج الفضلات من الفتحة نفسها." },
  { id: "6ad0103063cd9c24f9f40ce8", page: 39, number: 17, text: "أي مرحلة من مراحل النمو الجنيني المبكر يظهر فيها انغلاف الخلايا وتكوّن الطبقات الجنينية وفتحة الجاسترولا؟", options: ["اللاقحة", "التويتة", "البلاستولا", "الجاسترولا"], answer: 3, explanation: "تتميز مرحلة الجاسترولا ببدء الانغلاف وتكوّن الطبقات الجنينية والفتحة الأولية." },
  { id: "6ad0103063cd9c24f9f40ce9", page: 39, number: 18, text: "ما الطبقة التي تبطن التجويف الهضمي في الجاسترولا؟", options: ["الطبقة الخارجية", "الطبقة الداخلية", "الطبقة الوسطى", "فتحة الجاسترولا"], answer: 1, explanation: "تكوّن الطبقة الداخلية (الأديم الباطن) بطانة القناة الهضمية في الجنين." },
  { id: "6ad0103063cd9c24f9f40cea", page: 39, number: 19, text: "ما فائدة التناظر الشعاعي من ناحية استقبال المؤثرات؟", options: ["التفاعل مع البيئة من اتجاهات متعددة", "التغذي على مواد غير عضوية", "التنفس بالرئات", "التكاثر دون إخصاب"], answer: 0, explanation: "يسمح التناظر الشعاعي بالتفاعل مع المؤثرات والموارد القادمة من اتجاهات متعددة حول الجسم." },
  { id: "6ad0103063cd9c24f9f40ceb", page: 39, number: 20, text: "إلى أي مجموعة تنتمي شقائق النعمان البحرية؟", options: ["الزواحف", "اللاسعات (الجوفمعويات)", "البرمائيات", "الفطريات"], answer: 1, explanation: "شقائق النعمان من اللاسعات، وهي حيوانات بحرية ذات تناظر شعاعي وخلايا لاسعة." },
  { id: "6ad0103063cd9c24f9f40cec", page: 40, number: 1, text: "أثناء لعب طفل حافيًا على تراب ملوث، أصيب بعدوى ديدان. أي نوع يُرجح أن يكون؟", options: ["الإسكارس", "الدبوسية", "الخطافية", "الشعرية"], answer: 2, explanation: "تخترق يرقات الديدان الخطافية الجلد عند ملامسة تربة ملوثة حافيًا، ثم تهاجر داخل الجسم." },
  { id: "6ad0103063cd9c24f9f40ced", page: 40, number: 2, text: "كيف تنتقل دودة الإسكارس غالبًا إلى الإنسان؟", options: ["تناول خضروات ملوثة ببيوضها", "السباحة في ماء ملوث", "شرب الماء الملوث فقط", "تناول لحوم غير مطبوخة جيدًا"], answer: 0, explanation: "تنتقل الإسكارس بابتلاع بيوضها مع طعام أو خضروات ملوثة، ثم تفقس في الجهاز الهضمي." },
  { id: "6ad0103063cd9c24f9f40cee", page: 40, number: 3, text: "تكافح بعض البلدان القواقع في المياه العذبة للحد من انتشار أي مرض؟", options: ["داء الفيل", "مرض النوم", "الملاريا", "البلهارسيا"], answer: 3, explanation: "تعيش مراحل من دورة حياة طفيل البلهارسيا داخل قواقع المياه العذبة، لذا يساعد الحد من القواقع الناقلة على تقليل انتقال المرض." },
  { id: "6ad0103063cd9c24f9f40cef", page: 40, number: 4, text: "كيف يُصاب الإنسان بالبلهارسيا غالبًا؟", options: ["تناول طعام ملوث", "استنشاق هواء ملوث", "لسع البعوض", "ملامسة أو السباحة في مياه عذبة ملوثة باليرقات"], answer: 3, explanation: "تخترق يرقات السركاريا جلد الإنسان عند ملامسة مياه عذبة ملوثة." },
  { id: "6ad0103063cd9c24f9f40cf0", page: 40, number: 5, text: "أي الديدان استخدمها الطب التقليدي للمساعدة على سحب الدم؟", options: ["دودة الأرض", "الفيلاريا", "الدبوسية", "العلق"], answer: 3, explanation: "استُخدمت العلقات طبيًا لامتصاص الدم، وتُستخدم بعض الأنواع في تطبيقات طبية محددة." },
  { id: "6ad0103063cd9c24f9f40cf1", page: 40, number: 6, text: "ما الصفة التي تميز الديدان الأسطوانية عن الديدان المفلطحة؟", options: ["غياب جهاز الدوران", "قد تكون متطفلة أو حرة", "امتلاك تجويف جسمي كاذب", "التكاثر جنسيًا"], answer: 2, explanation: "للديدان الأسطوانية تجويف جسمي كاذب، بينما الديدان المفلطحة عديمة التجويف الجسمي." },
  { id: "6ad0103063cd9c24f9f40cf2", page: 40, number: 7, text: "أي مرض تسببه يرقة دودة طفيلية تخترق جلد الإنسان في المياه العذبة؟", options: ["داء الفيل", "الملاريا", "البلهارسيا", "داء الشعرية"], answer: 2, explanation: "تخترق يرقات السركاريا جلد الإنسان في المياه العذبة وتبدأ عدوى البلهارسيا." },
  { id: "6ad0103063cd9c24f9f40cf3", page: 40, number: 9, text: "أي المخلوقات الآتية أقرب إلى الديدان الأسطوانية من حيث امتلاك تجويف جسمي كاذب؟", options: ["الهيدرا", "الإسفنج", "الدوارات", "المفصليات"], answer: 2, explanation: "تُظهر الدوارات تجويفًا جسميًا كاذبًا مثل الديدان الأسطوانية؛ أما الهيدرا والإسفنج فليسا كذلك." },
  { id: "6ad0103063cd9c24f9f40cf4", page: 40, number: 10, text: "بماذا تتميز الديدان الحلقية عن الديدان الأسطوانية؟", options: ["تجويف جسمي حقيقي", "كونها ثانوية الفم", "تجويف جسمي كاذب", "وجود الأنسجة"], answer: 0, explanation: "تمتلك الديدان الحلقية تجويفًا جسميًا حقيقيًا مبطنًا بالأديم المتوسط؛ بينما تمتلك الديدان الأسطوانية تجويفًا كاذبًا." },
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
        subject: "أحياء", subcategory: "الحيوانات واللافقاريات", text: item.text, options: [...item.options], correctOptionIndex: item.answer,
        difficulty: draft.difficulty || "intermediate", topic: draft.topic || "الحيوانات واللافقاريات", explanation: item.explanation,
        sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
        ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
        sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
      }, $setOnInsert: { createdAt: reviewedAt } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } },
      { $set: { status: "approved", subject: "أحياء", subcategory: "الحيوانات واللافقاريات", text: item.text, options: [...item.options], explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة المصدر ومفتاح الإجابة وتصحيح الأسئلة المعتمدة على الصور بصياغة نصية قابلة للإجابة.", updatedAt: reviewedAt } },
    );
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
