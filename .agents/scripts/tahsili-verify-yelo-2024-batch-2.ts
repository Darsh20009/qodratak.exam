import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f418f3", page: 11, number: 23,
    text: "يُرمى مكعبا نرد متميزان مرة واحدة. ما احتمال أن يكون مجموع العددين الظاهرين 3؟",
    options: ["1/36", "2/36", "2/18", "1/12"],
    answer: 1,
    explanation: "من أصل 36 ناتجًا مرتبًا متساوية الاحتمال، يعطي (1,2) و(2,1) مجموعًا يساوي 3. الاحتمال 2/36=1/18.",
  },
  {
    id: "6ad0150c63cd9c24f9f418f4", page: 12, number: 25,
    text: "ما نوع الدالة f(x)=x⁵+x³+x؟",
    options: ["ليست فردية ولا زوجية", "فردية وزوجية معًا", "زوجية", "فردية"],
    answer: 3,
    explanation: "كل حدود الدالة أسها فردي، لذا f(−x)=−x⁵−x³−x=−f(x)، وتكون الدالة فردية.",
  },
  {
    id: "6ad0150c63cd9c24f9f418f5", page: 14, number: 28,
    text: "إذا كانت A=[[2,1],[0,5]] وB=[[-1,3],[1,−2]]، فأوجد 2A−B.",
    options: ["[[-5,−1],[1,12]]", "[[5,1],[−1,−12]]", "[[0,4],[4,2]]", "[[5,−1],[−1,12]]"],
    answer: 3,
    explanation: "نحسب 2A=[[4,2],[0,10]]، ثم نطرح B عنصرًا بعنصر: [[4−(−1),2−3],[0−1,10−(−2)]]=[[5,−1],[−1,12]].",
  },
  {
    id: "6ad0150c63cd9c24f9f418f6", page: 14, number: 29,
    text: "ما قيمة sin²θ+cos²θ؟",
    options: ["−1", "0", "1", "cos(2θ)"],
    answer: 2,
    explanation: "من متطابقة فيثاغورس الأساسية sin²θ+cos²θ=1 لأي زاوية θ.",
  },
  {
    id: "6ad0150c63cd9c24f9f418f7", page: 14, number: 30,
    text: "ما نهاية x²+x+2 عندما x→∞؟",
    options: ["−∞", "0", "1", "+∞"],
    answer: 3,
    explanation: "الحد الرئيس x² موجب ويزداد بلا حد عندما x→∞؛ لذا تتجه قيمة كثيرة الحدود إلى +∞.",
  },
  {
    id: "6ad0150c63cd9c24f9f418f8", page: 15, number: 31,
    text: "إذا كانت الزاويتان A وB متتامتين، وكانت الزاويتان A وC متتامتين، فأي علاقة صحيحة؟",
    options: ["m∠A+m∠B=180°", "m∠B=m∠C", "m∠A+m∠C=180°", "m∠B>m∠C"],
    answer: 1,
    explanation: "بما أن m∠A+m∠B=90° وm∠A+m∠C=90°، ينتج بطرح m∠A أن m∠B=m∠C.",
  },
  {
    id: "6ad0150c63cd9c24f9f418f9", page: 15, number: 32,
    text: "ما قيمة logₐ(aⁿ)، بافتراض أن a>0 وa≠1؟",
    options: ["n", "a", "−1", "1"],
    answer: 0,
    explanation: "اللوغاريتم والأس يلغيان أحدهما الآخر: logₐ(aⁿ)=n.",
  },
  {
    id: "6ad0150c63cd9c24f9f418fa", page: 15, number: 33,
    text: "ما قيمة log_(√3)(81)؟",
    options: ["8", "4", "6", "2"],
    answer: 0,
    explanation: "إذا كان log_(√3)(81)=k، فإن (√3)^k=81. وبما أن √3=3^(1/2) و81=3⁴، ينتج k/2=4 ومنه k=8.",
  },
  {
    id: "6ad0150c63cd9c24f9f418fb", page: 16, number: 34,
    text: "حوّل الصورة اللوغاريتمية logₓ(y)=k إلى الصورة الأسية.",
    options: ["xᵏ=y", "yᵏ=x", "kˣ=y", "kʸ=x"],
    answer: 0,
    explanation: "بحسب تعريف اللوغاريتم، logₓ(y)=k تعني أن الأساس x مرفوعًا للقوة k يساوي y؛ أي xᵏ=y.",
  },
  {
    id: "6ad0150c63cd9c24f9f418fc", page: 16, number: 35,
    text: "إذا كان u=⟨b,−3,1⟩ وv=⟨−2,−1,3⟩، فما قيمة b التي تجعل المتجهين متعامدين؟",
    options: ["−6", "−3", "3", "6"],
    answer: 2,
    explanation: "يتعامد المتجهان إذا كان حاصل الضرب النقطي صفرًا: u·v=−2b+3+3=0، ومنه b=3.",
  },
  {
    id: "6ad0150c63cd9c24f9f418fd", page: 16, number: 36,
    text: "ما المسافة بين المستقيمين المتوازيين y=−2 وy=4؟",
    options: ["2", "3", "4", "6"],
    answer: 3,
    explanation: "المستقيمان أفقيان، والمسافة بينهما فرق الإحداثيين الرأسيين: |4−(−2)|=6.",
  },
  {
    id: "6ad0150c63cd9c24f9f418fe", page: 17, number: 37,
    text: "أي مما يأتي ليس عاملًا لكثيرة الحدود x³+3x²+2x؟",
    options: ["x−1", "x+2", "x", "x+1"],
    answer: 0,
    explanation: "نحلل كثيرة الحدود: x³+3x²+2x=x(x²+3x+2)=x(x+1)(x+2). لذلك x−1 ليس عاملًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f418ff", page: 17, number: 38,
    text: "إذا كانت A=[[2,−1],[1,2]]، فأوجد A×A.",
    options: ["[[5,−4],[4,3]]", "[[4,1],[1,4]]", "[[4,−4],[4,5]]", "[[3,−4],[4,3]]"],
    answer: 3,
    explanation: "نضرب الصفوف في الأعمدة: A²=[[2·2+(−1)·1, 2·(−1)+(−1)·2],[1·2+2·1,1·(−1)+2·2]]=[[3,−4],[4,3]].",
  },
  {
    id: "6ad0150c63cd9c24f9f41900", page: 17, number: 39,
    text: "بحسب النظرية الأساسية في الجبر، كم جذرًا مركبًا لكثيرة الحدود f(x)=3x⁴+2x³−5x+1 مع احتساب التكرار؟",
    options: ["3", "2", "4", "5"],
    answer: 2,
    explanation: "درجة كثيرة الحدود 4، ولذلك لها أربعة جذور مركبة عند احتساب التكرارات، وفق النظرية الأساسية في الجبر.",
  },
  {
    id: "6ad0150c63cd9c24f9f41901", page: 18, number: 40,
    text: "ما نوع المتتابعة −16، −12، −8، −4، …؟",
    options: ["حسابية أساسها −4", "هندسية أساسها −2", "حسابية أساسها 4", "هندسية أساسها 2"],
    answer: 2,
    explanation: "الفرق بين كل حد والذي يليه ثابت ويساوي 4؛ لذا فهي متتابعة حسابية أساسها 4.",
  },
  {
    id: "6ad0150c63cd9c24f9f41902", page: 18, number: 41,
    text: "ما قياس الزاوية بين المتجهين ⟨3,0⟩ و⟨3,3⟩؟",
    options: ["30°", "45°", "120°", "135°"],
    answer: 1,
    explanation: "حاصل الضرب النقطي 9، وطولا المتجهين 3 و3√2. إذن cosθ=9/(9√2)=1/√2، ومنه θ=45°.",
  },
  {
    id: "6ad0150c63cd9c24f9f41903", page: 18, number: 42,
    text: "ما قيمة log₃(√81)؟",
    options: ["4", "8", "2", "−8"],
    answer: 2,
    explanation: "√81=9=3²، لذلك log₃(√81)=log₃(3²)=2.",
  },
] as const;

const rejected = [
  {
    id: "6ad0150c63cd9c24f9f418f2", page: 11, number: 21,
    note: "حُجب السؤال: الصيغة المطبوعة 2(x−2x)(x+2x) تساوي −6x²، لكن هذا الناتج غير موجود ضمن الخيارات المطبوعة. لا يمكن اعتماد مفتاح أو تصحيح موثوق من النسخة المصدرية.",
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
          subject: "رياضيات",
          subcategory: "رياضيات",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || "رياضيات",
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
