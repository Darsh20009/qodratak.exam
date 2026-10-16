import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-math-period-1";
const REVIEWER = "source-verified-content-audit";

const corrections = [
  {
    number: 110,
    page: 13,
    answer: 1,
    optionNeedle: "(0,3)",
    text: "أُزيحت النقطة (2، 6) وحدتين إلى اليسار وثلاث وحدات إلى الأسفل. ما إحداثيا النقطة الناتجة؟",
    explanation: "الإزاحة وحدتين إلى اليسار تنقص الإحداثي السيني: 2−2=0. والإزاحة ثلاث وحدات إلى الأسفل تنقص الصادي: 6−3=3. إذن النقطة (0، 3).",
  },
  {
    number: 136,
    page: 15,
    answer: 2,
    optionNeedle: "(2,−1)",
    text: "ما مركز الدائرة التي معادلتها (x−2)²+(y+1)²=4؟",
    explanation: "الصيغة القياسية للدائرة هي (x−h)²+(y−k)²=r². من (x−2)²+(y−(−1))²=4 يكون المركز (2، −1).",
  },
  {
    number: 153,
    page: 17,
    answer: 0,
    optionNeedle: "2",
    text: "أوجد ∫(4x+5) dx.",
    explanation: "نكامل حدًا حدًا: ∫4x dx=2x² و∫5 dx=5x، ثم نضيف ثابت التكامل C؛ فالنتيجة 2x²+5x+C.",
  },
  {
    number: 154,
    page: 17,
    answer: 2,
    optionNeedle: "50%",
    text: "لرجل ستة أبناء ذكور. ما احتمال أن يكون المولود التالي ذكرًا؟",
    explanation: "جنس كل مولود مستقل عن المواليد السابقين؛ لذلك يبقى احتمال الذكر 1/2، أي 50%، مهما كان عدد الأبناء السابقين.",
  },
  {
    number: 194,
    page: 20,
    answer: 1,
    optionNeedle: "قفزي",
    text: "إذا كانت f(x)=3x عندما x≥2، وf(x)=4−x² عندما x<2، فما نوع عدم الاتصال عند x=2؟",
    explanation: "عند الاقتراب من اليسار تكون النهاية 4−2²=0، وعند x=2 من الفرع الآخر تكون القيمة 3×2=6. النهايتان الجانبيتان مختلفتان، لذا يوجد عدم اتصال قفزي.",
  },
] as const;

const rejections = [
  { number: 3, page: 3, note: "مرفوض من البنك المنشور: السؤال يطلب الإزاحة من رسم غير مرفق، ولا يمكن تحديدها من النص والخيارات وحدهما." },
  { number: 47, page: 7, note: "مرفوض من البنك المنشور: الخياران أ وج متطابقان نصًا؛ أُبقيت المسودة محفوظة بدل نشر سؤال ذي خيارات مكررة." },
  { number: 151, page: 17, note: "مرفوض من البنك المنشور: قيمة sinθ في المسودة غير مقروءة/ناقصة؛ لا يمكن اعتماد الإجابة أو الشرح من دون قيمة واضحة." },
  { number: 166, page: 18, note: "مرفوض من البنك المنشور: تعريف الدالتين في تركيب الدوال تالف في الاستخراج ولا يطابق خيارات المجال بصورة تسمح بتحديد جواب موثوق." },
  { number: 168, page: 18, note: "مرفوض من البنك المنشور: العبارة الجبرية المطلوب تبسيطها ناقصة في النص المستخرج؛ الخيارات وحدها لا تحدد التعبير الأصلي." },
  { number: 169, page: 18, note: "مرفوض من البنك المنشور: قاعدة اللوغاريتم ومدخله غير واضحين في الاستخراج، فلا توجد مسألة قابلة للتحقق." },
  { number: 170, page: 18, note: "مرفوض من البنك المنشور: عناصر المصفوفات وعملية الضرب تضررت في الاستخراج ولا يمكن استعادة المعادلة كاملة بثقة." },
  { number: 173, page: 19, note: "مرفوض من البنك المنشور: تعريف الدالتين والعملية المركبة/المشتقة ناقص؛ النص المستخرج لا ينتج إجابة متسقة مع الخيارات." },
] as const;

function normalize(value: string) {
  return value.normalize("NFKC").replace(/\s+/g, "").replace(/[−–—]/g, "-");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this review is authorized for Replit preview only.`);
  }
  const drafts = await TahsiliQuestionDraft.find({ sourceId: SOURCE_ID, status: "pending_review" })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byNumber = new Map<number, any[]>();
  for (const draft of drafts) {
    const number = Number(draft.sourceQuestionNumber);
    byNumber.set(number, [...(byNumber.get(number) || []), draft]);
  }
  const failures: string[] = [];
  if (drafts.length !== corrections.length + rejections.length) {
    failures.push(`expected ${corrections.length + rejections.length} remaining drafts, found ${drafts.length}`);
  }
  for (const item of corrections) {
    const matches = byNumber.get(item.number) || [];
    if (matches.length !== 1 || matches[0].sourcePage !== item.page) {
      failures.push(`q${item.number}: source/page mismatch`);
      continue;
    }
    if (!Array.isArray(matches[0].options) || matches[0].options.length !== 4 ||
      !normalize(String(matches[0].options[item.answer] || "")).includes(normalize(item.optionNeedle))) {
      failures.push(`q${item.number}: selected option mismatch`);
    }
  }
  for (const item of rejections) {
    const matches = byNumber.get(item.number) || [];
    if (matches.length !== 1 || matches[0].sourcePage !== item.page) failures.push(`q${item.number}: rejection source/page mismatch`);
  }
  const covered = new Set([...corrections, ...rejections].map((item) => item.number));
  if (drafts.some((draft) => !covered.has(Number(draft.sourceQuestionNumber)))) failures.push("unreviewed draft remains in this batch");
  const keys = drafts.map((draft) => draft.sourceKey);
  const existing = keys.length ? await TahsiliQuestion.find({ sourceKey: { $in: keys } }).select("sourceKey").lean() : [];
  if (existing.length) failures.push(`found ${existing.length} already-published matching questions`);
  if (failures.length) {
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", draftsFound: drafts.length, failures }, null, 2));
    throw new Error("Preflight failed; no records were changed.");
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    database: TahsiliQuestionDraft.db.name,
    reviewed: drafts.length,
    approved: corrections.length,
    rejected: rejections.length,
    changed: false,
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const reviewedAt = new Date();
  for (const item of corrections) {
    const draft = byNumber.get(item.number)![0];
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
          subcategory: draft.subcategory || "عام",
          text: item.text,
          options: draft.options,
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "عام",
          explanation: item.explanation,
          sourcePage: draft.sourcePage,
          sourceQuestionNumber: namespacedQuestionNumber,
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
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      {
        $set: {
          status: "approved",
          text: item.text,
          explanation: item.explanation,
          reviewedBy: REVIEWER,
          reviewedAt,
          reviewerNotes: "تمت مطابقة نص السؤال وخياراته وحلّه مع ملف المصدر، وإضافة شرح موجز قابل للمراجعة.",
          updatedAt: reviewedAt,
        },
      },
    );
  }
  for (const item of rejections) {
    const draft = byNumber.get(item.number)![0];
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
