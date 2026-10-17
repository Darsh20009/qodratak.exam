import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f4194f", page: 64, number: 2,
    text: "أي فئات العناصر يكون تكافؤها غالبًا صفرًا بسبب امتلاء غلاف التكافؤ؟",
    options: ["الفلزات", "اللافلزات", "أشباه الفلزات", "الغازات النبيلة الخاملة"],
    answer: 3,
    explanation: "تمتلك الغازات النبيلة غلاف تكافؤ مكتملًا غالبًا، لذلك لا تميل إلى اكتساب أو فقد أو مشاركة إلكترونات، ويكون تكافؤها المعتاد صفرًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f41951", page: 65, number: 4,
    text: "ما أثر زيادة مساحة سطح المواد المتفاعلة الصلبة في سرعة التفاعل؟",
    options: ["تقلل سرعة التفاعل", "تزيد سرعة التفاعل", "لا تؤثر في السرعة", "تثبت سرعة التفاعل"],
    answer: 1,
    explanation: "زيادة مساحة السطح تكشف عددًا أكبر من الجسيمات للتصادم، فترفع عدد التصادمات الفعالة في وحدة الزمن وتزيد سرعة التفاعل.",
  },
  {
    id: "6ad0150c63cd9c24f9f41952", page: 65, number: 5,
    text: "يعالج مزارع بعض الثمار قبل موعد نضجها لتحفيز نضجها. أي هرمون نباتي يستخدم؟",
    options: ["الإيثيلين", "الأكسين", "الجبريلين", "السيتوكاينين"],
    answer: 0,
    explanation: "الإيثيلين هرمون نباتي غازي يسرّع نضج كثير من الثمار، ويستخدم للتحكم في توقيت النضج.",
  },
  {
    id: "6ad0150c63cd9c24f9f41953", page: 65, number: 6,
    text: "أي الصفات الآتية للورقة تُعد كمية؟",
    options: ["مقاسها", "ملمسها", "رائحتها", "لونها"],
    answer: 0,
    explanation: "يمكن قياس مقاس الورقة عدديًا، لذلك فهو وصف كمي. أما الملمس والرائحة واللون فيوصفون نوعيًا في هذا السياق.",
  },
  {
    id: "6ad0150c63cd9c24f9f41955", page: 66, number: 8,
    text: "أي المواد الآتية حمض وفق تعريف أرهينيوس؟",
    options: ["NaOH", "NH₃", "BCl₃", "HCl"],
    answer: 3,
    explanation: "حمض أرهينيوس يزيد تركيز أيونات الهيدروجين في الماء؛ ويتأين HCl في الماء ليعطي +H و−Cl.",
  },
  {
    id: "6ad0150c63cd9c24f9f41956", page: 66, number: 9,
    text: "إلى أي مجموعة وظيفية ينتمي المركب CH₃CH₂−O−CH₂CH₃؟",
    options: ["الإيثرات", "الأميدات", "الإسترات", "الأمينات"],
    answer: 0,
    explanation: "تحتوي الإيثرات على ذرة أكسجين تربط مجموعتين كربونيتين بالشكل R−O−R′، وهو ما يظهر في المركب المعطى.",
  },
  {
    id: "6ad0150c63cd9c24f9f41957", page: 67, number: 10,
    text: "أي العبارات الآتية تمثل وصفًا كميًا؟",
    options: ["تحتوي السحب على كمية من الأمطار", "الصوديوم مادة كاوية للجلد", "تركيز المحلول 1mol/L", "يذوب الملح في الماء الساخن"],
    answer: 2,
    explanation: "الوصف الكمي يتضمن قياسًا عدديًا ووحدة؛ وتركيز 1mol/L يحقق ذلك، بخلاف الأوصاف النوعية الأخرى.",
  },
  {
    id: "6ad0150c63cd9c24f9f41958", page: 67, number: 12,
    text: "ما الخاصية التي تعبّر عن الحرارة اللازمة لرفع درجة حرارة وحدة كتلة من مادة درجة مئوية واحدة؟",
    options: ["الحرارة الكامنة", "السعة الحرارية", "الحرارة النوعية", "السعر"],
    answer: 2,
    explanation: "الحرارة النوعية هي كمية الحرارة اللازمة لرفع درجة حرارة وحدة الكتلة من المادة درجة واحدة. أما السعة الحرارية فتخص الجسم كله.",
  },
  {
    id: "6ad0150c63cd9c24f9f41959", page: 68, number: 13,
    text: "ما المصطلح الذي يعبّر عن التغير في كمية مادة متفاعلة أو ناتجة لكل وحدة زمن؟",
    options: ["الاتزان الكيميائي", "التعادل", "سرعة التفاعل الكيميائي", "المادة المحفزة"],
    answer: 2,
    explanation: "سرعة التفاعل تقيس مقدار تغير تركيز المتفاعلات أو النواتج خلال وحدة الزمن.",
  },
  {
    id: "6ad0150c63cd9c24f9f4195a", page: 68, number: 14,
    text: "أُذيب 0.5mol من ملح في 500g من المذيب. ما مولالية المحلول؟",
    options: ["1.0mol/kg", "1.5mol/kg", "2.0mol/kg", "3.0mol/kg"],
    answer: 0,
    explanation: "المولالية = مولات المذاب ÷ كتلة المذيب بالكيلوغرام =0.5÷0.500=1.0mol/kg.",
  },
  {
    id: "6ad0150c63cd9c24f9f4195d", page: 70, number: 20,
    text: "في المعادلة Zn(s)+Cu²⁺(aq)→Zn²⁺(aq)+Cu(s)، ما العامل المختزل؟",
    options: ["Zn²⁺", "Cu²⁺", "Zn", "Cu"],
    answer: 2,
    explanation: "يتأكسد الزنك من Zn إلى Zn²⁺ ويفقد إلكترونين، وبذلك يختزل أيونات النحاس Cu²⁺ إلى نحاس فلزي؛ فالزنك هو العامل المختزل.",
  },
  {
    id: "6ad0150c63cd9c24f9f4195e", page: 70, number: 21,
    text: "أي الخواص الآتية للسكر خاصية كيميائية وليست فيزيائية؟",
    options: ["يوجد بلورات صلبة في الظروف العادية", "لونه أبيض", "طعمه حلو", "يتحلل عند تسخينه إلى مواد أخرى"],
    answer: 3,
    explanation: "التحلل بالتسخين يغيّر تركيب السكر وينتج مواد جديدة، ولذلك فهو خاصية كيميائية. اللون والطعم والحالة صفات فيزيائية.",
  },
] as const;

