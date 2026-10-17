import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-biology-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0188a63cd9c24f9f44653", page: 18, number: 194,
    text: "يشير السهم في الشكل إلى الميتوكوندريا. ما وظيفتها الأساسية؟",
    options: ["إنتاج الطاقة في صورة ATP", "إنتاج البروتين", "تغليف البروتين", "بناء الدهون"],
    answer: 0,
    explanation: "تجري في الميتوكوندريا مراحل رئيسية من التنفس الخلوي الهوائي، وينتج عنها معظم ATP في الخلية.",
  },
  {
    id: "6ad0188a63cd9c24f9f44654", page: 18, number: 195,
    text: "لماذا تُصنّف الدياتومات ضمن الطلائعيات الشبيهة بالنباتات؟",
    options: ["لأنها تصنع غذاءها بالبناء الضوئي", "لأنها تفترس الحيوانات", "لأنها تتطفل دائمًا", "لأنها لا تحتوي على أصباغ"],
    answer: 0,
    explanation: "تحتوي الدياتومات على أصباغ تمكّنها من البناء الضوئي، لذلك توصف بأنها طلائعيات شبيهة بالنباتات.",
  },
  {
    id: "6ad0188a63cd9c24f9f44655", page: 18, number: 196,
    text: "ما نوع العلاقة البيئية بين أسد ونمر يتنافسان على مورد غذائي واحد؟",
    options: ["افتراس", "تنافس", "تطفل", "تبادل منفعة"],
    answer: 1,
    explanation: "عندما يحتاج مخلوقان إلى المورد المحدود نفسه، تنشأ بينهما علاقة تنافس.",
  },
  {
    id: "6ad0188a63cd9c24f9f44656", page: 18, number: 197,
    text: "ما العامل الممرض الذي يسبب الإنفلونزا؟",
    options: ["بكتيريا", "فيروس", "ديدان", "بريونات"],
    answer: 1,
    explanation: "تسبب الإنفلونزا فيروسات الإنفلونزا، ولا تعالج المضادات الحيوية العدوى الفيروسية نفسها.",
  },
  {
    id: "6ad0188a63cd9c24f9f44657", page: 18, number: 198,
    text: "أي الحيوانات الآتية يُتوقع أن يكون معدل الأيض لكل وحدة كتلة فيه أعلى؟",
    options: ["فيل", "إنسان", "فأر", "غزال"],
    answer: 2,
    explanation: "يمتلك الحيوان الصغير مثل الفأر معدل أيض أعلى لكل وحدة كتلة مقارنةً بحيوان كبير مثل الفيل.",
  },
  {
    id: "6ad0188a63cd9c24f9f44658", page: 18, number: 199,
    text: "ما الوصف البيئي للنسور التي تتغذى على جثث الحيوانات الميتة؟",
    options: ["آكلة أعشاب", "قارتة", "كانسة", "متطفلة"],
    answer: 2,
    explanation: "الكانسات تتغذى على بقايا الكائنات الميتة، وتساعد على إعادة المواد إلى النظام البيئي.",
  },
  {
    id: "6ad0188a63cd9c24f9f44659", page: 18, number: 200,
    text: "ما الوظيفة الأساسية للخلايا الكولنشيمية ذات الجدران السميكة؟",
    options: ["التخزين", "البناء الضوئي", "تبادل الغازات", "الدعامة المرنة"],
    answer: 3,
    explanation: "توفر خلايا الكولنشيم دعامة مرنة للأجزاء النباتية النامية بفضل جدرانها غير المتساوية في السمك.",
  },
  {
    id: "6ad0188a63cd9c24f9f4465a", page: 18, number: 201,
    text: "أي تزاوج من الآتي يمكن أن ينتج طفلًا فصيلة دمه O وفق نظام ABO؟",
    options: ["IᴬIᴬ × IᴬIᴬ", "Iᴬi × Iᴮi", "IᴮIᴮ × IᴮIᴮ", "IᴮIᴮ × IᴬIᴬ"],
    answer: 1,
    explanation: "يمكن لكل من الوالدين ذوي النمط Iᴬi وIᴮi تمرير الأليل المتنحي i؛ وإذا ورث الطفل i من كليهما كان نمطه ii وفصيلته O.",
  },
  {
    id: "6ad0188a63cd9c24f9f4465b", page: 18, number: 202,
    text: "أي الحالات الآتية قد تسبب الإمساك؟",
    options: ["قلة الماء في محتوى الأمعاء", "زيادة الماء في محتوى الأمعاء", "نقص امتصاص الماء", "ضعف عمل الكلية"],
    answer: 0,
    explanation: "زيادة امتصاص الماء أو قلة الماء المتبقي في محتوى الأمعاء تجعل البراز جافًا وصلبًا، ما قد يسبب الإمساك.",
  },
  {
    id: "6ad0188a63cd9c24f9f4465c", page: 18, number: 203,
    text: "أي هرمون نباتي يرتبط أساسًا بزيادة استطالة الساق كما في الشكل؟",
    options: ["الأكسينات", "الإيثيلين", "الجبرلينات", "السيتوكينينات"],
    answer: 2,
    explanation: "تُعرف الجبرلينات بدورها في تعزيز استطالة الساق. أما الأكسينات فتسهم في استطالة الخلايا وتنظيم النمو والاستجابات الاتجاهية.",
  },
  {
    id: "6ad0188a63cd9c24f9f4465d", page: 18, number: 204,
    text: "يشير السهم في شكل الكروموسوم إلى المنطقة التي تصل الكروماتيدين الشقيقين. ما اسمها؟",
    options: ["الكروماتيد", "السنترومير", "DNA", "البروتين"],
    answer: 1,
    explanation: "السنترومير منطقة تضيق في الكروموسوم وتتصل عندها الكروماتيدات الشقيقة.",
  },
  {
    id: "6ad0188a63cd9c24f9f4465e", page: 18, number: 205,
    text: "أي المناطق الحيوية الآتية يكون معدل التبخر فيها عادةً أعلى من معدل الهطول؟",
    options: ["التندرا", "الصحراء", "الغابات الموسمية المطيرة", "الأراضي العشبية"],
    answer: 1,
    explanation: "تتميز الصحراء بقلة الهطول، وغالبًا ما يتجاوز فيها التبخر مقدار الماء الواصل من الأمطار.",
  },
  {
    id: "6ad0188a63cd9c24f9f4465f", page: 18, number: 206,
    text: "يُظهر النمط النووي في الشكل ثلاث نسخ من الكروموسوم 21. ما المتلازمة الناتجة؟",
    options: ["متلازمة تيرنر", "متلازمة داون", "ذكر بنمط كروموسومي طبيعي", "متلازمة كلاينفلتر"],
    answer: 1,
    explanation: "وجود ثلاث نسخ من الكروموسوم 21 يسمى تثلث الصبغي 21 ويرتبط بمتلازمة داون.",
  },
  {
    id: "6ad0188a63cd9c24f9f44660", page: 19, number: 207,
    text: "أي زوج من الحيوانات الآتية أبعد تصنيفًا عن الآخر؟",
    options: ["فيل وفأر", "نعامة وبطريق", "خفاش وصقر", "فيل وجمل"],
    answer: 2,
    explanation: "الخفاش من الثدييات والصقر من الطيور؛ أما الأزواج الأخرى فتضم حيوانات من الطائفة نفسها.",
  },
  {
    id: "6ad0188a63cd9c24f9f44662", page: 19, number: 209,
    text: "أي الأمراض الآتية تسببه بكتيريا؟",
    options: ["الإيدز", "الإنفلونزا", "الزكام", "السيلان"],
    answer: 3,
    explanation: "يسبب مرض السيلان نوع من البكتيريا، بينما يسبب الإيدز والإنفلونزا والزكام فيروسات.",
  },
  {
    id: "6ad0188a63cd9c24f9f44663", page: 19, number: 210,
    text: "أي الأمثلة الآتية يصف عاملًا لاحيويًا في النظام البيئي؟",
    options: ["نمر يمشي بين الأشجار", "حلزون يذهب إلى البحر", "سلحفاة تحمل طعامها", "ضوء الشمس يتخلل الأغصان"],
    answer: 3,
    explanation: "ضوء الشمس عامل غير حي، بخلاف الحيوانات المذكورة في الخيارات الأخرى.",
  },
  {
    id: "6ad0188a63cd9c24f9f44664", page: 19, number: 211,
    text: "يشير السهم في شكل الجنين إلى الكيس الغذائي الصغير المتصل به في المراحل المبكرة. ما اسمه؟",
    options: ["كيس المح", "غشاء الأمنيون", "غشاء الكوريون", "الجلد"],
    answer: 0,
    explanation: "كيس المح تركيب جنيني يمد الجنين بالمغذيات في المراحل المبكرة، ويظهر في الشكل بجوار الجنين.",
  },
  {
    id: "6ad0188a63cd9c24f9f44665", page: 19, number: 214,
    text: "يمثل اختلاف أشكال الأرجل في الشكل مثالًا على:",
    options: ["التنافس", "النمو", "التكيف", "الاستجابة"],
    answer: 2,
    explanation: "تتباين أشكال الأرجل بما يلائم وظائف وبيئات مختلفة؛ وهذا مثال على التكيف.",
  },
  {
    id: "6ad0188a63cd9c24f9f44666", page: 19, number: 215,
    text: "ما الجزيء الذي يمثله الشكل ذو اللولب المزدوج؟",
    options: ["DNA", "RNA", "ATP", "NAD⁺"],
    answer: 0,
    explanation: "يمثل اللولب المزدوج البنية الشائعة لجزيء DNA.",
  },
  {
    id: "6ad0188a63cd9c24f9f44667", page: 19, number: 216,
    text: "في تجربة اختبار أثر الري على نمو النبات الظاهرة في الصورة، ما المتغير المستقل؟",
    options: ["نوع التربة", "الضوء", "كمية الماء", "درجة الحرارة"],
    answer: 2,
    explanation: "المتغير المستقل هو العامل الذي يغيّره الباحث؛ وفي التجربة المصورة يتغير الري، أي كمية الماء.",
  },
  {
    id: "6ad0188a63cd9c24f9f44668", page: 19, number: 217,
    text: "ما نوع العضلات التي يعتمد عليها الشخص أساسًا في أداء التمارين الرياضية الإرادية؟",
    options: ["الإرادية", "القلبية", "الهيكلية", "الملساء"],
    answer: 2,
    explanation: "تُحرّك العضلات الهيكلية العظام، وهي العضلات المخططة التي يتحكم بها الإنسان إراديًا في معظم الحركات الرياضية.",
  },
  {
    id: "6ad0188a63cd9c24f9f44669", page: 19, number: 218,
    text: "عند مواجهة موقف مفاجئ ومثير للخوف كما في الشكل، أي هرمون يزداد إفرازه سريعًا؟",
    options: ["الجليكوجين", "الإبينفرين", "الإنسولين", "الأوكسيتوسين"],
    answer: 1,
    explanation: "يفرز لب الغدة الكظرية الإبينفرين في حالات الخوف أو الطوارئ، فيهيئ الجسم لاستجابة الكر أو الفر.",
  },
  {
    id: "6ad0188a63cd9c24f9f4466a", page: 19, number: 219,
    text: "ما السلسلة المكملة وفق ازدواج القواعد واتجاه السلسلتين للقالب 5′-ATGGGCGC-3′؟",
    options: ["3′-TAGGGCGG-5′", "3′-ATCGGCCG-5′", "3′-TACCCGCG-5′", "3′-TAGCGCGG-5′"],
    answer: 2,
    explanation: "تتقابل A مع T وG مع C، وتسير السلسلة المكملة باتجاه معاكس؛ لذلك تكون 3′-TACCCGCG-5′.",
  },
  {
    id: "6ad0188a63cd9c24f9f4466b", page: 20, number: 221,
    text: "البغل هجين عقيم لا ينتج نسلًا خصبًا. ما المستوى التصنيفي الذي يختلف فيه الحصان والحمار وفق مفهوم النوع؟",
    options: ["الجنس", "النوع", "الفصيلة", "الرتبة"],
    answer: 1,
    explanation: "وفق مفهوم النوع الحيوي، أفراد النوع الواحد تتزاوج طبيعيًا وتنتج نسلًا خصبًا. الحصان والحمار نوعان مختلفان، وبغلهما الهجين غالبًا عقيم.",
  },
  {
    id: "6ad0188a63cd9c24f9f4466c", page: 20, number: 222,
    text: "أي الحيوانات الآتية يملك طبقة دهنية تحت الجلد تساعده على تقليل فقد الحرارة؟",
    options: ["الحمار الوحشي", "الأرنب", "الغزال", "الفقمة"],
    answer: 3,
    explanation: "تساعد طبقة الدهون السميكة تحت جلد الفقمة على العزل الحراري في البيئات الباردة.",
  },
  {
    id: "6ad0188a63cd9c24f9f4466d", page: 20, number: 223,
    text: "أي نوع من العضلات تستخدمه أساسًا عند أداء التمارين الإرادية؟",
    options: ["العضلات اللاإرادية", "العضلات الهيكلية", "عضلة القلب", "العضلات الملساء"],
    answer: 1,
    explanation: "تعتمد الحركات الرياضية الإرادية على انقباض العضلات الهيكلية المرتبطة بالعظام.",
  },
  {
    id: "6ad0188a63cd9c24f9f4466e", page: 20, number: 224,
    text: "في ظروف مناسبة، ما الذي يحدث للخلايا الجذعية غير المتخصصة؟",
    options: ["تصبح متخصصة", "تبقى غير متخصصة دائمًا", "تتحول كل الخلايا البائية إلى خلايا بلازمية", "تتحول الخلايا الدهنية مباشرةً إلى خلايا طلائية"],
    answer: 0,
    explanation: "يمكن للخلايا الجذعية غير المتخصصة أن تتمايز إلى أنواع خلوية متخصصة عندما تتلقى الإشارات والظروف المناسبة.",
  },
  {
    id: "6ad0188a63cd9c24f9f4466f", page: 20, number: 225,
    text: "أي ظاهرة ترتبط بزيادة غازات الدفيئة وثاني أكسيد الكربون، وقد تسهم زيادة CO₂ ضمن ظروف مناسبة في رفع البناء الضوئي لبعض النباتات؟",
    options: ["الضباب الدخاني", "الاحتباس الحراري", "الأمطار الحمضية", "ثقب الأوزون"],
    answer: 1,
    explanation: "يرتبط الاحتباس الحراري بزيادة غازات الدفيئة ومنها CO₂. قد تحفز زيادة CO₂ البناء الضوئي في بعض النباتات، لكن الأثر يتوقف على الأنواع والحرارة والماء والعوامل الأخرى.",
  },
  {
    id: "6ad0188a63cd9c24f9f44670", page: 20, number: 226,
    text: "في الخلايا حقيقية النوى، أي حمض نووي يحمل المعلومات الوراثية على الكروموسومات الموجودة في النواة؟",
    options: ["DNA", "mRNA", "tRNA", "rRNA"],
    answer: 0,
    explanation: "يحمل DNA المعلومات الوراثية على الكروموسومات النووية. توجد أيضًا كمية صغيرة من DNA في الميتوكوندريا (وفي البلاستيدات لدى النباتات)، لذا صيغ السؤال هنا عن الكروموسومات النووية لا عن وجود DNA في النواة حصرًا.",
  },
] as const;

const rejected = [
  {
    id: "6ad0188a63cd9c24f9f44661",
    page: 19,
    number: 208,
    note: "حُجب السؤال: يسأل عن أقل كتلة حيوية بين فأر وثعلب وطيور ونبات دون عرض هرم غذائي أو سلسلة غذائية أو معطيات تربط هذه الكائنات؛ لا يمكن تحديد إجابة واحدة من الخيارات وحدها.",
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
