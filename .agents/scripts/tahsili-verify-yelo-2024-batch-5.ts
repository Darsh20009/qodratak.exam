import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f4192f", page: 43, number: 24,
    text: "وفق نظام فصائل ABO فقط، ما فصيلة الدم التي تُعد معطيًا عامًا لكريات الدم الحمراء؟",
    options: ["A", "AB", "B", "O"],
    answer: 3,
    explanation: "لا تحمل كريات الدم الحمراء من فصيلة O مستضدَي A أو B، لذا تُعد معطيًا عامًا ضمن نظام ABO. ولا يشمل هذا التبسيط عامل Rh.",
  },
  {
    id: "6ad0150c63cd9c24f9f41930", page: 44, number: 26,
    text: "أي العوامل الآتية مثال على عامل لا يعتمد أثره على كثافة الجماعة الحيوية؟",
    options: ["الجفاف الحاد", "طفيل في الأمعاء", "فيروس قاتل ينتشر بين الأفراد", "الازدحام الشديد"],
    answer: 0,
    explanation: "الجفاف عامل لاأحيائي يؤثر في الجماعة بصرف النظر عن عدد أفرادها. أما الطفيليات والأمراض والازدحام فعادةً يشتد أثرها مع زيادة الكثافة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41931", page: 45, number: 29,
    text: "أي الحيوانات الآتية أقرب تصنيفيًا إلى الحوت الأحدب؟",
    options: ["الأبوسوم", "الصقر", "السنجاب", "التمساح"],
    answer: 2,
    explanation: "الحوت والسنجاب من الثدييات المشيمية؛ أما الأبوسوم فمن الثدييات الجرابية، والتمساح والصقر ينتميان إلى مجموعتين أبعد.",
  },
  {
    id: "6ad0150c63cd9c24f9f41932", page: 45, number: 30,
    text: "أي مجموعة من الكائنات حقيقية النوى لها جدار خلوي وتتغذى بامتصاص المواد العضوية المتحللة؟",
    options: ["الطحالب", "الفطريات", "الحيوانات", "النباتات"],
    answer: 1,
    explanation: "الفطريات غير ذاتية التغذي؛ تفرز إنزيمات على المواد العضوية ثم تمتص نواتج تحللها، وتمتلك جدارًا خلويًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f41933", page: 46, number: 31,
    text: "أي المركبات الآتية عديد سكر؟",
    options: ["السليلوز", "الجلوكوز", "السكروز", "اللاكتوز"],
    answer: 0,
    explanation: "السليلوز بوليمر مكوّن من وحدات جلوكوز كثيرة، لذلك يصنف عديد سكر. الجلوكوز أحادي سكر، والسكروز واللاكتوز ثنائيا سكر.",
  },
  {
    id: "6ad0150c63cd9c24f9f41934", page: 46, number: 33,
    text: "بحسب الاستجابة الضوئية اللازمة للإزهار، يُصنّف قصب السكر عادةً ضمن نباتات:",
    options: ["النهار القصير", "النهار المتوسط", "النهار الطويل", "النهار المحايد"],
    answer: 0,
    explanation: "يُدرج قصب السكر في المقررات التعليمية ضمن نباتات النهار القصير؛ إذ يرتبط تحفيز إزهاره بفترة ليل طويلة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41935", page: 48, number: 37,
    text: "أي زوج من التراكيب الآتية يُعد مثالًا على أعضاء متماثلة تطوريًا؟",
    options: ["جناح الخفاش ورجل الأرنب الأمامية", "جناح الخفاش وزعنفة السمكة", "جناح الخفاش وجناح الغراب بوصفهما جناحين", "جناح الخفاش وحراشف الزواحف"],
    answer: 0,
    explanation: "جناح الخفاش ورجل الأرنب الأمامية تحويران للطرف الأمامي للثدييات، ويشتركان في مخطط عظمي أصلي رغم اختلاف الوظيفة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41936", page: 48, number: 39,
    text: "ما الوظيفة الأساسية للأحماض النووية؟",
    options: ["تخزين المعلومات الوراثية ونقلها", "المحافظة على حرارة الجسم", "تنظيم الإخراج مباشرة", "تخزين الطاقة بوصفها وظيفتها الأساسية"],
    answer: 0,
    explanation: "يخزن DNA المعلومات الوراثية، وتشارك الأحماض النووية ومنها RNA في نقلها والتعبير عنها.",
  },
  {
    id: "6ad0150c63cd9c24f9f41937", page: 49, number: 41,
    text: "راقب عالم نمرًا وهو يفترس حيوانًا وسجل ما شاهده. ما العمل العلمي الذي قام به؟",
    options: ["ملاحظة", "تجربة", "استنتاج", "نظرية"],
    answer: 0,
    explanation: "جمع المعلومات مباشرة باستخدام الحواس وتسجيل الحدث يُعد ملاحظة، ولا يتضمن وحده إجراء تجربة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41938", page: 51, number: 46,
    text: "ما المصطلح الذي يعني عدد المخلوقات الحية لكل وحدة مساحة؟",
    options: ["كثافة الجماعة", "توزيع الجماعة", "معدل نمو الجماعة", "عدد مجموعات الجماعة"],
    answer: 0,
    explanation: "كثافة الجماعة هي عدد أفراد الجماعة الحيوية في وحدة مساحة أو حجم.",
  },
  {
    id: "6ad0150c63cd9c24f9f41939", page: 51, number: 47,
    text: "أي الطلائعيات الآتية تجمع صفات نباتية وحيوانية؟",
    options: ["اليوجلينا", "البراميسيوم", "الأميبا", "السبيروجيرا"],
    answer: 0,
    explanation: "تحتوي اليوجلينا على بلاستيدات وتقوم بالبناء الضوئي، كما تتحرك وتستطيع التغذي بطرق غيرية عند غياب الضوء.",
  },
  {
    id: "6ad0150c63cd9c24f9f4193a", page: 52, number: 49,
    text: "في رسم الحيوان المنوي، إلى أي جزء يشير السهم؟",
    options: ["الرأس", "القطعة الوسطى", "الذيل", "النواة"],
    answer: 1,
    explanation: "يشير السهم إلى القطعة الوسطى خلف الرأس مباشرة؛ وتحتوي على ميتوكوندريا تمد حركة الحيوان المنوي بالطاقة.",
  },
  {
    id: "6ad0150c63cd9c24f9f4193b", page: 53, number: 50,
    text: "ما الجزيء الذي يمثله الرسم ذو اللولب المزدوج؟",
    options: ["DNA", "mRNA", "tRNA", "rRNA"],
    answer: 0,
    explanation: "اللولب المزدوج المكوّن من سلسلتين متكاملتين هو البنية المعروفة لجزيء DNA.",
  },
  {
    id: "6ad0150c63cd9c24f9f4193c", page: 53, number: 51,
    text: "أي الحيوانات الآتية لا يُعد مستهلكًا ثانويًا في شبكة غذائية مدرسية نموذجية؟",
    options: ["الذئب", "النمر", "الأسد", "الفيل"],
    answer: 3,
    explanation: "الفيل عاشب ويتغذى على المنتجات، لذلك يكون غالبًا مستهلكًا أوليًا؛ أما الحيوانات المفترسة المذكورة فتتغذى على مستهلكات.",
  },
  {
    id: "6ad0150c63cd9c24f9f4193d", page: 54, number: 54,
    text: "حيوان له شعر ويرضع صغاره. إلى أي طائفة يُصنّف؟",
    options: ["الطيور", "البرمائيات", "الزواحف", "الثدييات"],
    answer: 3,
    explanation: "الشعر وإرضاع الصغار سمتان مميزتان للثدييات. استُخدم «طائفة» بدل «شعبة» لأن الثدييات طائفة تصنيفية.",
  },
  {
    id: "6ad0150c63cd9c24f9f4193e", page: 54, number: 55,
    text: "إلى أي طائفة ينتمي البعوض؟",
    options: ["القشريات", "الحشرات", "العنكبيات", "الرخويات"],
    answer: 1,
    explanation: "البعوض حشرة؛ جسمه مقسم إلى رأس وصدر وبطن، وله ست أرجل وزوج واحد من الأجنحة.",
  },
  {
    id: "6ad0150c63cd9c24f9f4193f", page: 55, number: 58,
    text: "قد ترتبط هشاشة العظام ونقص قوتها بنقص أي أملاح في الغذاء؟",
    options: ["اليود", "الحديد", "الكالسيوم", "البوتاسيوم"],
    answer: 2,
    explanation: "الكالسيوم مكوّن معدني أساسي للعظام؛ ونقصه المزمن قد يضعف تمعدن العظام ويرفع خطر هشاشتها.",
  },
] as const;

