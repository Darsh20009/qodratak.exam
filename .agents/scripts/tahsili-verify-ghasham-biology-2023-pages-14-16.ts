import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103063cd9c24f9f40c82", page: 14, number: 22, text: "أي بكتيريا تعيش طبيعيًا في أمعاء الإنسان؟", options: ["الأميبا", "الإشريكية القولونية", "بكتيريا السل", "السيانوبكتيريا"], answer: 1, explanation: "تعيش أنواع من الإشريكية القولونية طبيعيًا في أمعاء الإنسان، مع أن بعض سلالاتها قد تسبب المرض." },
  { id: "6ad0103063cd9c24f9f40c83", page: 14, number: 23, text: "ما نوع البكتيريا التي ينبغي المحافظة عليها لدعم سلامة الجسم؟", options: ["الفلورا الطبيعية", "الكوليرا", "اليرسينيا", "السالمونيلا"], answer: 0, explanation: "تضم الفلورا الطبيعية كائنات نافعة تسهم في وظائف الجسم، مثل حماية مواقع الجسم من بعض الممرضات." },
  { id: "6ad0103063cd9c24f9f40c84", page: 14, number: 24, text: "أي بكتيريا تعيش في عقد جذور النباتات البقولية وتثبت النيتروجين؟", options: ["بكتيريا تثبت ثاني أكسيد الكربون", "بكتيريا تثبت الأكسجين", "بكتيريا تثبت النيتروجين", "بكتيريا تثبت الكربون"], answer: 2, explanation: "تعيش بكتيريا تكافلية مثل الريزوبيا في عقد جذور البقوليات وتحوّل النيتروجين الجوي إلى مركبات يستفيد منها النبات." },
  { id: "6ad0103063cd9c24f9f40c85", page: 14, number: 25, text: "عند اختيار مضاد حيوي يستهدف بناء الجدار البكتيري، أي تركيب خلوي تدرسه؟", options: ["الرايبوسومات", "أجسام جولجي", "الجدار الخلوي", "العضيات"], answer: 2, explanation: "تستهدف بعض المضادات الحيوية بناء الجدار الخلوي البكتيري؛ لذلك تساعد معرفة تركيبه على فهم آلية الدواء وانتقائيته." },
  { id: "6ad0103063cd9c24f9f40c86", page: 14, number: 26, text: "كيف تنتقل بعض المادة الوراثية بين الخلايا في بدائيات النوى؟", options: ["المحفظة", "الشعيرات الجنسية (Pili)", "الغشاء البلازمي", "الكروموسومات"], answer: 1, explanation: "تساعد الشعيرات الجنسية (Pili) على اتصال خليتين بكتيريتين وانتقال DNA بينهما بالاقتران." },
  { id: "6ad0103063cd9c24f9f40c87", page: 14, number: 27, text: "أي مرض بكتيري يصيب الرئتين وقد يقلل كفاءة تبادل الغازات بين الهواء والدم؟", options: ["سرطان الرئة", "السل الرئوي", "الربو", "الإنفلونزا"], answer: 1, explanation: "السل الرئوي عدوى بكتيرية تصيب الرئتين، وقد تتلف أنسجتهما وتضعف تبادل الغازات." },
  { id: "6ad0103063cd9c24f9f40c88", page: 14, number: 28, text: "ما المادة التي تقتل المخلوقات الدقيقة أو تثبط نموها؟", options: ["المضاد الحيوي", "مولد الضد", "مضاد فيروسي", "مضاد بكتيري"], answer: 0, explanation: "المضاد الحيوي دواء يقتل بكتيريا أو يثبط نموها؛ ولا تعالج المضادات الحيوية العدوى الفيروسية." },
  { id: "6ad0103063cd9c24f9f40c89", page: 14, number: 29, text: "ما التركيب الذي يمكّن بعض الخلايا البكتيرية من البقاء مدة طويلة في الظروف الصعبة؟", options: ["البوغ الداخلي", "المخصب", "الفجوة المنقبضة", "التكيف"], answer: 0, explanation: "تكوّن بعض البكتيريا أبواغًا داخلية مقاومة تساعدها على البقاء خلال الظروف البيئية غير الملائمة." },
  { id: "6ad0103063cd9c24f9f40c8a", page: 14, number: 30, text: "أي الأمراض الآتية قد تسببه البكتيريا؟", options: ["الملاريا", "الجدري المائي", "تسوس الأسنان", "السرطان"], answer: 2, explanation: "تسوس الأسنان يرتبط بأحماض تنتجها بكتيريا الفم عند استهلاك السكريات؛ والملاريا يسببها طفيلي، والجدري المائي فيروس." },
  { id: "6ad0103063cd9c24f9f40c8b", page: 14, number: 31, text: "أي تركيب تستخدمه بعض البكتيريا لمقاومة الظروف البيئية القاسية؟", options: ["الهدبيات", "الأبواغ الداخلية", "الجدار الخلوي", "المحفظة"], answer: 1, explanation: "تساعد الأبواغ الداخلية بعض البكتيريا على البقاء في ظروف قاسية مثل الجفاف والحرارة والمواد الكيميائية." },
  { id: "6ad0103063cd9c24f9f40c8c", page: 14, number: 32, text: "ما المادة المميزة في جدار معظم البكتيريا؟", options: ["السليلوز", "الببتيدوجلايكان", "الكيتين", "الدهون"], answer: 1, explanation: "يتكون جدار معظم البكتيريا من الببتيدوجلايكان؛ بينما السليلوز شائع في جدران النباتات والكيتين في الفطريات." },
  { id: "6ad0103063cd9c24f9f40c8d", page: 14, number: 33, text: "تنتمي بكتيريا المكورات الرئوية (Streptococcus pneumoniae) شكليًا إلى أي مجموعة؟", options: ["المكورات (الخلايا الكروية)", "الحلزونية", "العصوية", "المستطيلة"], answer: 0, explanation: "تظهر المكورات الرئوية خلايا كروية غالبًا في أزواج؛ لذلك تصنف ضمن المكورات، لا العصويات أو الحلزونيات." },
  { id: "6ad0103063cd9c24f9f40c8e", page: 15, number: 1, text: "أي عامل ممرض غير خلوي يمكن أن يؤثر في الخلايا العصبية في الدماغ؟", options: ["فيروس القوباء", "البريون", "فيروس الإنفلونزا", "فيروس نقص المناعة البشرية"], answer: 1, explanation: "البريونات بروتينات معدية غير خلوية قد تسبب أمراضًا تنكسية تصيب الجهاز العصبي والدماغ." },
  { id: "6ad0103063cd9c24f9f40c8f", page: 15, number: 2, text: "أي مكوّن يُستخدم في اللقاح المعتمد على المستضد السطحي لفيروس التهاب الكبد B؟", options: ["بكتيريا غير فعالة", "أجزاء من الجدار الخلوي للبكتيريا", "سم غير فعال", "مستضدات أو أجزاء بروتينية من الفيروس"], answer: 3, explanation: "لقاح التهاب الكبد B المستخدم حاليًا لقاح مؤتلف يحتوي على المستضد السطحي الفيروسي، لا على بكتيريا أو سموم." },
  { id: "6ad0103063cd9c24f9f40c90", page: 15, number: 3, text: "أي تركيب يوجد في فيروس كورونا؟", options: ["سيتوبلازم", "حمض نووي", "ميتوكندريا", "بلاستيدات"], answer: 1, explanation: "يحمل فيروس كورونا مادة وراثية من RNA داخل غلافه؛ ولا يمتلك سيتوبلازمًا أو عضيات خلوية مثل الميتوكندريا والبلاستيدات." },
  { id: "6ad0103063cd9c24f9f40c92", page: 15, number: 5, text: "أي بروتين تنتجه خلايا الجسم استجابةً للفيروسات ويساعد على الحد من تكاثرها؟", options: ["الإنترفيرون", "الجوانين", "الثايمين", "السيتوسين"], answer: 0, explanation: "الإنترفيرونات بروتينات إشارية تنتجها الخلايا المصابة وتساعد الخلايا المجاورة على مقاومة التكاثر الفيروسي." },
  { id: "6ad0103063cd9c24f9f40c93", page: 15, number: 7, text: "يصنف فيروس نقص المناعة البشرية HIV ضمن الفيروسات:", options: ["الارتدادية", "الارتجاعية", "الانحلالية", "المباشرة"], answer: 1, explanation: "HIV فيروس ارتجاعي؛ يحول إنزيم النسخ العكسي مادته الوراثية RNA إلى DNA داخل الخلية المصابة." },
  { id: "6ad0103063cd9c24f9f40c95", page: 15, number: 9, text: "لقاح شلل الأطفال الفموي الحي يتكون من:", options: ["بكتيريا ضعيفة", "فيروس مضعّف", "سموم فطرية", "سموم بكتيرية"], answer: 1, explanation: "يحتوي لقاح شلل الأطفال الفموي الحي على سلالة فيروسية مضعفة. صيغ السؤال هنا لتحديد اللقاح الفموي الحي، إذ توجد أيضًا لقاحات أخرى معطلة." },
  { id: "6ad0103063cd9c24f9f40c96", page: 15, number: 10, text: "أي العبارات الآتية غير صحيحة عن الفيروسات؟", options: ["تحمل حمضًا نوويًا", "تعالج بالمضادات الحيوية", "تعيش متطفلة داخل الخلايا", "لها غلاف أو قفيصة تحمي مادتها الوراثية"], answer: 1, explanation: "المضادات الحيوية تستهدف تراكيب أو عمليات بكتيرية ولا تعالج الفيروسات؛ أما الفيروسات فتحمل DNA أو RNA وتتكاثر داخل خلايا العائل." },
  { id: "6ad0103063cd9c24f9f40c97", page: 15, number: 11, text: "أي مجموعة تستطيع أن تظهر صفات الحياة داخل العائل وتتصرف خارج الخلية كجسيم غير حي؟", options: ["الفيروسات", "الطلائعيات", "الفطريات", "البكتيريا"], answer: 0, explanation: "لا تتكاثر الفيروسات مستقلّة، لكنها تستغل خلية العائل للتضاعف؛ لذلك توصف بكونها بين الحي وغير الحي." },
  { id: "6ad0103063cd9c24f9f40c99", page: 15, number: 13, text: "أي خاصية أساسية تُستخدم في تصنيف الفيروسات؟", options: ["الحجم وحده", "تركيب الغلاف البروتيني وحده", "نوع الحمض النووي", "المرض الذي تسببه فقط"], answer: 2, explanation: "من أسس تصنيف الفيروسات نوع مادتها الوراثية (DNA أو RNA)، إلى جانب خصائص أخرى مثل الغلاف والبنية." },
  { id: "6ad0103063cd9c24f9f40c9a", page: 16, number: 14, text: "إذا كان العلاج مصممًا لمنع التصاق الفيروس بالخلية النباتية، فما أثره المتوقع؟", options: ["يمنع بدء العدوى", "يعمل سمادًا صناعيًا", "يغير الغلاف الفيروسي", "يعمل سياج حماية"], answer: 0, explanation: "يمنع تعطيل التصاق الفيروس بالخلية دخوله إليها، فيحد من بدء العدوى. أُزيل ادعاء «الأقل تكلفة» من صياغة المسودة لأنه لا توجد مقارنة أسعار في المصدر." },
  { id: "6ad0103063cd9c24f9f40c9b", page: 16, number: 15, text: "أي المخلوقات الآتية لا يسلك نمط التكاثر المستقل الذي تتميز به المخلوقات الحية الأخرى؟", options: ["الفيروسات", "البكتيريا", "النبات", "الحيوان"], answer: 0, explanation: "الفيروسات لا تتكاثر من تلقاء نفسها؛ إذ تحتاج إلى خلية عائل لتصنع نسخًا منها." },
  { id: "6ad0103063cd9c24f9f40c9c", page: 16, number: 16, text: "أي مما يأتي ليس من خصائص الفيروسات؟", options: ["النمو في بيئة صناعية خالية من خلايا العائل", "التكاثر داخل النبات", "التكاثر داخل الحيوان", "تتكون من مادة وراثية وغلاف بروتيني"], answer: 0, explanation: "لا تنمو الفيروسات ولا تتضاعف على وسط صناعي خالٍ من الخلايا؛ فهي تحتاج إلى خلايا عائل حية." },
  { id: "6ad0103063cd9c24f9f40c9d", page: 16, number: 17, text: "أي مما يأتي لا يتكاثر على وسط صناعي خالٍ من خلايا حية؟", options: ["البكتيريا", "الفيروسات", "النبات", "الفطريات"], answer: 1, explanation: "تحتاج الفيروسات إلى خلايا عائل حية للتضاعف؛ أما كثير من البكتيريا والفطريات فيمكن تنميتها على أوساط ملائمة." },
  { id: "6ad0103063cd9c24f9f40c9e", page: 16, number: 18, text: "ما المرض الذي يسببه فيروس نقص المناعة البشرية (HIV)، وهو فيروس ارتجاعي؟", options: ["الجدري", "الإيدز", "الإنفلونزا", "الرشح"], answer: 1, explanation: "يهاجم فيروس HIV خلايا مناعية، وقد يؤدي إلى متلازمة نقص المناعة المكتسبة (الإيدز)." },
  { id: "6ad0103063cd9c24f9f40c9f", page: 16, number: 19, text: "إذا أراد طالب دراسة العامل المسبب لمرض الجدري، فأي مجال علمي يساعده على إجراء تجاربه؟", options: ["الأمراض الفيروسية", "الأمراض البكتيرية", "الحشرات الناقلة للمرض", "الديدان الطفيلية"], answer: 0, explanation: "يسبب الجدري فيروس؛ لذلك يندرج البحث في العامل المسبب وطرق انتقاله ضمن دراسة الأمراض الفيروسية." },
] as const;

