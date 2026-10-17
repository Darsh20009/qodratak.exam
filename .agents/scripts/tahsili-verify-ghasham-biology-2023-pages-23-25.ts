import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103063cd9c24f9f40cb7", page: 23, number: 26, text: "ما الصفة التي تميز البراميسيوم؟", options: ["بلاستيدات خضراء", "نواتان", "أسواط", "جدار خلوي"], answer: 1, explanation: "يمتلك البراميسيوم نواة كبيرة وأخرى صغيرة، ولا يحتوي على بلاستيدات خضراء أو جدار خلوي." },
  { id: "6ad0103063cd9c24f9f40cb8", page: 23, number: 27, text: "انتشار مرض النوم الأفريقي يدل على وجود أي حشرة ناقلة؟", options: ["البعوض", "ذبابة الرمل", "ذبابة تسي تسي", "الذباب المنزلي"], answer: 2, explanation: "تنقل ذبابة تسي تسي طفيلي التريبانوسوما المسبب لمرض النوم الأفريقي." },
  { id: "6ad0103063cd9c24f9f40cba", page: 23, number: 29, text: "أي المخلوقات الآتية يستخدم الأهداب للحركة في الماء؟", options: ["الأميبا", "البلازموديوم", "البراميسيوم", "التريبانوسوما"], answer: 2, explanation: "يتحرك البراميسيوم باستخدام الأهداب التي تغطي سطحه." },
  { id: "6ad0103063cd9c24f9f40cbb", page: 23, number: 30, text: "ما الذي يساعد الدياتومات على الطفو قرب سطح الماء؟", options: ["كبر حجم خلاياها", "امتلاكها مثانة هوائية", "تخزينها الغذاء على هيئة زيوت", "تكوين جدار خلوي من السيليكا"], answer: 2, explanation: "يساعد تخزين الزيوت على خفض كثافة الدياتومات، فيسهم في بقائها قرب سطح الماء حيث يتوفر الضوء." },
  { id: "6ad0103063cd9c24f9f40cbc", page: 23, number: 31, text: "من أي الطلائعيات يمكن الحصول على السيليكا المستخدمة في بعض مواد تلميع الأسنان؟", options: ["السوطيات الدوارة", "الطحالب البنية", "اليوجلينات", "الدياتومات"], answer: 3, explanation: "تتكون أصداف الدياتومات من السيليكا، وتدخل بقاياها في التراب الدياتومي وبعض المواد الكاشطة." },
  { id: "6ad0103063cd9c24f9f40cbd", page: 23, number: 32, text: "أي الطلائعيات الآتية تجمع صفات نباتية وحيوانية؟", options: ["البراميسيوم", "الأميبا", "اليوجلينا", "الطحالب الخضراء"], answer: 2, explanation: "تقوم اليوجلينا بالبناء الضوئي، كما تتحرك ويمكنها الحصول على الغذاء بطرائق غير ذاتية عند غياب الضوء." },
  { id: "6ad0103063cd9c24f9f40cbe", page: 23, number: 33, text: "ما الإجراء المباشر للحد من انتقال الملاريا؟", options: ["مكافحة البعوض الناقل", "لبس الكمام", "تجنب شرب المياه الملوثة", "قطع الأشجار"], answer: 0, explanation: "تنتقل الملاريا عبر أنثى بعوض الأنوفيلس؛ لذا تساعد مكافحة الناقل على تقليل انتقال المرض." },
  { id: "6ad0103063cd9c24f9f40cc0", page: 23, number: 35, text: "أي تركيب يوجد في اليوجلينا ويساعدها على حماية جسمها؟", options: ["جدار خلوي", "نواة بدائية", "فجوة غذائية", "قشيرة مرنة"], answer: 3, explanation: "تحيط باليوجلينا قشيرة مرنة تدعم شكلها وتحميها، ولا تمتلك جدارًا خلويًا صلبًا." },
  { id: "6ad0103063cd9c24f9f40cc1", page: 23, number: 36, text: "بأي تركيب تتحرك الأميبا؟", options: ["الأهداب", "الأسواط", "الأقدام الكاذبة", "الأرجل"], answer: 2, explanation: "تتحرك الأميبا بامتدادات مؤقتة من السيتوبلازم تسمى الأقدام الكاذبة." },
  { id: "6ad0103063cd9c24f9f40cc2", page: 24, number: 39, text: "أي المجموعات الآتية أنسب لتكوين أحافير دقيقة؟", options: ["البوغيات", "السوطيات", "المثقبات", "الهدبيات"], answer: 2, explanation: "تمتلك كثير من المثقبات أصدافًا تحفظ في الرواسب وتُستخدم أحافيرها في دراسة البيئات الجيولوجية." },
  { id: "6ad0103063cd9c24f9f40cc3", page: 24, number: 40, text: "ما التركيب الذي يساعد البراميسيوم على طرد الماء الزائد والمحافظة على الاتزان الداخلي؟", options: ["الأكياس الخيطية", "أجسام جولجي", "الفجوات المنقبضة", "الجسم المركزي"], answer: 2, explanation: "تطرد الفجوات المنقبضة الماء الزائد من البراميسيوم، خصوصًا في البيئات العذبة." },
  { id: "6ad0103063cd9c24f9f40cc4", page: 24, number: 41, text: "لماذا تختلف ألوان الطحالب؟", options: ["احتواء خلاياها على صبغة جرام", "احتواؤها على أصباغ مختلفة تمتص الضوء", "لأن ألوانها لا تتغير أبدًا", "احتواؤها على صبغات جرام"], answer: 1, explanation: "تختلف الأصباغ التي تمتلكها الطحالب؛ فتمتص أطوالًا موجية مختلفة وتعكس ألوانًا متباينة." },
  { id: "6ad0103063cd9c24f9f40cc5", page: 24, number: 42, text: "كيف تتكاثر الدياتومات؟", options: ["لاجنسيًا فقط", "جنسيًا فقط", "لا تتكاثر", "جنسيًا ولاجنسيًا"], answer: 3, explanation: "تتكاثر الدياتومات لاجنسيًا بالانقسام، كما يحدث التكاثر الجنسي في ظروف أو مراحل معينة من دورة حياتها." },
  { id: "6ad0103063cd9c24f9f40cc6", page: 24, number: 43, text: "في بيئة حارة ورطبة تنتشر فيها بعوضة الأنوفيلس، أي مرض يُتوقع زيادة خطر انتقاله؟", options: ["الحصبة", "الملاريا", "مرض النوم", "السكري"], answer: 1, explanation: "الأنوفيلس ناقل لطفيلي الملاريا؛ وتزيد ملاءمة الظروف للبعوض من خطر انتقاله حيث يوجد الطفيلي." },
  { id: "6ad0103063cd9c24f9f40cc7", page: 24, number: 44, text: "أي الطلائعيات الآتية تُستخدم في المكافحة الحيوية لبعض الحشرات؟", options: ["الميكروسبوريديا", "المثقبات", "جذريات القدم", "الأميبا"], answer: 0, explanation: "تُستخدم أنواع من الميكروسبوريديا طفيلياتٍ دقيقة لمكافحة بعض الحشرات." },
  { id: "6ad0103063cd9c24f9f40cc8", page: 24, number: 45, text: "مخلوق له جدار خلوي ويتغذى بتحليل المواد العضوية؛ إلى أي مجموعة من الطلائعيات الشبيهة ينتمي؟", options: ["الفطريات", "النباتات", "الحيوانات", "الإسفنجيات"], answer: 0, explanation: "تضم الطلائعيات الشبيهة بالفطريات كائنات محللة تمتص المواد العضوية بعد تفكيكها." },
  { id: "6ad0103063cd9c24f9f40cc9", page: 24, number: 46, text: "ما فائدة تخزين الدياتومات للغذاء على هيئة زيوت؟", options: ["الحصول على الرطوبة", "المساعدة على الطفو والبقاء قرب الضوء", "الغوص إلى قاع الماء", "إنتاج الأملاح"], answer: 1, explanation: "تقلل الزيوت كثافة الخلية فتساعدها على الطفو قرب سطح الماء، حيث يصل الضوء اللازم للبناء الضوئي." },
  { id: "6ad0103063cd9c24f9f40cca", page: 24, number: 47, text: "مخلوق طلائعي وحيد الخلية يشبه النعل وتغطي جسمه أهداب؛ أي تركيب يمثله؟", options: ["البراميسيوم", "اليوجلينا", "الأميبا", "الأشنات"], answer: 0, explanation: "البراميسيوم طلائعي مغطى بالأهداب، ويشبه شكله النعل. استُبدلت الصورة بوصف نصي حتى لا يعتمد السؤال على صورة غير مرفقة." },
  { id: "6ad0103063cd9c24f9f40ccb", page: 24, number: 48, text: "إلى أي مملكة تنتمي الأميبا؟", options: ["الفطريات", "الطلائعيات", "البكتيريا البدائية", "البكتيريا الحقيقية"], answer: 1, explanation: "الأميبا كائن وحيد الخلية حقيقي النواة ينتمي إلى مملكة الطلائعيات." },
  { id: "6ad0103063cd9c24f9f40ccc", page: 24, number: 49, text: "يُعد طفيل الجيارديا لامبليا:", options: ["بدائي النواة", "طلائعيًا", "فطرًا", "طحلبًا"], answer: 1, explanation: "الجيارديا طلائعي طفيلي وحيد الخلية يسبب داء الجيارديات." },
  { id: "6ad0103063cd9c24f9f40ccd", page: 24, number: 50, text: "أي المخلوقات الآتية تمتلك بلاستيدة حلزونية؟", options: ["الإسبيروجيرا", "الخميرة", "الفولفوكس", "البراميسيوم"], answer: 0, explanation: "تتميز الإسبيروجيرا ببلاستيدات خضراء شريطية حلزونية داخل خلاياها." },
  { id: "6ad0103063cd9c24f9f40cce", page: 25, number: 51, text: "أي الطرق الآتية ليست طريقة تغذية للفطريات؟", options: ["البناء الضوئي", "الترمم", "التطفل", "التكافل"], answer: 0, explanation: "الفطريات غير ذاتية التغذية؛ تمتص المواد العضوية وقد تعيش مترممة أو متطفلة أو متكافلة، ولا تقوم بالبناء الضوئي." },
  { id: "6ad0103063cd9c24f9f40ccf", page: 25, number: 52, text: "ما عديد التسكر الذي يدخل في بناء الجدار الخلوي للفطريات؟", options: ["الكيتين", "السليلوز", "الجوانين", "السكروز"], answer: 0, explanation: "يتكون جدار الفطريات أساسًا من الكيتين؛ أما السليلوز فيميز جدران النباتات." },
  { id: "6ad0103063cd9c24f9f40cd0", page: 25, number: 53, text: "اختفاء الأشنات من منطقة ما قد يدل على:", options: ["زيادة الرطوبة", "تلوث الماء", "تلوث الهواء", "زيادة آكلات الأعشاب"], answer: 2, explanation: "الأشنات حساسة لملوثات الهواء؛ لذا قد يشير اختفاؤها إلى تلوث الهواء." },
  { id: "6ad0103063cd9c24f9f40cd1", page: 25, number: 54, text: "ما فائدة الفطريات الجذرية التي تعيش على جذور نبات البطاطس؟", options: ["زيادة امتصاص الماء", "امتصاص الضوء", "تقليل حجم الدرنة", "حماية الجذور"], answer: 0, explanation: "تزيد الفطريات الجذرية مساحة الامتصاص الفعالة حول الجذور، فتساعد النبات على امتصاص الماء والأملاح. عُدلت الصياغة من «درنات البطاطس» إلى «جذور نبات البطاطس» لتطابق هذا التكافل." },
  { id: "6ad0103063cd9c24f9f40cd2", page: 25, number: 55, text: "أي نوع من التكاثر تستخدمه فطريات الخميرة غالبًا؟", options: ["الاندماج", "التجزؤ", "التبرعم", "التجدد"], answer: 2, explanation: "تتكاثر الخميرة لاجنسيًا غالبًا بالتبرعم، حيث ينمو برعم من الخلية الأم ثم ينفصل." },
  { id: "6ad0103063cd9c24f9f40cd3", page: 25, number: 56, text: "أي عبارة صحيحة عن الكيتين؟", options: ["يدخل في جدار الخلية الفطرية", "يدخل في جدار الخلية النباتية", "يدخل في جدار الخلية الحيوانية", "يدخل في جدار جميع ما سبق"], answer: 0, explanation: "الكيتين مكوّن رئيس لجدار الفطريات، كما يوجد في الهيكل الخارجي لمفصليات الأرجل، وليس جدارًا للنباتات أو الحيوانات." },
  { id: "6ad0103063cd9c24f9f40cd4", page: 25, number: 57, text: "ما الذي يساعد الخيوط الفطرية غير المقسمة على نقل المواد بسرعة؟", options: ["زيادة مساحة الامتصاص", "انتقال المغذيات بسرعة عبر السيتوبلازم المتصل", "زيادة عدد المقاطع", "كثرة الخيوط الفطرية"], answer: 1, explanation: "تفتقر الخيوط غير المقسمة إلى الحواجز العرضية؛ فيكون السيتوبلازم متصلًا ويسمح بانتقال المواد بسرعة على امتداد الخيط." },
  { id: "6ad0103063cd9c24f9f40cd6", page: 25, number: 59, text: "أي تركيب فطري يزيد مساحة امتصاص الغذاء من الوسط؟", options: ["مرونة الجدار الخلوي", "الغزل الفطري", "الخيط الفطري غير المقسم", "وجود أنوية قليلة في السيتوبلازم"], answer: 1, explanation: "يتكون الغزل الفطري من شبكة خيوط واسعة تزيد مساحة تماس الفطر مع الوسط، فتساعده على امتصاص الغذاء. صُحح مفتاح المسودة من الخيط غير المقسم إلى الغزل الفطري." },
  { id: "6ad0103063cd9c24f9f40cd7", page: 25, number: 61, text: "أي المخلوقات الآتية ينتمي إلى اللحميات؟", options: ["البلازموديوم", "الأميبا", "التريبانوسوما", "البراميسيوم"], answer: 1, explanation: "تتحرك الأميبا بالأقدام الكاذبة، وتُصنف ضمن اللحميات في التصنيف التقليدي للطلائعيات." },
] as const;