const rejected = [
  {
    id: "6ad0150c63cd9c24f9f4192e", page: 43, number: 22,
    note: "حُجب السؤال: يحتوي الخياران ج ود على الاقتران نفسه، كما أن الخيارات لا تعرض أربع إجابات مختلفة؛ لا يمكن نشره كاختيار من متعدد موثوق دون الرجوع إلى نسخة أصلية سليمة.",
  },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this review is authorized for Replit preview only.`);
  }
  const allItems = [...approvals, ...rejected];
  const ids = allItems.map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({
    _id: { $in: ids },
    sourceId: SOURCE_ID,
    status: "pending_review",
  })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== allItems.length) failures.push(`expected ${allItems.length} pending source rows, found ${drafts.length}`);
  for (const item of allItems) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) failures.push(`q${item.number}: source/page mismatch`);
  }
  for (const item of approvals) {
    if (item.options.length !== 4 || new Set(item.options.map((value) => value.trim())).size !== 4 ||
      item.options.some((value) => !value.trim()) || item.answer < 0 || item.answer > 3) {
      failures.push(`q${item.number}: invalid cleaned options or answer index`);
    }
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
    rejected: rejected.length,
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
          subject: "أحياء",
          subcategory: "أحياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || "أحياء",
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
          reviewerNotes: "تمت مراجعة السؤال والإجابة علميًا بمقابلتهما مع المصدر، وتنظيف الصياغة وإضافة شرح توضيحي.",
          updatedAt: reviewedAt,
        },
      },
    );
  }
  for (const item of rejected) {
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
