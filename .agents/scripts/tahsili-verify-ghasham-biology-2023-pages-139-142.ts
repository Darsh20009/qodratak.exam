import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40f58", page: 139, number: 48, topic: "علم البيئة - التنوع الحيوي", text: "مجتمع حيوي يضم أسودًا وفيلة وزرافات وسناجب وقرودًا. ما نوع التنوع الذي يوضحه تعدد الأنواع؟", options: ["تنوع وراثي", "تنوع الأنواع", "تنوع النظم البيئية", "تنوع جيني داخل النوع"], answer: 1, explanation: "وجود أنواع مختلفة من المخلوقات في المجتمع نفسه يوضح تنوع الأنواع." },
  { id: "6ad0103163cd9c24f9f40f59", page: 139, number: 49, topic: "علم البيئة - العلاقات الغذائية", text: "يصنف الدب عادة ضمن الحيوانات التي تتغذى على النبات والحيوان. ما نمط تغذيته؟", options: ["قارتة", "آكلة لحوم فقط", "آكلة أعشاب فقط", "محللة"], answer: 0, explanation: "القارت يتغذى على مواد نباتية وحيوانية؛ والدببة عمومًا قارتة، مع اختلاف الغذاء بحسب النوع والبيئة." },
  { id: "6ad0103163cd9c24f9f40f5a", page: 139, number: 50, topic: "علم البيئة - مستويات التنظيم", text: "أي مستويات التنظيم البيئي الآتية أكثر تعقيدًا؟", options: ["المخلوق الحي", "الجماعة الحيوية", "المجتمع الحيوي", "النظام البيئي"], answer: 3, explanation: "يضم النظام البيئي مجتمعًا حيويًا وعوامل لاحيوية وتفاعلاتها، ولذلك هو أكثر تعقيدًا من الخيارات الأخرى." },
  { id: "6ad0103163cd9c24f9f40f5b", page: 139, number: 51, topic: "علم البيئة - مستويات التنظيم", text: "أي مستوى من مستويات التنظيم الآتية يضم عددًا أقل من المخلوقات الحية عادة؟", options: ["النظام البيئي", "المجتمع الحيوي", "الجماعة الحيوية", "المنطقة الحيوية"], answer: 2, explanation: "الجماعة الحيوية تضم أفراد نوع واحد، بينما يضم المجتمع عدة جماعات، ويضم النظام البيئي والمناطق الحيوية نطاقًا أوسع." },
  { id: "6ad0103163cd9c24f9f40f5c", page: 140, number: 1, topic: "علم البيئة - العوامل البيئية", text: "قد تساعد زيادة تركيز ثاني أكسيد الكربون على زيادة البناء الضوئي لبعض النباتات في الظروف المناسبة. أي ظاهرة ترتبط بزيادة الغازات الدفيئة في الغلاف الجوي؟", options: ["الضباب الدخاني", "الأمطار الحمضية", "الاحتباس الحراري", "ثقب الأوزون"], answer: 2, explanation: "ترتبط زيادة الغازات الدفيئة، ومنها ثاني أكسيد الكربون، بزيادة احتباس الحرارة في الغلاف الجوي؛ وقد يؤثر توفر CO₂ في البناء الضوئي مع بقاء الضوء والماء والحرارة عوامل محددة." },
  { id: "6ad0103163cd9c24f9f40f5d", page: 140, number: 2, topic: "علم البيئة - العوامل البيئية", text: "ما المصطلح الذي يصف قدرة المخلوق الحي على البقاء ومقاومة عامل بيئي ضمن حدود معينة؟", options: ["التعاقب البيئي", "التحمل", "الاستجابة", "التعاقب الثانوي"], answer: 1, explanation: "مدى التحمل هو النطاق الذي يستطيع المخلوق الحي فيه البقاء ومقاومة التغير في عامل بيئي محدد." },
  { id: "6ad0103163cd9c24f9f40f5e", page: 140, number: 3, topic: "علم البيئة - الأنظمة المائية", text: "أين يتركز معظم العوالق النباتية التي تحتاج إلى الضوء؟", options: ["المنطقة المضيئة", "المنطقة المظلمة", "منطقة اللجة", "قاع المحيط"], answer: 0, explanation: "تتركز العوالق النباتية في المنطقة المضيئة حيث يتوفر الضوء اللازم للبناء الضوئي." },
  { id: "6ad0103163cd9c24f9f40f5f", page: 140, number: 4, topic: "علم البيئة - الأنظمة المائية", text: "أي منطقة مائية لا تستطيع فيها المخلوقات المعتمدة على البناء الضوئي صنع غذائها بسبب غياب الضوء؟", options: ["المنطقة المضيئة", "منطقة المد المرتفع", "المنطقة المظلمة", "منطقة الرذاذ"], answer: 2, explanation: "لا يصل ضوء كافٍ إلى المنطقة المظلمة في الأعماق، لذلك لا تستطيع النباتات والعوالق النباتية الاعتماد فيها على البناء الضوئي." },
  { id: "6ad0103163cd9c24f9f40f60", page: 140, number: 6, topic: "علم البيئة - التعاقب البيئي", text: "ما اسم المجتمع الحيوي المستقر الذي يستقر بعد التعاقب البيئي مع حدوث تغير طفيف نسبيًا في الأنواع؟", options: ["التعاقب الأولي", "التعاقب الثانوي", "نهاية التعاقب", "مجتمع الذروة"], answer: 3, explanation: "مجتمع الذروة هو المجتمع المستقر نسبيًا الذي يصل إليه التعاقب البيئي في ظروف بيئية معينة." },
  { id: "6ad0103163cd9c24f9f40f61", page: 140, number: 7, topic: "علم البيئة - الأنظمة المائية", text: "كيف تصنف طريقة تغذي العوالق النباتية؟", options: ["ذاتية التغذية", "طفيلية", "رمية", "تكافلية"], answer: 0, explanation: "تصنع العوالق النباتية غذاءها بالتمثيل الضوئي، لذا فهي ذاتية التغذية. لا ينطبق ذلك على جميع أنواع العوالق الحيوانية." },
  { id: "6ad0103163cd9c24f9f40f62", page: 140, number: 8, topic: "علم البيئة - الماء", text: "أين توجد أكبر نسبة من المياه العذبة على الأرض؟", options: ["الأنهار", "البحيرات", "المحيطات", "الأنهار الجليدية والكتل الجليدية"], answer: 3, explanation: "تتركز النسبة الأكبر من المياه العذبة في الجليد والأنهار الجليدية، لا في الأنهار والبحيرات." },
  { id: "6ad0103163cd9c24f9f40f63", page: 140, number: 9, topic: "علم البيئة - الأنظمة المائية", text: "ما اسم المنطقة التي يختلط فيها ماء النهر العذب بماء البحر المالح؟", options: ["مصب النهر (المصبّ)", "منطقة اللجة", "منطقة المد والجزر", "الأراضي الرطبة"], answer: 0, explanation: "المصب منطقة انتقالية يلتقي فيها ماء النهر العذب بماء البحر المالح." },
  { id: "6ad0103163cd9c24f9f40f64", page: 140, number: 10, topic: "علم البيئة - المناطق الحيوية", text: "أي منطقة حيوية تتميز غالبًا بتربة خصبة، وتبقى عشبية بدلًا من أن تتحول إلى غابة بسبب قلة الأمطار أو الحرائق أو الرعي؟", options: ["المناطق العشبية", "السافانا الاستوائية", "التندرا", "الصحراء"], answer: 0, explanation: "تتميز الأراضي العشبية المعتدلة بتربة خصبة، وتحد قلة الأمطار والحرائق والرعي من نمو الأشجار وتحولها إلى غابات." },
  { id: "6ad0103163cd9c24f9f40f65", page: 140, number: 11, topic: "علم البيئة - المناطق الحيوية", text: "أي تكيف يساعد النباتات في الغابات الموسمية الاستوائية على تحمل موسم الجفاف؟", options: ["جذورها تخزن الماء دائمًا", "جذورها سطحية فقط", "تساقط الأوراق وقت الجفاف", "الحشائش قريبة من الأرض"], answer: 2, explanation: "يساعد تساقط الأوراق في موسم الجفاف على تقليل فقد الماء عند بعض نباتات الغابات الموسمية." },
  { id: "6ad0103163cd9c24f9f40f66", page: 140, number: 12, topic: "علم البيئة - الأنظمة المائية", text: "كيف توصف المصبات من حيث موقعها بين الأنظمة المائية؟", options: ["مناطق انتقالية", "مياه عذبة فقط", "مياه مالحة فقط", "مناطق استوائية"], answer: 0, explanation: "المصب منطقة انتقالية بين المياه العذبة القادمة من النهر والمياه المالحة في البحر." },
  { id: "6ad0103163cd9c24f9f40f67", page: 141, number: 13, topic: "علم البيئة - الأنظمة المائية", text: "ما العامل الذي يساعد على خلط مياه البركة وتوزيع الأكسجين والمواد الغذائية بين طبقاتها في الربيع؟", options: ["حركة الرياح", "درجة حرارة المياه وحدها", "نشاط المخلوقات الحية وحده", "سقوط الأمطار الغزيرة"], answer: 0, explanation: "تسهم الرياح في خلط طبقات الماء، فتساعد على توزيع الأكسجين والمواد الغذائية في البركة." },
  { id: "6ad0103163cd9c24f9f40f68", page: 141, number: 14, topic: "علم البيئة - مدى التحمل", text: "في منحنى مدى التحمل المرسوم، أي حرف يشير إلى منطقة عدم التحمل عند الطرف المنخفض للعامل البيئي؟", options: ["A", "B", "C", "D"], answer: 1, explanation: "في الرسم تمثل B المنطقة الطرفية منخفضة العامل التي لا يستطيع المخلوق الحي فيها البقاء؛ أما D فتقع عند المنطقة المثلى." },
  { id: "6ad0103163cd9c24f9f40f69", page: 141, number: 15, topic: "علم البيئة - مدى التحمل", text: "في منحنى مدى التحمل المرسوم، ماذا يمثل الحرف D؟", options: ["منطقة عدم التحمل", "المدى الأمثل", "الإجهاد الفسيولوجي", "المدى الأعلى"], answer: 1, explanation: "يقع الحرف D عند قمة منحنى الأداء؛ أي في المدى الأمثل الذي تكون فيه ظروف العامل البيئي أنسب للمخلوق." },
  { id: "6ad0103163cd9c24f9f40f6a", page: 142, number: 1, topic: "علم البيئة - خصائص الجماعة", text: "ما المصطلح الذي يصف دخول أفراد جدد إلى جماعة حيوية؟", options: ["الهجرة الداخلية", "الهجرة الخارجية", "القدرة الاستيعابية", "معدل نمو الجماعة"], answer: 0, explanation: "الهجرة الداخلية هي دخول أفراد إلى الجماعة، بينما الهجرة الخارجية هي مغادرة أفراد لها." },
  { id: "6ad0103163cd9c24f9f40f6b", page: 142, number: 2, topic: "علم البيئة - خصائص الجماعة", text: "ما المصطلح الذي يصف أكبر عدد من الأفراد تستطيع البيئة دعمه على المدى الطويل؟", options: ["الهجرة الخارجية", "كثافة الجماعة", "الكتلة الحيوية", "القدرة الاستيعابية"], answer: 3, explanation: "القدرة الاستيعابية هي أكبر حجم للجماعة يمكن للبيئة دعمه باستمرار وفق مواردها وظروفها." },
  { id: "6ad0103163cd9c24f9f40f6c", page: 142, number: 3, topic: "علم البيئة - خصائص الجماعة", text: "ما المصطلح الذي يصف خروج أفراد من جماعة حيوية؟", options: ["الهجرة الداخلية", "الهجرة الخارجية", "معدل نمو الجماعة", "معدل النمو الأسي"], answer: 1, explanation: "الهجرة الخارجية هي مغادرة أفراد الجماعة إلى مكان آخر." },
  { id: "6ad0103163cd9c24f9f40f6e", page: 142, number: 5, topic: "علم البيئة - خصائص الجماعة", text: "أي مجال يدرس حجم الجماعات البشرية وتوزيعها؟", options: ["القدرة الاستيعابية", "علم السكان", "العوامل المحددة", "كثافة الجماعة"], answer: 1, explanation: "يدرس علم السكان حجم الجماعات البشرية وتركيبها وتوزيعها وتغيرها." },
  { id: "6ad0103163cd9c24f9f40f6f", page: 142, number: 6, topic: "علم البيئة - خصائص الجماعة", text: "ما نمط توزيع الحيوانات التي تعيش في قطعان؟", options: ["منتظم", "عشوائي", "تكتلي", "لا شيء مما ذكر"], answer: 2, explanation: "تعيش الحيوانات القطيعية متجمعة في مجموعات، وهذا نمط توزيع تكتلي." },
  { id: "6ad0103163cd9c24f9f40f71", page: 142, number: 8, topic: "علم البيئة - خصائص الجماعة", text: "ما اسم التحول الذي تنتقل فيه الجماعة من معدلات ولادة ووفيات مرتفعة إلى معدلات أقل؟", options: ["القدرة الاستيعابية", "التحول السكاني", "مدى التحمل", "النمو الصفري"], answer: 1, explanation: "يصف التحول السكاني التغير التاريخي في معدلات الولادة والوفاة مع تطور المجتمع والظروف الصحية والاقتصادية." },
  { id: "6ad0103163cd9c24f9f40f72", page: 142, number: 9, topic: "علم البيئة - خصائص الجماعة", text: "أي خاصية للجماعة الحيوية توضح عدد أفرادها لكل وحدة مساحة؟", options: ["معدل نمو الجماعة", "توزيع الجماعة", "نطاق الجماعة", "كثافة الجماعة"], answer: 3, explanation: "كثافة الجماعة هي عدد أفرادها في وحدة مساحة أو حجم." },
  { id: "6ad0103163cd9c24f9f40f73", page: 142, number: 10, topic: "علم البيئة - خصائص الجماعة", text: "أي العوامل الآتية لا يعتمد تأثيرها عادة على كثافة الجماعة؟", options: ["الطفيليات", "الفيضانات", "التنافس", "المرض"], answer: 1, explanation: "الفيضان عامل لاحيوي قد يؤثر في الجماعات بصرف النظر عن كثافتها، بينما يزداد أثر المنافسة والطفيليات والأمراض غالبًا مع ارتفاع الكثافة." },
  { id: "6ad0103163cd9c24f9f40f74", page: 142, number: 11, topic: "علم البيئة - خصائص الجماعة", text: "يوضح الشكل توزيع الأفراد بحسب العمر، وتظهر قاعدته أعرض من مستوياته العليا. ما نمط نمو الجماعة الذي يشير إليه؟", options: ["نمو بطيء", "نمو معتدل", "نمو سريع", "نمو سلبي"], answer: 2, explanation: "اتساع القاعدة يعني ارتفاع نسبة صغار السن مقارنة بالأعمار الأكبر؛ وهذا يشير عادة إلى نمو سريع محتمل للجماعة." },
  { id: "6ad0103163cd9c24f9f40f75", page: 142, number: 12, topic: "علم البيئة - خصائص الجماعة", text: "ما المصطلح الذي يصف سرعة زيادة عدد أفراد جماعة حيوية أو نقصانه؟", options: ["معدل نمو الجماعة", "معدل الوفيات", "توزيع الجماعة", "الهجرة الداخلية"], answer: 0, explanation: "معدل نمو الجماعة يصف تغير حجمها مع الزمن نتيجة الولادات والوفيات والهجرة الداخلية والخارجية." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40f70", page: 142, number: 7, reason: "يعيد السؤال السابق مباشرة عن نمط التوزيع التكتلي للحيوانات القطيعية؛ الشكل لا يضيف مهارة أو استنتاجًا مميزًا بما يكفي." },
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
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة مفتاح الإجابة والشرح مع المصدر، وتصحيح مفتاح المصدر عند ثبوت خطئه، وتوضيح الرسم أو المفهوم في نص السؤال.", updatedAt: reviewedAt,
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
