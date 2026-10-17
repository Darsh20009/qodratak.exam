import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-biology-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0188963cd9c24f9f445f6",
    page: 9,
    number: 85,
    text: "كم خلية ناتجة عادةً من انقسام منصف واحد مكتمل لخلية أم؟",
    options: ["خليتان", "3 خلايا", "4 خلايا", "5 خلايا"],
    answer: 2,
    explanation: "ينتج الانقسام المنصف المكتمل عادةً أربع خلايا أحادية المجموعة الكروموسومية من خلية أم واحدة.",
  },
  {
    id: "6ad0188963cd9c24f9f445f7",
    page: 9,
    number: 86,
    text: "أي مرض تنقله ذبابة تسي تسي؟",
    options: ["مرض النوم الأمريكي", "الفيلاريا", "الملاريا", "مرض النوم الإفريقي"],
    answer: 3,
    explanation: "تنقل ذبابة تسي تسي طفيليات المثقبيات المسببة لمرض النوم الإفريقي.",
  },
  {
    id: "6ad0188963cd9c24f9f445f8",
    page: 9,
    number: 87,
    text: "أي علاقة أو سلوك اجتماعي يمكن أن يقلل الصراع المباشر بين أفراد مجموعة حيوانية؟",
    options: ["المغازلة", "الصراع", "سيادة التسلسل الهرمي", "الهجرة"],
    answer: 2,
    explanation: "قد يحد التسلسل الهرمي الواضح من المواجهات المتكررة، لأنه ينظم أولوية الوصول إلى الموارد بين الأفراد.",
  },
  {
    id: "6ad0188963cd9c24f9f445f9",
    page: 9,
    number: 88,
    text: "إذا لوحظت صفيحة خلوية أثناء انقسام خلية، فما نوع الخلية على الأرجح؟",
    options: ["حيوانية", "فطرية", "نباتية", "طلائعية حيوانية"],
    answer: 2,
    explanation: "تتكون الصفيحة الخلوية في الانقسام الخلوي النباتي وتتحول إلى جزء من الجدار الفاصل بين الخليتين.",
  },
  {
    id: "6ad0188963cd9c24f9f445fa",
    page: 9,
    number: 89,
    text: "ما الإجراء المباشر للحد من انتقال مرض النوم الإفريقي؟",
    options: ["غسل الخضروات", "تجنب المشي حافيًا", "مكافحة البعوض", "مكافحة ذبابة تسي تسي"],
    answer: 3,
    explanation: "ينتقل مرض النوم الإفريقي بواسطة ذبابة تسي تسي؛ لذا تستهدف الوقاية مكافحة هذا الناقل.",
  },
  {
    id: "6ad0188963cd9c24f9f445fb",
    page: 9,
    number: 90,
    text: "أي نوع من العضلات يحرك اليد إراديًا؟",
    options: ["هيكلية", "قلبية", "ملساء", "دائرية فقط"],
    answer: 0,
    explanation: "تحرك العضلات الهيكلية المرتبطة بالعظام اليد والذراع، وتخضع حركتها غالبًا للتحكم الإرادي.",
  },
  {
    id: "6ad0188963cd9c24f9f445fc",
    page: 9,
    number: 91,
    text: "كيف تنتشر ثمار جوز الهند طبيعيًا بين الجزر؟",
    options: ["بالرياح", "بالحيوانات", "بتيارات البحار", "بالإنسان فقط"],
    answer: 2,
    explanation: "تطفو ثمار جوز الهند ذات الغلاف الليفي، ويمكن أن تنقلها تيارات البحار إلى جزر أخرى.",
  },
  {
    id: "6ad0188963cd9c24f9f445fd",
    page: 9,
    number: 92,
    text: "لماذا يتباطأ تبخر العرق في الجو الرطب مقارنة بالجو الجاف؟",
    options: ["لأن جزيئات الماء تلتصق أكثر", "بسبب نقص تماسك جزيئات الهواء", "لأن معدل تبخر الماء يقل", "لأن معدل تبخر الماء يزداد"],
    answer: 2,
    explanation: "يكون الهواء الرطب قريبًا من التشبع ببخار الماء، فيقل فرق ضغط البخار بين العرق والهواء، فيتباطأ التبخر والتبريد.",
  },
  {
    id: "6ad0188963cd9c24f9f445fe",
    page: 9,
    number: 93,
    text: "أي الكائنات الآتية يستطيع صنع غذائه بالبناء الضوئي؟",
    options: ["السبيروجيرا", "الأميبا", "التريبانوسوما", "البلاناريا"],
    answer: 0,
    explanation: "السبيروجيرا طحلب أخضر يحتوي على الكلوروفيل ويصنع غذاءه بالبناء الضوئي.",
  },
  {
    id: "6ad0188963cd9c24f9f445ff",
    page: 9,
    number: 94,
    text: "إلى أي حجرة في القلب يصل الدم المؤكسج العائد من الرئتين عبر الأوردة الرئوية؟",
    options: ["الأذين الأيسر", "البطين الأيسر", "الأذين الأيمن", "البطين الأيمن"],
    answer: 0,
    explanation: "تفتح الأوردة الرئوية في الأذين الأيسر، ثم ينتقل الدم منه إلى البطين الأيسر.",
  },
  {
    id: "6ad0188963cd9c24f9f44600",
    page: 9,
    number: 95,
    text: "ما اسم التكاثر الذي ينتج نسلًا من بويضة دون إخصابها؟",
    options: ["التبرعم", "التجدد", "الاقتران", "التكاثر العذري"],
    answer: 3,
    explanation: "التكاثر العذري هو نمو فرد من بويضة غير مخصبة.",
  },
  {
    id: "6ad0188963cd9c24f9f44601",
    page: 9,
    number: 96,
    text: "ما التكيف الذي يساعد بعض الدياتومات على الطفو قرب سطح الماء؟",
    options: ["كبر حجم الخلية", "وجود مثانة هوائية", "تخزين مواد احتياطية على هيئة زيوت", "جدار مكوّن من السيليكا"],
    answer: 2,
    explanation: "تقلل المواد الدهنية المخزنة كثافة بعض الدياتومات وتساعد على الطفو؛ أما جدار السيليكا فوظيفته بنائية.",
  },
  {
    id: "6ad0188963cd9c24f9f44602",
    page: 9,
    number: 97,
    text: "ما الوحدات البنائية الأساسية للبروتينات؟",
    options: ["الأحماض الأمينية", "الأحماض الدهنية", "الكربوهيدرات", "الجليكوجين"],
    answer: 0,
    explanation: "تتكون البروتينات من سلاسل أحماض أمينية ترتبط بروابط ببتيدية.",
  },
  {
    id: "6ad0188963cd9c24f9f44603",
    page: 9,
    number: 98,
    text: "ما المصطلح الذي يصف استخدام نباتات حية لامتصاص ملوثات أو تقليلها في موقع ملوث؟",
    options: ["المعالجة الحيوية النباتية", "الزيادة الحيوية", "التوطين", "التلويث"],
    answer: 0,
    explanation: "المعالجة الحيوية النباتية (Phytoremediation) تستخدم النباتات لامتصاص بعض الملوثات أو تثبيتها أو المساعدة على تفكيكها.",
  },
  {
    id: "6ad0188963cd9c24f9f44604",
    page: 10,
    number: 99,
    text: "في أي عضية نباتية تحدث التفاعلات الضوئية ودورة تثبيت الكربون في البناء الضوئي؟",
    options: ["جهاز جولجي", "الميتوكوندريا", "البلاستيدة الخضراء", "النواة"],
    answer: 2,
    explanation: "تحدث التفاعلات الضوئية على أغشية الثايلاكويد، وتحدث دورة كالفن في السدى؛ وكلاهما داخل البلاستيدة الخضراء.",
  },
  {
    id: "6ad0188963cd9c24f9f44605",
    page: 10,
    number: 100,
    text: "ما النمط الكروموسومي المعتاد لمتلازمة ثلاثية X؟",
    options: ["XO", "XXX", "XY", "XYY"],
    answer: 1,
    explanation: "تنتج متلازمة ثلاثية X عادةً عن وجود ثلاثة كروموسومات X (47,XXX).",
  },
  {
    id: "6ad0188963cd9c24f9f44607",
    page: 10,
    number: 104,
    text: "ما المتوقع عند وجود النمط الكروموسومي YO لدى الإنسان؟",
    options: ["متلازمة داون", "أنثى طبيعية", "ذكر طبيعي", "لا يكون النمط قابلًا للحياة"],
    answer: 3,
    explanation: "لا يمكن للنمط YO البقاء؛ فوجود كروموسوم X ضروري لتوفير جينات أساسية للنمو.",
  },
  {
    id: "6ad0188963cd9c24f9f44608",
    page: 10,
    number: 105,
    text: "وفق النموذج المدرسي المعتاد للخلية النباتية، أي تركيب يغيب غالبًا عنها مقارنة بالخلية الحيوانية؟",
    options: ["خيوط المغزل", "المريكزات", "المادة الوراثية DNA", "الغشاء البلازمي"],
    answer: 1,
    explanation: "في النموذج المدرسي، تفتقر معظم الخلايا النباتية إلى المريكزات، بينما تمتلكها كثير من الخلايا الحيوانية. وتوجد استثناءات بين الأنواع.",
  },
  {
    id: "6ad0188963cd9c24f9f44609",
    page: 10,
    number: 106,
    text: "في نظام ABO وحده، أي فصيلة تُعد المتبرع العام لكريات الدم الحمراء؟",
    options: ["A", "B", "AB", "O"],
    answer: 3,
    explanation: "ضمن نظام ABO فقط، لا تحمل كريات فصيلة O مستضدي A أو B. أما التوافق الفعلي فيتطلب مراعاة عامل Rh وفحوص التوافق.",
  },
  {
    id: "6ad0188963cd9c24f9f4460a",
    page: 10,
    number: 108,
    text: "من أي وحدتين سكريتين يتكون السكروز؟",
    options: ["الجلوكوز والفركتوز", "السليلوز والنشا", "النشا والفركتوز", "السليلوز والجلوكوز"],
    answer: 0,
    explanation: "يتكون السكروز من اتحاد جزيء جلوكوز مع جزيء فركتوز.",
  },
  {
    id: "6ad0188963cd9c24f9f4460b",
    page: 10,
    number: 109,
    text: "أي الخيارات الآتية سكر ثنائي يتكون من اتحاد جزيئين أحاديين؟",
    options: ["الجليكوجين", "النشا", "الفركتوز", "اللاكتوز"],
    answer: 3,
    explanation: "اللاكتوز سكر ثنائي يتكون من الجلوكوز والجالاكتوز. أما الجليكوجين والنشا فعديدات سكاريد، والفركتوز أحادي سكاريد.",
  },
  {
    id: "6ad0188963cd9c24f9f4460c",
    page: 10,
    number: 110,
    text: "ما طريقة التكاثر اللاجنسي الشائعة في فطر الخميرة؟",
    options: ["التجزؤ", "الاندماج", "التبرعم", "التجدد"],
    answer: 2,
    explanation: "تتكاثر الخميرة لاجنسيًا غالبًا بالتبرعم، حيث ينمو برعم من الخلية الأم ثم ينفصل.",
  },
  {
    id: "6ad0188963cd9c24f9f4460d",
    page: 10,
    number: 111,
    text: "أي مادة كربوهيدراتية بنائية توجد في جدار خلايا نبات الجرجير؟",
    options: ["السليلوز", "السكروز", "الجليكوجين", "الجلوكوز"],
    answer: 0,
    explanation: "السليلوز مكوّن بنائي رئيس في جدر الخلايا النباتية.",
  },
  {
    id: "6ad0188963cd9c24f9f4460e",
    page: 10,
    number: 112,
    text: "إلى أين يتجه الدم عندما يغادر البطين الأيمن؟",
    options: ["الرئتان", "الكبد", "الأمعاء", "الدماغ"],
    answer: 0,
    explanation: "يضخ البطين الأيمن الدم غير المؤكسج عبر الشريان الرئوي إلى الرئتين.",
  },
  {
    id: "6ad0188963cd9c24f9f4460f",
    page: 11,
    number: 113,
    text: "ما النمط الجيني المعتاد لفصيلة الدم AB؟",
    options: ["IᴬIᴬ", "IᴮIᴮ", "IᴬIᴮ", "ii"],
    answer: 2,
    explanation: "تظهر فصيلة AB عند اجتماع الأليلين السائدين المشتركين Iᴬ وIᴮ.",
  },
  {
    id: "6ad0188963cd9c24f9f44610",
    page: 11,
    number: 114,
    text: "التعرّف على صوت قرد بعيد والاستجابة له يندرج ضمن أي نوع من السلوك في التصنيف الوارد في المصدر؟",
    options: ["المغازلة", "الافتراس", "الإدراكي", "تحديد منطقة النفوذ"],
    answer: 2,
    explanation: "يعتمد السلوك الإدراكي على استقبال المعلومة الحسية ومعالجتها؛ والتعرف على الصوت البعيد مثال على ذلك في تصنيف المصدر.",
  },
  {
    id: "6ad0188963cd9c24f9f44611",
    page: 11,
    number: 115,
    text: "أي الكائنات الأولية الآتية تُعرف بأصدافها التي تسهم في تكوين سجل أحفوري جيد؟",
    options: ["البوغيات", "السوطيات", "المثقبات", "الهدبيات"],
    answer: 2,
    explanation: "للمثقبات أصداف غالبًا كلسية، وتُحفظ أصدافها بكثرة في الرواسب؛ لذلك تعد مهمة في السجل الأحفوري.",
  },
  {
    id: "6ad0188963cd9c24f9f44612",
    page: 11,
    number: 116,
    text: "أي جزء رئيس من الدماغ يشارك في الوظائف العليا مثل التفكير والذاكرة والانفعالات؟",
    options: ["المخ الكبير", "المخيخ", "النخاع المستطيل", "الحبل الشوكي"],
    answer: 0,
    explanation: "المخ الكبير مسؤول عن كثير من الوظائف العليا، ومنها التفكير والذاكرة والإدراك، ويشارك في معالجة الانفعالات.",
  },
  {
    id: "6ad0188963cd9c24f9f44614",
    page: 11,
    number: 118,
    text: "ما العامل الذي يساعد على انتشار جوز الهند بين الجزر؟",
    options: ["التعلق بفراء الحيوانات", "الانتشار بالرياح", "وجود تراكيب شبيهة بالأجنحة", "طفو الثمار وانتقالها عبر المحيطات"],
    answer: 3,
    explanation: "يساعد الغلاف الليفي للثمرة على الطفو، فتستطيع التيارات البحرية نقل جوز الهند إلى جزر بعيدة.",
  },
  {
    id: "6ad0188963cd9c24f9f44615",
    page: 11,
    number: 120,
    text: "ما العامل المسبب لشلل الأطفال؟",
    options: ["بكتيريا ضعيفة", "سموم فطرية", "سموم بكتيرية", "فيروس شلل الأطفال"],
    answer: 3,
    explanation: "شلل الأطفال مرض فيروسي يسببه فيروس شلل الأطفال، وليس بكتيريا أو سمًا.",
  },
  {
    id: "6ad0188963cd9c24f9f44616",
    page: 11,
    number: 121,
    text: "عندما يزداد حجم الخلية أسرع من مساحة سطحها، ما المشكلة التي قد تواجهها؟",
    options: ["صعوبة تبادل المواد والحصول على الغذاء", "سهولة التخلص من الفضلات", "تحسن تبادل المواد تلقائيًا", "عدم وجود حد لحجم الخلية"],
    answer: 0,
    explanation: "مع نمو الخلية تقل نسبة مساحة سطحها إلى حجمها، فيصبح تبادل المغذيات والغازات والفضلات أقل كفاءة.",
  },
  {
    id: "6ad0188963cd9c24f9f44617",
    page: 11,
    number: 122,
    text: "أي شريان ينقل الدم غير المؤكسج من القلب إلى الرئتين؟",
    options: ["الشريان الرئوي", "الشريان الأبهر", "الشريان السباتي", "الشريان الفخذي"],
    answer: 0,
    explanation: "ينقل الشريان الرئوي الدم غير المؤكسج من البطين الأيمن إلى الرئتين.",
  },
  {
    id: "6ad0188963cd9c24f9f44618",
    page: 11,
    number: 123,
    text: "أي نوع من المفاصل يشبه حركة مفصل الباب؟",
    options: ["رَزّي (مفصلي)", "درزي", "كروي حُقّي", "منزلق"],
    answer: 0,
    explanation: "المفصل الرزّي يشبه مفصلة الباب، ويسمح أساسًا بالثني والبسط.",
  },
  {
    id: "6ad0188963cd9c24f9f44619",
    page: 11,
    number: 124,
    text: "ما المصطلح الذي يصف أكبر عدد من أفراد الأنواع المختلفة تستطيع البيئة دعمه على المدى الطويل؟",
    options: ["الهجرة الخارجية", "كثافة الجماعة", "الكتلة الحيوية", "القدرة الاستيعابية"],
    answer: 3,
    explanation: "القدرة الاستيعابية هي أكبر جماعة أو مجموع جماعات تستطيع البيئة دعمها على المدى الطويل وفق مواردها وظروفها.",
  },
  {
    id: "6ad0188963cd9c24f9f4461a",
    page: 11,
    number: 125,
    text: "ما النسيج الذي يسمح للحشائش بمواصلة النمو الطولي بعد قص القمم النامية؟",
    options: ["الكامبيوم الوعائي", "الكامبيوم الفليني", "الأنسجة المولدة البينية", "الأنسجة المولدة الجانبية"],
    answer: 2,
    explanation: "توجد الأنسجة المولدة البينية عند قواعد الأوراق أو السلاميات في كثير من الحشائش، وتسمح باستمرار النمو بعد القص.",
  },
] as const;

const rejections = [
  {
    id: "6ad0188963cd9c24f9f44606",
    page: 10,
    number: 102,
    note: "مرفوض: السؤال يسأل أي الخيارات له القواعد النيتروجينية نفسها دون تحديد المقارنة؛ كل من tRNA وRNA يضم القواعد A وU وC وG، لذا يوجد أكثر من جواب صحيح.",
  },
  {
    id: "6ad0188963cd9c24f9f44613",
    page: 11,
    number: 117,
    note: "مرفوض: كل من الأبوسوم والسنجاب من الثدييات، لذا كلاهما يتشابه تصنيفيًا مع الحوت الأحدب ولا يحدد السؤال معيارًا آخر.",
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
