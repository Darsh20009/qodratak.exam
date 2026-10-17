import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-physics-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103463cd9c24f9f41744",
    page: 3,
    number: 2,
    text: "وزن رائد فضاء على سطح الأرض 980 N، ووزنه على كوكب آخر 490 N. إذا كان تسارع الجاذبية على الأرض 9.8 m/s²، فما تسارع الجاذبية على الكوكب الآخر؟",
    options: ["9.8 m/s²", "7.35 m/s²", "4.9 m/s²", "2.45 m/s²"],
    answer: 2,
    explanation: "كتلة رائد الفضاء = 980÷9.8=100 kg. وعلى الكوكب الآخر g=الوزن÷الكتلة=490÷100=4.9 m/s².",
  },
  {
    id: "6ad0103463cd9c24f9f41745",
    page: 3,
    number: 3,
    text: "قذف شخص جسمًا كتلته 0.1 kg إلى صندوق. وصل الجسم إلى قاع الصندوق بعد 0.5 s. ما سرعته لحظة الاصطدام إذا كان g=9.8 m/s² وبدأ من السكون؟",
    options: ["0.049 m/s", "49 m/s", "4.9 m/s", "9.8 m/s"],
    answer: 2,
    explanation: "من v_f=v_i+gt، والجسم بدأ من السكون: v_f=0+9.8×0.5=4.9 m/s.",
  },
  {
    id: "6ad0103463cd9c24f9f41746",
    page: 3,
    number: 4,
    text: "أطلقت قذيفة بسرعة ابتدائية 10 m/s، واستمرت في التسارع بمقدار 5 m/s² لمدة 10 s قبل أن تستقر في الهدف. ما الإزاحة التي قطعتها؟",
    options: ["350 m", "150 m", "25 m", "625 m"],
    answer: 0,
    explanation: "نستخدم Δd=vᵢt+½at². بالتعويض: 10×10+½×5×10²=100+250=350 m.",
  },
  {
    id: "6ad0103463cd9c24f9f41748",
    page: 3,
    number: 6,
    text: "سقط جسم سقوطًا حرًا لمدة 2 s. ما سرعته بعد ثانيتين إذا كان g=9.8 m/s² وبدأ من السكون؟",
    options: ["9.8 m/s", "19.6 m/s", "4.9 m/s", "29.4 m/s"],
    answer: 1,
    explanation: "من v_f=v_i+gt، وبما أن الجسم بدأ من السكون: v_f=0+9.8×2=19.6 m/s.",
  },
  {
    id: "6ad0103463cd9c24f9f41749",
    page: 3,
    number: 7,
    text: "في العلاقة المتجهة FΔt=mΔv، ما الكميات المتجهة؟",
    options: ["الكتلة والسرعة والدفع", "الزمن والقوة والسرعة", "القوة والزمن والكتلة", "الدفع والقوة والتغير في السرعة"],
    answer: 3,
    explanation: "القوة والتغير في السرعة كميتان متجهتان، وكذلك الدفع FΔt لأنه يساوي التغير في الزخم. أما الكتلة والزمن فكميتان قياسيتان.",
  },
  {
    id: "6ad0103463cd9c24f9f4174a",
    page: 4,
    number: 8,
    text: "جسم وزنه W وكتلته M عند سطح الأرض. ماذا يحدث لوزنه وكتلته عند ارتفاعه كثيرًا عن سطح الأرض؟",
    options: ["تقل كتلته M ويبقى وزنه W ثابتًا", "يقل وزنه W وتزداد كتلته M", "يقل وزنه W وتبقى كتلته M ثابتة", "تزداد كل من كتلته M ووزنه W"],
    answer: 2,
    explanation: "الكتلة خاصية ثابتة للجسم، أما الوزن فيعتمد على مجال الجاذبية. وبالابتعاد عن الأرض تقل الجاذبية، فيقل الوزن وتبقى الكتلة ثابتة.",
  },
  {
    id: "6ad0103463cd9c24f9f4174c",
    page: 4,
    number: 11,
    text: "تُطعَّم شبه الموصل من النوع n بذرات مانحة للإلكترونات. ما تكافؤ ذرات الشائبة المانحة؟",
    options: ["ثنائي", "ثلاثي", "رباعي", "خماسي"],
    answer: 3,
    explanation: "الشائبة المانحة في شبه الموصل من النوع n تكون خماسية التكافؤ؛ إذ تملك خمسة إلكترونات تكافؤ، ويمكنها توفير إلكترون حر إضافي.",
  },
  {
    id: "6ad0103463cd9c24f9f4174d",
    page: 4,
    number: 12,
    text: "ما مقدار العزم بوحدة N·m الناتج عن قوة مقدارها 40 N تؤثر عموديًا على ذراع طوله 110 cm؟",
    options: ["44 N·m", "60 N·m", "150 N·m", "200 N·m"],
    answer: 0,
    explanation: "نحوّل طول الذراع: 110 cm=1.10 m. ولأن القوة عمودية، τ=Fr=40×1.10=44 N·m.",
  },
  {
    id: "6ad0103463cd9c24f9f4174f",
    page: 4,
    number: 14,
    text: "يتكون الملف الابتدائي لمحول من 600 لفة والثانوي من 1800 لفة. إذا كان جهد الملف الابتدائي 110 V، فما جهد الملف الثانوي؟",
    options: ["1115 V", "1090 V", "630 V", "330 V"],
    answer: 3,
    explanation: "في المحول المثالي Vₛ/Vₚ=Nₛ/Nₚ. إذن Vₛ=110×(1800÷600)=330 V.",
  },
  {
    id: "6ad0103463cd9c24f9f41750",
    page: 5,
    number: 15,
    text: "عند تحلل الراديوم-226 بإصدار جسيم ألفا، ما النواة الناتجة؟",
    options: ["Rn-222", "Fr-223", "Ac-227", "Th-232"],
    answer: 0,
    explanation: "جسيم ألفا يحمل عددًا كتليًا 4 وعددًا ذريًا 2. لذلك يصبح العدد الكتلي 226−4=222 والعدد الذري 88−2=86، أي Rn-222.",
  },
  {
    id: "6ad0103463cd9c24f9f41751",
    page: 5,
    number: 16,
    text: "أي انتقال إلكتروني في ذرة الهيدروجين يصدر فوتونًا بأكبر تردد؟",
    options: ["E₆ → E₃", "E₆ → E₂", "E₃ → E₂", "E₂ → E₇"],
    answer: 1,
    explanation: "طاقة الفوتون تساوي مقدار فرق طاقتي المستويين. أكبر هبوط بين الانتقالات المنبعثة هنا هو من المستوى السادس إلى الثاني، لذا يكون تردده الأكبر.",
  },
  {
    id: "6ad0103563cd9c24f9f41754",
    page: 5,
    number: 19,
    text: "ما وحدة قياس مستوى شدة الصوت؟",
    options: ["الهرتز", "البار", "الديسيبل", "الفولت"],
    answer: 2,
    explanation: "يقاس مستوى شدة الصوت بالديسيبل (dB). الهرتز وحدة التردد، والبار وحدة ضغط، والفولت وحدة فرق الجهد.",
  },
  {
    id: "6ad0103563cd9c24f9f41755",
    page: 5,
    number: 20,
    text: "مم تتكون أشعة جاما؟",
    options: ["فوتونات ذات طاقة عالية", "جسيمات متفاوتة", "جسيمات موجبة", "إلكترونات تنبعث من النواة"],
    answer: 0,
    explanation: "أشعة جاما إشعاع كهرومغناطيسي عالي الطاقة، ويتكون من فوتونات، وليس من جسيمات ألفا أو إلكترونات.",
  },
  {
    id: "6ad0103563cd9c24f9f41756",
    page: 5,
    number: 21,
    text: "ما وزن جسم كتلته 15 kg إذا كان g=10 m/s²؟",
    options: ["⅔ N", "3/2 N", "150 N", "1500 N"],
    answer: 2,
    explanation: "الوزن W=mg=15×10=150 N.",
  },
  {
    id: "6ad0103563cd9c24f9f41757",
    page: 5,
    number: 23,
    text: "كتلة جسم 3 kg على سطح أفقي، ومعامل الاحتكاك الحركي μₖ=0.3. ما مقدار قوة الاحتكاك إذا كان g=10 m/s²؟",
    options: ["10 N", "9 N", "0.9 N", "0.1 N"],
    answer: 1,
    explanation: "على سطح أفقي تكون القوة العمودية N=mg=3×10=30 N. إذن fₖ=μₖN=0.3×30=9 N.",
  },
] as const;

const rejections = [
  {
    id: "6ad0103463cd9c24f9f4174b",
    page: 4,
    number: 10,
    note: "مرفوض من البنك المنشور: صياغة المصدر تسأل عن نوع ترانزستور، لكن بها خياران صالحان (NPN وPNP) ولا تحدد أيهما مطلوب.",
  },
  {
    id: "6ad0103563cd9c24f9f41753",
    page: 5,
    number: 18,
    note: "مرفوض من البنك المنشور: متن السؤال مبتور بعد عبارة «يمثل مجموعة من» ولا يحدد ما الذي تمثله المصطلحات، فلا يمكن تعيين إجابة وحيدة من المصدر.",
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
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} pending source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) {
      failures.push(`q${item.number}: source/page mismatch`);
      continue;
    }
    if (!Array.isArray(item.options) || item.options.length !== 4 ||
      !item.options[item.answer] || item.options.some((option) => !option.trim())) {
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
          subcategory: draft.subcategory || "فيزياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "فيزياء",
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
          reviewerNotes: "تمت مطابقة نص السؤال والخيارات والحل مع المصدر؛ نُظفت الصياغة وأضيف شرح خطوة بخطوة.",
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
