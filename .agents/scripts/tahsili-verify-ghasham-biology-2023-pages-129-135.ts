import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40f16", page: 129, number: 2, topic: "الأحماض النووية", text: "ما تسلسل القواعد المكمل والمضاد الاتجاه لشريط DNA ذي التسلسل 5′-CTGAATTCA-3′؟", options: ["3′-GACTTAAGT-5′", "5′-GACTTAAGT-3′", "3′-GUCUUAGU-5′", "5′-GUCUUAGU-3′"], answer: 0, explanation: "تتزاوج القواعد A مع T وC مع G، ويكون الشريطان متعاكسي الاتجاه؛ لذلك يكون الشريط المكمل 3′-GACTTAAGT-5′." },
  { id: "6ad0103163cd9c24f9f40f17", page: 129, number: 3, topic: "الأحماض النووية", text: "إذا شكّل الأدينين 21% من قواعد عينة DNA مزدوجة، فما النسبة التقريبية للسيتوسين؟", options: ["51%", "71%", "29%", "31%"], answer: 2, explanation: "وفق قاعدة تشارغاف، A=T، فيكون مجموع A وT هو 42%. يتبقى 58% لـG وC، وبما أن G=C تكون نسبة C هي 29%." },
  { id: "6ad0103163cd9c24f9f40f18", page: 129, number: 4, topic: "الأحماض النووية", text: "ما الوظيفة الأساسية للأحماض النووية؟", options: ["تخزين المعلومات الوراثية ونقلها", "المحافظة على حرارة الجسم", "تخزين الطاقة طويلة الأمد", "تنظيم عملية الإخراج"], answer: 0, explanation: "تخزن الأحماض النووية المعلومات الوراثية وتنقلها وتساهم في استخدامها لتوجيه تصنيع البروتينات." },
  { id: "6ad0103163cd9c24f9f40f19", page: 129, number: 5, topic: "الأحماض النووية", text: "أي حمض نووي يخزن معظم المعلومات الوراثية في خلايا الكائنات الحية؟", options: ["mRNA", "DNA", "tRNA", "rRNA"], answer: 1, explanation: "يخزن DNA معظم المعلومات الوراثية في الخلايا، بينما تؤدي أنواع RNA أدوارًا مهمة في التعبير الجيني وتصنيع البروتين." },
  { id: "6ad0103163cd9c24f9f40f1a", page: 129, number: 6, topic: "الأحماض النووية", text: "ما الوحدة البنائية الأساسية للأحماض النووية؟", options: ["الفوسفات وحده", "النيوكليوتيدات", "القواعد النيتروجينية وحدها", "سكر الرايبوز وحده"], answer: 1, explanation: "يتكون DNA وRNA من سلاسل نيوكليوتيدات؛ وتضم النيوكليوتيدة سكرًا خماسيًا ومجموعة فوسفات وقاعدة نيتروجينية." },
  { id: "6ad0103163cd9c24f9f40f1b", page: 129, number: 7, topic: "الأحماض النووية", text: "أي قاعدة نيتروجينية توجد في RNA ولا توجد عادة في DNA؟", options: ["الثايمين", "اليوراسيل", "الجوانين", "السيتوسين"], answer: 1, explanation: "يستخدم RNA اليوراسيل بدلًا من الثايمين، بينما يحتوي كل من DNA وRNA على الأدينين والجوانين والسيتوسين." },
  { id: "6ad0103163cd9c24f9f40f1c", page: 129, number: 8, topic: "الأحماض النووية", text: "أي قاعدة في DNA يستبدل بها اليوراسيل في RNA؟", options: ["الأدينين", "الثايمين", "الجوانين", "السيتوسين"], answer: 1, explanation: "يحل اليوراسيل محل الثايمين في RNA، ويقترن اليوراسيل بالأدينين." },
  { id: "6ad0103163cd9c24f9f40f1d", page: 129, number: 9, topic: "الأحماض النووية", text: "أي قاعدة نيتروجينية مشتركة بين DNA وRNA؟", options: ["سكر منقوص الأكسجين", "الثايمين", "اليوراسيل", "السيتوسين"], answer: 3, explanation: "يشترك DNA وRNA في القواعد الأدينين والجوانين والسيتوسين؛ ويختلفان في استخدام الثايمين أو اليوراسيل." },
  { id: "6ad0103163cd9c24f9f40f1e", page: 129, number: 10, topic: "الأحماض النووية", text: "ما قاعدتا تشارغاف في جزيء DNA مزدوج؟", options: ["A = T وC = G", "C = G وU = C", "C = T وA = T", "A = G وA = T"], answer: 0, explanation: "في DNA مزدوج تتزاوج A مع T وC مع G؛ لذلك تتساوى نسبة A مع T ونسبة C مع G." },
  { id: "6ad0103163cd9c24f9f40f1f", page: 129, number: 11, topic: "الأحماض النووية", text: "إذا شكّل الأدينين 21% من قواعد DNA مزدوج، فما نسبة الثايمين؟", options: ["21%", "29%", "71%", "51%"], answer: 0, explanation: "يرتبط الأدينين بالثايمين في DNA مزدوج؛ لذلك تكون نسبة T مساوية لنسبة A، أي 21%." },
  { id: "6ad0103163cd9c24f9f40f20", page: 129, number: 12, topic: "الأحماض النووية", text: "أي أزواج القواعد الآتية يطابق قواعد الاقتران في DNA؟", options: ["A مع T، وC مع G", "A مع C، وT مع G", "A مع G، وC مع T", "A مع G، وC مع U"], answer: 0, explanation: "في DNA يرتبط الأدينين بالثايمين، ويرتبط السيتوسين بالجوانين." },
  { id: "6ad0103163cd9c24f9f40f21", page: 129, number: 13, topic: "التقنية الحيوية", text: "ما اسم التقنية التي تُستخدم لإدخال DNA أو جزء منه في DNA آخر لإنتاج تركيب وراثي جديد؟", options: ["الهندسة الوراثية", "الشفرة الوراثية", "الطفرة", "تنظيم الجينات"], answer: 0, explanation: "تتضمن الهندسة الوراثية تعديل المادة الوراثية أو نقل مقاطع DNA ودمجها في جزيئات DNA أخرى." },
  { id: "6ad0103163cd9c24f9f40f22", page: 130, number: 14, topic: "الأحماض النووية - التعبير الجيني", text: "ما اسم العملية التي يقرأ فيها الريبوسوم شيفرة mRNA لتجميع سلسلة بروتينية؟", options: ["النسخ", "الترجمة", "التضاعف", "المعالجة"], answer: 1, explanation: "في الترجمة يقرأ الريبوسوم كودونات mRNA، وتُستخدم جزيئات tRNA لإحضار الأحماض الأمينية وبناء البروتين." },
  { id: "6ad0103163cd9c24f9f40f23", page: 130, number: 15, topic: "الأحماض النووية", text: "يمثل الشكل جزيئًا ذا لولب مزدوج يتكون من شريطين متكاملين. ما الجزيء؟", options: ["DNA", "mRNA", "rRNA", "tRNA"], answer: 0, explanation: "يتكون DNA عادة من شريطين متعاكسي الاتجاه يلتفان في صورة لولب مزدوج؛ أما أنواع RNA الشائعة فتتكون غالبًا من شريط واحد." },
  { id: "6ad0103163cd9c24f9f40f24", page: 130, number: 16, topic: "الأحماض النووية", text: "إذا كانت نسبة السيتوسين في عينة DNA مزدوج 30%، فما نسبة الجوانين؟", options: ["10%", "20%", "30%", "40%"], answer: 2, explanation: "يرتبط السيتوسين بالجوانين في DNA مزدوج؛ لذلك تتساوى نسبتهما، وتكون نسبة G هي 30%." },
  { id: "6ad0103163cd9c24f9f40f25", page: 130, number: 17, topic: "الأحماض النووية", text: "أي قاعدة لا توجد عادة في جزيء mRNA؟", options: ["اليوراسيل", "الثايمين", "الجوانين", "الأدينين"], answer: 1, explanation: "يحتوي mRNA على اليوراسيل بدلًا من الثايمين، إلى جانب الأدينين والجوانين والسيتوسين." },
  { id: "6ad0103163cd9c24f9f40f26", page: 130, number: 18, topic: "الوراثة - الطفرات", text: "هل تنتقل الطفرة التي تحدث في خلية جسمية عادة إلى أبناء الشخص؟", options: ["نعم، تظهر في كل الجيل الأول", "نعم، تظهر في جميع الأجيال القادمة", "نعم، تظهر حتمًا في الجيل الثاني", "لا، لا تورث عادة لأنها لم تحدث في خلية جنسية"], answer: 3, explanation: "الطفرة الجسدية قد تنتقل إلى خلايا ناتجة من انقسام الخلية داخل جسم الفرد، لكنها لا تورث عادة للأبناء ما لم تحدث في السلالة الجنسية." },
  { id: "6ad0103163cd9c24f9f40f27", page: 130, number: 19, topic: "الأحماض النووية", text: "مم يتكون النيوكليوسوم؟", options: ["نيوكليوتيدات وبروتينات", "فوسفات وبروتونات", "DNA ملتف حول بروتينات هستونية", "فوسفات وهستونات فقط"], answer: 2, explanation: "يتكون النيوكليوسوم من DNA ملتف حول مجموعة من بروتينات الهستون، وهو مستوى من تنظيم DNA في الكروماتين." },
  { id: "6ad0103163cd9c24f9f40f29", page: 130, number: 21, topic: "الوراثة - الطفرات", text: "تغير تسلسل DNA من GGTCAT إلى CCACAT مع بقاء طول التسلسل ثابتًا. ما نوع التغير؟", options: ["إزاحة إطار القراءة", "استبدال قواعد", "حذف قواعد", "تضاعف قواعد"], answer: 1, explanation: "تغيرت قواعد في مواضع موجودة من دون زيادة طول التسلسل أو نقصانه؛ لذلك يصنف التغير استبدالًا للقواعد." },
  { id: "6ad0103163cd9c24f9f40f2b", page: 130, number: 23, topic: "الأحماض النووية - التعبير الجيني", text: "كم قاعدة نيتروجينية يلزم في جزيء mRNA لترميز بروتين مكوّن من 60 حمضًا أمينيًا، بافتراض عدم احتساب كودون الإنهاء؟", options: ["60", "120", "180", "360"], answer: 2, explanation: "يرمز كل حمض أميني بكودون من ثلاث قواعد؛ لذا يلزم 60 × 3 = 180 قاعدة لترميز 60 حمضًا أمينيًا، دون احتساب كودون الإنهاء." },
  { id: "6ad0103163cd9c24f9f40f2c", page: 135, number: 1, topic: "علم البيئة - العلاقات البيئية", text: "ما العلاقة التي تنشأ عندما يستخدم مخلوقان أو أكثر المورد المحدود نفسه في الوقت نفسه؟", options: ["تنافس", "تعايش", "تقايض", "تطفل"], answer: 0, explanation: "ينشأ التنافس عندما تتزاحم مخلوقات على مورد محدود مثل الغذاء أو الماء أو المساحة." },
  { id: "6ad0103163cd9c24f9f40f2d", page: 135, number: 2, topic: "علم البيئة - العلاقات البيئية", text: "ما اسم المخلوقات التي تحلل بقايا المخلوقات الميتة والمواد العضوية؟", options: ["قارتة", "ذاتية التغذية", "مفترسات", "محللات"], answer: 3, explanation: "تفكك المحللات المواد العضوية في البقايا والفضلات إلى مواد أبسط تعود إلى البيئة." },
  { id: "6ad0103163cd9c24f9f40f2e", page: 135, number: 3, topic: "علم البيئة - مستويات التنظيم", text: "ما أعلى مستوى من مستويات التنظيم البيئي؟", options: ["الغلاف الحيوي", "النظام البيئي", "الجماعة الحيوية", "المجتمع الحيوي"], answer: 0, explanation: "يشمل الغلاف الحيوي جميع الأنظمة البيئية والمناطق التي توجد فيها الحياة على الأرض، ولذلك فهو أعلى مستويات التنظيم." },
  { id: "6ad0103163cd9c24f9f40f2f", page: 135, number: 5, topic: "علم البيئة - مستويات التنظيم", text: "أي مثال يمثل جماعة حيوية؟", options: ["حيوانات من أنواع مختلفة", "أفراد من النوع نفسه يعيشون في مكان واحد", "نباتات من أنواع مختلفة", "حيوانات ونباتات من أنواع مختلفة"], answer: 1, explanation: "الجماعة الحيوية هي أفراد من النوع نفسه يعيشون في المكان والوقت نفسيهما." },
  { id: "6ad0103163cd9c24f9f40f30", page: 135, number: 6, topic: "علم البيئة - العلاقات البيئية", text: "ما العلاقة بين النحلة والزهرة عند حصول النحلة على الرحيق ونقلها حبوب اللقاح؟", options: ["تقايض (تبادل منفعة)", "تعايش", "تطفل", "افتراس"], answer: 0, explanation: "تستفيد النحلة من الرحيق، وتستفيد الزهرة من نقل حبوب اللقاح؛ لذلك يستفيد الطرفان." },
  { id: "6ad0103163cd9c24f9f40f31", page: 135, number: 7, topic: "علم البيئة - العلاقات البيئية", text: "ما العلاقة بين النمور والأسود عندما تتنافس على مورد غذائي مشترك؟", options: ["تنافس", "تطفل", "تعايش", "افتراس"], answer: 0, explanation: "تتنافس النمور والأسود إذا استخدمت المورد الغذائي المحدود نفسه." },
  { id: "6ad0103163cd9c24f9f40f32", page: 135, number: 8, topic: "علم البيئة - مستويات التنظيم", text: "ما اسم مجموعة واسعة من الأنظمة البيئية التي تتشابه في المناخ والكائنات السائدة؟", options: ["مجتمع حيوي", "منطقة حيوية", "نظام بيئي", "غلاف حيوي"], answer: 1, explanation: "المنطقة الحيوية تضم أنظمة بيئية واسعة تتشابه في المناخ وأنماط الحياة السائدة." },
  { id: "6ad0103163cd9c24f9f40f33", page: 135, number: 9, topic: "علم البيئة - العوامل البيئية", text: "أي مما يأتي عامل لاحيوي في البيئة الصحراوية؟", options: ["قلة سقوط الأمطار", "زيادة أعداد الحيوانات المفترسة", "زيادة الحيوانات آكلة الأعشاب", "تناقص نمو الأعشاب"], answer: 0, explanation: "قلة الأمطار عامل مناخي غير حي؛ أما أعداد الحيوانات ونمو النباتات فهي مكونات أو آثار حيوية." },
  { id: "6ad0103163cd9c24f9f40f34", page: 135, number: 10, topic: "علم البيئة - مستويات التنظيم", text: "مجموعة من أسماك الهامور من النوع نفسه تعيش في مكان واحد وتتنافس على الغذاء. ماذا تمثل؟", options: ["مجتمعًا حيويًا", "جماعة حيوية", "منطقة حيوية", "نظامًا بيئيًا"], answer: 1, explanation: "أفراد النوع الواحد الذين يعيشون في مساحة واحدة يشكلون جماعة حيوية." },
  { id: "6ad0103163cd9c24f9f40f35", page: 135, number: 11, topic: "علم البيئة - تدفق الطاقة", text: "أي مجموعة تشكل قاعدة معظم السلاسل الغذائية وتدخل الطاقة إلى النظام البيئي؟", options: ["المخلوقات غير الذاتية", "المحللات", "الكانسات", "المخلوقات الذاتية التغذية"], answer: 3, explanation: "تلتقط المخلوقات الذاتية التغذية الطاقة، غالبًا من ضوء الشمس، وتصنع مادة عضوية تنتقل عبر المستويات الغذائية." },
  { id: "6ad0103163cd9c24f9f40f36", page: 135, number: 12, topic: "علم البيئة - مستويات التنظيم", text: "ماذا يتكون من مجموع المناطق الحيوية والأنظمة البيئية على الأرض؟", options: ["المجتمع الحيوي", "الجماعات الحيوية", "الغلاف الحيوي", "النظام البيئي"], answer: 2, explanation: "الغلاف الحيوي هو مجموع أجزاء الأرض التي توجد فيها الحياة، ويضم الأنظمة البيئية والمناطق الحيوية." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40f15", page: 129, number: 1, reason: "لا يتضمن أي خيار العالم فريدريك ميشر، الذي عُرف بعزل المادة التي سميت لاحقًا DNA؛ أما غريفيث وتشارغاف وواتسون وكريك فارتبطوا باكتشافات لاحقة ومختلفة." },
  { id: "6ad0103163cd9c24f9f40f28", page: 130, number: 20, reason: "مكرر معنويًا للسؤال 13 في الصفحة السابقة عن إدخال أو إضافة DNA إلى DNA آخر بوصفه هندسة وراثية، ولا يضيف مهارة جديدة." },
  { id: "6ad0103163cd9c24f9f40f2a", page: 130, number: 22, reason: "مكرر مباشرة للسؤال 17 في الصفحة نفسها: القاعدة التي لا توجد في mRNA هي الثايمين." },
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
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة مفتاح الإجابة والشرح مع المصدر، وتصحيح الخطأ المطبعي أو العلمي في المفتاح عند الحاجة.", updatedAt: reviewedAt,
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
