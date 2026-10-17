import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40eb9", page: 113, number: 13, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "في أي نسيج بشري يحدث تخمر حمض اللاكتيك عند نقص الأكسجين؟", options: ["النواة", "العضلات", "الجدار الخلوي", "الفجوات"], answer: 1, explanation: "قد يحدث تخمر حمض اللاكتيك في خلايا العضلات عند عدم كفاية الأكسجين لتلبية حاجة الخلية إلى الطاقة." },
  { id: "6ad0103163cd9c24f9f40eba", page: 113, number: 14, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "ما صافي عدد جزيئات ATP الناتجة من التحلل السكري لجزيء جلوكوز واحد؟", options: ["ATP واحد", "2 ATP", "3 ATP", "4 ATP"], answer: 1, explanation: "ينتج التحلل السكري أربعة ATP إجمالًا ويستهلك اثنين، لذلك يكون صافي الناتج جزيئَي ATP." },
  { id: "6ad0103163cd9c24f9f40ebb", page: 113, number: 15, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "أي مجموعة من الكائنات تستخدم التخمر الكحولي الشبيه بالمخطط؟", options: ["الطيور", "الفطريات مثل الخميرة", "النباتات", "الحيوانات"], answer: 1, explanation: "تستخدم الخمائر، وهي فطريات، التخمر الكحولي لتحويل نواتج التحلل السكري إلى إيثانول وثاني أكسيد الكربون." },
  { id: "6ad0103163cd9c24f9f40ebd", page: 113, number: 17, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "كم مجموعة فوسفات توجد في جزيء ATP؟", options: ["1", "2", "3", "4"], answer: 2, explanation: "يحتوي ATP على ثلاث مجموعات فوسفات؛ وعند إزالة واحدة يتحول إلى ADP." },
  { id: "6ad0103163cd9c24f9f40ebe", page: 113, number: 18, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "في مخطط التحلل السكري، كم جزيئًا من ATP يُستهلك وكم جزيئًا يُنتج إجمالًا؟", options: ["يُستهلك 2 وينتج 1", "يُستهلك 2 وينتج 4", "يُستهلك 4 وينتج 6", "يُستهلك 4 وينتج 4"], answer: 1, explanation: "يستهلك التحلل السكري جزيئَي ATP في بدايته، ثم ينتج أربعة ATP إجمالًا؛ وصافي الربح جزيئان." },
  { id: "6ad0103163cd9c24f9f40ebf", page: 113, number: 19, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "أي ناتج عضوي أساسي يصنعه البناء الضوئي أولًا؟", options: ["كربوهيدرات أحادية السكر مثل الجلوكوز", "كربوهيدرات ثنائية السكر", "كربوهيدرات عديدة السكر مباشرة", "الدهون"], answer: 0, explanation: "تنتج دورة كالفن مركبات ثلاثية الكربون تستخدم الخلية النباتية في بناء السكريات، ومنها الجلوكوز." },
  { id: "6ad0103163cd9c24f9f40ec0", page: 113, number: 20, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "أي معادلة تمثل التنفس الخلوي الهوائي للجلوكوز؟", options: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "C₆H₁₂O₆ + طاقة → 6CO₂ + 6H₂O + 6O₂", "C₆H₁₂O₆ + 6CO₂ → 6CO₂ + 6H₂O + طاقة", "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + طاقة"], answer: 3, explanation: "يستهلك التنفس الهوائي الجلوكوز والأكسجين، وينتج ثاني أكسيد الكربون والماء والطاقة." },
  { id: "6ad0103163cd9c24f9f40ec1", page: 113, number: 21, subcategory: "الطاقة الخلوية - البناء الضوئي والتنفس الخلوي", text: "في مخطط البناء الضوئي، ما المادة الداخلة من الهواء إلى النبات عبر الأوراق؟", options: ["الماء", "الأكسجين", "ثاني أكسيد الكربون", "مركبات عضوية"], answer: 2, explanation: "تمتص الأوراق ثاني أكسيد الكربون من الهواء، وتمتص الجذور الماء من التربة؛ وتُستخدم المادتان في البناء الضوئي." },
  { id: "6ad0103163cd9c24f9f40ec2", page: 114, number: 2, subcategory: "دورة الخلية - الانقسام الخلوي", text: "كم خلية بنت تنتج عادة من انقسام خلية كبدية واحدة مرة واحدة بالانقسام المتساوي؟", options: ["6", "2", "4", "3"], answer: 1, explanation: "ينتج الانقسام المتساوي خليتين بنتين متماثلتين وراثيًا غالبًا من خلية واحدة." },
  { id: "6ad0103163cd9c24f9f40ec3", page: 114, number: 3, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ما الخاصية التي تجعل الخلايا الجذعية واعدة في علاج بعض الأنسجة التالفة؟", options: ["هي خلايا متخصصة تستبدل أعضاء كاملة مباشرة", "هي خلايا غير متخصصة يمكن توجيهها لتتمايز إلى أنواع متخصصة", "تنتج هرمونات تحفز المناعة فقط", "تنتج مضادات حيوية طبيعية"], answer: 1, explanation: "تستطيع بعض الخلايا الجذعية التمايز إلى أنواع خلوية متخصصة عند توافر الإشارات والظروف المناسبة، ما يجعلها مجالًا بحثيًا علاجيًا." },
  { id: "6ad0103163cd9c24f9f40ec4", page: 114, number: 4, subcategory: "دورة الخلية - الانقسام الخلوي", text: "لماذا يصعب على خلية كبيرة الحصول على المواد والتخلص من الفضلات بالكفاءة نفسها التي تحققها خلية أصغر؟", options: ["لأن حجمها ومساحتها يجعلان الحصول على الغذاء أسهل", "لأن نموها يحافظ على نسبة سطح إلى حجم ثابتة", "لأن حجمها يزداد أسرع من مساحة سطحها فتقل كفاءة التبادل", "لأنها تتخلص من الفضلات بسهولة أكبر"], answer: 2, explanation: "يزداد حجم الخلية مع نموها أسرع من مساحة سطحها، فتقل نسبة مساحة السطح إلى الحجم ويصعب تبادل المواد عبر الغشاء." },
  { id: "6ad0103163cd9c24f9f40ec6", page: 114, number: 6, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ما البنية التي تنتظم فيها جزيئات DNA النووي على هيئة وحدات مدمجة؟", options: ["البلاستيدات", "الكروموسومات", "الميتوكوندريا", "أجسام جولجي"], answer: 1, explanation: "يرتبط DNA ببروتينات ويلتف ليكوّن الكروموسومات، التي تحمل المعلومات الوراثية." },
  { id: "6ad0103163cd9c24f9f40ec7", page: 114, number: 7, subcategory: "دورة الخلية - الانقسام الخلوي", text: "مم يتكون الكروموسوم المضاعف قبل انفصال الكروماتيدات؟", options: ["كروماتيدات غير شقيقة", "كروماتيدان شقيقان", "كروماتيدات غير متماثلة", "نيوكليوتيدات فقط"], answer: 1, explanation: "يتكون الكروموسوم المضاعف من كروماتيدين شقيقين متصلين عند السنترومير." },
  { id: "6ad0103163cd9c24f9f40ec8", page: 114, number: 9, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ما نتيجة فشل نقاط السيطرة التي تضبط دورة الخلية؟", options: ["موت الخلية مباشرة في كل الحالات", "نمو وانقسام غير منتظمين", "نمو منتظم دائمًا", "توقف نمو الخلية حتمًا"], answer: 1, explanation: "يسمح خلل نقاط السيطرة لبعض الخلايا بمواصلة الانقسام دون التنظيم الطبيعي، وقد يسهم ذلك في نمو غير منضبط." },
  { id: "6ad0103163cd9c24f9f40ec9", page: 114, number: 10, subcategory: "دورة الخلية - الانقسام الخلوي", text: "كم خلية تنتج في النهاية من خلية واحدة بعد اكتمال الانقسام المنصف؟", options: ["خليتان", "ثلاث خلايا", "أربع خلايا", "ثماني خلايا"], answer: 2, explanation: "يتضمن الانقسام المنصف انقسامين متتاليين وينتج عادة أربع خلايا أحادية المجموعة الكروموسومية." },
  { id: "6ad0103163cd9c24f9f40eca", page: 114, number: 11, subcategory: "دورة الخلية - الانقسام الخلوي", text: "كم خلية تنتج من خلية جسدية واحدة بعد أربع دورات متتالية من الانقسام المتساوي؟", options: ["2", "3", "4", "16"], answer: 3, explanation: "يتضاعف عدد الخلايا في كل دورة؛ لذلك يكون العدد 2⁴ = 16 خلية بعد أربع دورات." },
  { id: "6ad0103163cd9c24f9f40ecb", page: 115, number: 12, subcategory: "دورة الخلية - الانقسام الخلوي", text: "لاحظت تكوّن صفيحة خلوية أثناء الانقسام السيتوبلازمي. إلى أي نوع خلية تنتمي؟", options: ["نباتية", "حيوانية", "أميبية", "بكتيرية"], answer: 0, explanation: "تتكون الصفيحة الخلوية في الخلايا النباتية أثناء الانقسام السيتوبلازمي، ثم تسهم في إنشاء جدار فاصل بين الخليتين." },
  { id: "6ad0103163cd9c24f9f40ecc", page: 115, number: 13, subcategory: "دورة الخلية - الانقسام الخلوي", text: "كم خلية بكتيرية تنتج من انقسام خلية واحدة بالانشطار الثنائي مرة واحدة؟", options: ["2", "4", "6", "8"], answer: 0, explanation: "ينتج الانشطار الثنائي خليتين بنتين من خلية بكتيرية واحدة في كل دورة انقسام." },
  { id: "6ad0103163cd9c24f9f40ecd", page: 115, number: 14, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ماذا يحدث للخلايا الجذعية غير المتخصصة عندما تتلقى إشارات تمايز مناسبة؟", options: ["تتحول إلى خلايا أقل تخصصًا", "تتمايز إلى خلايا متخصصة", "تتحول جميعها إلى خلايا بلازمية", "تتحول جميعها إلى خلايا دهنية"], answer: 1, explanation: "تدفع إشارات التمايز بعض الخلايا الجذعية إلى اكتساب صفات ووظائف أنواع خلوية متخصصة." },
  { id: "6ad0103163cd9c24f9f40ece", page: 115, number: 15, subcategory: "دورة الخلية - الانقسام الخلوي", text: "أي صفة تميز الخلايا السرطانية عن الخلايا الطبيعية؟", options: ["تلتزم بنقاط السيطرة وتتوقف عند الحاجة", "قد تواصل الانقسام رغم إشارات تنظيم دورة الخلية", "تكون جميعها منتظمة الشكل", "تتوقف بعد عدد محدود من الانقسامات"], answer: 1, explanation: "قد تفقد الخلايا السرطانية الاستجابة الطبيعية لإشارات تنظيم دورة الخلية، فتواصل الانقسام بصورة غير منضبطة." },
  { id: "6ad0103163cd9c24f9f40ecf", page: 115, number: 16, subcategory: "دورة الخلية - الانقسام الخلوي", text: "أي تركيب خلوي يحمل معظم المعلومات الوراثية المنظمة في جينات؟", options: ["الكروموسومات", "الريبوسومات", "الليسوسومات", "السنترسومات"], answer: 0, explanation: "تحمل الكروموسومات DNA والجينات التي تتضمن معظم المعلومات الوراثية للخلية." },
  { id: "6ad0103163cd9c24f9f40ed0", page: 115, number: 18, subcategory: "دورة الخلية - الانقسام الخلوي", text: "يقارن الرسم مدة أطوار دورة خلية طبيعية وخلية سرطانية. ما الاستنتاج الذي تدعمه البيانات؟", options: ["يزداد احتمال السرطان وحده", "الطور البيني للخلايا السرطانية أطول", "تنمو الخلايا السرطانية خلال الدورة أسرع", "تنمو الخلايا الطبيعية أسرع"], answer: 2, explanation: "يمثل الرسم زمنًا أقصر لدورة الخلية السرطانية مقارنة بالطبيعية؛ لذا تدعم البيانات أنها تنمو أو تنقسم بسرعة أكبر." },
  { id: "6ad0103163cd9c24f9f40ed1", page: 115, number: 19, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ما المقصود بالعبور الجيني في الانقسام المنصف؟", options: ["تبادل أجزاء بين كروماتيدين شقيقين", "تبادل أجزاء بين كروماتيدين غير شقيقين من كروموسومين متماثلين", "تضاعف DNA", "انفصال الكروماتيدات الشقيقة"], answer: 1, explanation: "يحدث العبور الجيني بتبادل قطع بين كروماتيدات غير شقيقة لكروموسومين متماثلين خلال الطور التمهيدي الأول." },
  { id: "6ad0103163cd9c24f9f40ed2", page: 115, number: 20, subcategory: "دورة الخلية - الانقسام الخلوي", text: "أي مما يأتي ليس آلية طبيعية تسهم في التنوع الوراثي للنسل؟", options: ["العبور الجيني", "تعطل الكروموسومات", "الانقسام المنصف", "التوزيع العشوائي للكروموسومات"], answer: 1, explanation: "يسهم العبور والتوزيع العشوائي في الانقسام المنصف في التنوع الوراثي. أما تعطل الكروموسومات فليس آلية طبيعية منتظمة لإنتاجه." },
  { id: "6ad0103163cd9c24f9f40ed3", page: 115, number: 21, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ما اسم عملية تبادل الأجزاء بين كروماتيدات غير شقيقة لكروموسومين متماثلين؟", options: ["الاتحاد", "التضاعف", "التماثل", "العبور الجيني"], answer: 3, explanation: "تسمى عملية تبادل القطع بين كروماتيدات غير شقيقة للكروموسومات المتماثلة بالعبور الجيني." },
  { id: "6ad0103163cd9c24f9f40ed4", page: 115, number: 22, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ما اسم اقتران الكروموسومات المتماثلة في الطور التمهيدي الأول من الانقسام المنصف؟", options: ["التضاعف", "النسخ", "الانفصال", "التشابك (الاقتران)"], answer: 3, explanation: "يسمى اقتران الكروموسومات المتماثلة في الطور التمهيدي الأول التشابك أو الاقتران؛ وقد يحدث العبور بين كروماتيداتها غير الشقيقة." },
  { id: "6ad0103163cd9c24f9f40ed5", page: 116, number: 23, subcategory: "دورة الخلية - الانقسام الخلوي", text: "في الرسم، تنفصل الكروموسومات المتماثلة مع بقاء الكروماتيدات الشقيقة متصلة. ما الطور الذي يمثله؟", options: ["الطور التمهيدي الأول", "الطور الاستوائي الأول", "الطور الانفصالي الأول", "الطور النهائي الأول"], answer: 2, explanation: "في الطور الانفصالي الأول تنفصل الكروموسومات المتماثلة وتتجه إلى قطبي الخلية، بينما تبقى الكروماتيدات الشقيقة متصلة." },
  { id: "6ad0103163cd9c24f9f40ed6", page: 116, number: 24, subcategory: "دورة الخلية - الانقسام الخلوي", text: "إذا احتوت الخلية الجنسية للدجاج على 39 كروموسومًا، فكم كروموسومًا يوجد في خلية جسمية؟", options: ["60", "80", "78", "100"], answer: 2, explanation: "تحتوي الخلية الجنسية على نصف العدد الموجود في الخلايا الجسمية؛ لذا يكون العدد الجسمي 2 × 39 = 78." },
  { id: "6ad0103163cd9c24f9f40ed7", page: 116, number: 25, subcategory: "دورة الخلية - الانقسام الخلوي", text: "ما أهمية العبور الجيني في الانقسام المنصف؟", options: ["إنتاج عدد كبير من الأمشاج وحده", "زيادة عدد الأمشاج", "المحافظة على الصفات دون تغير", "الإسهام في التنوع الوراثي"], answer: 3, explanation: "ينشئ العبور تراكيب جديدة من الأليلات في الكروماتيدات، فيسهم في التنوع الوراثي للأمشاج." },
  { id: "6ad0103163cd9c24f9f40ed8", page: 116, number: 26, subcategory: "دورة الخلية - الانقسام الخلوي", text: "إذا احتوت الخلية الجنسية البشرية على 23 كروموسومًا، فكم كروموسومًا في خلية من الجلد؟", options: ["23", "46", "48", "72"], answer: 1, explanation: "الخلايا الجلدية جسدية وثنائية المجموعة الكروموسومية؛ لذا تحتوي على 46 كروموسومًا." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40ebc", page: 113, number: 16, reason: "امتصاص الكلوروفيل يعتمد على طول موجة الضوء؛ وصياغة «يمتص كمية أكبر» لا تحدد الطول الموجي أو طيف المصدر، لذلك لا توجد إجابة وحيدة ثابتة بين الأنواع المعروضة." },
  { id: "6ad0103163cd9c24f9f40ed9", page: 116, number: 28, reason: "السؤال يطلب خلية أحادية المجموعة الكروموسومية، لكن الخيارات تذكر عضوًا هو المبيض ولا تذكر البويضة أو الحيوان المنوي؛ لذلك لا يوجد خيار صحيح بصيغته الحالية." },
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
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة الإجابة والشرح مع المصدر، وتصحيح الصياغة والخيارات التي كانت ملتبسة أو تعتمد على رسم.", updatedAt: reviewedAt,
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
