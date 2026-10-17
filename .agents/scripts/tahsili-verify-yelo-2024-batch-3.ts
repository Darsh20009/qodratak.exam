import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f41904", page: 20, number: 1,
    text: "أي عبارة لا تصف قوة الطرد المركزي الظاهرية في إطار مرجعي دوّار؟",
    options: ["قوة حقيقية مستقلة", "يُخيّل للراكب أنها تدفعه إلى الخارج", "تُفسر بالقصور الذاتي وقانون نيوتن الأول", "تظهر في الوصف أثناء الانعطاف بحركة دائرية"],
    answer: 0,
    explanation: "قوة الطرد المركزي قوة ظاهرية تُستخدم لوصف الحركة من إطار دوّار، وليست قوة حقيقية مستقلة تؤثر إلى الخارج في إطار عطالي.",
  },
  {
    id: "6ad0150c63cd9c24f9f41905", page: 20, number: 2,
    text: "في علاقة دي برولي λ=h/(mv)، ماذا تمثل λ؟",
    options: ["الزخم", "التردد", "السعة", "الطول الموجي"],
    answer: 3,
    explanation: "تعطي علاقة دي برولي λ=h/p، حيث p=mv هو الزخم؛ لذلك تمثل λ الطول الموجي المصاحب للجسيم.",
  },
  {
    id: "6ad0150c63cd9c24f9f41906", page: 21, number: 4,
    text: "ما الجهاز المستخدم لفصل الأيونات بحسب نسبة كتلتها إلى شحنتها؟",
    options: ["المجهر النفقي الماسح", "أنبوب الأشعة السينية", "الليزر", "مطياف الكتلة"],
    answer: 3,
    explanation: "يفصل مطياف الكتلة الأيونات وفق نسبة الكتلة إلى الشحنة باستخدام المجالات الكهربائية أو المغناطيسية، ثم يكشفها.",
  },
  {
    id: "6ad0150c63cd9c24f9f41907", page: 21, number: 5,
    text: "أي تغييرين يقللان مقاومة سلك فلزي، مع ثبات مادته؟",
    options: ["رفع درجة الحرارة وتقليل مساحة المقطع", "خفض درجة الحرارة وتقليل مساحة المقطع", "خفض درجة الحرارة وزيادة مساحة المقطع", "رفع درجة الحرارة وزيادة مساحة المقطع"],
    answer: 2,
    explanation: "للفلزات تزداد المقاومية عادةً بارتفاع درجة الحرارة، كما أن R=ρL/A. لذا يخفض تبريد السلك المقاومية، وتخفض زيادة مساحة مقطعه المقاومة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41909", page: 22, number: 7,
    text: "ما الخطوة التي تُستخدم لاختبار الفرضية العلمية؟",
    options: ["إجراء تجربة", "التحليل", "الملاحظة فقط", "الاستنتاج"],
    answer: 0,
    explanation: "تُختبر الفرضية بتصميم تجربة أو جمع بيانات مناسبة، ثم تحليل النتائج لتحديد مدى دعمها للفرضية.",
  },
  {
    id: "6ad0150c63cd9c24f9f4190a", page: 22, number: 8,
    text: "ثلاث مقاومات 3Ω و6Ω و9Ω موصولة على التوالي. ما مقاومتها المكافئة؟",
    options: ["18Ω", "9Ω", "3Ω", "1.63Ω"],
    answer: 0,
    explanation: "في التوصيل على التوالي تُجمع المقاومات: Rالمكافئة=3+6+9=18Ω.",
  },
  {
    id: "6ad0150c63cd9c24f9f4190b", page: 23, number: 11,
    text: "في الترانزستور الموضح، ما وظيفة الأطراف ذات الأرقام (3،2،1) على الترتيب؟",
    options: ["قاعدة، باعث، جامع", "جامع، قاعدة، باعث", "جامع، باعث، قاعدة", "باعث، جامع، قاعدة"],
    answer: 0,
    explanation: "من تسميات الرسم: الطرف 3 هو القاعدة B، والطرف 2 هو الباعث E، والطرف 1 هو الجامع C؛ فالترتيب المطلوب قاعدة ثم باعث ثم جامع.",
  },
  {
    id: "6ad0150c63cd9c24f9f4190c", page: 24, number: 14,
    text: "إذا كان جهد المصدر مرتفعًا ونريد خفض جهد الخرج، فما الجهاز المناسب؟",
    options: ["محول رافع للجهد", "محول خافض للجهد", "مغير جهد عام", "مجزئ جهد"],
    answer: 1,
    explanation: "يستخدم محول خافض للجهد للحصول على جهد خرج أقل من جهد الدخل في أنظمة التيار المتناوب.",
  },
  {
    id: "6ad0150c63cd9c24f9f4190d", page: 24, number: 15,
    text: "نواة السيزيوم-132 عددها الذري 55. كم عدد النيوترونات فيها؟",
    options: ["55", "77", "132", "187"],
    answer: 1,
    explanation: "عدد النيوترونات = العدد الكتلي − العدد الذري =132−55=77.",
  },
  {
    id: "6ad0150c63cd9c24f9f4190e", page: 25, number: 17,
    text: "أي الحالات الآتية تنتج طاقة حرارية دون اعتمادها على الإشعاع الكهرومغناطيسي؟",
    options: ["حروق الجلد بعد التعرض للشمس", "تسخين الطعام بالميكروويف", "احتراق الغابات بسبب عدسة زجاجية", "تدفئة اليدين بفركهما"],
    answer: 3,
    explanation: "يحوّل الاحتكاك بين اليدين الشغل الميكانيكي إلى طاقة داخلية وحرارة، من دون الحاجة إلى إشعاع كهرومغناطيسي.",
  },
  {
    id: "6ad0150c63cd9c24f9f4190f", page: 26, number: 19,
    text: "ما المسافة بين قمتين متتاليتين في موجة دورية؟",
    options: ["موجة موقوفة", "التردد", "الطول الموجي", "سرعة الصوت"],
    answer: 2,
    explanation: "المسافة بين نقطتين متتاليتين لهما الطور نفسه، مثل قمتين متتاليتين، هي الطول الموجي.",
  },
  {
    id: "6ad0150c63cd9c24f9f41910", page: 26, number: 21,
    text: "تحتوي نواة X على 10 بروتونات و12 نيوترونًا. ما رمزها النووي؟",
    options: ["²²₁₀X", "¹⁰₂₂X", "¹²₁₀X", "¹⁰₁₂X"],
    answer: 0,
    explanation: "العدد الذري يساوي عدد البروتونات 10، والعدد الكتلي يساوي البروتونات مع النيوترونات 10+12=22؛ لذا الرمز ²²₁₀X.",
  },
  {
    id: "6ad0150c63cd9c24f9f41911", page: 27, number: 22,
    text: "ينص أي مبدأ على استحالة قياس موضع جسيم وزخمه معًا بدقة مطلقة في الوقت نفسه؟",
    options: ["مبدأ هايزنبرغ لعدم اليقين", "مبدأ دي برولي", "مبدأ أينشتاين", "تأثير كومبتون"],
    answer: 0,
    explanation: "ينص مبدأ عدم اليقين لهايزنبرغ على وجود حد أساسي لدقة تحديد الموضع والزخم معًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f41912", page: 27, number: 23,
    text: "موجة زمنها الدوري 10s. ما ترددها؟",
    options: ["0.1Hz", "1Hz", "10Hz", "100Hz"],
    answer: 0,
    explanation: "التردد هو مقلوب الزمن الدوري: f=1/T=1/10=0.1Hz.",
  },
  {
    id: "6ad0150c63cd9c24f9f41913", page: 28, number: 25,
    text: "ما الكمية الفيزيائية التي تساوي المساحة تحت منحنى القوة مقابل الزمن؟",
    options: ["الزخم", "السرعة", "التسارع", "الدفع"],
    answer: 3,
    explanation: "تكامل القوة بالنسبة إلى الزمن يساوي الدفع، وهو يساوي التغير في الزخم.",
  },
  {
    id: "6ad0150c63cd9c24f9f41914", page: 30, number: 32,
    text: "مع ثبات طول الموصل ومادته ودرجة حرارته، تتناسب مقاومته عكسيًا مع:",
    options: ["طوله", "مساحة مقطعه", "درجة حرارته", "نوع مادته"],
    answer: 1,
    explanation: "من العلاقة R=ρL/A، تتناسب مقاومة الموصل عكسيًا مع مساحة مقطعه A عند ثبات العوامل الأخرى.",
  },
  {
    id: "6ad0150c63cd9c24f9f41915", page: 30, number: 33,
    text: "يسقط ضوء طوله الموجي 300nm على فلز طول موجة العتبة له 200nm. هل تنبعث إلكترونات ضوئية؟",
    options: ["تتحرر", "تتحرك فقط", "تتحرر وتتحرك", "لا تتحرر"],
    answer: 3,
    explanation: "طول الموجة الساقط 300nm أكبر من طول موجة العتبة 200nm، أي أن طاقة الفوتون أقل من دالة الشغل؛ لذلك لا يحدث انبعاث ضوئي. مفتاح المصدر المنشور يخالف هذا الاستنتاج وصُحح هنا.",
  },
] as const;

const rejected = [
  {
    id: "6ad0150c63cd9c24f9f41908", page: 21, number: 6,
    note: "حُجب السؤال: يتضمن خيارين متجهيين، فالقوة كمية متجهة والسرعة المتجهة موصوفة باتجاه السقوط إلى أسفل. لا توجد إجابة وحيدة من الخيارات المطبوعة.",
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
          subject: "فيزياء",
          subcategory: "فيزياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || "فيزياء",
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
          reviewerNotes: "تمت مراجعة صياغة السؤال وحلّه وخياراته مقابل المصدر والتحقق الفيزيائي، وأضيف شرح توضيحي.",
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
