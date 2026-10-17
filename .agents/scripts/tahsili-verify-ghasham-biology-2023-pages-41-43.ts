import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103063cd9c24f9f40cf5", page: 41, number: 11, text: "أي الديدان الآتية تنتقل دورة حياتها عبر قوقع المياه العذبة؟", options: ["الشستوسوما (البلهارسيا)", "البلاناريا", "البلازموديوم", "الدودة الشريطية"], answer: 0, explanation: "تحتاج ديدان الشستوسوما إلى قواقع مياه عذبة بوصفها عائلًا وسيطًا في دورة حياتها، ثم تصيب الإنسان عبر يرقات تخترق الجلد." },
  { id: "6ad0103063cd9c24f9f40cf6", page: 41, number: 12, text: "إذا انخفضت أعداد المحار الصلب في مياه المحيط، فما الأثر المتوقع على الطحالب التي يتغذى عليها؟", options: ["تتراكم السموم في أجسام الأسماك", "تزداد نسبة ثاني أكسيد الكربون", "تصبح المياه أكثر صفاءً", "تنمو الطحالب وتتكاثر أكثر"], answer: 3, explanation: "يتغذى المحار المرشح على العوالق والطحالب؛ لذلك قد يؤدي انخفاض أعداده إلى زيادة نمو الطحالب." },
  { id: "6ad0103063cd9c24f9f40cf7", page: 41, number: 13, text: "ما العامل الحيوي الذي قد يفسر انخفاض أعداد المحار في المنطقة؟", options: ["نقص الغذاء", "التلوث المائي", "افتراسه من نجم البحر", "انخفاض معدل التكاثر"], answer: 2, explanation: "يتغذى نجم البحر على المحار؛ وقد يؤدي ارتفاع الافتراس إلى انخفاض أعداد المحار." },
  { id: "6ad0103063cd9c24f9f40cf8", page: 41, number: 14, text: "ما الأثر المتوقع على صفاء مياه البحر إذا قلت أعداد المحار المرشح للماء؟", options: ["يزداد نجم البحر", "تزداد الأسماك", "تقل شفافية الماء بسبب انخفاض الترشيح", "تزداد صفاءً"], answer: 2, explanation: "يرشح المحار الماء ويتغذى على جسيمات وعوالق؛ لذا قد يؤدي انخفاضه إلى تراكمها وانخفاض شفافية الماء." },
  { id: "6ad0103063cd9c24f9f40cf9", page: 41, number: 15, text: "ما العضو الذي تتخلص الرخويات بوساطته من الفضلات ويساعدها على اتزان الماء؟", options: ["النفريديا", "الكلية", "النفرون", "الحالب"], answer: 0, explanation: "تستخدم الرخويات أعضاء إخراجية أنبوبية تسمى النفريديا لتنظيم الماء والتخلص من الفضلات." },
  { id: "6ad0103063cd9c24f9f40cfa", page: 41, number: 16, text: "ما نوع التناظر في الأخطبوط؟", options: ["عديم التناظر", "جانبي التناظر", "شعاعي التناظر", "متعدد التناظر"], answer: 1, explanation: "الأخطبوط من الرخويات ذات التناظر الجانبي." },
  { id: "6ad0103063cd9c24f9f40cfb", page: 41, number: 17, text: "أي جهاز في جسم الإنسان تتأثر وظيفته بديدان الفيلاريا المسببة لداء الفيل؟", options: ["الجهاز اللمفي", "الجهاز الدوري", "الجهاز الإخراجي", "الجهاز التنفسي"], answer: 0, explanation: "تعيش الديدان الفيلارية في الجهاز اللمفي وقد تسد أوعيته، مسببة تورمًا شديدًا يعرف بداء الفيل." },
  { id: "6ad0103063cd9c24f9f40cfc", page: 41, number: 18, text: "أي رخوي له ثمانية أذرع ويستعمل الحبر وسيلةً للهرب من المفترسات؟", options: ["الأخطبوط", "الحبار", "الجمبري", "السمك"], answer: 0, explanation: "للأخطبوط ثمانية أذرع، ويمكنه إطلاق سحابة حبر لتشتيت المفترس أثناء الهرب. حُددت الأذرع الثمانية لتجنب تعدد الإجابات مع الحبار." },
  { id: "6ad0103063cd9c24f9f40cfd", page: 42, number: 1, text: "كيف تتبادل العقارب الغازات؟", options: ["الرئات الكتبية", "القصبات الهوائية", "الخياشيم", "الجلد"], answer: 0, explanation: "تتنفس العقارب عبر رئات كتبية داخلية، وهي تراكيب مميزة لبعض العنكبيات." },
  { id: "6ad0103063cd9c24f9f40cfe", page: 42, number: 2, text: "ما التركيب الذي يخلص الحشرات من الفضلات ويساعد على تنظيم الماء داخل أجسامها؟", options: ["أنابيب ملبيجي", "الخلايا اللهبية", "النفرون", "النفريديا"], answer: 0, explanation: "تجمع أنابيب ملبيجي الفضلات من سائل الجسم وتساهم في الاتزان المائي لدى الحشرات." },
  { id: "6ad0103063cd9c24f9f40cff", page: 42, number: 3, text: "ما الذي يساعد الصرصور على السير فوق سطح الماء دون أن يغرق؟", options: ["جسمه المغطى بالكيتين فقط", "شعيرات دقيقة على أقدامه", "تقسيم جسمه", "وجود أجنحة"], answer: 1, explanation: "تساعد الشعيرات الدقيقة على أقدام الصرصور على توزيع وزنه والتفاعل مع سطح الماء دون كسر توتره السطحي." },
  { id: "6ad0103063cd9c24f9f40d00", page: 42, number: 4, text: "أي المخلوقات الآتية لا يمتلك قرون استشعار؟", options: ["العنكبوت", "الصرصور", "النملة", "السرطان"], answer: 0, explanation: "العنكبيات لا تمتلك قرون استشعار؛ بينما توجد قرون استشعار لدى الحشرات والقشريات." },
  { id: "6ad0103063cd9c24f9f40d01", page: 42, number: 5, text: "تستخدم الفراشة خرطومًا ملتفًا لتؤدي أي وظيفة؟", options: ["امتصاص السوائل", "التمزيق والتقطيع", "اللعق واللحس", "الاختراق وامتصاص الدم"], answer: 0, explanation: "تستخدم الفراشات خرطومًا أنبوبيًا ملتفًا لامتصاص رحيق الأزهار والسوائل." },
  { id: "6ad0103063cd9c24f9f40d02", page: 42, number: 6, text: "إلى أي مناطق جسمية يقسم جسم النملة؟", options: ["رأس وصدر وبطن", "رأس وصدر فقط", "صدر وبطن فقط", "رأس وبطن فقط"], answer: 0, explanation: "يتكون جسم الحشرة، ومنها النملة، من ثلاثة أقسام: الرأس والصدر والبطن." },
  { id: "6ad0103063cd9c24f9f40d03", page: 42, number: 7, text: "أي الحيوانات الآتية يتكون جسمه من رأس وصدر وبطن؟", options: ["القراد", "العنكبوت", "الفراشة", "العقرب"], answer: 2, explanation: "الفراشة حشرة ويتكون جسمها من رأس وصدر وبطن؛ أما العنكبيات فيتكون جسمها عادة من منطقتين رئيسيتين." },
  { id: "6ad0103063cd9c24f9f40d04", page: 42, number: 8, text: "ما وظيفة المغازل عند العناكب؟", options: ["إنتاج الحرير", "الإخراج", "الهضم", "الانقسام"], answer: 0, explanation: "تنتج المغازل خيوط الحرير التي يستخدمها العنكبوت في بناء الشبكة أو صنع خيوط الأمان." },
  { id: "6ad0103063cd9c24f9f40d05", page: 42, number: 9, text: "مم يتكون الهيكل الخارجي للعقرب؟", options: ["الكيراتين", "الكيتين", "السيليكا", "السليلوز"], answer: 1, explanation: "يتكون الهيكل الخارجي لمفصليات الأرجل، ومنها العقارب، من الكيتين." },
  { id: "6ad0103063cd9c24f9f40d06", page: 42, number: 10, text: "أي مجموعة حيوانية تضم مخلوقات لها خمسة أزواج من الأرجل؟", options: ["الحشرات", "العنكبيات", "القشريات", "الديدان"], answer: 2, explanation: "للقشريات العشرية الأرجل خمسة أزواج من الأرجل المشيّة، مثل السرطان والجمبري." },
  { id: "6ad0103063cd9c24f9f40d07", page: 42, number: 11, text: "ما وسيلة التنفس في الجمبري؟", options: ["الخياشيم", "الجلد", "القصبات الهوائية", "الرئات الكتبية"], answer: 0, explanation: "يتنفس الجمبري في الماء باستخدام الخياشيم." },
  { id: "6ad0103063cd9c24f9f40d08", page: 42, number: 12, text: "ما الفائدة الأساسية من انسلاخ العقرب؟", options: ["تدعيم الجسم", "تقليل تبخر الماء", "النمو", "حماية الأنسجة الداخلية"], answer: 2, explanation: "تطرح مفصليات الأرجل هيكلها الخارجي في عملية الانسلاخ لتتمكن من النمو وتكوين هيكل أكبر." },
  { id: "6ad0103063cd9c24f9f40d0a", page: 43, number: 14, text: "مخلوق بحري صغير جدًا له خمسة أزواج من الزوائد المفصلية وقرنا استشعار؛ إلى أي مجموعة ينتمي؟", options: ["الحيوانات", "النباتات", "العنكبيات", "القشريات"], answer: 3, explanation: "امتلاك خمسة أزواج من الأرجل وقرني استشعار من صفات كثير من القشريات." },
  { id: "6ad0103063cd9c24f9f40d0b", page: 43, number: 15, text: "إلى أي مجموعة تنتمي البعوضة؟", options: ["القشريات", "العنكبيات", "الرخويات", "الحشرات"], answer: 3, explanation: "البعوضة حشرة؛ لها ثلاثة أزواج من الأرجل وجسم مقسم إلى رأس وصدر وبطن." },
  { id: "6ad0103063cd9c24f9f40d0c", page: 43, number: 16, text: "كيف يتنفس جراد البحر؟", options: ["القصبات الهوائية", "الرئات الكتبية", "الخياشيم", "الجلد"], answer: 2, explanation: "يتنفس جراد البحر المائي بواسطة الخياشيم." },
  { id: "6ad0103063cd9c24f9f40d0d", page: 43, number: 17, text: "ما التركيب الذي يستخدمه جراد البحر للإمساك بالغذاء؟", options: ["الخياشيم", "الأرجل السابحة", "قرون الاستشعار", "المخالب"], answer: 3, explanation: "تستخدم المخالب (الكلّابات) للإمساك بالغذاء والدفاع. استُبدل رقم الشكل بوصف التركيب الذي يشير إليه المصدر." },
  { id: "6ad0103063cd9c24f9f40d0f", page: 43, number: 19, text: "ما الجهاز التنفسي الذي تستخدمه الخنافس؟", options: ["الرئات الكتبية", "أنابيب ملبيجي", "القصبات الهوائية", "الخياشيم"], answer: 2, explanation: "تتنفس الخنافس، بوصفها حشرات، عبر شبكة القصبات الهوائية التي تنقل الأكسجين إلى الأنسجة." },
  { id: "6ad0103063cd9c24f9f40d10", page: 43, number: 20, text: "أي حيوان بحري يمتلك شجرة تنفسية؟", options: ["نجم البحر", "خيار البحر", "قنفذ البحر", "دولار البحر"], answer: 1, explanation: "يمتلك خيار البحر شجرة تنفسية متصلة بالمذرق، وتشارك في تبادل الغازات." },
  { id: "6ad0103063cd9c24f9f40d11", page: 43, number: 21, text: "في بعض أنواع نجم البحر، إذا احتوى الجزء المنفصل على جزء من القرص المركزي، فما الذي يمكن أن يحدث؟", options: ["يتحلل", "يتجدد إلى فرد جديد", "يجف", "يموت حتمًا"], answer: 1, explanation: "يمكن لبعض أنواع نجم البحر تجديد فرد من جزء منفصل إذا احتوى على جزء مناسب من القرص المركزي." },
  { id: "6ad0103063cd9c24f9f40d12", page: 43, number: 22, text: "أي المخلوقات الآتية يمتلك جهازًا فكيًا يسمى مصباح أرسطو؟", options: ["قنفذ البحر", "خيار البحر", "دولار البحر", "الإسفنج"], answer: 0, explanation: "يمتلك قنفذ البحر جهازًا فكيًا معقدًا يسمى مصباح أرسطو، ويستخدمه في كشط الغذاء." },
  { id: "6ad0103063cd9c24f9f40d15", page: 43, number: 25, text: "أي الحيوانات الآتية يدفن نفسه في الرمل؟", options: ["الضفدع", "السهيم", "الجراد", "الهيدرا"], answer: 1, explanation: "يعيش السهيم غالبًا مدفونًا جزئيًا في الرمل، مع إبقاء مقدمته ظاهرة لالتقاط الغذاء من الماء." },
  { id: "6ad0103063cd9c24f9f40d16", page: 43, number: 26, text: "أين يجمع الطلاب عينات شوكيات الجلد؟", options: ["البرك", "البحيرات", "الأنهار", "البحار"], answer: 3, explanation: "شوكيات الجلد حيوانات بحرية؛ لذا تُجمع عيناتها من البيئات البحرية." },
  { id: "6ad0103063cd9c24f9f40d17", page: 43, number: 27, text: "ما الصفة التي تميز شوكيات الجلد عن كثير من الحيوانات الأخرى؟", options: ["التكاثر", "التنفس", "تنوع الحركة بوساطة الجهاز الوعائي المائي", "التغذية"], answer: 2, explanation: "تمتلك شوكيات الجلد جهازًا وعائيًا مائيًا وأقدامًا أنبوبية تساعدها على الحركة والالتصاق والتقاط الغذاء." },
] as const;

