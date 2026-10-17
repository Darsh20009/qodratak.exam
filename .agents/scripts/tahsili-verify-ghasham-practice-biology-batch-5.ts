import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-biology-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0188a63cd9c24f9f4463b",
    page: 15,
    number: 167,
    text: "ما نوع المفصل الذي يربط عظم الفخذ بالحوض؟",
    options: ["رَزّي", "مداري", "درزي", "كروي حُقّي"],
    answer: 3,
    explanation: "مفصل الورك كروي حُقّي؛ يسمح بالحركة في عدة اتجاهات، ويصل رأس عظم الفخذ بالتجويف الحُقّي في الحوض.",
  },
  {
    id: "6ad0188a63cd9c24f9f4463c",
    page: 15,
    number: 168,
    text: "أي جزء من الدماغ ينسق الحركة ويسهم في حفظ التوازن؟",
    options: ["المخ الكبير", "المخيخ", "الحبل الشوكي", "النخاع المستطيل"],
    answer: 1,
    explanation: "ينسق المخيخ الحركة والتوازن ودقة الأداء الحركي.",
  },
  {
    id: "6ad0188a63cd9c24f9f4463d",
    page: 15,
    number: 169,
    text: "ما نوع المفصل الذي يتعرض للخلع عند خلع الورك؟",
    options: ["مداري", "منزلق", "كروي حُقّي", "رَزّي"],
    answer: 2,
    explanation: "مفصل الورك مفصل كروي حُقّي، ويمكن أن يحدث فيه خلع عندما يخرج رأس عظم الفخذ من التجويف.",
  },
  {
    id: "6ad0188a63cd9c24f9f4463e",
    page: 15,
    number: 170,
    text: "أي السكريات الآتية أحادي السكاريد؟",
    options: ["الجلوكوز", "السكروز", "اللاكتوز", "السليلوز"],
    answer: 0,
    explanation: "الجلوكوز أحادي سكاريد. السكروز واللاكتوز ثنائيا سكاريد، والسليلوز عديد سكاريد.",
  },
  {
    id: "6ad0188a63cd9c24f9f4463f",
    page: 15,
    number: 171,
    text: "أي العمليات الآتية ليست هضمًا ميكانيكيًا؟",
    options: ["تحريك الطعام باللسان", "طحن الطعام بالأسنان", "إفراز اللعاب", "دفع الطعام نحو المريء باللسان"],
    answer: 2,
    explanation: "إفراز اللعاب عملية إفراز كيميائية؛ أما تحريك الطعام وطحنه ودفعه فهي عمليات ميكانيكية.",
  },
  {
    id: "6ad0188a63cd9c24f9f44640",
    page: 15,
    number: 172,
    text: "أي مما يأتي مثال على روتين يومي للحيوان؟",
    options: ["النوم والاستيقاظ", "التزاوج", "النمو", "التكاثر"],
    answer: 0,
    explanation: "يتكرر النوم والاستيقاظ عادةً ضمن دورة يومية مرتبطة بتعاقب الليل والنهار.",
  },
  {
    id: "6ad0188a63cd9c24f9f44641",
    page: 15,
    number: 173,
    text: "يشير السهم في الرسم إلى المعدة. ما الصفة التي تميز بيئتها؟",
    options: ["وسطها قاعدي", "وسطها حمضي", "تهضم الدهون أساسًا", "تمتص معظم الغذاء"],
    answer: 1,
    explanation: "تفرز المعدة حمض الهيدروكلوريك، فيكون وسطها حمضيًا. يحدث معظم امتصاص المغذيات في الأمعاء الدقيقة.",
  },
  {
    id: "6ad0188a63cd9c24f9f44642",
    page: 16,
    number: 174,
    text: "أي العناصر المعدنية الآتية يدخل في تركيب الهيموغلوبين؟",
    options: ["الكالسيوم", "الصوديوم", "الحديد", "الزنك"],
    answer: 2,
    explanation: "تحتوي مجموعة الهيم في الهيموغلوبين على الحديد، الذي يرتبط بالأكسجين ارتباطًا عكوسًا.",
  },
  {
    id: "6ad0188a63cd9c24f9f44643",
    page: 16,
    number: 175,
    text: "ما اسم تبادل المقاطع بين كروماتيدات الكروموسومات المتماثلة في الطور التمهيدي الأول من الانقسام المنصف؟",
    options: ["التصالب", "العبور", "الانقسام المتساوي", "الانقسام المنصف"],
    answer: 1,
    explanation: "العبور هو تبادل مقاطع بين كروماتيدات غير شقيقة من كروموسومات متماثلة في الطور التمهيدي الأول.",
  },
  {
    id: "6ad0188a63cd9c24f9f44644",
    page: 16,
    number: 176,
    text: "في تزاوج Ee × Ee، ما نسبة الأبناء المتوقع أن يكون نمطهم الجيني متماثلًا متنحيًا ee؟",
    options: ["25%", "50%", "75%", "100%"],
    answer: 0,
    explanation: "ينتج عن مربع بانيت النمطان EE وEe وEe وee؛ لذا احتمال ee يساوي 1 من 4، أي 25%.",
  },
  {
    id: "6ad0188a63cd9c24f9f44645",
    page: 16,
    number: 177,
    text: "أي مجموعة تتكون من عوامل لاحيوية فقط؟",
    options: ["الماء والتربة والأكسجين والميكروبات والطيور", "الشمس والبط والبعوض والطيور", "ثاني أكسيد الكربون والإنسان والسلاحف والميكروبات", "الماء والتربة والشمس وثاني أكسيد الكربون"],
    answer: 3,
    explanation: "الماء والتربة وضوء الشمس وثاني أكسيد الكربون عوامل غير حية. أما الحيوانات والميكروبات فعوامل حيوية.",
  },
  {
    id: "6ad0188a63cd9c24f9f44646",
    page: 16,
    number: 178,
    text: "شاهد علي وأصدقاؤه ضفدعًا في رحلة وسجلوا ما رأوه. ما الخطوة العلمية التي قاموا بها؟",
    options: ["استنتاج", "ملاحظة", "تجربة", "نظرية"],
    answer: 1,
    explanation: "مشاهدة الكائن الحي وتسجيل صفاته مباشرةً تمثل ملاحظة.",
  },
  {
    id: "6ad0188a63cd9c24f9f44647",
    page: 16,
    number: 179,
    text: "أي الاستجابات الآتية ليست من آثار تنشيط الجهاز العصبي السمبثاوي عادةً؟",
    options: ["زيادة نشاط العضلات", "انخفاض معدل نبض القلب", "زيادة إفراز اللعاب", "اتساع حدقة العين"],
    answer: 2,
    explanation: "يزيد الجهاز السمبثاوي عادةً الاستعداد للنشاط، مثل تسارع القلب واتساع الحدقة، ويثبط الهضم واللعاب. زيادة إفراز اللعاب ترتبط أكثر بالنشاط نظير السمبثاوي.",
  },
  {
    id: "6ad0188a63cd9c24f9f44648",
    page: 16,
    number: 180,
    text: "في تهجين بذور البازلاء الموضح، إذا كان الأبوان YY (أصفر) وyy (أخضر)، فما النمط الجيني والشكلي للبذرة رقم 1 في الجيل الأول؟",
    options: ["Yy صفراء", "yy صفراء", "Yy خضراء", "بذرة وردية"],
    answer: 0,
    explanation: "ينتج عن YY×yy نسل كله Yy. وبما أن Y سائد للون الأصفر، تكون البذور صفراء.",
  },
  {
    id: "6ad0188a63cd9c24f9f44649",
    page: 16,
    number: 181,
    text: "أي موضوع علمي هو الأنسب لكتابة بحث عن مرض شلل الأطفال؟",
    options: ["الحشرات الناقلة للأمراض", "الأمراض الفيروسية", "الأمراض الهضمية", "هشاشة العظام"],
    answer: 1,
    explanation: "شلل الأطفال مرض فيروسي، لذا تندرج دراسته ضمن موضوع الأمراض الفيروسية.",
  },
  {
    id: "6ad0188a63cd9c24f9f4464a",
    page: 16,
    number: 182,
    text: "شاهد طلاب في رحلة ميدانية أنواعًا مختلفة من الضفادع والتقطوا صورًا لها. ما الطريقة العلمية التي استخدموها؟",
    options: ["نظرية", "فرضية", "استنتاج", "ملاحظة"],
    answer: 3,
    explanation: "مشاهدة الأنواع وتسجيلها بالصور جمعٌ للمعلومات بالملاحظة، وليس تجربةً ما لم يغيّر الباحث عاملًا ويختبر أثره.",
  },
  {
    id: "6ad0188a63cd9c24f9f4464b",
    page: 16,
    number: 183,
    text: "أي سلوك اجتماعي يساعد على تنظيم السيطرة وتقليل النزاع المتكرر داخل الجماعة؟",
    options: ["الصراع", "المغازلة", "تسلسل السيادة الهرمي", "السلوك الإدراكي"],
    answer: 2,
    explanation: "يحدد تسلسل السيادة الهرمي أولوية الأفراد في الجماعة، وقد يقلل المواجهات المتكررة على الموارد.",
  },
  {
    id: "6ad0188a63cd9c24f9f4464c",
    page: 17,
    number: 185,
    text: "أي العمليات الآتية تزيد التنوع الوراثي في النسل؟",
    options: ["الانقسام المنصف", "الانقسام المتساوي", "تكوين الأبواغ وحده", "التكاثر بالتبرعم"],
    answer: 0,
    explanation: "يسهم الانقسام المنصف في التنوع عبر العبور والتوزيع المستقل للكروموسومات، ويزداد التنوع مع الإخصاب العشوائي.",
  },
  {
    id: "6ad0188a63cd9c24f9f4464d",
    page: 17,
    number: 186,
    text: "أي تنظيم اجتماعي يمكن أن يخفف الصراعات المتكررة بين أفراد الجماعة؟",
    options: ["تسلسل السيادة", "الهجرة", "منطقة النفوذ", "الإيثار"],
    answer: 0,
    explanation: "يساعد تسلسل السيادة الواضح على تنظيم الأولوية والوصول إلى الموارد، فيقلل بعض النزاعات المتكررة.",
  },
  {
    id: "6ad0188a63cd9c24f9f4464e",
    page: 17,
    number: 187,
    text: "إذا كانت نسبة قواعد الثايمين في جزيء DNA تساوي 40%، فما نسبة الأدينين؟",
    options: ["40%", "60%", "30%", "20%"],
    answer: 0,
    explanation: "يرتبط الأدينين بالثايمين بنسبة متساوية في DNA؛ لذا تكون نسبة A مساوية لنسبة T، أي 40%.",
  },
  {
    id: "6ad0188a63cd9c24f9f4464f",
    page: 17,
    number: 188,
    text: "في كريات الدم الحمراء أثناء نقل ثاني أكسيد الكربون إلى الرئتين، ما التفاعل الذي يساعد على تحرير CO₂ للزفير؟",
    options: ["اتحاد H⁺ مع HCO₃⁻ داخل كرية دم حمراء ثم تكوّن CO₂ وH₂O", "اتحاد H⁺ مع HCO₃⁻ داخل كرية دم بيضاء", "اتحاد H⁺ مع H₂O داخل كرية دم حمراء فقط", "اتحاد H⁺ مع H₂O داخل كرية دم بيضاء"],
    answer: 0,
    explanation: "في الرئتين يتحد H⁺ مع HCO₃⁻ داخل كرية الدم الحمراء، فيتكون حمض الكربونيك الذي يتحلل إلى CO₂ وH₂O؛ ثم ينتشر CO₂ إلى الحويصلات ويُزفَر.",
  },
  {
    id: "6ad0188a63cd9c24f9f44650",
    page: 17,
    number: 191,
    text: "يؤثر مرض حمّى الوادي المتصدع في جماعات حيوية. أي عامل محدد يصف انتقال مرض معدٍ بين الأفراد؟",
    options: ["المساحة", "الكتلة", "الحجم", "الكثافة"],
    answer: 3,
    explanation: "الأمراض المعدية عامل يعتمد غالبًا على الكثافة؛ فزيادة تقارب الأفراد واحتمال تواصلهم قد تزيد فرص الانتقال.",
  },
  {
    id: "6ad0188a63cd9c24f9f44651",
    page: 17,
    number: 192,
    text: "ما السطح الذي يساعد الضفدع على تبادل الغازات والتنفس أثناء وجوده في باطن الأرض؟",
    options: ["أنابيب ملبيجي", "الأرجل", "الجلد", "الرئات وحدها"],
    answer: 2,
    explanation: "يمكن للضفدع تبادل الغازات عبر جلده الرطب، وهو مهم خصوصًا عندما يكون مدفونًا أو في حالة خمول.",
  },
  {
    id: "6ad0188a63cd9c24f9f44652",
    page: 17,
    number: 193,
    text: "أي مرض بكتيري قد يصيب الرئتين ويضعف تبادل الغازات بين الهواء والدم؟",
    options: ["سرطان الرئة", "الربو", "الإنفلونزا", "السل الرئوي"],
    answer: 3,
    explanation: "السل الرئوي عدوى بكتيرية قد تسبب تلفًا والتهابًا في أنسجة الرئة، فتضعف كفاءة تبادل الغازات.",
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
          subcategory: draft.subcategory || "أحياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "أحياء",
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
          reviewerNotes: "تمت مراجعة السؤال والخيارات والحل بمقابلتها مع المصدر، وأضيف شرح توضيحي.",
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
