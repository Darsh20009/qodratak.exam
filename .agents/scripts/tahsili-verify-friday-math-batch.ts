import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

type Correction = {
  number: number;
  page: number;
  correctOptionIndex: number;
  optionMustContain: string[];
  text: string;
  explanation: string;
};

const SOURCE_ID = "friday-evening-p2-math-2024";
const REVIEWER = "source-verified-content-audit";
const CORRECTIONS: Correction[] = [
  {
    number: 3, page: 3, correctOptionIndex: 0, optionMustContain: ["-√3"],
    text: "إذا كان cos(2θ) = 1/2 و90° < θ < 180°، فما قيمة cos(θ)؟",
    explanation: "من الهوية cos(2θ)=2cos²(θ)−1 نحصل على cos²(θ)=3/4. وبما أن θ في الربع الثاني فقيمة cos سالبة؛ إذن cos(θ)=−√3/2.",
  },
  {
    number: 4, page: 3, correctOptionIndex: 2, optionMustContain: ["a43"],
    text: "في مصفوفة من أربعة صفوف وثلاثة أعمدة، ما الرمز الذي يمثل العنصر عند تقاطع الصف الرابع والعمود الثالث؟",
    explanation: "يرمز aᵢⱼ إلى عنصر الصف i والعمود j؛ لذلك عنصر الصف الرابع والعمود الثالث هو a₄₃.",
  },
  {
    number: 5, page: 3, correctOptionIndex: 3, optionMustContain: ["sin2θ"],
    text: "بسّط التعبير 4 sin²(θ/2) cos²(θ/2).",
    explanation: "باستخدام 2sin(θ/2)cos(θ/2)=sin(θ)، يصبح التعبير [2sin(θ/2)cos(θ/2)]²، أي sin²(θ).",
  },
  {
    number: 6, page: 4, correctOptionIndex: 0, optionMustContain: ["49"],
    text: "احسب 343^(2/3).",
    explanation: "343^(2/3) يساوي (∛343)². والجذر التكعيبي لـ343 هو 7، لذا الناتج 7²=49.",
  },
  {
    number: 7, page: 4, correctOptionIndex: 2, optionMustContain: ["-1"],
    text: "احسب lim عندما x→0 للتعبير 4^x − cos(x) + 2x − 1.",
    explanation: "الدوال مستمرة عند الصفر، فنعوّض x=0: 4⁰−cos(0)+2·0−1 = 1−1+0−1 = −1.",
  },
  {
    number: 12, page: 6, correctOptionIndex: 0, optionMustContain: ["7x"],
    text: "حوّل المعادلة القطبية r = 7/sec(θ) إلى الصورة الديكارتية.",
    explanation: "لأن 1/sec(θ)=cos(θ)، تصبح r=7cos(θ). نضرب في r فنحصل على r²=7r cos(θ). وباستخدام r²=x²+y² وr cos(θ)=x تكون x²+y²=7x.",
  },
  {
    number: 15, page: 8, correctOptionIndex: 3, optionMustContain: ["3"],
    text: "أوجد قيمة الجزء الصحيح للعدد 3.7، أي ⌊3.7⌋.",
    explanation: "الجزء الصحيح هو أكبر عدد صحيح لا يتجاوز العدد؛ لذلك ⌊3.7⌋=3.",
  },
  {
    number: 17, page: 8, correctOptionIndex: 1, optionMustContain: ["12"],
    text: "ما عدد نواتج فضاء العينة عند رمي قطعة نقدية ومكعب أرقام؟",
    explanation: "للقطعة النقدية نتيجتان وللمكعب ست نتائج؛ عدد النواتج الكلي 2×6=12.",
  },
  {
    number: 21, page: 10, correctOptionIndex: 2, optionMustContain: ["a34"],
    text: "في المصفوفة، ما الرمز الذي يمثل العنصر الواقع في الصف الثالث والعمود الرابع؟",
    explanation: "في الترميز aᵢⱼ يشير الرقم الأول إلى الصف والثاني إلى العمود؛ العنصر المطلوب هو a₃₄.",
  },
  {
    number: 22, page: 10, correctOptionIndex: 3, optionMustContain: ["5", "-4"],
    text: "ما مركز القطع الزائد (y+4)²/48 − (x−5)²/36 = 1؟",
    explanation: "بمقارنة المعادلة بالصورة القياسية، يظهر الإزاحان x−5 وy−(−4)؛ لذلك مركز القطع الزائد هو (5,−4).",
  },
  {
    number: 23, page: 11, correctOptionIndex: 2, optionMustContain: ["3"],
    text: "ما أساس المتتابعة الهندسية 12، 36، 108، 324، …؟",
    explanation: "أساس المتتابعة هو نسبة حد إلى الحد السابق: 36÷12=3، وكذلك 108÷36=3.",
  },
  {
    number: 25, page: 11, correctOptionIndex: 0, optionMustContain: ["9", "-10"],
    text: "إذا كان A=(5,−3) وB=(1,4)، فأوجد 2A−B.",
    explanation: "نحسب 2A=(10,−6)، ثم نطرح B مركبةً مركبة: (10−1, −6−4)=(9,−10).",
  },
  {
    number: 27, page: 12, correctOptionIndex: 0, optionMustContain: ["625"],
    text: "احسب [(1−2i)(2i+1)]⁴.",
    explanation: "نكتب (2i+1)=(1+2i)، وباستخدام فرق المربعين: (1−2i)(1+2i)=1−(2i)²=1+4=5. إذن 5⁴=625.",
  },
];

