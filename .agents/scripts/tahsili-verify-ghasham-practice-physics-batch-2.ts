import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-physics-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f41758",
    page: 6,
    number: 25,
    text: "تحركت سيارة من النقطة A مسافة 3 km شمالًا، ثم 4 km شرقًا حتى وصلت إلى النقطة B. ما مقدار إزاحتها؟",
    options: ["1 km", "5 km", "7 km", "12 km"],
    answer: 1,
    explanation: "المساران متعامدان؛ مقدار الإزاحة هو طول الوتر: √(3²+4²)=√25=5 km.",
  },
  {
    id: "6ad0103563cd9c24f9f4175a",
    page: 6,
    number: 28,
    text: "الطاقة لا تفنى ولا تُستحدث من العدم. إلى ماذا تشير هذه العبارة؟",
    options: ["نظرية", "فرضية", "قانون", "استنتاج"],
    answer: 2,
    explanation: "هذه صياغة لقانون حفظ الطاقة: لا تفنى الطاقة ولا تُستحدث من العدم، وإنما تتحول من صورة إلى أخرى.",
  },
  {
    id: "6ad0103563cd9c24f9f4175b",
    page: 6,
    number: 29,
    text: "وفق نظرية أينشتاين للضوء، أي العبارات التالية خاطئة؟",
    options: ["يتكون الضوء من حزم مكمّاة من الطاقة", "يتكون الضوء من حزم متصلة من الطاقة", "تعتمد طاقة الفوتون على تردده", "طاقة الفوتون تساوي hf"],
    answer: 1,
    explanation: "الضوء يتبادل الطاقة على هيئة كمّات منفصلة (فوتونات)، لا على هيئة حزم متصلة. أما طاقة الفوتون فتساوي hf.",
  },
  {
    id: "6ad0103563cd9c24f9f4175c",
    page: 6,
    number: 30,
    text: "أثّر شخص بقوة مقدارها 55 N في صندوق، لكن الصندوق لم يتحرك. ما الشغل الذي بذلته القوة؟",
    options: ["0 J", "37 J", "18 J", "55 J"],
    answer: 0,
    explanation: "الشغل W=Fd cosθ، ويتطلب حدوث إزاحة. بما أن الصندوق لم يتحرك فالإزاحة صفر، وبالتالي الشغل صفر.",
  },
  {
    id: "6ad0103563cd9c24f9f4175d",
    page: 7,
    number: 32,
    text: "موجة كهرومغناطيسية طولها الموجي 2×10⁻⁸ m. ما ترددها في الفراغ؟",
    options: ["6.7×10⁻¹⁷ Hz", "15×10¹⁵ Hz", "15×10⁻¹⁵ Hz", "6.7×10¹⁷ Hz"],
    answer: 1,
    explanation: "في الفراغ f=c/λ. بالتعويض: (3×10⁸)÷(2×10⁻⁸)=1.5×10¹⁶ Hz، وهي تساوي 15×10¹⁵ Hz.",
  },
  {
    id: "6ad0103563cd9c24f9f4175e",
    page: 7,
    number: 35,
    text: "يمثل رمز دائرة كهربائية على شكل خط متعرج من دون سهم أو علامة متغيرة أي عنصر؟",
    options: ["مقاومة ثابتة", "مقاومة متغيرة", "منصهر", "مكثف"],
    answer: 0,
    explanation: "يرمز الخط المتعرج غير المصحوب بسهم إلى مقاومة ثابتة. يضاف سهم إلى الرمز للدلالة على المقاومة المتغيرة.",
  },
  {
    id: "6ad0103563cd9c24f9f4175f",
    page: 7,
    number: 36,
    text: "تؤثر في قارب قوتان: 4 N شرقًا و3 N شمالًا. ما القوة المتزنة اللازمة لإيقاف حركته؟",
    options: ["4 N غربًا", "3 N جنوبًا", "5 N شمال شرق", "5 N جنوب غرب"],
    answer: 3,
    explanation: "محصلة القوتين عمودية ومقدارها √(4²+3²)=5 N باتجاه الشمال الشرقي. القوة المتزنة تساويها مقدارًا وتعاكسها اتجاهًا: 5 N جنوب غرب.",
  },
  {
    id: "6ad0103563cd9c24f9f41760",
    page: 7,
    number: 37,
    text: "جسم يدور بزاوية مقدارها 3π rad. كم تساوي هذه الزاوية بالدرجات؟",
    options: ["540°", "360°", "270°", "720°"],
    answer: 0,
    explanation: "للتحويل من الراديان إلى الدرجات نضرب في 180/π: 3π×180/π=540°.",
  },
  {
    id: "6ad0103563cd9c24f9f41761",
    page: 8,
    number: 40,
    text: "ماذا يحدث لمقاومة موصل فلزي عند ارتفاع درجة حرارته؟",
    options: [
      "تزداد بسبب زيادة تصادم الإلكترونات",
      "تقل بسبب نقص التصادمات",
      "تزداد بسبب نقص التصادمات",
      "تقل بسبب زيادة التصادمات",
    ],
    answer: 0,
    explanation: "ارتفاع درجة حرارة الفلز يزيد اهتزاز ذرات الشبكة، فتزداد تصادمات الإلكترونات الحرة، وترتفع المقاومة.",
  },
  {
    id: "6ad0103563cd9c24f9f41762",
    page: 8,
    number: 42,
    text: "بين لوحين مجال كهربائي مقداره 4×10⁴ V/m، والمسافة بينهما 8×10⁻⁴ m. ما فرق الجهد بين اللوحين؟",
    options: ["32 V", "12 V", "0.5 V", "2×10⁻⁸ V"],
    answer: 0,
    explanation: "فرق الجهد بين اللوحين ΔV=Ed=(4×10⁴)(8×10⁻⁴)=32 V.",
  },
  {
    id: "6ad0103563cd9c24f9f41763",
    page: 8,
    number: 43,
    text: "في أي حالة من حالات المادة توجد معظم مادة النجوم؟",
    options: ["صلبة", "سائلة", "بلازما", "غاز"],
    answer: 2,
    explanation: "النجوم شديدة السخونة؛ لذلك تكون مادتها في معظمها بلازما، وهي غاز متأين يحتوي على جسيمات مشحونة.",
  },
  {
    id: "6ad0103563cd9c24f9f41764",
    page: 8,
    number: 44,
    text: "جسم على مستوى مائل زاويته θ، ومركبتا تسارع الجاذبية هما gₓ=g sinθ على امتداد المستوى وgᵧ=g cosθ عموديًا عليه. أي زاوية تجعل gₓ<gᵧ؟",
    options: ["45°", "35°", "65°", "55°"],
    answer: 1,
    explanation: "الشرط sinθ<cosθ يتحقق للزوايا الحادة الأصغر من 45°. من الخيارات، الزاوية 35°.",
  },
  {
    id: "6ad0103563cd9c24f9f41765",
    page: 8,
    number: 45,
    text: "يتحرك بندول بين النقطتين الطرفيتين A وE ويمر بالنقطة C في أسفل مساره. عند أي مواضع تكون طاقته الحركية صفرًا؟",
    options: ["عند C فقط", "عند B وD", "عند A وE", "عند A فقط"],
    answer: 2,
    explanation: "عند النقطتين الطرفيتين A وE تتوقف الكرة لحظيًا قبل أن تعكس اتجاهها، فتكون سرعتها وطاقة حركتها صفرًا.",
  },
  {
    id: "6ad0103563cd9c24f9f41766",
    page: 8,
    number: 48,
    text: "وُضع جسم أمام مرآة مقعرة، وكان طول صورته مساويًا لطول الجسم. ما العلاقة بين بعد الصورة dᵢ وبعد الجسم dₒ؟",
    options: ["dᵢ=dₒ", "dᵢ=2dₒ", "dₒ=2dᵢ", "dᵢ=3dₒ"],
    answer: 0,
    explanation: "في المرآة المقعرة تتكون صورة مساوية للجسم عندما يكون الجسم عند مركز التكور؛ حينها يكون بعد الصورة مساويًا لبعد الجسم.",
  },
] as const;

const rejections = [
  {
    id: "6ad0103563cd9c24f9f41767",
    page: 8,
    number: 49,
    note: "مرفوض من البنك المنشور: الاختيار بين النقاط 1–4 يعتمد على مخطط دائرة بمصباحين غير مرفق مع المسودة؛ يلزم إرفاق الرسم أو تحويله إلى وصف وخيارات نصية.",
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
    if (item.options.length !== 4 || item.options.some((option) => !option.trim()) ||
      !Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) {
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
          reviewerNotes: "تم التحقق من الحل ومقارنته بالمصدر؛ أُعيدت صياغة المتن ليتضمن المعطيات اللازمة وأضيف شرح واضح.",
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