const rejections = [
  { id: "6ad0103063cd9c24f9f40c91", page: 15, number: 4, note: "حُجب السؤال: أكثر من فيروس في الخيارات قد يوصف بأنه كروي أو متعدد الأوجه؛ ولا يحدد النص سمة تشخيصية تميز فيروس الإنفلونزا." },
  { id: "6ad0103063cd9c24f9f40c94", page: 15, number: 8, note: "حُجب السؤال: يربط المصدر إرهاق مريض الإنفلونزا بانخفاض بناء ATP بسبب استهلاك الفيروس له مباشرة، وهو تفسير فسيولوجي غير موثق وغير دقيق." },
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
        subject: "أحياء", subcategory: "بدائيات النوى والفيروسات", text: item.text, options: [...item.options], correctOptionIndex: item.answer,
        difficulty: draft.difficulty || "intermediate", topic: draft.topic || "بدائيات النوى والفيروسات", explanation: item.explanation,
        sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
        ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
        sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
      }, $setOnInsert: { createdAt: reviewedAt } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } },
      { $set: { status: "approved", subject: "أحياء", subcategory: "بدائيات النوى والفيروسات", text: item.text, options: [...item.options], explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة المفتاح والشرح مع المصدر، وتصحيح الصياغة أو حجب ما لا يملك إجابة واحدة موثوقة.", updatedAt: reviewedAt } },
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
