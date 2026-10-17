import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f41940", page: 56, number: 59,
    text: "أي الكائنات الآتية لا تحتوي خلاياها على جدار خلوي؟",
    options: ["التمر", "الرمان", "المشروم", "الهيدرا"],
    answer: 3,
    explanation: "الهيدرا حيوان، وخلايا الحيوانات لا تمتلك جدارًا خلويًا. أما خلايا النباتات والفطريات فلها جدر خلوية.",
  },
  {
    id: "6ad0150c63cd9c24f9f41941", page: 56, number: 60,
    text: "ما اسم مجموعة من أسماك النوع نفسه تعيش وتتكاثر في المكان والوقت نفسيهما؟",
    options: ["المجتمع الحيوي", "الجماعة الحيوية", "النظام البيئي", "الغلاف الحيوي"],
    answer: 1,
    explanation: "الجماعة الحيوية أفراد من النوع نفسه تعيش في منطقة وزمن محددين. المجتمع يضم جماعات أنواع مختلفة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41942", page: 57, number: 62,
    text: "أي العمليات الآتية لا تُعد تكاثرًا لاجنسيًا؟",
    options: ["الاقتران", "الانشطار", "التبرعم", "التجدد"],
    answer: 0,
    explanation: "الاقتران تبادل للمادة الوراثية بين خليتين ولا يزيد عدد الأفراد مباشرة، بخلاف الانشطار والتبرعم والتجدد في الكائنات التي تتكاثر بهذه الطرق.",
  },
  {
    id: "6ad0150c63cd9c24f9f41943", page: 57, number: 63,
    text: "أي الكائنات الآتية غالبًا عديم التناظر؟",
    options: ["البط", "قنديل البحر", "دودة الأرض", "الإسفنج"],
    answer: 3,
    explanation: "كثير من الإسفنجيات لا يمكن تقسيم أجسامها إلى أنصاف متماثلة حول محور أو مستوى، لذا توصف بأنها عديمة التناظر.",
  },
  {
    id: "6ad0150c63cd9c24f9f41944", page: 58, number: 65,
    text: "أي البروتينات الآتية يدخل في تركيب ريش الطيور؟",
    options: ["البروتين", "الهيموغلوبين", "الكولاجين", "الكيراتين"],
    answer: 3,
    explanation: "الريش مكوّن أساسًا من بروتين الكيراتين، وهو بروتين بنيوي يوجد أيضًا في الشعر والأظافر.",
  },
  {
    id: "6ad0150c63cd9c24f9f41945", page: 58, number: 66,
    text: "أي الكائنات الآتية أكثر تعرضًا لتراكم الملوثات التي يزداد تركيزها عبر السلسلة الغذائية؟",
    options: ["النسر", "الحشائش", "الفأر", "الخنفساء"],
    answer: 0,
    explanation: "يزداد تركيز بعض الملوثات الثابتة عند انتقالها إلى مستويات غذائية أعلى؛ لذلك تتعرض المفترسات العليا مثل النسر لأعلى تراكم.",
  },
  {
    id: "6ad0150c63cd9c24f9f41946", page: 58, number: 67,
    text: "أدخل مزارع طائرًا ليتغذى على الحشرات الضارة في مزرعته. ما الطريقة التي يستخدمها؟",
    options: ["المكافحة الحيوية", "التقايض", "المعالجة الحيوية", "التعايش"],
    answer: 0,
    explanation: "المكافحة الحيوية هي استخدام عدو طبيعي، مثل مفترس أو طفيلي، للحد من أعداد الآفات. استُبدل مصطلح المصدر غير الدقيق «الزيادة الحيوية» بالمصطلح العلمي المناسب.",
  },
  {
    id: "6ad0150c63cd9c24f9f41947", page: 59, number: 68,
    text: "أي اضطراب وراثي ينتج عن غياب صبغة الميلانين في الجلد والشعر؟",
    options: ["التليف الكيسي", "المهاق", "مرض تاي-ساكس", "الجالاكتوسيميا"],
    answer: 1,
    explanation: "ينتج المهاق عن اضطراب وراثي يقلل إنتاج الميلانين أو يمنعه، فتقل الصبغة في الجلد والشعر والعينين.",
  },
  {
    id: "6ad0150c63cd9c24f9f41948", page: 59, number: 69,
    text: "في سلسلة غذائية، عند أي مستوى يُتوقع أعلى تركيز لملوث ثابت يتراكم عبر المستويات؟",
    options: ["النسر", "الضفدع", "الشعير", "السلحفاة"],
    answer: 0,
    explanation: "تضخم التركيز الحيوي يجعل تركيز الملوثات الثابتة أعلى عند المستويات الغذائية العليا؛ والنسر مفترس أعلى من الشعير والضفدع.",
  },
  {
    id: "6ad0150c63cd9c24f9f41949", page: 59, number: 70,
    text: "أي المفصليات الآتية له ثلاثة أزواج من الأرجل؟",
    options: ["النمل", "العقرب", "العنكبوت", "جراد البحر"],
    answer: 0,
    explanation: "للحشرات، ومنها النمل، ثلاثة أزواج من الأرجل. للعناكب أربعة أزواج، وللقشريات عادةً خمسة أزواج أو أكثر.",
  },
  {
    id: "6ad0150c63cd9c24f9f4194a", page: 60, number: 71,
    text: "أي عبارة تصف تناظر نجم البحر الهش؟",
    options: ["تناظر جانبي في طور اليرقة", "تناظر جانبي عند البلوغ", "تناظر شعاعي في طور اليرقة", "عديم التناظر"],
    answer: 0,
    explanation: "تكون يرقات شوكيات الجلد، ومنها نجم البحر الهش، ذات تناظر جانبي، ثم يظهر التناظر الشعاعي الخماسي في الطور البالغ.",
  },
  {
    id: "6ad0150c63cd9c24f9f4194b", page: 61, number: 73,
    text: "أي عضية خلوية مسؤولة أساسًا عن إنتاج معظم ATP في الخلية؟",
    options: ["الفجوات", "الميتوكوندريا", "المريكزات", "الريبوسومات"],
    answer: 1,
    explanation: "تنتج الميتوكوندريا معظم ATP عبر التنفس الخلوي الهوائي؛ أما الريبوسومات فتصنع البروتينات.",
  },
  {
    id: "6ad0150c63cd9c24f9f4194c", page: 61, number: 74,
    text: "ما التركيب الذي يساعد الأسماك على استشعار حركة الماء والاهتزازات؟",
    options: ["جهاز الخط الجانبي", "القشور", "جهاز الدوران", "الزعانف"],
    answer: 0,
    explanation: "تلتقط مستقبلات جهاز الخط الجانبي حركة الماء والاهتزازات حول السمكة، فتساعدها على تحديد حركة الأجسام والاتزان المكاني.",
  },
  {
    id: "6ad0150c63cd9c24f9f4194e", page: 62, number: 76,
    text: "أي تكيف يقلل كتلة الطائر بتقليل حمل الفضلات النيتروجينية أثناء الطيران؟",
    options: ["غياب المثانة البولية في معظم الطيور", "امتلاك غدد زيتية", "ثبات درجة الحرارة", "وجود الريش"],
    answer: 0,
    explanation: "تطرح معظم الطيور الفضلات النيتروجينية على هيئة حمض اليوريك شبه الصلب ولا تمتلك مثانة بولية، ما يقلل كتلة الماء والفضلات المحمولة. صيغ السؤال لتحديد هذا التكيف بدل جمعه مع الريش، الذي يساعد أيضًا على الطيران.",
  },
] as const;

const rejected = [
  {
    id: "6ad0150c63cd9c24f9f4194d", page: 61, number: 75,
    note: "حُجب السؤال: الخياران «تقضي وقتًا أقل في الطور البيني» و«لا تستجيب طبيعيًا لإشارات تنظيم دورة الخلية» يمكن أن يصفا الخلايا السرطانية، فلا يوجد اختيار وحيد موثوق بصيغته الحالية.",
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
          reviewerNotes: "تمت مراجعة الإجابة علميًا، وتنقيح صياغة السؤال أو الخيار عند الحاجة، وإضافة شرح توضيحي.",
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