const REJECTION = {
  number: 24,
  page: 11,
  note: "مرفوض من بنك التدريب: معلومتَا الوسيط والمنوال وحدهما لا تحددان المتوسط الحسابي لخمسة أعداد؛ توجد مجموعات مختلفة تحقق الشرطين بمتوسطات مختلفة، لذلك لا توجد إجابة وحيدة قابلة للتصحيح.",
};

function normalize(value: string): string {
  return value.normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/\s+/g, "")
    .replace(/[()⟨⟩〈〉,]/g, "");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable; no content was changed.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this batch is authorized for Replit preview only.`);
  }

  const drafts = await TahsiliQuestionDraft.find({ sourceId: SOURCE_ID, status: "pending_review" })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options explanation sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byNumber = new Map<number, any[]>();
  for (const draft of drafts) {
    const number = Number(draft.sourceQuestionNumber);
    byNumber.set(number, [...(byNumber.get(number) || []), draft]);
  }
  const expectedNumbers = [...CORRECTIONS.map((item) => item.number), REJECTION.number];
  const failures: string[] = [];
  for (const correction of CORRECTIONS) {
    const matches = byNumber.get(correction.number) || [];
    if (matches.length !== 1) {
      failures.push(`السؤال ${correction.number}: عدد السجلات المطابقة ${matches.length}`);
      continue;
    }
    const draft = matches[0];
    if (draft.sourcePage !== correction.page || draft.subject !== "رياضيات" || !Array.isArray(draft.options) || draft.options.length !== 4) {
      failures.push(`السؤال ${correction.number}: بيانات المصدر أو الخيارات لا تطابق الفحص`);
      continue;
    }
    const answerOption = normalize(String(draft.options[correction.correctOptionIndex] || ""));
    if (!correction.optionMustContain.every((needle) => answerOption.includes(normalize(needle)))) {
      failures.push(`السؤال ${correction.number}: الخيار المحدد لا يطابق الإجابة المحسوبة/الموثقة`);
    }
    if (correction.explanation.length < 12) failures.push(`السؤال ${correction.number}: الشرح قصير`);
  }
  const rejectedMatches = byNumber.get(REJECTION.number) || [];
  if (rejectedMatches.length !== 1 || rejectedMatches[0]?.sourcePage !== REJECTION.page) {
    failures.push(`السؤال ${REJECTION.number}: سجل الرفض لا يطابق صفحة المصدر`);
  }
  const unexpected = drafts.filter((draft) => !expectedNumbers.includes(Number(draft.sourceQuestionNumber)));
  if (unexpected.length) failures.push(`هناك ${unexpected.length} سجل إضافي غير مشمول في هذه الدفعة`);

  const sourceKeys = drafts.map((draft) => draft.sourceKey);
  const existingQuestions = sourceKeys.length
    ? await TahsiliQuestion.find({ sourceKey: { $in: sourceKeys } }).select("sourceKey answerConfidence").lean()
    : [];
  if (existingQuestions.length) {
    failures.push(`وجدت ${existingQuestions.length} سؤالًا منشورًا مسبقًا؛ أوقفت الدفعة لتجنب الاستبدال`);
  }
  const existingQuestionIds = drafts.length
    ? await TahsiliQuestion.find({ questionId: { $in: drafts.map((draft) => draft.questionId) } })
      .select("questionId sourceKey").lean()
    : [];
  if (existingQuestionIds.length) {
    failures.push(`وجدت ${existingQuestionIds.length} تعارضًا في أرقام الأسئلة؛ أوقفت الدفعة`);
  }

  if (failures.length) {
    console.log(JSON.stringify({ apply, sourceId: SOURCE_ID, draftsFound: drafts.length, failures }, null, 2));
    throw new Error("فشل فحص ما قبل التعديل؛ لم تُعتمد أي سجلات.");
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    database: TahsiliQuestionDraft.db.name,
    sourceId: SOURCE_ID,
    approved: CORRECTIONS.map(({ number, page, correctOptionIndex }) => ({ number, page, correctOptionIndex })),
    rejected: { number: REJECTION.number, page: REJECTION.page, reason: REJECTION.note },
    changed: false,
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const reviewedAt = new Date();
  for (const correction of CORRECTIONS) {
    const draft = byNumber.get(correction.number)![0];
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate(
      { sourceKey: draft.sourceKey },
      {
        $set: {
          questionId: draft.questionId,
          sourceId: draft.sourceId,
          sourceKey: draft.sourceKey,
          sourceOrdinal: draft.sourceOrdinal,
          subject: draft.subject,
          subcategory: draft.subcategory || "عام",
          text: correction.text,
          options: draft.options,
          correctOptionIndex: correction.correctOptionIndex,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "عام",
          explanation: correction.explanation,
          sourcePage: draft.sourcePage,
          sourceQuestionNumber,
          printedQuestionNumber: draft.sourceQuestionNumber,
          sourceBlockIndex: draft.sourceBlockIndex,
          ...(draft.requiresImage && draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
          sourceBook: draft.sourceBook,
          answerConfidence: "verified",
          reviewedBy: REVIEWER,
          reviewedAt,
          updatedAt: reviewedAt,
        },
        $setOnInsert: { createdAt: reviewedAt },
      },
      { upsert: true, new: true, runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      {
        $set: {
          status: "approved",
          text: correction.text,
          explanation: correction.explanation,
          reviewedBy: REVIEWER,
          reviewedAt,
          reviewerNotes: `تمت مطابقة الإجابة مع السؤال ${correction.number} في ملف المصدر نفسه، ثم تحقق الحل الرياضي وشرح الخطوات.`,
          updatedAt: reviewedAt,
        },
      },
    );
  }

  const rejectedDraft = rejectedMatches[0];
  await TahsiliQuestionDraft.updateOne(
    { _id: rejectedDraft._id, status: "pending_review" },
    {
      $set: {
        status: "rejected",
        reviewedBy: REVIEWER,
        reviewedAt,
        reviewerNotes: REJECTION.note,
        updatedAt: reviewedAt,
      },
    },
  );
  summary.changed = true;
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Batch review failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromMongoDB();
  });
