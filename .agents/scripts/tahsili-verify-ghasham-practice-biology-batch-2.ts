import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-biology-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0188963cd9c24f9f445d4",
    page: 6,
    number: 43,
    text: "ما الهرمون الذي يُستخدم لتسريع نضج بعض الثمار بعد حصادها؟",
    options: ["السيتوكينينات", "الإيثيلين", "الجبريلينات", "الأكسينات"],
    answer: 1,
    explanation: "الإيثيلين هرمون نباتي غازي يحفّز نضج الثمار، ويمكن استخدامه للتحكم في توقيت نضجها.",
  },
  {
    id: "6ad0188963cd9c24f9f445d5",
    page: 6,
    number: 44,
    text: "ما الترتيب المعتاد لانتقال السيال العصبي داخل العصبون؟",
    options: ["جسم الخلية ← الزوائد الشجرية ← المحور", "جسم الخلية ← المحور ← الزوائد الشجرية", "المحور ← جسم الخلية ← الزوائد الشجرية", "الزوائد الشجرية ← جسم الخلية ← المحور"],
    answer: 3,
    explanation: "يستقبل العصبون الإشارة عبر الزوائد الشجرية، ثم تمر بجسم الخلية، ثم تنتقل على طول المحور.",
  },
  {
    id: "6ad0188963cd9c24f9f445d6",
    page: 6,
    number: 45,
    text: "أي الكائنات الآتية خلاياه لا تحتوي على جدار خلوي؟",
    options: ["نبات التمر", "المشروم", "الإسفنج", "الرمان"],
    answer: 2,
    explanation: "الإسفنج حيوان، وخلايا الحيوانات لا تمتلك جدارًا خلويًا. للنباتات والفطريات جدران خلوية.",
  },
  {
    id: "6ad0188963cd9c24f9f445d7",
    page: 6,
    number: 46,
    text: "ما السمة التي تميز الخلايا الجذعية عن الخلايا المتمايزة؟",
    options: ["تنقسم دائمًا بسرعة عالية", "تنقسم انقسامًا مباشرًا", "توجد في الأجنة فقط", "لم تتخصص بعد ويمكنها التمايز"],
    answer: 3,
    explanation: "الخلايا الجذعية غير متمايزة، ويمكنها الانقسام ثم التمايز إلى أنواع متخصصة ضمن شروط مناسبة.",
  },
  {
    id: "6ad0188963cd9c24f9f445d8",
    page: 6,
    number: 47,
    text: "يرقة أي طفيلي مائي عذب يمكن أن تخترق جلد الإنسان وتسبب المرض؟",
    options: ["الملاريا", "البلهارسيا", "اليرسينيا", "داء الشعرية"],
    answer: 1,
    explanation: "تخرج الأطوار المعدية للبلهارسيا إلى المياه العذبة ويمكنها اختراق جلد الإنسان.",
  },
  {
    id: "6ad0188963cd9c24f9f445d9",
    page: 6,
    number: 48,
    text: "ما طريق العدوى الشائع بدودة الشعرينة (Trichinella)؟",
    options: ["تناول لحم مصاب غير مطهو جيدًا", "تناول خضروات ملوثة فقط", "المشي حافيًا على تربة ملوثة", "لدغة بعوضة"],
    answer: 0,
    explanation: "تنتقل دودة الشعرينة غالبًا بتناول لحم مصاب نيئ أو غير مطهو جيدًا، ولا سيما لحم الخنزير أو لحوم الصيد.",
  },
  {
    id: "6ad0188963cd9c24f9f445da",
    page: 6,
    number: 50,
    text: "ما الإجراء المباشر للحد من انتقال مرض النوم الإفريقي؟",
    options: ["غسل الخضروات", "تجنب المشي حافيًا", "مكافحة البعوض", "مكافحة ذبابة تسي تسي"],
    answer: 3,
    explanation: "ينتقل مرض النوم الإفريقي بواسطة ذبابة تسي تسي؛ لذا تستهدف الوقاية مكافحة هذا الناقل.",
  },
  {
    id: "6ad0188963cd9c24f9f445dc",
    page: 6,
    number: 52,
    text: "بالمقارنة العامة مع الخلايا الطبيعية، ما التغير الشائع في دورة الخلية السرطانية سريعة الانقسام؟",
    options: ["يبقى شكلها منتظمًا", "تنقسم بانتظام", "تقضي وقتًا أقل في الطور البيني", "تقضي وقتًا أطول في الطور البيني"],
    answer: 2,
    explanation: "في النموذج الدراسي، يؤدي تسارع انقسام الخلية السرطانية إلى تقصير زمن دورة الخلية، ومن ذلك قضاء وقت أقل في الطور البيني مقارنةً بالخلية الطبيعية.",
  },
  {
    id: "6ad0188963cd9c24f9f445dd",
    page: 6,
    number: 53,
    text: "أي إنزيم من الآتي يهضم البروتينات؟",
    options: ["البيبسين", "الأميليز", "الليباز", "الهرمونات"],
    answer: 0,
    explanation: "البيبسين إنزيم معدي يكسر البروتينات إلى سلاسل ببتيدية أقصر.",
  },
  {
    id: "6ad0188963cd9c24f9f445de",
    page: 6,
    number: 54,
    text: "أي الديدان الحلقية تمتص الدم وتفرز مادة مضادة للتخثر تساعد على استمرار تدفقه؟",
    options: ["الإسكارس", "العلق الطبي", "البلاناريا", "الدودة الشوكية"],
    answer: 1,
    explanation: "العلق الطبي من الديدان الحلقية، ويفرز في لعابه موادًا مضادة للتخثر تساعد على بقاء الدم متدفقًا أثناء تغذيه.",
  },
  {
    id: "6ad0188963cd9c24f9f445df",
    page: 6,
    number: 55,
    text: "ما تصنيف الحيوان الذي يتغذى على جثث الحيوانات؟",
    options: ["آكل لحوم", "كانس", "قارت", "آكل أعشاب"],
    answer: 1,
    explanation: "الحيوان الكانس يتغذى على بقايا الحيوانات الميتة.",
  },
  {
    id: "6ad0188963cd9c24f9f445e0",
    page: 6,
    number: 56,
    text: "في خطوات المنهج العلمي، ما الخطوة التي تأتي عادةً بعد صياغة الفرضية؟",
    options: ["الملاحظة الأولية", "اختبار الفرضية بالتجربة", "الاستنتاج قبل جمع البيانات", "صياغة نظرية مباشرة"],
    answer: 1,
    explanation: "تُختبر الفرضية بتجربة أو بجمع أدلة مناسبة، ثم تُحلل النتائج ويُستخلص الاستنتاج.",
  },
  {
    id: "6ad0188963cd9c24f9f445e1",
    page: 7,
    number: 64,
    text: "تستطيع بعض أنواع نجم البحر تعويض الأجزاء المفقودة بعملية:",
    options: ["التجدد", "التحلل", "الموت", "لا يحدث شيء"],
    answer: 0,
    explanation: "التجدد هو إعادة نمو أجزاء مفقودة. وتختلف قدرة التجدد بين أنواع نجم البحر، ولا يعني ذلك أن كل جزء منفصل ينمو دائمًا إلى فرد كامل.",
  },
  {
    id: "6ad0188963cd9c24f9f445e2",
    page: 7,
    number: 65,
    text: "التعرّف على صوت قرد بعيد والاستجابة له يندرج ضمن أي نوع من السلوك في التصنيف الوارد في المصدر؟",
    options: ["المغازلة", "الافتراس", "تحديد منطقة النفوذ", "الإدراكي"],
    answer: 3,
    explanation: "يعتمد السلوك الإدراكي على استقبال المعلومة الحسية ومعالجتها؛ والتعرف على الصوت البعيد مثال على ذلك في تصنيف المصدر.",
  },
  {
    id: "6ad0188963cd9c24f9f445e3",
    page: 7,
    number: 66,
    text: "ما التكيف الذي يساعد بعض الدياتومات على الطفو قرب سطح الماء؟",
    options: ["جدار رقيق فقط", "السباحة بالأهداب", "تخزين مواد احتياطية على هيئة زيوت", "مثانات هوائية"],
    answer: 2,
    explanation: "يساعد تخزين مواد احتياطية دهنية أقل كثافة على تقليل كثافة الخلية وتحسين طفو بعض الدياتومات.",
  },
  {
    id: "6ad0188963cd9c24f9f445e4",
    page: 7,
    number: 67,
    text: "ما النمط الكروموسومي المعتاد لمتلازمة كلاينفلتر لدى الذكر؟",
    options: ["XO", "XXY", "XXX", "OY"],
    answer: 1,
    explanation: "النمط الأكثر شيوعًا لمتلازمة كلاينفلتر هو 47,XXY؛ أي وجود كروموسوم X إضافي.",
  },
  {
    id: "6ad0188963cd9c24f9f445e5",
    page: 7,
    number: 68,
    text: "أي الطلائعيات الآتية تُستخدم رواسبها الغنية بالسيليكا في تلميع الأسطح؟",
    options: ["اليوجلينا", "الطحالب البنية", "الدياتومات", "الطحالب الذهبية"],
    answer: 2,
    explanation: "تتكون أصداف الدياتومات من السيليكا، ويمكن أن تُستخدم رواسبها الدقيقة (تراب الدياتومات) في التلميع والترشيح.",
  },
  {
    id: "6ad0188963cd9c24f9f445e6",
    page: 7,
    number: 69,
    text: "أي الحيوانات الآتية لا يمتلك أنسجة حقيقية؟",
    options: ["العصفور", "الإسفنج", "نجم البحر", "دودة الأرض"],
    answer: 1,
    explanation: "الإسفنجيات تفتقر إلى الأنسجة والأعضاء الحقيقية، بخلاف بقية الحيوانات المذكورة.",
  },
  {
    id: "6ad0188963cd9c24f9f445e7",
    page: 7,
    number: 70,
    text: "ما الصفة المشتركة بين الديدان الأسطوانية والديدان المفلطحة؟",
    options: ["التناظر الجانبي", "التناظر الشعاعي", "الجسم المفلطح", "الإخراج بالخلايا اللهبية"],
    answer: 0,
    explanation: "لكلتا المجموعتين تناظر جانبي. أما الجسم المفلطح والخلايا اللهبية فليسا صفتين مشتركتين بينهما.",
  },
  {
    id: "6ad0188963cd9c24f9f445e8",
    page: 8,
    number: 71,
    text: "يعرض ذكر الطاووس ريشه أمام الأنثى. ما نوع هذا السلوك؟",
    options: ["الإيثار", "المنافسة", "المغازلة", "التواصل"],
    answer: 2,
    explanation: "عرض الريش أمام الأنثى سلوك مغازلة مرتبط بالتزاوج.",
  },
  {
    id: "6ad0188963cd9c24f9f445e9",
    page: 8,
    number: 72,
    text: "أي العمليات الآتية تسهم في التنوع الوراثي للأمشاج؟",
    options: ["الانقسام المتساوي", "التبرعم", "إنتاج الأبواغ وحده", "الانقسام المنصف"],
    answer: 3,
    explanation: "يسهم الانقسام المنصف في التنوع الوراثي من خلال التوزيع المستقل للكروموسومات والعبور.",
  },
  {
    id: "6ad0188963cd9c24f9f445ea",
    page: 8,
    number: 73,
    text: "أين يبدأ الهضم الكيميائي للبروتينات؟",
    options: ["الفم", "المعدة", "الأمعاء الدقيقة", "المريء"],
    answer: 1,
    explanation: "يبدأ الهضم الكيميائي للبروتينات في المعدة بفعل حمض المعدة وإنزيم البيبسين.",
  },
  {
    id: "6ad0188963cd9c24f9f445eb",
    page: 8,
    number: 74,
    text: "إذا انخفضت أعداد الغزلان في منطقة عشبية، فما الأثر المباشر المتوقع على الأعشاب نتيجة انخفاض الرعي؟",
    options: ["تزداد الأعشاب", "تموت الذئاب فورًا", "تقل الأعشاب", "تزداد أعداد الذئاب والأعشاب معًا"],
    answer: 0,
    explanation: "انخفاض أعداد الغزلان يقلل استهلاك الأعشاب بالرعي، فيُتوقع أن تزداد الأعشاب، مع ثبات العوامل الأخرى.",
  },
  {
    id: "6ad0188963cd9c24f9f445ec",
    page: 8,
    number: 75,
    text: "أي جهاز ينقل الدم إلى أنحاء الجسم؟",
    options: ["الجهاز الهيكلي", "الجهاز العصبي", "الجهاز الدوري", "الجهاز الإخراجي"],
    answer: 2,
    explanation: "يضخ القلب الدم عبر الأوعية الدموية ضمن الجهاز الدوري.",
  },
  {
    id: "6ad0188963cd9c24f9f445ed",
    page: 8,
    number: 76,
    text: "أي الحيوانات الآتية لا يمتلك جهازًا عصبيًا؟",
    options: ["الإسفنج", "الحمار", "الأسد", "البقرة"],
    answer: 0,
    explanation: "الإسفنجيات لا تمتلك جهازًا عصبيًا حقيقيًا، بخلاف الحيوانات الفقارية المذكورة.",
  },
  {
    id: "6ad0188963cd9c24f9f445ee",
    page: 8,
    number: 77,
    text: "مفصل المرفق الموضح في الشكل من أي نوع؟",
    options: ["رَزّي (مفصلي)", "درزي", "مداري", "منزلق"],
    answer: 0,
    explanation: "مفصل المرفق مفصل رَزّي يسمح أساسًا بالثني والبسط في مستوى واحد.",
  },
  {
    id: "6ad0188963cd9c24f9f445ef",
    page: 8,
    number: 78,
    text: "أي الخيارات الآتية ليس تكيفًا يساعد النباتات الصحراوية على تقليل فقد الماء؟",
    options: ["وجود الثغور في تجاويف", "التفاف الأوراق", "زيادة مساحة سطح الورقة", "قلة عدد الثغور"],
    answer: 2,
    explanation: "زيادة مساحة الورقة تزيد عادةً مساحة التبخر، بينما تساعد الثغور الغائرة والتفاف الأوراق وقلة الثغور على تقليل فقد الماء.",
  },
  {
    id: "6ad0188963cd9c24f9f445f0",
    page: 8,
    number: 79,
    text: "كيف يحصل الإسفنج على غذائه؟",
    options: ["بالترشيح", "بالبناء الذاتي", "بالتغذية الترممية", "بالتكافل فقط"],
    answer: 0,
    explanation: "الإسفنج حيوان مرشِّح؛ يسحب الماء عبر المسام ويلتقط منه الجسيمات الغذائية.",
  },
  {
    id: "6ad0188963cd9c24f9f445f1",
    page: 8,
    number: 80,
    text: "أي الحركات الآتية تنتج عن عمل العضلات الهيكلية؟",
    options: ["انقباض القلب", "الحركة الدودية للأمعاء", "ثني الذراع", "انبساط المثانة"],
    answer: 2,
    explanation: "العضلات الهيكلية إرادية، مثل العضلات التي تثني الذراع. عضلة القلب ملساء/قلبية، وحركة الأمعاء والمثانة تعتمد أساسًا على العضلات الملساء.",
  },
  {
    id: "6ad0188963cd9c24f9f445f2",
    page: 8,
    number: 81,
    text: "ما اسم تبادل أجزاء بين الكروموسومات المتماثلة في الطور التمهيدي الأول من الانقسام المنصف؟",
    options: ["العبور", "التطور", "الاستنساخ", "التلاصق"],
    answer: 0,
    explanation: "العبور هو تبادل مقاطع بين كروماتيدات غير شقيقة من كروموسومات متماثلة خلال الطور التمهيدي الأول.",
  },
  {
    id: "6ad0188963cd9c24f9f445f3",
    page: 8,
    number: 82,
    text: "في نظام فصائل ABO، أي فصيلة لا تحمل مستضدي A أو B على كريات الدم الحمراء؟",
    options: ["A", "B", "AB", "O"],
    answer: 3,
    explanation: "في نظام ABO لا تحمل كريات الدم الحمراء من فصيلة O مستضد A أو B. توافق نقل الدم الكامل يتطلب أيضًا مراعاة عامل Rh واختبار التوافق.",
  },
  {
    id: "6ad0188963cd9c24f9f445f4",
    page: 8,
    number: 83,
    text: "ما نوع العلاقة بين بكتيريا العقد الجذرية التي تثبت النيتروجين والنبات البقولي؟",
    options: ["تعايش", "تبادل منفعة", "ترمم", "افتراس"],
    answer: 1,
    explanation: "تثبت البكتيريا النيتروجين للنبات، ويحصل بعضها على مركبات كربونية وموئل؛ لذلك تُعد العلاقة تبادل منفعة.",
  },
  {
    id: "6ad0188963cd9c24f9f445f5",
    page: 8,
    number: 84,
    text: "في أي مستوى تصنيفي يشترك الضفدع والتمساح معًا؟",
    options: ["الطائفة", "الشعبة", "الجنس", "النوع"],
    answer: 1,
    explanation: "ينتمي الضفدع والتمساح إلى شعبة الحبليات، لكنهما يختلفان في الطائفة؛ فالضفدع من البرمائيات والتمساح من الزواحف.",
  },
] as const;

