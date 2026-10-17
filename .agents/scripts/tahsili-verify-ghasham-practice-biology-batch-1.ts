import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-biology-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0188963cd9c24f9f445af",
    page: 3,
    number: 1,
    text: "أي مرض تنقله ذبابة تسي تسي؟",
    options: ["مرض النوم الإفريقي", "الفيلاريا", "الملاريا", "البلهارسيا"],
    answer: 0,
    explanation: "تنقل ذبابة تسي تسي طفيليات المثقبيات المسببة لمرض النوم الإفريقي.",
  },
  {
    id: "6ad0188963cd9c24f9f445b0",
    page: 3,
    number: 2,
    text: "تزاوج نبات أحمر الأزهار نقي (RR) مع نبات أبيض الأزهار نقي (rr). إذا كان R سائدًا، فما النمط الظاهري للجيل الأول؟",
    options: ["4 حمراء و1 بيضاء", "2 حمراء و2 بيضاء", "1 حمراء و3 بيضاء", "4 حمراء و0 بيضاء"],
    answer: 3,
    explanation: "كل نسل التزاوج RR×rr يكون Rr. وبما أن R سائد، تكون جميع نباتات الجيل الأول حمراء الأزهار.",
  },
  {
    id: "6ad0188963cd9c24f9f445b1",
    page: 3,
    number: 3,
    text: "ما المادة الرئيسة المشتركة بين الهيكل الخارجي للروبيان والجدار الخلوي للفطريات؟",
    options: ["السليكا", "السليلوز", "الكيتين", "الببتيدوجلايكان"],
    answer: 2,
    explanation: "يتكون الهيكل الخارجي للروبيان أساسًا من الكيتين، كما يدخل الكيتين في جدار الخلايا الفطرية.",
  },
  {
    id: "6ad0188963cd9c24f9f445b2",
    page: 3,
    number: 4,
    text: "وفق قاعدة تشارغاف، إذا شكّل السيتوسين 30% من قواعد DNA، فما نسبة الجوانين؟",
    options: ["10%", "20%", "30%", "40%"],
    answer: 2,
    explanation: "في DNA يرتبط السيتوسين بالجوانين بنسبة متساوية؛ لذلك تكون نسبة G مساوية لنسبة C، أي 30%.",
  },
  {
    id: "6ad0188963cd9c24f9f445b3",
    page: 3,
    number: 5,
    text: "أين توجد أكبر كمية من المياه العذبة على الأرض؟",
    options: ["المياه الجوفية", "الأنهار الجليدية والغطاء الجليدي", "الأنهار", "العيون"],
    answer: 1,
    explanation: "تخزن الأنهار الجليدية والصفائح الجليدية معظم المياه العذبة على الأرض؛ تليها المياه الجوفية.",
  },
  {
    id: "6ad0188963cd9c24f9f445b4",
    page: 3,
    number: 6,
    text: "يقارن مخطط فن بين السمندل والضفدع. ما الصفة المشتركة بينهما؟",
    options: ["الرقبة", "الذيل", "الجسم الطويل", "الأطراف"],
    answer: 3,
    explanation: "للسمندل والضفدع البالغ أربعة أطراف. الذيل والجسم الطويل ليسا صفتين مشتركتين في جميع الضفادع البالغة.",
  },
  {
    id: "6ad0188963cd9c24f9f445b5",
    page: 3,
    number: 7,
    text: "في عينة DNA، إذا كان الأدينين 21% من القواعد النيتروجينية، فما نسبة السيتوسين؟",
    options: ["51%", "71%", "29%", "31%"],
    answer: 2,
    explanation: "A=T=21%، فيتبقى 58% لـC وG. وبما أن C=G، فنسبة السيتوسين 58÷2=29%.",
  },
  {
    id: "6ad0188963cd9c24f9f445b6",
    page: 3,
    number: 8,
    text: "أي العضيات الآتية لا توجد في الخلايا الحيوانية؟",
    options: ["البلاستيدات", "الميتوكوندريا", "الشبكة الإندوبلازمية", "النواة"],
    answer: 0,
    explanation: "البلاستيدات، ومنها البلاستيدات الخضراء، توجد في الخلايا النباتية وبعض الطلائعيات ولا توجد في الخلايا الحيوانية.",
  },
  {
    id: "6ad0188963cd9c24f9f445b7",
    page: 3,
    number: 9,
    text: "ما المصطلح الذي يصف مجموعة مشاهدات مضبوطة تُجرى لاختبار فرضية؟",
    options: ["التجربة", "القانون", "الاستنتاج", "النظرية"],
    answer: 0,
    explanation: "التجربة إجراء منظم ومضبوط لاختبار فرضية وجمع الأدلة المتعلقة بها.",
  },
  {
    id: "6ad0188963cd9c24f9f445b9",
    page: 3,
    number: 11,
    text: "أي مما يأتي مثال على نمط يومي في سلوك الحيوان؟",
    options: ["النوم والاستيقاظ", "السبات الشتوي", "الهجرة", "التزاوج الموسمي"],
    answer: 0,
    explanation: "النمط اليومي يتكرر خلال دورة الليل والنهار؛ ومن أمثلته أوقات النوم والاستيقاظ.",
  },
  {
    id: "6ad0188963cd9c24f9f445ba",
    page: 3,
    number: 12,
    text: "تُظهر الصورة زهرة لها أسدية ومدقة وبتلات وسبلات. كيف تُصنّف؟",
    options: ["أحادية الجنس كاملة", "أحادية الجنس ناقصة", "ثنائية الجنس كاملة", "ثنائية الجنس ناقصة"],
    answer: 2,
    explanation: "الزهرة ثنائية الجنس لاحتوائها الأسدية والمدقة، وكاملة لوجود المحيطات الأربعة: السبلات والبتلات والأسدية والمدقة.",
  },
  {
    id: "6ad0188963cd9c24f9f445bb",
    page: 3,
    number: 13,
    text: "أي المواد الآتية عديد سكاريد؟",
    options: ["السليلوز", "الجلوكوز", "السكروز", "اللاكتوز"],
    answer: 0,
    explanation: "السليلوز عديد سكاريد يتكون من وحدات جلوكوز متكررة. الجلوكوز أحادي السكاريد والسكروز واللاكتوز ثنائيا سكاريد.",
  },
  {
    id: "6ad0188963cd9c24f9f445bc",
    page: 3,
    number: 14,
    text: "ما الوظيفة الأساسية للأحماض النووية؟",
    options: ["تخزين المعلومات الوراثية ونقلها", "تخزين الطاقة طويلة الأمد", "الحفاظ على حرارة الجسم", "تنظيم الإخراج"],
    answer: 0,
    explanation: "يخزن DNA المعلومات الوراثية وينقلها، ويسهم RNA في استخدامها والتعبير عنها.",
  },
  {
    id: "6ad0188963cd9c24f9f445bd",
    page: 4,
    number: 15,
    text: "أي السلوكيات الآتية مثال على استخدام الفيرمونات؟",
    options: ["عواء الذئب", "جمع النحل لرحيق الأزهار", "ترك الفهد بولًا لتحديد منطقته", "جميع الغذاء"],
    answer: 2,
    explanation: "يترك الفهد مواد كيميائية في البول تُستخدم إشارات لتحديد المنطقة والتواصل مع أفراد النوع.",
  },
  {
    id: "6ad0188963cd9c24f9f445be",
    page: 4,
    number: 16,
    text: "أي مستويات التنظيم الآتية أقل تعقيدًا؟",
    options: ["المجتمع الحيوي", "المنطقة الحيوية", "النظام البيئي", "الغلاف الحيوي"],
    answer: 0,
    explanation: "المجتمع الحيوي مجموعة جماعات لأنواع مختلفة. يعلوه النظام البيئي ثم المنطقة الحيوية ثم الغلاف الحيوي، لذا فهو الأقل تعقيدًا بين الخيارات.",
  },
  {
    id: "6ad0188963cd9c24f9f445bf",
    page: 4,
    number: 17,
    text: "في أي مناطق المحيط لا تستطيع الكائنات التي تعتمد على البناء الضوئي العيش عادةً؟",
    options: ["المنطقة المظلمة", "المنطقة الضوئية", "منطقة الرذاذ", "منطقة المد المرتفع"],
    answer: 0,
    explanation: "لا يصل ضوء كافٍ للبناء الضوئي إلى المنطقة المظلمة في المحيط، لذلك لا تستطيع فيها الكائنات المعتمدة على البناء الضوئي إنتاج غذائها.",
  },
  {
    id: "6ad0188963cd9c24f9f445c0",
    page: 4,
    number: 18,
    text: "ما اسم السلوك الذي يحدد ترتيب سيطرة أفراد مجموعة الدجاج على بعضها؟",
    options: ["الصراع", "الحضانة", "الهجرة", "سيادة التسلسل الهرمي"],
    answer: 3,
    explanation: "سيادة التسلسل الهرمي (ترتيب النقر) تحدد ترتيب السيطرة والوصول إلى الموارد بين أفراد المجموعة.",
  },
  {
    id: "6ad0188963cd9c24f9f445c1",
    page: 4,
    number: 19,
    text: "يوضح الشكل سلسلة مفردة من النيوكليوتيدات. ما اسم الجزيء؟",
    options: ["ATP", "NAD⁺", "RNA", "DNA"],
    answer: 2,
    explanation: "الشكل يمثل سلسلة RNA مفردة. أما DNA فيتكون غالبًا من سلسلتين متكاملتين.",
  },
  {
    id: "6ad0188963cd9c24f9f445c2",
    page: 4,
    number: 20,
    text: "ما اسم المادة الكيميائية التي تستخدمها بعض الحيوانات للتواصل مع أفراد النوع نفسه؟",
    options: ["الهرمونات", "البروتينات", "الفيرمونات", "الإنزيمات"],
    answer: 2,
    explanation: "الفيرمونات إشارات كيميائية يطلقها فرد وتؤثر في سلوك أو استجابة أفراد أخرى من النوع نفسه.",
  },
  {
    id: "6ad0188963cd9c24f9f445c3",
    page: 4,
    number: 21,
    text: "تسير مجموعة من النمل في مسار محدد يتبع بعضه بعضًا. ما الإشارة التي تساعد النمل على اتباع المسار؟",
    options: ["رائحة مادة كيميائية", "طعم مادة", "أصوات النمل", "أصوات خطواته"],
    answer: 0,
    explanation: "يترك النمل فيرمونات على المسار، وتتبعها النملات الأخرى بحاسة الشم.",
  },
  {
    id: "6ad0188963cd9c24f9f445c4",
    page: 4,
    number: 22,
    text: "تُستخدم بكتيريا لتفكيك النفط المتسرب في الماء. ما اسم هذه المعالجة؟",
    options: ["التنوع البيئي", "التنمية المستدامة", "المعالجة الحيوية", "الموارد المتجددة"],
    answer: 2,
    explanation: "المعالجة الحيوية تستخدم كائنات حية، مثل بعض البكتيريا، لتفكيك الملوثات أو تقليلها.",
  },
  {
    id: "6ad0188963cd9c24f9f445c5",
    page: 4,
    number: 23,
    text: "ما المصطلح الذي يصف استخدام كائنات حية لإزالة مواد سامة من منطقة ملوثة؟",
    options: ["المضادات الحيوية", "الزيادة الحيوية", "التنوع الحيوي", "المعالجة الحيوية"],
    answer: 3,
    explanation: "المعالجة الحيوية توظف كائنات حية أو عملياتها لتفكيك الملوثات أو خفض تركيزها في البيئة.",
  },
  {
    id: "6ad0188963cd9c24f9f445c6",
    page: 4,
    number: 24,
    text: "ما نوع التنوع الذي يقيس عدد الأنواع المختلفة ووفرة كل نوع في المجتمع الحيوي؟",
    options: ["التنوع الحيوي", "التنوع الوراثي", "تنوع الأنواع", "تنوع النظام البيئي"],
    answer: 2,
    explanation: "تنوع الأنواع يصف عدد الأنواع في المجتمع الحيوي ومدى وفرة كل نوع فيه.",
  },
  {
    id: "6ad0188963cd9c24f9f445c7",
    page: 4,
    number: 25,
    text: "وجود الأسود والزرافات والسناجب والقرود في مجتمع حيوي يدل على أي نوع من التنوع؟",
    options: ["التنوع الحيوي", "التنوع الوراثي", "تنوع الأنواع", "تنوع النظام البيئي"],
    answer: 2,
    explanation: "وجود أنواع مختلفة من الكائنات في المجتمع يدل على تنوع الأنواع.",
  },
  {
    id: "6ad0188963cd9c24f9f445c8",
    page: 4,
    number: 26,
    text: "ما المصطلح الذي يصف جزيئات كبيرة مكوّنة من وحدات بنائية متكررة؟",
    options: ["الأمينات", "المونومرات", "الأميدات", "البوليمرات"],
    answer: 3,
    explanation: "البوليمرات جزيئات كبيرة تتكون من وحدات بنائية متكررة تسمى مونومرات.",
  },
  {
    id: "6ad0188963cd9c24f9f445c9",
    page: 4,
    number: 27,
    text: "ما الصفة المشتركة بين الخفاش ومنقار البط؟",
    options: ["الأشواك", "الغدد اللبنية والريش", "الريش", "الغدد اللبنية لإرضاع الصغار"],
    answer: 3,
    explanation: "الخفاش ومنقار البط من الثدييات، وتمتلك إناثهما غددًا لبنية لإرضاع الصغار. وجود الريش ليس صفة مشتركة بينهما.",
  },
  {
    id: "6ad0188963cd9c24f9f445ca",
    page: 4,
    number: 28,
    text: "أي العضيات الآتية لا يشارك مباشرة في تصنيع البروتين أو معالجته؟",
    options: ["النواة", "الليسوسومات", "النوية", "جهاز جولجي"],
    answer: 1,
    explanation: "تشارك النواة في نسخ المعلومات الوراثية، والنوية في تكوين وحدات الريبوسوم، وجهاز جولجي في تعديل بعض البروتينات وتوجيهها. أما الليسوسومات فوظيفتها الهضم داخل الخلية.",
  },
  {
    id: "6ad0188963cd9c24f9f445cb",
    page: 5,
    number: 33,
    text: "تتجنب بعض المفترسات أكل الإسفنج بسبب وجود:",
    options: ["طبقتين سميكتين", "شويكات", "خلايا مطوقة", "ثقوب"],
    answer: 1,
    explanation: "تحتوي أجسام كثير من الإسفنجيات على شويكات صلبة قد تجعلها غير مستساغة أو مؤذية للمفترسات.",
  },
  {
    id: "6ad0188963cd9c24f9f445cc",
    page: 5,
    number: 34,
    text: "ما الفرق الأساسي بين التطفل والتكافل التبادلي؟",
    options: ["في التطفل يستفيد أحد المخلوقين والآخر لا يتأثر", "في التطفل يستفيد أحدهما ويتضرر الآخر", "في الحالتين يستفيد المخلوقان", "في الحالتين يتضرر المخلوقان"],
    answer: 1,
    explanation: "في التطفل يستفيد الطفيل ويتضرر العائل، أما في التكافل التبادلي فيستفيد الطرفان.",
  },
  {
    id: "6ad0188963cd9c24f9f445cd",
    page: 5,
    number: 35,
    text: "أي تزاوج يعطي نسلًا جميع أفراده ذوي النمط الجيني Bb؟",
    options: ["BB × bb", "Bb × Bb", "BB × BB", "Bb × bb"],
    answer: 0,
    explanation: "ينتج عن BB×bb أمشاج B من أحد الأبوين وb من الآخر فقط؛ لذلك يكون كل النسل Bb.",
  },
  {
    id: "6ad0188963cd9c24f9f445ce",
    page: 5,
    number: 36,
    text: "أي تزاوج بين أبوين يمكن أن ينتج طفلًا فصيلة دمه O⁺؟",
    options: ["IᴬIᴬ × Iᴬi", "Iᴬi × Iᴮi", "Iᴮi × IᴮIᴮ", "Iᴮi × IᴬIᴬ"],
    answer: 1,
    explanation: "يستطيع كل من الأبوين Iᴬi وIᴮi تمرير الأليل المتنحي i. اجتماع i من كليهما ينتج النمط ii وفصيلة O؛ وتحديد Rh موجب ممكن إذا ورث الطفل أليل Rh موجبًا.",
  },
  {
    id: "6ad0188963cd9c24f9f445cf",
    page: 5,
    number: 37,
    text: "في مخطط السلالة، الفرد II-3 ممثل بدائرة نصف مظللة. ماذا يدل الرمز؟",
    options: ["ذكر مصاب", "أنثى مصابة", "ذكر حامل للمرض", "أنثى حاملة للمرض"],
    answer: 3,
    explanation: "الدائرة تمثل أنثى، والتظليل الجزئي في هذا المخطط يرمز إلى حمل الأليل المرتبط بالمرض دون ظهور الإصابة.",
  },
  {
    id: "6ad0188963cd9c24f9f445d0",
    page: 5,
    number: 39,
    text: "أي التراكيب الآتية متماثل الأصل مع جناح الخفاش؟",
    options: ["جناح الغراب", "أرجل السلحفاة", "ذراع الأرنب", "زعانف الأسماك"],
    answer: 2,
    explanation: "جناح الخفاش وذراع الأرنب طرفان أماميان للفقاريات، لهما الخطة العظمية الأساسية نفسها رغم اختلاف الوظيفة.",
  },
  {
    id: "6ad0188963cd9c24f9f445d1",
    page: 5,
    number: 40,
    text: "ما الإجراء المباشر لمكافحة مرض النوم الإفريقي؟",
    options: ["مكافحة البعوض", "القضاء على النمل الأبيض", "مكافحة ذبابة تسي تسي", "غسل الخضروات جيدًا"],
    answer: 2,
    explanation: "مرض النوم الإفريقي ينتقل بواسطة ذبابة تسي تسي؛ لذلك تحد مكافحة الناقل من انتقال المرض.",
  },
  {
    id: "6ad0188963cd9c24f9f445d2",
    page: 5,
    number: 41,
    text: "في علاقة الأشنات، ماذا يستفيد الفطر من الطحلب؟",
    options: ["الضوء", "الماء", "الغذاء", "الهواء"],
    answer: 2,
    explanation: "ينتج الطحلب مواد عضوية بالبناء الضوئي، ويستفيد الفطر من الغذاء الذي يوفره شريكه.",
  },
  {
    id: "6ad0188963cd9c24f9f445d3",
    page: 5,
    number: 42,
    text: "في أي نسيج تتكون معظم خلايا الدم الحمراء والبيضاء والصفائح الدموية؟",
    options: ["المخ", "القنطرة", "نخاع العظم الأحمر", "تحت المهاد"],
    answer: 2,
    explanation: "يحدث تكوّن خلايا الدم (تكوّن الدم) في نخاع العظم الأحمر.",
  },
] as const;

const rejections = [
  {
    id: "6ad0188963cd9c24f9f445b8",
    page: 3,
    number: 10,
    note: "مرفوض: سؤال «أي المناطق مهددة بالانقراض؟» غير محدد علميًا؛ المناطق أو الجزر لا تنقرض، ولا يوضح السؤال هل يقصد الأنواع أو المواطن أو سبب التهديد.",
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
