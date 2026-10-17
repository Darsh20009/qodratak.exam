import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-chemistry-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f417e0",
    page: 9,
    number: 69,
    text: "أي البيانات الآتية عن الورقة التي معك بيانات كمية؟",
    options: ["لونها", "مقاسها", "رائحتها", "شكلها"],
    answer: 1,
    explanation: "مقاس الورقة يمكن قياسه وتعبيره بأرقام ووحدات، لذا فهو بيان كمي. اللون والرائحة والشكل أوصاف نوعية.",
  },
  {
    id: "6ad0103563cd9c24f9f417e1",
    page: 9,
    number: 70,
    text: "ما أكبر عدد من الإلكترونات يمكن أن يوجد في مستوى الطاقة الرئيس الثاني؟",
    options: ["2", "8", "18", "32"],
    answer: 1,
    explanation: "سعة مستوى الطاقة الرئيس تعطى بالعلاقة 2n². للمستوى الثاني n=2، فتكون سعته 2×2²=8 إلكترونات.",
  },
  {
    id: "6ad0103563cd9c24f9f417e2",
    page: 9,
    number: 71,
    text: "تحلل الراديوم-226 بانبعاث جسيم ألفا. ما النواة الناتجة؟",
    options: ["الرادون-222 (Rn)", "الفرانسيوم-223 (Fr)", "الأكتينيوم-227 (Ac)", "الثوريوم-232 (Th)"],
    answer: 0,
    explanation: "في انبعاث ألفا ينقص العدد الكتلي 4 والعدد الذري 2؛ لذلك Ra-226 (Z=88) يتحول إلى Rn-222 (Z=86).",
  },
  {
    id: "6ad0103563cd9c24f9f417e3",
    page: 9,
    number: 72,
    text: "عند انبعاث جسيم ألفا من نواة، كيف يتغير العدد الذري Z والعدد الكتلي A؟",
    options: ["Z+2 وA+4", "Z−2 وA+4", "Z+2 وA−4", "Z−2 وA−4"],
    answer: 3,
    explanation: "جسيم ألفا يتكون من بروتونين ونيوترونين؛ لذلك ينقص العدد الذري بمقدار 2 والعدد الكتلي بمقدار 4.",
  },
  {
    id: "6ad0103563cd9c24f9f417e4",
    page: 9,
    number: 73,
    text: "كم عدد الأوربيتالات في المجال الفرعي p؟",
    options: ["1", "3", "5", "7"],
    answer: 1,
    explanation: "يتكون المجال الفرعي p من ثلاثة أوربيتالات متعامدة، ويستوعب بحد أقصى ستة إلكترونات.",
  },
  {
    id: "6ad0103563cd9c24f9f417e5",
    page: 9,
    number: 75,
    text: "كيف تتناسب طاقة الفوتون مع طوله الموجي؟",
    options: ["طرديًا", "عكسيًا مع التردد", "عكسيًا مع الطول الموجي", "طرديًا مع الكتلة"],
    answer: 2,
    explanation: "طاقة الفوتون E=hc/λ؛ لذلك تتناسب عكسيًا مع الطول الموجي.",
  },
  {
    id: "6ad0103563cd9c24f9f417e6",
    page: 9,
    number: 76,
    text: "ما عدد النيوترونات في نواة السيزيوم-132، إذا كان عدده الذري 55؟",
    options: ["55", "132", "77", "187"],
    answer: 2,
    explanation: "عدد النيوترونات=A−Z=132−55=77.",
  },
  {
    id: "6ad0103563cd9c24f9f417e7",
    page: 9,
    number: 77,
    text: "ما النسبة الأساسية التي تساعد على تقدير استقرار النواة؟",
    options: ["النيوترونات إلى الإلكترونات", "الإلكترونات إلى النيوترونات", "البروتونات إلى الإلكترونات", "النيوترونات إلى البروتونات"],
    answer: 3,
    explanation: "يرتبط استقرار النواة بنسبة النيوترونات إلى البروتونات؛ وتتغير النسبة المستقرة باختلاف العدد الذري.",
  },
  {
    id: "6ad0103563cd9c24f9f417e8",
    page: 9,
    number: 78,
    text: "لماذا تكون الذرة المتعادلة كهربائيًا متعادلة الشحنة؟",
    options: ["لأن عدد البروتونات يساوي عدد النيوترونات", "لأن عدد الإلكترونات يساوي عدد النيوترونات", "لأن عدد البروتونات يساوي عدد الإلكترونات", "لأن جسيمات نواتها غير مشحونة"],
    answer: 2,
    explanation: "في الذرة المتعادلة يتساوى عدد البروتونات الموجبة مع عدد الإلكترونات السالبة، فتكون محصلة الشحنة صفرًا.",
  },
  {
    id: "6ad0103563cd9c24f9f417e9",
    page: 9,
    number: 79,
    text: "ما الذي يتغير عند انبعاث فوتون جاما من نواة؟",
    options: ["يزداد العدد الكتلي بمقدار 1", "ينقص العدد الكتلي بمقدار 1", "يزداد العدد الذري بمقدار 1", "لا يتغير العدد الكتلي ولا العدد الذري"],
    answer: 3,
    explanation: "انبعاث جاما يحرر طاقة من نواة مثارة دون تغيير عدد بروتوناتها أو نيوتروناتها؛ لذا لا يتغير A أو Z.",
  },
  {
    id: "6ad0103563cd9c24f9f417ea",
    page: 9,
    number: 80,
    text: "ما التوزيع الإلكتروني لأيون الصوديوم Na⁺؟ (العدد الذري للصوديوم 11)",
    options: ["1s² 2s² 2p⁶ 3s²", "1s² 2s² 2p⁶ 3s¹", "1s² 2s² 2p⁶", "1s² 2s² 2p⁵ 3s²"],
    answer: 2,
    explanation: "تفقد ذرة الصوديوم إلكترون 3s واحدًا لتصبح Na⁺ ذات 10 إلكترونات، وتوزيعها 1s² 2s² 2p⁶.",
  },
  {
    id: "6ad0103563cd9c24f9f417eb",
    page: 10,
    number: 81,
    text: "ما الحالة الفيزيائية للزئبق عند درجة حرارة الغرفة؟",
    options: ["صلب", "سائل", "غاز", "بلازما"],
    answer: 1,
    explanation: "الزئبق سائل عند درجة حرارة الغرفة والضغط الجوي المعتاد، بخلاف معظم الفلزات.",
  },
  {
    id: "6ad0103563cd9c24f9f417ec",
    page: 10,
    number: 83,
    text: "أي الجزيئات الآتية قطبي؟",
    options: ["H₂O", "Cl₂", "CO₂", "CH₄"],
    answer: 0,
    explanation: "جزيء الماء منحني الشكل وروابط O–H قطبية لا تتلاشى محصلتها، لذا فالجزيء قطبي. أما الخيارات الأخرى فغير قطبية بسبب تماثلها.",
  },
  {
    id: "6ad0103563cd9c24f9f417ed",
    page: 10,
    number: 84,
    text: "ما اسم الترتيب ثلاثي الأبعاد الذي تنتظم فيه الأيونات الموجبة والسالبة بالتناوب في البلورة الأيونية؟",
    options: ["الشبكة البلورية", "شبكة الألماس", "شبكة الجزيئات", "الشبكة الفلزية"],
    answer: 0,
    explanation: "ترتب الأيونات في البلورة الأيونية بنمط متكرر ثلاثي الأبعاد يسمى الشبكة البلورية.",
  },
  {
    id: "6ad0103563cd9c24f9f417ee",
    page: 10,
    number: 85,
    text: "ما الاسم الكيميائي للمركب (NH₄)₃PO₄؟",
    options: ["أسيتات الأمونيوم", "فوسفات الأمونيوم", "كبريتات الأمونيوم", "كربونات الأمونيوم"],
    answer: 1,
    explanation: "يتكون المركب من أيونات الأمونيوم NH₄⁺ وأيون الفوسفات PO₄³⁻، واسمه فوسفات الأمونيوم.",
  },
  {
    id: "6ad0103563cd9c24f9f417ef",
    page: 10,
    number: 86,
    text: "أي التفاعلات الآتية تفاعل إحلال بسيط؟",
    options: [
      "2Li + 2H₂O → 2LiOH + H₂",
      "N₂O₅ + H₂O → 2HNO₃",
      "2Al + 3S → Al₂S₃",
      "2NO₂ + O₂ → 2N₂O₅",
    ],
    answer: 0,
    explanation: "في التفاعل الأول يحل الليثيوم محل الهيدروجين في الماء، أما الخيارات الأخرى فتفاعلات تكوين.",
  },
  {
    id: "6ad0103563cd9c24f9f417f0",
    page: 10,
    number: 87,
    text: "ما نوع التفاعل العام A + BX → AX + B؟",
    options: ["تفكك", "إحلال بسيط", "إحلال مزدوج", "تكوين"],
    answer: 1,
    explanation: "يحل العنصر A محل B في المركب BX، لذلك يصنف التفاعل إحلالًا بسيطًا.",
  },
  {
    id: "6ad0103563cd9c24f9f417f1",
    page: 10,
    number: 89,
    text: "يُظهر التوزيع الإلكتروني 1s² 2s² 2p³. في أي دورة يقع العنصر؟",
    options: ["الأولى", "الثانية", "الثالثة", "الرابعة"],
    answer: 1,
    explanation: "رقم الدورة يساوي أكبر رقم مستوى رئيس مشغول؛ وأكبر مستوى هنا n=2، لذلك يقع العنصر في الدورة الثانية.",
  },
  {
    id: "6ad0103563cd9c24f9f417f2",
    page: 10,
    number: 90,
    text: "أي الهالوجينات الآتية أقل طاقة تأين أولى؟",
    options: ["F", "Cl", "Br", "I"],
    answer: 3,
    explanation: "تقل طاقة التأين عمومًا نزولًا في المجموعة بسبب زيادة نصف القطر والحجب؛ لذا يكون اليود الأقل بين الخيارات.",
  },
  {
    id: "6ad0103563cd9c24f9f417f3",
    page: 10,
    number: 91,
    text: "أي العناصر الآتية أعلى كهروسالبية؟",
    options: ["الفلور", "الكلور", "البروم", "اليود"],
    answer: 0,
    explanation: "الفلور أعلى العناصر كهروسالبية؛ إذ يجذب إلكترونات الرابطة بقوة كبيرة.",
  },
  {
    id: "6ad0103563cd9c24f9f417f4",
    page: 11,
    number: 92,
    text: "ما الصيغة الأولية للجلوكوز C₆H₁₂O₆؟",
    options: ["C₃H₆O₃", "C₂H₄O₂", "CH₂O", "CHO"],
    answer: 2,
    explanation: "نقسم الأعداد في الصيغة الجزيئية على أكبر قاسم مشترك 6: C₆H₁₂O₆ تصبح CH₂O.",
  },
  {
    id: "6ad0103563cd9c24f9f417f5",
    page: 11,
    number: 93,
    text: "أي المعادلات الآتية تمثل احتراق الميثان احتراقًا تامًا؟",
    options: [
      "H₂ + Cl₂ → 2HCl",
      "Mg + 2HCl → MgCl₂ + H₂",
      "KOH + HNO₃ → KNO₃ + H₂O",
      "CH₄ + 2O₂ → CO₂ + 2H₂O",
    ],
    answer: 3,
    explanation: "الاحتراق التام للهيدروكربون بوجود الأكسجين ينتج ثاني أكسيد الكربون والماء. المعادلة الرابعة موزونة.",
  },
  {
    id: "6ad0103563cd9c24f9f417f6",
    page: 11,
    number: 94,
    text: "أي المعادلات الآتية تمثل الاحتراق التام الموزون للإيثانول C₂H₅OH؟",
    options: [
      "C₂H₅OH(l) + O₂(g) → CO₂(g) + H₂O(g)",
      "C₂H₅OH(l) + 3H₂(g) → 2CO₂(g) + 3H₂O(g)",
      "C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(g)",
      "C₂H₅OH(l) + 3O₂(l) → 2CO₂(g) + 3H₂O(l)",
    ],
    answer: 2,
    explanation: "الاحتراق التام ينتج CO₂ وH₂O. المعادلة الثالثة موزونة: ذرتا كربون، وست ذرات هيدروجين، وسبع ذرات أكسجين على كل طرف، والأكسجين متفاعل غازي.",
  },
  {
    id: "6ad0103563cd9c24f9f417f7",
    page: 11,
    number: 95,
    text: "ما اسم قوة التجاذب بين الأيونات الموجبة للفلز وإلكترونات التكافؤ الحرة؟",
    options: ["الرابطة الأيونية", "الرابطة الفلزية", "الرابطة التساهمية", "الرابطة التناسقية"],
    answer: 1,
    explanation: "تنشأ الرابطة الفلزية من تجاذب الأيونات الفلزية الموجبة مع إلكترونات التكافؤ غير المتمركزة في البلورة.",
  },
  {
    id: "6ad0103563cd9c24f9f417f8",
    page: 11,
    number: 96,
    text: "ما الصيغة الصحيحة لنترات المغنيسيوم؟",
    options: ["MgNO₃", "MgSO₄", "Mg(NO₃)₂", "MgCO₃"],
    answer: 2,
    explanation: "شحنة أيون المغنيسيوم +2 وشحنة النترات −1؛ لذا يلزم أيونا نترات لكل أيون مغنيسيوم: Mg(NO₃)₂.",
  },
  {
    id: "6ad0103563cd9c24f9f417f9",
    page: 11,
    number: 97,
    text: "على أي حالات المادة تطلق خاصية الميوعة؟",
    options: ["الغازات والسوائل", "الغازات فقط", "السوائل فقط", "المواد الصلبة والسوائل"],
    answer: 0,
    explanation: "الميوعة هي قابلية المادة للانسياب، وتظهر في السوائل والغازات ولا تظهر في المواد الصلبة.",
  },
  {
    id: "6ad0103563cd9c24f9f417fa",
    page: 11,
    number: 99,
    text: "أي الظروف تجعل الغاز الحقيقي أقرب إلى سلوك الغاز المثالي؟",
    options: ["ضغط أعلى وحرارة أعلى", "ضغط أقل وحرارة أقل", "ضغط أقل وحرارة أعلى", "ضغط أعلى وحرارة أقل"],
    answer: 2,
    explanation: "عند ضغط منخفض تتباعد الجسيمات، وعند درجة حرارة مرتفعة تقل أهمية قوى التجاذب مقارنة بطاقة حركتها؛ فيقترب الغاز الحقيقي من السلوك المثالي.",
  },
  {
    id: "6ad0103563cd9c24f9f417fb",
    page: 11,
    number: 100,
    text: "لتحضير 1000 mL من محلول HCl مائي تركيزه 5% بالحجم، ما الكميتان المناسبتان؟",
    options: [
      "50 mL من HCl و950 mL من الماء",
      "950 mL من HCl و5 mL من الماء",
      "5 mL من HCl و950 mL من الماء",
      "5 mL من HCl و1000 mL من الماء",
    ],
    answer: 0,
    explanation: "النسبة الحجمية 5% من 1000 mL تساوي 50 mL من المذاب، ويُستكمل الحجم إلى 1000 mL بالماء. عند التحضير أضف الحمض إلى الماء بحذر، لا الماء إلى الحمض.",
  },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this review is authorized for Replit preview only.`);
  }
  const ids = approvals.map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({
    _id: { $in: ids },
    sourceId: SOURCE_ID,
    status: "pending_review",
  })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== approvals.length) failures.push(`expected ${approvals.length} pending source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) failures.push(`q${item.number}: source/page mismatch`);
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
    rejected: 0,
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
          subcategory: draft.subcategory || "كيمياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "كيمياء",
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
          reviewerNotes: "تمت مراجعة نص السؤال والخيارات والحل مع المصدر، وأضيف شرح توضيحي.",
          updatedAt: reviewedAt,
        },
      },
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
