import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-chemistry-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f417fc",
    page: 12,
    number: 101,
    text: "وفق تعريف أرهينيوس، ماذا تنتج القاعدة عند ذوبانها في الماء؟",
    options: ["إلكترونات", "أيونات OH⁻", "تستقبل زوجًا من الإلكترونات", "أيونات H⁺"],
    answer: 1,
    explanation: "قاعدة أرهينيوس تزيد تركيز أيونات الهيدروكسيد OH⁻ في المحلول المائي.",
  },
  {
    id: "6ad0103563cd9c24f9f417fd",
    page: 12,
    number: 102,
    text: "أي نظرية تعرّف القاعدة بأنها مادة تستقبل بروتونًا H⁺؟",
    options: ["برونستد-لوري", "أرهينيوس", "لويس", "دالتون"],
    answer: 0,
    explanation: "وفق برونستد-لوري، القاعدة مستقبِل للبروتون والحمض مانح له.",
  },
  {
    id: "6ad0103563cd9c24f9f417fe",
    page: 12,
    number: 103,
    text: "ما الرتبة الكلية للتفاعل الذي قانون سرعته R=k[A][B]³؟",
    options: ["الأولى", "الثانية", "الثالثة", "الرابعة"],
    answer: 3,
    explanation: "الرتبة الكلية مجموع أسس التراكيز في قانون السرعة: 1+3=4.",
  },
  {
    id: "6ad0103563cd9c24f9f417ff",
    page: 12,
    number: 104,
    text: "ما القاعدة المرافقة لحمض الكبريتيك H₂SO₄ بعد فقد بروتون واحد؟",
    options: ["OH⁻", "HSO₄⁻", "H₂SO₃", "SO₄²⁻"],
    answer: 1,
    explanation: "تفقد جزيئة H₂SO₄ بروتونًا واحدًا لتتحول إلى القاعدة المرافقة HSO₄⁻.",
  },
  {
    id: "6ad0103563cd9c24f9f41800",
    page: 12,
    number: 105,
    text: "في التفاعل HCOOH+H₂O→HCOO⁻+H₃O⁺، ما القاعدة المرافقة لحمض الفورميك؟",
    options: ["HCOO⁻", "HCOOH", "H₂O", "H₃O⁺"],
    answer: 0,
    explanation: "يمنح حمض الفورميك HCOOH بروتونًا ويتحول إلى قاعدته المرافقة HCOO⁻.",
  },
  {
    id: "6ad0103563cd9c24f9f41801",
    page: 12,
    number: 106,
    text: "إذا كان pH محلول يساوي 5.2 عند 25°C، فما قيمة pOH؟",
    options: ["5.2", "13", "8.8", "14"],
    answer: 2,
    explanation: "عند 25°C، pH+pOH=14؛ لذلك pOH=14−5.2=8.8.",
  },
  {
    id: "6ad0103563cd9c24f9f41802",
    page: 12,
    number: 107,
    text: "ما قيمة pH للماء النقي عند 25°C؟",
    options: ["0", "5", "7", "14"],
    answer: 2,
    explanation: "عند 25°C يكون الماء النقي متعادلًا، وتركيزا H₃O⁺ وOH⁻ متساويين، ولذلك pH=7.",
  },
  {
    id: "6ad0103563cd9c24f9f41803",
    page: 12,
    number: 108,
    text: "في التفاعل HC₂H₃O₂+H₂O→H₃O⁺+C₂H₃O₂⁻، كيف يُصنّف H₃O⁺؟",
    options: ["حمض", "قاعدة", "حمض مرافق", "قاعدة مرافقة"],
    answer: 2,
    explanation: "تستقبل جزيئة الماء بروتونًا من الحمض وتتحول إلى H₃O⁺؛ لذا فإن H₃O⁺ هو الحمض المرافق للماء.",
  },
  {
    id: "6ad0103563cd9c24f9f41804",
    page: 12,
    number: 109,
    text: "للتفاعل Zn(s)+2Ag⁺(aq)⇌Zn²⁺(aq)+2Ag(s)، ما تعبير ثابت الاتزان K؟",
    options: [
      "K=[Ag⁺]²/[Zn²⁺]",
      "K=[Ag]²/[Zn]",
      "K=[Ag]²[Zn²⁺]/([Zn][Ag⁺]²)",
      "K=[Zn²⁺]/[Ag⁺]²",
    ],
    answer: 3,
    explanation: "لا تدخل المواد الصلبة النقية في تعبير ثابت الاتزان. تبقى تراكيز الأنواع المائية فقط: K=[Zn²⁺]/[Ag⁺]².",
  },
  {
    id: "6ad0103563cd9c24f9f41805",
    page: 12,
    number: 110,
    text: "ما الحمض المرافق للقاعدة H₂O بعد اكتساب بروتون؟",
    options: ["O²⁻", "OH⁻", "H₂O", "H₃O⁺"],
    answer: 3,
    explanation: "تكتسب جزيئة الماء بروتونًا لتصبح H₃O⁺، وهو الحمض المرافق لها.",
  },
  {
    id: "6ad0103563cd9c24f9f41806",
    page: 12,
    number: 111,
    text: "يقارن مخطط طاقة التفاعل أربعة إنزيمات، ويبيّن أن المنحنى 4 له أقل حاجز طاقة تنشيط. أي إنزيم هو الأكثر فاعلية؟",
    options: ["الإنزيم 1", "الإنزيم 2", "الإنزيم 3", "الإنزيم 4"],
    answer: 3,
    explanation: "الإنزيم الأكثر فاعلية يخفض طاقة التنشيط أكثر من غيره، ما يزيد سرعة التفاعل. وفق بيانات المخطط، أقل حاجز هو للإنزيم 4.",
  },
  {
    id: "6ad0103563cd9c24f9f41807",
    page: 13,
    number: 112,
    text: "كم رابطة سيجما وكم رابطة باي في جزيء الأسيتيلين H–C≡C–H؟",
    options: ["2 سيجما و1 باي", "2 سيجما و3 باي", "3 سيجما و2 باي", "3 سيجما و3 باي"],
    answer: 2,
    explanation: "تتكون الرابطة الثلاثية بين الكربونين من رابطة سيجما ورابطتي باي، وتوجد رابطتا C–H سيجما؛ المجموع 3 سيجما و2 باي.",
  },
  {
    id: "6ad0103563cd9c24f9f41808",
    page: 13,
    number: 113,
    text: "امتص معدن كتلته 0.5 kg حرارة فارتفعت حرارته 20°C. إذا كانت حرارته النوعية 376 J/(kg·°C)، فما الطاقة الممتصة؟",
    options: ["1880 J", "3760 J", "7520 J", "15040 J"],
    answer: 1,
    explanation: "نستخدم q=mcΔT: q=0.5×376×20=3760 J.",
  },
  {
    id: "6ad0103563cd9c24f9f41809",
    page: 13,
    number: 114,
    text: "في التفاعل H₂S+Cl₂→S+2HCl، ما العامل المختزل؟",
    options: ["H₂S", "Cl₂", "S", "HCl"],
    answer: 0,
    explanation: "يتأكسد الكبريت في H₂S من عدد أكسدة −2 إلى 0؛ والمادة التي تتأكسد هي العامل المختزل.",
  },
  {
    id: "6ad0103563cd9c24f9f4180b",
    page: 13,
    number: 116,
    text: "ما اسم عملية تغليف الحديد بطبقة واقية من الزنك لمقاومة التآكل؟",
    options: ["الترويق", "التأين", "التحلل", "الجلفنة"],
    answer: 3,
    explanation: "الجلفنة هي طلاء الحديد بالزنك لحمايته من التآكل.",
  },
  {
    id: "6ad0103563cd9c24f9f4180c",
    page: 13,
    number: 117,
    text: "ما عدد أكسدة الكبريت في H₂SO₄؟",
    options: ["−2", "+6", "+2", "+8"],
    answer: 1,
    explanation: "للمركب المتعادل: 2(+1)+x+4(−2)=0؛ إذن عدد أكسدة الكبريت x=+6.",
  },
  {
    id: "6ad0103563cd9c24f9f4180d",
    page: 13,
    number: 118,
    text: "ما عدد أكسدة الكبريت في H₂S؟",
    options: ["+2", "+4", "−2", "صفر"],
    answer: 2,
    explanation: "لأن مجموع أعداد الأكسدة في H₂S يساوي صفرًا: 2(+1)+x=0؛ إذن x=−2.",
  },
  {
    id: "6ad0103563cd9c24f9f4180e",
    page: 13,
    number: 119,
    text: "أي المركبات الهيدروكربونية الآتية يحتوي روابط سيجما فقط؟",
    options: ["C₃H₈", "C₂H₂", "C₃H₄", "C₆H₁₀"],
    answer: 0,
    explanation: "C₃H₈ ألكان مشبع، وجميع روابطه أحادية من نوع سيجما. أما الصيغ الأخرى فتتطلب روابط غير مشبعة.",
  },
  {
    id: "6ad0103563cd9c24f9f4180f",
    page: 13,
    number: 120,
    text: "حلقة خماسية فيها رابطة ثلاثية بين C1 وC2، وكلور عند C3 وبروم عند C4. ما اسم المركب وفق IUPAC؟",
    options: [
      "4-برومو-3-كلورو سيكلوبنت-1-اين",
      "4-برومو-3-كلورو سيكلوبنتان",
      "1-برومو-3-كلورو سيكلوبنت-1-ين",
      "2-برومو-1-كلورو سيكلوبنت-1-اين",
    ],
    answer: 0,
    explanation: "تُعطى الرابطة الثلاثية أقل رقم، فتكون عند C1. بعد الترقيم من الطرف المناسب للرابطة تكون مجموعة الكلور عند C3 والبروم عند C4؛ لذلك الاسم 4-برومو-3-كلورو سيكلوبنت-1-اين.",
  },
  {
    id: "6ad0103563cd9c24f9f41810",
    page: 13,
    number: 121,
    text: "ما الصيغة العامة للإيثرات؟",
    options: ["R–O–R′", "R–COOH", "R–OH", "R–COO–R′"],
    answer: 0,
    explanation: "تحتوي الإيثرات على ذرة أكسجين مرتبطة بمجموعتين عضويتين: R–O–R′.",
  },
  {
    id: "6ad0103563cd9c24f9f41811",
    page: 14,
    number: 122,
    text: "ما الصيغة العامة لهاليدات الألكيل؟",
    options: ["R–OH", "R–X", "R–COOH", "R–O–R′"],
    answer: 1,
    explanation: "يتكون هاليد الألكيل من مجموعة ألكيل R مرتبطة بذرة هالوجين X، وصيغته العامة R–X.",
  },
  {
    id: "6ad0103563cd9c24f9f41812",
    page: 14,
    number: 123,
    text: "حلقة سيكلوهكسان تحمل ذرتي كلور على كربونين متجاورين. ما اسم المركب؟",
    options: ["1,2-ثنائي كلورو هكسان", "1,2-ثنائي كلورو سيكلوهكسان", "1,2-ثنائي كلورو بنزين", "1,6-ثنائي كلورو سيكلوهكسان"],
    answer: 1,
    explanation: "المركب حلقة مشبعة من ست ذرات كربون، أي سيكلوهكسان، وعليها بديلان متجاوران؛ لذلك الاسم 1,2-ثنائي كلورو سيكلوهكسان.",
  },
  {
    id: "6ad0103563cd9c24f9f41814",
    page: 14,
    number: 125,
    text: "أي المجموعات الوظيفية الآتية لا تحتوي مجموعة الكربونيل C=O؟",
    options: ["الأمينات", "الأميدات", "الإسترات", "الألدهيدات"],
    answer: 0,
    explanation: "الأمينات تحتوي نيتروجينًا ولا تحتوي مجموعة كربونيل. أما الأميدات والإسترات والألدهيدات فتحتوي C=O.",
  },
  {
    id: "6ad0103563cd9c24f9f41815",
    page: 14,
    number: 126,
    text: "حلقة بنزين تحمل ذرتي بروم في الموضعين 1 و3. ما اسم المركب وفق IUPAC؟",
    options: ["ثنائي برومو سيكلوهكسان", "1,3-ثنائي بروموبنزين", "1,3-ثنائي برومو سيكلوهكسان", "بروموبنزين"],
    answer: 1,
    explanation: "الحلقة عطرية، والبرومان في موضعين يفصل بينهما كربون؛ لذا اسمها 1,3-ثنائي بروموبنزين.",
  },
  {
    id: "6ad0103563cd9c24f9f41816",
    page: 14,
    number: 127,
    text: "أي المركبات الآتية يحتوي المجموعة الوظيفية للإيثر R–O–R′؟",
    options: ["CH₃COOH", "CH₃OCH₃", "CH₃CH₂OH", "CH₃COCH₃"],
    answer: 1,
    explanation: "في CH₃OCH₃ ترتبط ذرة الأكسجين بمجموعتي ميثيل، وهو إيثر. الخيارات الأخرى حمض كربوكسيلي وكحول وكيتون.",
  },
  {
    id: "6ad0103563cd9c24f9f41817",
    page: 14,
    number: 128,
    text: "ما الناتج العضوي من تفاعل الإيثانول مع حمض الأسيتيك؟",
    options: ["أمين", "ألدهيد", "كيتون", "إستر"],
    answer: 3,
    explanation: "يتفاعل الكحول مع الحمض الكربوكسيلي بتفاعل الأسترة، فيتكون إستر وماء؛ والناتج العضوي هنا إيثانوات الإيثيل.",
  },
  {
    id: "6ad0103563cd9c24f9f41818",
    page: 14,
    number: 129,
    text: "أي المركبات الآتية لا تكوّن روابط هيدروجينية بين جزيئاتها النقية؟",
    options: ["CH₃NH₂", "C₂H₅OH", "CH₃OCH₃", "C₂H₅COOH"],
    answer: 2,
    explanation: "الميثيل إيثر يحتوي أكسجينًا يستقبل رابطة هيدروجينية، لكنه لا يحتوي رابطة O–H أو N–H ليمنحها؛ لذلك لا تتكون روابط هيدروجينية بين جزيئاته النقية. بقية الخيارات تحتوي رابطة مناسبة للمنح.",
  },
  {
    id: "6ad0103563cd9c24f9f41819",
    page: 14,
    number: 130,
    text: "إلى أي مجموعة وظيفية ينتمي المركب CH₃COOH؟",
    options: ["الألدهيدات", "الكحوليات", "الأحماض الكربوكسيلية", "الكيتونات"],
    answer: 2,
    explanation: "يحتوي CH₃COOH مجموعة الكربوكسيل –COOH، لذا فهو حمض كربوكسيلي (حمض الأسيتيك).",
  },
  {
    id: "6ad0103563cd9c24f9f4181a",
    page: 14,
    number: 131,
    text: "أي المركبات الآتية أعلى درجة غليان؟",
    options: ["الأسيتون CH₃COCH₃", "1-بروبانول CH₃CH₂CH₂OH", "حمض البروبانويك CH₃CH₂COOH", "إيثيل ميثيل إيثر CH₃CH₂OCH₃"],
    answer: 2,
    explanation: "تكوّن الأحماض الكربوكسيلية روابط هيدروجينية قوية، وغالبًا ثنائيات جزيئية، فترتفع درجات غليانها مقارنة بهذه المركبات ذات الكتل المتقاربة.",
  },
] as const;

const rejections = [
  {
    id: "6ad0103563cd9c24f9f4180a",
    page: 13,
    number: 115,
    note: "مرفوض: خيارا (أ) و(د) متكافئان جبريًا ويعطيان الصيغة نفسها لجهد الخلية؛ يوجد جوابان صحيحان.",
  },
  {
    id: "6ad0103563cd9c24f9f4181b",
    page: 14,
    number: 132,
    note: "مرفوض: نزع الماء من الإيثانول قد ينتج الإيثين أو الإيثر بحسب ظروف التفاعل ودرجة الحرارة؛ السؤال لا يذكر الظروف اللازمة لتحديد جواب وحيد.",
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