const rejected = [
  {
    id: "6ad0150c63cd9c24f9f41950", page: 64, number: 3,
    note: "حُجب السؤال: يورد المصدر صيغة كلوريد الألومنيوم بصورة ناقصة، كما أن AlCl₃ ذو طابع تساهمي ملحوظ وليس مثالًا مدرسيًا خاليًا من الالتباس على الرابطة الأيونية. لا أعتمد مفتاحه دون نسخة سليمة أو صياغة ومثال بديلين موثقين.",
  },
  {
    id: "6ad0150c63cd9c24f9f41954", page: 66, number: 7,
    note: "حُجب السؤال لتكراره معنى سؤال سابق وخياراته وإجابته نفسها تقريبًا: تحديد مقاس الورقة بوصفه بيانات كمية.",
  },
  {
    id: "6ad0150c63cd9c24f9f4195b", page: 69, number: 18,
    note: "حُجب السؤال لتكراره تعريف الحرارة النوعية الوارد في سؤال سابق من المصدر نفسه بعد صفحتين؛ أبقينا سؤالًا واحدًا لتجنب نسخ مكرر.",
  },
  {
    id: "6ad0150c63cd9c24f9f4195c", page: 70, number: 19,
    note: "حُجب السؤال لتكراره حرفيًا تقريبًا سؤال السيزيوم-132 وعدد النيوترونات الذي سبق في الصفحة 24 من المصدر نفسه.",
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
          subject: "كيمياء",
          subcategory: "كيمياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || "كيمياء",
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
          reviewerNotes: "تمت مراجعة السؤال والحساب/المفتاح علميًا، وإضافة شرح واضح.",
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
