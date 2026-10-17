import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f418e6", page: 4, number: 1,
    text: "النقاط A(−2, 3)، B(3, 5)، C(4, 1)، وD(x, y) هي رؤوس متوازي الأضلاع ABCD بالترتيب. ما إحداثيا D؟",
    options: ["(−3, 7)", "(7, −3)", "(−1, −1)", "(−1, 3)"],
    answer: 2,
    explanation: "في متوازي الأضلاع ABCD بالترتيب يكون A+C=B+D، لذا D=A+C−B. نحسب x=−2+4−3=−1، وy=3+1−5=−1؛ إذن D=(−1,−1).",
  },
  {
    id: "6ad0150c63cd9c24f9f418e7", page: 4, number: 3,
    text: "اختبر تماثل المعادلة x⁵=−5y³ حول نقطة الأصل.",
    options: ["متماثلة حول محور x", "متماثلة حول نقطة الأصل", "متماثلة حول محور y", "غير متماثلة"],
    answer: 1,
    explanation: "بالتعويض عن x وy بـ−x و−y نحصل على (−x)⁵=−5(−y)³، أي −x⁵=5y³، وهي المعادلة الأصلية مضروبة في −1؛ لذلك يبقى التمثيل نفسه ويكون متماثلًا حول نقطة الأصل.",
  },
  {
    id: "6ad0150c63cd9c24f9f418e8", page: 5, number: 5,
    text: "إذا كانت f(x)=(x²+x)/x حيث x≠0، فما تصنيف الدالة من حيث الزوجية والفردية؟",
    options: ["فردية", "ليست زوجية ولا فردية", "زوجية", "فردية وزوجية معًا"],
    answer: 1,
    explanation: "نبسط f(x)=x+1 على المجال x≠0. عندئذ f(−x)=1−x، وهي لا تساوي f(x) ولا −f(x)، لذا فالدالة ليست زوجية ولا فردية.",
  },
  {
    id: "6ad0150c63cd9c24f9f418e9", page: 6, number: 7,
    text: "أي المتتابعات الآتية هندسية لكل a>1؟",
    options: ["2a، a²، a⁴، …", "a+1، a²−1، a−1، …", "a، a²، a³، a⁴، …", "a−1، a+1، a−2، …"],
    answer: 2,
    explanation: "نسبة كل حد إلى السابق في المتتابعة a،a²،a³،a⁴,… تساوي a؛ فهي متتابعة هندسية أساسها a.",
  },
  {
    id: "6ad0150c63cd9c24f9f418ea", page: 6, number: 8,
    text: "بسّط المقدار log₅(x+1)+log₅(x)−2log₅(1+x)، مع x>0.",
    options: ["3log₅(x)−log₅(1)", "log₅(x)", "3log₅(x)", "log₅(x/(x+1))"],
    answer: 3,
    explanation: "باستخدام خواص اللوغاريتمات: log₅(x+1)−2log₅(x+1)=−log₅(x+1)، فيتبقى log₅(x)−log₅(x+1)=log₅(x/(x+1)).",
  },
  {
    id: "6ad0150c63cd9c24f9f418eb", page: 6, number: 9,
    text: "بسّط المقدار (1−cos²θ)sin²θ.",
    options: ["cos⁴θ", "sin⁴θ", "1−cos⁴θ", "(1−cos²θ)²"],
    answer: 1,
    explanation: "من الهوية sin²θ+cos²θ=1 ينتج 1−cos²θ=sin²θ؛ لذلك يصبح المقدار sin²θ×sin²θ=sin⁴θ.",
  },
  {
    id: "6ad0150c63cd9c24f9f418ec", page: 7, number: 11,
    text: "ما رتبة المصفوفة ذات 3 صفوف و4 أعمدة؟ [[1,2,5,0],[5,9,7,0],[3,−4,8,0]]",
    options: ["3×4", "4×3", "3×2", "3×3"],
    answer: 0,
    explanation: "رتبة المصفوفة من حيث الأبعاد تكتب عدد الصفوف ثم عدد الأعمدة. للمصفوفة ثلاثة صفوف وأربعة أعمدة، لذا أبعادها 3×4.",
  },
  {
    id: "6ad0150c63cd9c24f9f418ed", page: 8, number: 13,
    text: "ما قيمة log₃(1/81)؟",
    options: ["4", "−4", "−1/4", "2"],
    answer: 1,
    explanation: "لأن 81=3⁴، فإن 1/81=3⁻⁴؛ بالتالي log₃(1/81)=−4.",
  },
  {
    id: "6ad0150c63cd9c24f9f418ee", page: 8, number: 14,
    text: "متوسط توزيع طبيعي يساوي 12 وانحرافه المعياري 2. قرّب P(10<X<16) باستخدام قاعدة التوزيع الطبيعي.",
    options: ["81.5%", "47.5%", "86%", "40%"],
    answer: 0,
    explanation: "نحوّل إلى درجات معيارية: عند 10 تكون z=−1 وعند 16 تكون z=2. المساحة بينهما تقارب 0.8185؛ وأقرب خيار معطى هو 81.5%.",
  },
  {
    id: "6ad0150c63cd9c24f9f418ef", page: 9, number: 16,
    text: "ما نهاية (x²−4)/(x−2) عندما x يقترب من ∞؟",
    options: ["−4", "0", "4", "+∞"],
    answer: 3,
    explanation: "نحلل البسط: x²−4=(x−2)(x+2). بعد الاختصار، للمقادير x≠2، يصبح التعبير x+2؛ وعندما x→∞ تتجه قيمته إلى +∞.",
  },
  {
    id: "6ad0150c63cd9c24f9f418f0", page: 10, number: 18,
    text: "ما المعاكس الإيجابي (المقابل النقيض) للعبارة الشرطية ¬p→q؟",
    options: ["¬p→¬q", "¬q→p", "q→¬p", "p→q"],
    answer: 1,
    explanation: "المقابل النقيض لعبارة P→Q هو ¬Q→¬P. بوضع P=¬p وQ=q نحصل على ¬q→p.",
  },
  {
    id: "6ad0150c63cd9c24f9f418f1", page: 10, number: 19,
    text: "بسّط العدد المركب (8i−2)/(2i).",
    options: ["4+i", "4−i", "4i−i", "i−4"],
    answer: 0,
    explanation: "نقسم الحدين على 2i: 8i/(2i)−2/(2i)=4−1/i. وبما أن 1/i=−i، تكون النتيجة 4+i.",
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
          subject: "رياضيات",
          subcategory: draft.subcategory || "رياضيات",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "رياضيات",
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
          reviewerNotes: "تمت مراجعة صياغة السؤال والحل ومفتاح الإجابة بمقابلتها مع المصدر وحل المسألة، وأضيف شرح توضيحي.",
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