const rejections = [
  { id: "6ad0103063cd9c24f9f40cb9", page: 23, number: 28, note: "حُجب السؤال: مفتاح المصدر يختار السباحة بالأهداب، وهي ليست وسيلة طفو الدياتومات؛ كما يكرر مفهوم سؤال آخر يربط طفوها بتخزين الزيوت." },
  { id: "6ad0103063cd9c24f9f40cd5", page: 25, number: 58, note: "حُجب السؤال: الخيارات لا تتضمن الفطريات الكيتريدية، وهي المجموعة المعروفة بإنتاج الأبواغ السوطية؛ ولا يصح اعتماد مفتاح يختار العفن المخاطي." },
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
        subject: "أحياء", subcategory: "الطلائعيات والفطريات", text: item.text, options: [...item.options], correctOptionIndex: item.answer,
        difficulty: draft.difficulty || "intermediate", topic: draft.topic || "الطلائعيات والفطريات", explanation: item.explanation,
        sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
        ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
        sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
      }, $setOnInsert: { createdAt: reviewedAt } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } },
      { $set: { status: "approved", subject: "أحياء", subcategory: "الطلائعيات والفطريات", text: item.text, options: [...item.options], explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة المحتوى والمفتاح مع المصدر وتصحيح المصطلحات العلمية والصياغة عند الحاجة.", updatedAt: reviewedAt } },
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