const rejections = [
  {
    id: "6ad0188963cd9c24f9f445db",
    page: 6,
    number: 51,
    note: "مرفوض: مفتاح المصدر يربط خلل الخط الجانبي بفقد الاتزان، لكن الخط الجانبي يستشعر حركة الماء والاهتزازات، بينما الاتزان يعتمد أساسًا على الجهاز الدهليزي؛ لا يصح إبقاء هذا المفتاح كما هو.",
  },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this review is authorized for Replit preview only.`);
  }
  const reviewed = [...approvals, ...rejections];
  const ids = reviewed.map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({
    _id: { $in: ids },
    sourceId: SOURCE_ID,
    status: "pending_review",
  })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} pending source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) failures.push(`q${item.number}: source/page mismatch`);
    if (item.options.length !== 4 || new Set(item.options.map((value) => value.trim())).size !== 4 ||
      item.options.some((value) => !value.trim()) || item.answer < 0 || item.answer > 3) {
      failures.push(`q${item.number}: invalid cleaned options or answer index`);
    }
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page) failures.push(`q${item.number}: rejection source/page mismatch`);
  }
  const sourceKeys = drafts.map((draft) => draft.sourceKey);
  const existing = sourceKeys.length
    ? await TahsiliQuestion.find({ sourceKey: { $in: sourceKeys } }).select("sourceKey").lean()
    : [];
  if (existing.length) failures.push(`found ${existing.length} already-published matching questions`);
  if (failures.length) {
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", reviewed: drafts.length, failures }, null, 2));
    throw new Error("Preflight failed; no records were changed.");
  }
  const summary = {
    mode: apply ? "apply" : "dry-run",
    database: TahsiliQuestionDraft.db.name,
    sourceId: SOURCE_ID,
    reviewed: drafts.length,
    approved: approvals.length,
    rejected: rejections.length,
    changed: false,
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const namespacedQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate(
      { sourceKey: draft.sourceKey },
      {
        $set: {
          questionId: draft.questionId,
          sourceId: draft.sourceId,
          sourceKey: draft.sourceKey,
          sourceOrdinal: draft.sourceOrdinal,
          subject: draft.subject,
          subcategory: draft.subcategory || "أحياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "أحياء",
          explanation: item.explanation,
          sourcePage: draft.sourcePage,
          sourceQuestionNumber: namespacedQuestionNumber,
          printedQuestionNumber: item.number,
          sourceBlockIndex: draft.sourceBlockIndex,
          sourceBook: draft.sourceBook,
          answerConfidence: "verified",
          reviewedBy: REVIEWER,
          reviewedAt,
          updatedAt: reviewedAt,
        },
        $setOnInsert: { createdAt: reviewedAt },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      {
        $set: {
          status: "approved",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          explanation: item.explanation,
          reviewedBy: REVIEWER,
          reviewedAt,
          reviewerNotes: "تمت مراجعة السؤال والخيارات والحل بمقابلتها مع المصدر، وأضيف شرح توضيحي.",
          updatedAt: reviewedAt,
        },
      },
    );
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt } },
    );
  }
  summary.changed = true;
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Review batch failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromMongoDB();
  });