const rejections = [
  { id: "6ad0103063cd9c24f9f40d0e", page: 43, number: 18, note: "حُجب السؤال: الصورة لجراد البحر، وأعضاؤه الإخراجية غدد خضراء/غدد قرنية، وهي غير موجودة بين الخيارات؛ مفتاح المصدر «النفريديا» غير صحيح." },
  { id: "6ad0103063cd9c24f9f40d13", page: 43, number: 23, note: "حُجب السؤال: لا يصح الجزم بأن نجم البحر لا يكون غذاءً للحيوانات؛ توجد مفترسات بحرية تتغذى على نجوم البحر، فلا توجد إجابة عامة موثوقة." },
  { id: "6ad0103063cd9c24f9f40d14", page: 43, number: 24, note: "حُجب السؤال: لا تدل أحافير شوكيات الجلد على أن الحياة ظهرت أولًا في البحار؛ كما أن المجموعة ليست أقدم أشكال الحياة البحرية." },
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
      { $set: { status: "approved", subject: "أحياء", subcategory: "الحيوانات واللافقاريات", text: item.text, options: [...item.options], explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة المحتوى والمفتاح مع المصدر، وصُححت الأسئلة المعتمدة على الأشكال أو حُجبت عند غياب إجابة موثوقة.", updatedAt: reviewedAt } },
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
