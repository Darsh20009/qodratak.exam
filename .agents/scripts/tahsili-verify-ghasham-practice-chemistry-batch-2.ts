import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-chemistry-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f417c2",
    page: 6,
    number: 35,
    text: "ما نوع التهجين حول ذرة الأكسجين في جزيء الماء H₂O؟",
    options: ["sp", "sp²", "sp³", "sp³d"],
    answer: 2,
    explanation: "حول ذرة الأكسجين رابطتان O–H وزوجان غير رابطين؛ أي أربع مناطق كثافة إلكترونية، فيكون التهجين sp³.",
  },
  {
    id: "6ad0103563cd9c24f9f417c3",
    page: 6,
    number: 36,
    text: "إلى أي مجموعة من الجزيئات الحيوية ينتمي السليلوز الذي يدخل في تركيب الجدار الخلوي للنبات؟",
    options: ["الكربوهيدرات", "الدهون", "البروتينات", "الأحماض النووية"],
    answer: 0,
    explanation: "السليلوز عديد سكاريد، ولذلك يُصنَّف ضمن الكربوهيدرات.",
  },
  {
    id: "6ad0103563cd9c24f9f417c4",
    page: 6,
    number: 37,
    text: "ما المتغيران اللذان يربط بينهما قانون شارل لكمية محددة من الغاز عند ثبوت الضغط؟",
    options: ["الضغط ودرجة الحرارة", "درجة الحرارة والحجم", "الضغط والحجم", "الضغط وكمية الغاز"],
    answer: 1,
    explanation: "ينص قانون شارل على أن حجم كمية محددة من الغاز يتناسب طرديًا مع درجة حرارته المطلقة عند ثبوت الضغط.",
  },
  {
    id: "6ad0103563cd9c24f9f417c5",
    page: 6,
    number: 38,
    text: "ما الجهاز المستخدم لقياس الضغط الجوي؟",
    options: ["النانومتر", "المانومتر", "الترمومتر", "البارومتر"],
    answer: 3,
    explanation: "يُستخدم البارومتر لقياس الضغط الجوي، بينما يقيس المانومتر ضغط الغاز المحصور.",
  },
  {
    id: "6ad0103563cd9c24f9f417c6",
    page: 6,
    number: 39,
    text: "أي الطرق الآتية تُستخدم لحماية الحديد من التآكل؟",
    options: ["الأكسدة", "الاختزال", "الكربنة", "الجلفنة"],
    answer: 3,
    explanation: "تغطي الجلفنة الحديد بطبقة من الزنك، فتعمل الطبقة حاجزًا واقيًا وتوفّر حماية تضحية عند خدش السطح.",
  },
  {
    id: "6ad0103563cd9c24f9f417c7",
    page: 6,
    number: 40,
    text: "أي التغيرات الآتية تغير كيميائي؟",
    options: ["ذوبان الجليد", "تكثف بخار الماء", "احتراق فتيلة الشمعة", "انصهار الزئبق"],
    answer: 2,
    explanation: "احتراق فتيلة الشمعة يتضمن تفاعلًا كيميائيًا ينتج مواد جديدة، أما بقية الخيارات فتغيرات في الحالة الفيزيائية.",
  },
  {
    id: "6ad0103563cd9c24f9f417c8",
    page: 6,
    number: 41,
    text: "إلى أي مجموعة عضوية ينتمي المركب CH₃CH₂–O–CH₂CH₃؟",
    options: ["الإيثرات", "الإسترات", "الأميدات", "الأمينات"],
    answer: 0,
    explanation: "تحتوي الإيثرات على ذرة أكسجين بين مجموعتين عضويتين R–O–R′، وهذا يطابق تركيب المركب.",
  },
  {
    id: "6ad0103563cd9c24f9f417c9",
    page: 6,
    number: 42,
    text: "ما اسم المركب الحلقي الظاهر في الرسم؟ (حلقة سيكلوهكسان تحمل مجموعتي ميثيل عند الموضعين 1 و4)",
    options: ["1,4-ثنائي ميثيل سيكلوهكسان", "1,4-ثنائي ميثيل سيكلوبنتان", "1,4-ثنائي إيثيل سيكلوهكسان", "1,4-ثنائي ميثيل بنزين"],
    answer: 0,
    explanation: "الحلقة سداسية مشبعة، أي سيكلوهكسان، وتحمل مجموعتي ميثيل متقابلتين عند الموضعين 1 و4؛ لذا اسمها 1,4-ثنائي ميثيل سيكلوهكسان.",
  },
  {
    id: "6ad0103563cd9c24f9f417ca",
    page: 6,
    number: 45,
    text: "ما عدد أكسدة النيتروجين في حمض النتريك HNO₃؟",
    options: ["+6", "+5", "−2", "−5"],
    answer: 1,
    explanation: "مجموع أعداد الأكسدة في المركب المتعادل يساوي صفرًا: (+1)+x+3(−2)=0، ومنه x=+5.",
  },
  {
    id: "6ad0103563cd9c24f9f417cb",
    page: 7,
    number: 46,
    text: "عينة هيدروجين كتلتها 400 g وكتلتها المولية 1.0 g/mol. كم عدد مولاتها؟",
    options: ["401 mol", "400 mol", "399 mol", "200 mol"],
    answer: 1,
    explanation: "عدد المولات n=m/M=400 g ÷ 1.0 g/mol=400 mol.",
  },
  {
    id: "6ad0103563cd9c24f9f417cc",
    page: 7,
    number: 47,
    text: "في التفاعل Zn(s)+Cu²⁺(aq)→Zn²⁺(aq)+Cu(s)، ما العامل المختزل؟",
    options: ["Zn²⁺", "Cu²⁺", "Zn", "Cu"],
    answer: 2,
    explanation: "يتأكسد الخارصين من عدد أكسدة 0 إلى +2، فيمنح إلكترونين لأيون النحاس؛ لذلك يعمل Zn عاملًا مختزلًا.",
  },
  {
    id: "6ad0103563cd9c24f9f417cd",
    page: 7,
    number: 48,
    text: "في الاتزان N₂(g)+2O₂(g)⇌2NO₂(g)، إلى أي اتجاه ينزاح الاتزان عند زيادة تركيز N₂؟",
    options: ["لا يتأثر", "باتجاه تكوين N₂", "باتجاه تكوين NO₂", "باتجاه تكوين O₂"],
    answer: 2,
    explanation: "وفق مبدأ لوشاتيليه، إضافة N₂ تدفع النظام إلى استهلاك الزيادة، فينزاح الاتزان نحو تكوين NO₂.",
  },
  {
    id: "6ad0103563cd9c24f9f417ce",
    page: 7,
    number: 49,
    text: "في التفاعل الطارد للحرارة CH₄(g)+2O₂(g)⇌CO₂(g)+2H₂O(g)+حرارة، ماذا يحدث عند رفع درجة الحرارة؟",
    options: ["تقل كمية CH₄", "تقل كمية O₂", "تزداد كمية CO₂", "تقل كمية H₂O"],
    answer: 3,
    explanation: "الحرارة ناتج في التفاعل الطارد. رفع درجة الحرارة يدفع الاتزان نحو المتفاعلات، فتقل كمية النواتج ومنها H₂O.",
  },
  {
    id: "6ad0103563cd9c24f9f417cf",
    page: 7,
    number: 50,
    text: "أي فروع الكيمياء يدرس مركبات الكربون؟",
    options: ["الكيمياء التحليلية", "الكيمياء العضوية", "الكيمياء الذرية", "الكيمياء الفيزيائية"],
    answer: 1,
    explanation: "تدرس الكيمياء العضوية بنية مركبات الكربون وخواصها وتفاعلاتها.",
  },
  {
    id: "6ad0103563cd9c24f9f417d0",
    page: 7,
    number: 51,
    text: "لتفاعل ماص للحرارة عند الاتزان، أي تغيير يزيد ثابت الاتزان K؟",
    options: ["إضافة عامل محفز", "خفض درجة الحرارة", "إضافة النواتج", "رفع درجة الحرارة"],
    answer: 3,
    explanation: "درجة الحرارة وحدها تغيّر قيمة ثابت الاتزان. في التفاعل الماص تُعد الحرارة متفاعلًا؛ فرفعها يزيد K ويدفع الاتزان نحو النواتج.",
  },
  {
    id: "6ad0103563cd9c24f9f417d1",
    page: 7,
    number: 52,
    text: "متى يصبح التوزيع الإلكتروني لأيون الكالسيوم Ca²⁺ مماثلًا لتوزيع غاز نبيل؟",
    options: ["عندما يكتسب إلكترونًا واحدًا", "عندما يفقد إلكترونًا واحدًا", "عندما يكتسب إلكترونين", "عندما يفقد إلكترونين"],
    answer: 3,
    explanation: "للكالسيوم 20 إلكترونًا. بفقد إلكترونين يصبح Ca²⁺ ذا 18 إلكترونًا، مثل الأرجون.",
  },
  {
    id: "6ad0103563cd9c24f9f417d2",
    page: 7,
    number: 53,
    text: "ما نوع الرابطة التساهمية الشائعة التي يستطيع عنصر من المجموعة 15 تكوينها لإكمال غلاف التكافؤ؟",
    options: ["أحادية", "ثنائية", "ثلاثية", "رباعية"],
    answer: 2,
    explanation: "لعناصر المجموعة 15 خمسة إلكترونات تكافؤ، ويمكنها تكوين ثلاث روابط تساهمية لإكمال الثمانية؛ ومثال ذلك الرابطة الثلاثية في N₂.",
  },
  {
    id: "6ad0103563cd9c24f9f417d3",
    page: 7,
    number: 54,
    text: "ما الخاصية التي تقيس مقاومة السائل للتدفق والانسياب؟",
    options: ["الميوعة", "السريان", "اللزوجة", "التوتر السطحي"],
    answer: 2,
    explanation: "اللزوجة مقياس مقاومة السائل للتدفق؛ وكلما زادت اللزوجة كان انسيابه أصعب.",
  },
  {
    id: "6ad0103563cd9c24f9f417d4",
    page: 8,
    number: 55,
    text: "أي قانون يوضحه تكوّن الماء H₂O وفوق أكسيد الهيدروجين H₂O₂ من العنصرين نفسيهما بنسب كتلية مختلفة؟",
    options: ["قانون النسب المتضاعفة", "حفظ الطاقة", "قانون النسب الثابتة", "حفظ الكتلة"],
    answer: 0,
    explanation: "عندما تكوّن العناصر نفسها أكثر من مركب، وتقابل كتلة ثابتة من أحدها كتل مختلفة بسيطة النسبة من الآخر، ينطبق قانون النسب المتضاعفة.",
  },
  {
    id: "6ad0103563cd9c24f9f417d5",
    page: 8,
    number: 56,
    text: "كيف يُصنّف حمض الكبريتيك H₂SO₄؟",
    options: ["مخلوط", "عنصر", "محلول", "مركب"],
    answer: 3,
    explanation: "H₂SO₄ مادة نقية تتكون كيميائيًا من الهيدروجين والكبريت والأكسجين بنسبة ثابتة، لذا فهو مركب.",
  },
  {
    id: "6ad0103563cd9c24f9f417d6",
    page: 8,
    number: 57,
    text: "أي الأمثلة الآتية ينتج عن التوتر السطحي للماء؟",
    options: ["امتصاص الملابس للماء", "عمل المكبس الهيدروليكي", "وقوف حشرة على سطح الماء", "ارتفاع الماء في جذور النباتات"],
    answer: 2,
    explanation: "تماسك جزيئات الماء عند سطحه يكوّن سطحًا مشدودًا نسبيًا، ما يساعد بعض الحشرات الخفيفة على الوقوف عليه.",
  },
  {
    id: "6ad0103563cd9c24f9f417d7",
    page: 8,
    number: 58,
    text: "ما اسم تحول المادة مباشرة من الحالة الصلبة إلى الحالة الغازية دون المرور بالسائلة؟",
    options: ["التسامي", "الترسب", "التكثف", "التبخر"],
    answer: 0,
    explanation: "التسامي تحول مباشر من الصلب إلى الغاز، أما الترسب فهو التحول العكسي من الغاز إلى الصلب.",
  },
  {
    id: "6ad0103563cd9c24f9f417d8",
    page: 8,
    number: 59,
    text: "أي الأمثلة الآتية مخلوط معلق؟",
    options: ["الدم", "محلول السكر", "الماء مع الرمل", "المشروب الغازي"],
    answer: 2,
    explanation: "الرمل لا يذوب في الماء، وجسيماته كبيرة نسبيًا وتترسب عند ترك المخلوط؛ لذلك فهو معلق.",
  },
  {
    id: "6ad0103563cd9c24f9f417d9",
    page: 8,
    number: 61,
    text: "إلى أي نوع من الخواص تُصنّف الكتلة؟",
    options: ["خاصية مكثفة مميزة", "خاصية كيميائية", "خاصية ممتدة تعتمد على كمية المادة", "خاصية نوعية"],
    answer: 2,
    explanation: "الكتلة خاصية ممتدة؛ تتغير بتغير كمية المادة، بخلاف الخواص المكثفة مثل الكثافة.",
  },
  {
    id: "6ad0103563cd9c24f9f417da",
    page: 8,
    number: 62,
    text: "إلى أي نوع من المخاليط يُصنّف الحليب؟",
    options: ["معلق", "غروي", "محلول حقيقي", "مخلوط متجانس على المستوى الجزيئي"],
    answer: 1,
    explanation: "الحليب مستحلب غروي؛ تنتشر فيه قطرات دقيقة من الدهون في الماء ولا تترسب سريعًا.",
  },
  {
    id: "6ad0103563cd9c24f9f417db",
    page: 8,
    number: 63,
    text: "ما الخطوة العلمية المعتادة التي تأتي بعد وضع الفرضية لاختبارها؟",
    options: ["إجراء التجربة", "تسجيل الملاحظة الأولى", "كتابة الاستنتاج مسبقًا", "جمع بيانات بلا اختبار"],
    answer: 0,
    explanation: "تُختبر الفرضية عادة بإجراء تجربة مضبوطة، ثم تُحلل البيانات ويُكتب الاستنتاج.",
  },
  {
    id: "6ad0103563cd9c24f9f417dc",
    page: 8,
    number: 65,
    text: "ما الخاصية التي تميّز المركب عن المخلوط؟",
    options: ["يمكن فصل مكوناته بالترشيح", "تتحد مكوناته بأي نسبة", "تتحد مكوناته كيميائيًا بنسبة محددة", "تحتفظ مكوناته بخصائصها الأصلية"],
    answer: 2,
    explanation: "تتحد عناصر المركب كيميائيًا بنسب ثابتة، وتنتج مادة جديدة تختلف خواصها عن خواص مكوناتها.",
  },
  {
    id: "6ad0103563cd9c24f9f417dd",
    page: 8,
    number: 66,
    text: "أي المخاليط الآتية يُظهر بوضوح تأثير تندال؟",
    options: ["الحليب السائل", "ماء وسكر", "ماء وملح", "ماء وطباشير"],
    answer: 0,
    reviewNote: "تم تصحيح مفتاح المصدر: الإجابة هي الحليب (أ)، لأنه غروي يشتت الضوء. المفتاح المطبوع (د) يختار الماء والطباشير، وهو معلق لا المثال المقصود للغروي.",
    explanation: "الحليب مستحلب غروي؛ جسيماته المنتشرة تشتت الضوء فتظهر حزمة الضوء، وهذا هو تأثير تندال. محلولا السكر والملح حقيقيان فلا يظهر فيهما هذا التأثير.",
  },
  {
    id: "6ad0103563cd9c24f9f417de",
    page: 8,
    number: 67,
    text: "ما الطريقة المناسبة لفصل ألوان الحبر الأسود؟",
    options: ["التقطير", "الكروماتوغرافيا", "الترشيح", "التبلور"],
    answer: 1,
    explanation: "تفصل الكروماتوغرافيا أصباغ الحبر بحسب اختلاف انجذاب كل صبغة للطور المتحرك والطور الثابت.",
  },
  {
    id: "6ad0103563cd9c24f9f417df",
    page: 8,
    number: 68,
    text: "ما الطريقة المناسبة لفصل سوائل ممتزجة تختلف في درجات غليانها؟",
    options: ["التقطير", "الكروماتوغرافيا", "الترشيح", "التبلور"],
    answer: 0,
    explanation: "يفصل التقطير السوائل الممتزجة اعتمادًا على اختلاف درجات غليانها؛ يتبخر المكوّن الأقل غليانًا أولًا ثم يُكثّف.",
  },
] as const;

const rejections = [
  {
    id: "6ad0103563cd9c24f9f417c1",
    page: 6,
    number: 34,
    note: "مرفوض: السؤال يسأل عن إشعاع غير مشحون، لكن أشعة جاما والأشعة فوق البنفسجية كلتيهما غير مشحونتين؛ لذلك يوجد أكثر من جواب صحيح.",
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
          reviewerNotes: ("reviewNote" in item && item.reviewNote) ||
            "تمت مراجعة نص السؤال والخيارات والحل مع المصدر، وأضيف شرح توضيحي.",
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
