import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-physics-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f41768",
    page: 9,
    number: 50,
    text: "أي حالة تمثل قدرة مقدارها 8 W؟",
    options: ["8 J خلال 8 s", "80 J خلال 8 s", "8 J خلال 1 s", "80 J خلال 1 s"],
    answer: 2,
    explanation: "القدرة P=W/t. في الخيار الصحيح 8 J خلال ثانية واحدة، فتكون P=8÷1=8 W.",
  },
  {
    id: "6ad0103563cd9c24f9f4176a",
    page: 9,
    number: 53,
    text: "الحرارة الكامنة لانصهار الذهب 6.3×10⁴ J/kg. ما كمية الحرارة اللازمة لصهر 0.5 kg منه؟",
    options: ["31,500 J", "63,000 J", "5,000 J", "1,000 J"],
    answer: 0,
    explanation: "نستخدم Q=mH_f. إذن Q=0.5×6.3×10⁴=31,500 J.",
  },
  {
    id: "6ad0103563cd9c24f9f4176b",
    page: 9,
    number: 54,
    text: "إذا كان متوسط القدرة المستهلكة في مصباح 60 W، وكان متوسط القدرة نصف القدرة العظمى، فما القدرة العظمى؟",
    options: ["30 W", "60 W", "90 W", "120 W"],
    answer: 3,
    explanation: "إذا كان P_avg=½P_max، فإن P_max=2P_avg=2×60=120 W.",
  },
  {
    id: "6ad0103563cd9c24f9f4176c",
    page: 9,
    number: 56,
    text: "عند تقريب قضيب من كرة كشاف كهربائي زاد انفراج ورقتيه. ما الاستنتاج المناسب عن شحنة القضيب والكشاف؟",
    options: ["مشحونان بالشحنة نفسها", "مشحونان بشحنتين مختلفتين", "غير مشحونين", "الكشاف مؤرّض"],
    answer: 0,
    explanation: "زيادة الانفراج تعني زيادة التنافر بين الورقتين؛ وهذا يحدث عندما يدفع القضيب شحنات من النوع نفسه إلى الورقتين، فيكون القضيب والكشاف مشحونين بالشحنة نفسها.",
  },
  {
    id: "6ad0103563cd9c24f9f4176e",
    page: 10,
    number: 59,
    text: "فقدت قطعة معدنية كتلتها 0.5 kg مقدارًا من حرارتها فهبطت درجة حرارتها 20 K. إذا كانت حرارتها النوعية 376 J/(kg·K)، فما مقدار الطاقة الحرارية المفقودة؟",
    options: ["15,040 J", "7,520 J", "1,880 J", "3,760 J"],
    answer: 3,
    explanation: "مقدار الحرارة Q=mcΔT=0.5×376×20=3,760 J.",
  },
  {
    id: "6ad0103563cd9c24f9f4176f",
    page: 10,
    number: 60,
    text: "لتحويل الجلفانومتر إلى أميتر يقيس شدة تيار كبيرة، كيف تُوصل مقاومة المجزئ؟",
    options: ["مقاومة كبيرة على التوالي", "مقاومة صغيرة على التوالي", "مقاومة صغيرة على التوازي", "مقاومة كبيرة على التوازي"],
    answer: 2,
    explanation: "يوصل بالأميتر مجزئ مقاومته صغيرة على التوازي مع الجلفانومتر، فيمر معظم التيار عبر المجزئ ويحمي ملف الجلفانومتر.",
  },
  {
    id: "6ad0103563cd9c24f9f41771",
    page: 10,
    number: 63,
    text: "قطع شخص مسارًا دائريًا طوله 360 m ثم عاد إلى نقطة انطلاقه. ما إزاحته والمسافة الكلية التي قطعها؟",
    options: [
      "الإزاحة 360 m، والمسافة صفر",
      "الإزاحة صفر، والمسافة 360 m",
      "الإزاحة 360 m، والمسافة 360 m",
      "الإزاحة صفر، والمسافة صفر",
    ],
    answer: 1,
    explanation: "عاد الشخص إلى نقطة البداية، لذلك الإزاحة (المتجه من البداية إلى النهاية) تساوي صفرًا. أما المسافة فهي طول المسار الذي قطعه، أي 360 m.",
  },
  {
    id: "6ad0103563cd9c24f9f41772",
    page: 10,
    number: 64,
    text: "في خطوات الطريقة العلمية، ما الخطوة التي تأتي بعد وضع الفرضية؟",
    options: ["التجريب", "الاستنتاج", "الملاحظة", "النظرية"],
    answer: 0,
    explanation: "بعد صياغة الفرضية يخطط الباحث لاختبارها بالتجربة، ثم يحلل النتائج ويستنتج.",
  },
  {
    id: "6ad0103563cd9c24f9f41773",
    page: 11,
    number: 65,
    text: "كيف تتناسب طاقة الفوتون مع الطول الموجي؟",
    options: ["طرديًا مع الطول الموجي", "عكسيًا مع الطول الموجي", "طرديًا مع سرعة الضوء في الفراغ", "عكسيًا مع التردد"],
    answer: 1,
    explanation: "طاقة الفوتون E=hf=hc/λ. لذلك تتناسب عكسيًا مع الطول الموجي λ.",
  },
  {
    id: "6ad0103563cd9c24f9f41774",
    page: 11,
    number: 66,
    text: "ما الجهاز الذي يحول الطاقة الكهربائية إلى طاقة حركية دورانية؟",
    options: ["المكثف الكهربائي", "المحول الكهربائي", "المولد الكهربائي", "المحرك الكهربائي"],
    answer: 3,
    explanation: "المحرك الكهربائي يحول الطاقة الكهربائية إلى حركة دورانية؛ أما المولد فيحول الحركة إلى طاقة كهربائية.",
  },
  {
    id: "6ad0103563cd9c24f9f41775",
    page: 11,
    number: 68,
    text: "إذا تحرك جسم وتغير موضعه بمرور الزمن، فما العبارة الصحيحة؟",
    options: [
      "الجسم ساكن ومن المؤكد أنه لا يتسارع",
      "الجسم ساكن ومن الممكن أن يتسارع",
      "الجسم متحرك ومن الممكن ألا يتسارع",
      "الجسم متحرك ومن المؤكد أنه يتسارع",
    ],
    answer: 2,
    explanation: "تغير الموضع بمرور الزمن يعني أن الجسم متحرك. ولا يلزم أن تتغير سرعته؛ فقد يتحرك بسرعة ثابتة ولا يتسارع.",
  },
  {
    id: "6ad0103563cd9c24f9f41776",
    page: 11,
    number: 69,
    text: "في محول مثالي، جهد الملف الابتدائي 160 V وعدد لفاته 40، وعدد لفات الملف الثانوي 80. ما جهد الملف الثانوي؟",
    options: ["320 V", "160 V", "80 V", "100 V"],
    answer: 0,
    explanation: "للمحول المثالي Vₚ/Vₛ=Nₚ/Nₛ. لذلك Vₛ=160×(80÷40)=320 V.",
  },
  {
    id: "6ad0103563cd9c24f9f41777",
    page: 11,
    number: 71,
    text: "تصل دائرة مصدرًا كهربائيًا بثلاث مقاومات A وB وC في حلقة واحدة متصلة من دون أي تفرعات. كيف تكون المقاومات موصلة؟",
    options: ["جميعها على التوالي", "جميعها على التوازي", "A وB على التوازي وC على التوالي", "A وB على التوالي وC على التوازي"],
    answer: 0,
    explanation: "وجود مسار واحد للتيار من دون تفرعات يعني أن المقاومات الثلاث موصلة على التوالي.",
  },
] as const;

const rejections = [
  {
    id: "6ad0103563cd9c24f9f41770",
    page: 10,
    number: 62,
    note: "مرفوض من البنك المنشور: تحديد أقل سرعة متوسطة يتطلب مقارنة خطوط الرسم البياني، لكن الرسم غير مرفق بالمسودة.",
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
          reviewerNotes: "تم التحقق من نص السؤال وخياراته والحل مع المصدر، وأضيف شرح واضح.",
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
