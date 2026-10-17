import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "yelo-2024-p2-thursday-evening";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0150c63cd9c24f9f41916", page: 31, number: 35, subject: "فيزياء",
    text: "في دائرة الانحياز العكسي للدايود الموضحة، إلى أي اتجاه يتحرك الإلكترون a والفجوة b؟",
    options: ["يتحرك a إلى اليمين وb إلى اليسار", "يتحرك a إلى اليسار وb إلى اليمين", "يتحرك كلاهما إلى اليمين", "يتحرك كلاهما إلى اليسار"],
    answer: 0,
    explanation: "في الانحياز العكسي تُسحب الإلكترونات في منطقة n بعيدًا عن الوصلة باتجاه الطرف الموجب، بينما تتحرك الفجوات في منطقة p بعيدًا عنها باتجاه الطرف السالب؛ ووفق قطبية الرسم يكون اتجاه a يمينًا وb يسارًا.",
  },
  {
    id: "6ad0150c63cd9c24f9f41917", page: 31, number: 36, subject: "فيزياء",
    text: "مرآة كروية تكبيرها مقداره 3. إذا كان طول الجسم 10cm، فما مقدار طول صورته؟",
    options: ["60cm", "20cm", "10cm", "30cm"],
    answer: 3,
    explanation: "مقدار التكبير |m|=طول الصورة/طول الجسم. لذلك طول الصورة=3×10=30cm.",
  },
  {
    id: "6ad0150c63cd9c24f9f41918", page: 32, number: 37, subject: "فيزياء",
    text: "ما اسم ظاهرة انبعاث إلكترونات من سطح مادة عند سقوط إشعاع كهرومغناطيسي مناسب عليها؟",
    options: ["التأثير الكهروضوئي", "موجات دي برولي", "الطول الموجي", "الانبعاث الذري"],
    answer: 0,
    explanation: "يحدث التأثير الكهروضوئي عندما تمتص إلكترونات السطح فوتونات ذات طاقة كافية فتتحرر من المادة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41919", page: 32, number: 38, subject: "فيزياء",
    text: "عند انبعاث جسيم ألفا من نواة الراديوم-226 ذات العدد الذري 88، ما النواة الناتجة؟",
    options: ["الرادون-222 وعدده الذري 86", "الفرانسيوم-223 وعدده الذري 87", "الأكتينيوم-227 وعدده الذري 89", "الثوريوم-232 وعدده الذري 90"],
    answer: 0,
    explanation: "يقل العدد الكتلي بمقدار 4 والعدد الذري بمقدار 2 في انبعاث ألفا؛ فينتج رادون-222 وعدده الذري 86.",
  },
  {
    id: "6ad0150c63cd9c24f9f4191a", page: 32, number: 39, subject: "فيزياء",
    text: "مع ثبات طول الموصل ومادته، كيف نقلل مقاومته؟",
    options: ["نخفض درجة الحرارة ونزيد مساحة المقطع", "نرفع درجة الحرارة ونقلل مساحة المقطع", "نزيد كليهما", "نقلل كليهما"],
    answer: 0,
    explanation: "في الفلزات تنخفض المقاومية عادةً عند خفض درجة الحرارة، كما أن زيادة مساحة المقطع تقلل R وفق R=ρL/A.",
  },
  {
    id: "6ad0150c63cd9c24f9f4191b", page: 33, number: 40, subject: "فيزياء",
    text: "ما اسم كمية الطاقة اللازمة لتحويل 1kg من مادة من الحالة السائلة إلى الغازية عند درجة الغليان؟",
    options: ["الحرارة النوعية", "درجة الغليان", "درجة التبخر", "الحرارة الكامنة النوعية للتبخر"],
    answer: 3,
    explanation: "الحرارة الكامنة النوعية للتبخر هي الطاقة اللازمة لتحويل وحدة الكتلة من سائل إلى غاز عند درجة الغليان دون تغير درجة الحرارة.",
  },
  {
    id: "6ad0150c63cd9c24f9f4191c", page: 33, number: 41, subject: "فيزياء",
    text: "كم ميكروثانية في 10 ثوانٍ؟",
    options: ["1×10⁻⁶μs", "1×10⁻³μs", "1×10⁷μs", "1×10⁵μs"],
    answer: 2,
    explanation: "الثانية الواحدة تساوي 10⁶ ميكروثانية؛ لذلك 10s=10×10⁶μs=1×10⁷μs.",
  },
  {
    id: "6ad0150c63cd9c24f9f4191e", page: 34, number: 44, subject: "فيزياء",
    text: "أي العبارات الآتية غير صحيحة؟",
    options: ["الشحنات المتشابهة تتنافر", "عند تصادم الفوتونات بعضها ببعض تكتسب طاقة", "الشحنات المختلفة تتجاذب", "يمكن للشحنات أن تؤثر بعضها في بعض عن بعد"],
    answer: 1,
    explanation: "لا تكتسب الفوتونات طاقة لمجرد تصادمها كما تزعم العبارة. أما الشحنات المتشابهة فتتنافر والمختلفة تتجاذب، ويمكن أن تؤثر كهربائيًا عن بعد.",
  },
  {
    id: "6ad0150c63cd9c24f9f4191f", page: 34, number: 45, subject: "فيزياء",
    text: "يمر فرق جهد مقداره 9V بين طرفي جهاز مقاومته 2Ω. ما شدة التيار؟",
    options: ["4.5A", "7A", "11A", "18A"],
    answer: 0,
    explanation: "من قانون أوم I=V/R=9/2=4.5A.",
  },
  {
    id: "6ad0150c63cd9c24f9f41920", page: 36, number: 1, subject: "أحياء",
    text: "ما دور الكوليسترول في الغشاء البلازمي؟",
    options: ["يساعد على تنظيم حركة ذيول الأحماض الدهنية وسيولة الغشاء", "يدعم الخلية ويعطيها شكلها وحده", "ينفذ النفاذية الاختيارية وحده", "يتعرف على الإشارات الكيميائية وحده"],
    answer: 0,
    explanation: "يتخلل الكوليسترول طبقة الدهون الفسفورية، فيساعد على تنظيم سيولة الغشاء ويحد من تراص ذيول الأحماض الدهنية بإحكام.",
  },
  {
    id: "6ad0150c63cd9c24f9f41921", page: 37, number: 4, subject: "أحياء",
    text: "أي السلوكيات الآتية يعتمد أساسًا على الوراثة ويظهر دون تعلم سابق؟",
    options: ["السلوك الغريزي الفطري", "السلوك الإدراكي", "السلوك المكتسب", "التعود"],
    answer: 0,
    explanation: "السلوك الغريزي نمط فطري موروث يظهر دون أن يحتاج الفرد إلى تعلمه بالتجربة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41922", page: 37, number: 6, subject: "أحياء",
    text: "أي الحيوانات الآتية من الثدييات؟",
    options: ["القرش", "البطريق", "الأخطبوط", "الدولفين"],
    answer: 3,
    explanation: "الدولفين ثديي يتنفس بالرئتين ويلد صغاره ويرضعها؛ القرش سمكة والبطريق طائر والأخطبوط رخوي.",
  },
  {
    id: "6ad0150c63cd9c24f9f41923", page: 38, number: 9, subject: "أحياء",
    text: "يرتفع احتمال إنجاب طفل مصاب بمتلازمة داون مع تقدم عمر الأم. أي الأعمار الآتية يمثل أعلى خطر ضمن الخيارات؟",
    options: ["45 سنة", "25 سنة", "35 سنة", "30 سنة"],
    answer: 0,
    explanation: "يزداد احتمال التثلث الصبغي 21 مع تقدم عمر الأم؛ ومن الأعمار المعطاة تمثل 45 سنة أعلى خطر نسبيًا. لا يوجد «متوسط عمر» واحد ينطبق على جميع الأمهات.",
  },
  {
    id: "6ad0150c63cd9c24f9f41924", page: 39, number: 10, subject: "أحياء",
    text: "أي الحيوانات الآتية يمتلك عضلة حجاب حاجز تفصل التجويف الصدري عن البطني؟",
    options: ["الخفاش", "التمساح", "السمكة", "البطة"],
    answer: 0,
    explanation: "الخفاش من الثدييات، والثدييات تمتلك حجابًا حاجزًا عضليًا يساعد في التنفس.",
  },
  {
    id: "6ad0150c63cd9c24f9f41925", page: 39, number: 11, subject: "أحياء",
    text: "النسر الذي يتغذى على جيف الحيوانات الميتة يوصف بأنه:",
    options: ["كانس", "آكل أعشاب", "آكل لحوم فقط", "قارت"],
    answer: 0,
    explanation: "الكانس يتغذى على جثث الكائنات الميتة؛ وهذا الوصف أدق من التصنيف العام بأنه آكل لحوم.",
  },
  {
    id: "6ad0150c63cd9c24f9f41926", page: 39, number: 12, subject: "أحياء",
    text: "أي المواد الآتية لا تُهضم إنزيميًا في الأمعاء الدقيقة؟",
    options: ["الماء", "السكريات", "البروتينات", "الدهون"],
    answer: 0,
    explanation: "الماء لا يحتاج إلى هضم إنزيمي؛ أما الكربوهيدرات والبروتينات والدهون فتُستكمل عملية هضمها في الأمعاء الدقيقة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41927", page: 40, number: 14, subject: "أحياء",
    text: "بأي صفة تختلف الحمامة عن القرش والضفدع والتمساح؟",
    options: ["لها قلب ذو حجرتين", "ثابتة درجة الحرارة داخليًا", "لها جلد خشن", "تتنفس عبر الرئتين"],
    answer: 1,
    explanation: "الحمامة طائر داخلي الحرارة ويحافظ على درجة جسم مستقرة نسبيًا؛ القرش والضفدع والتمساح متغيرة الحرارة.",
  },
  {
    id: "6ad0150c63cd9c24f9f41928", page: 40, number: 15, subject: "أحياء",
    text: "ما الحالة المرتبطة غالبًا بالنمط الكروموسومي XO؟",
    options: ["أنثى طبيعية", "حالة قاتلة دائمًا", "أنثى مصابة بمتلازمة تيرنر", "ذكر مصاب بمتلازمة كلاينفلتر"],
    answer: 2,
    explanation: "يرتبط النمط 45,X (ويكتب أحيانًا XO) بمتلازمة تيرنر لدى الإناث.",
  },
  {
    id: "6ad0150c63cd9c24f9f41929", page: 41, number: 16, subject: "أحياء",
    text: "إذا كان كلا الأبوين غير متماثل الجينات Tt لصفة ثني اللسان، فما الطرز الجينية الممكنة للأبناء؟",
    options: ["TT وTt وtt", "TT فقط", "TT وtt فقط", "Tt فقط"],
    answer: 0,
    explanation: "ينتج من التزاوج Tt×Tt الأنماط TT وTt وtt بنسبة متوقعة 1:2:1.",
  },
  {
    id: "6ad0150c63cd9c24f9f4192a", page: 41, number: 17, subject: "أحياء",
    text: "ما المصطلح الذي يستخدم في تصنيف النباتات غالبًا مقابل مصطلح الشعبة في تصنيف الحيوانات؟",
    options: ["الرتبة", "القسم", "النوع", "الطائفة"],
    answer: 1,
    explanation: "يستعمل مصطلح «القسم» في كثير من التصنيفات النباتية بوصفه مكافئًا لمستوى الشعبة.",
  },
  {
    id: "6ad0150c63cd9c24f9f4192b", page: 41, number: 18, subject: "أحياء",
    text: "تعرف أسماك السلمون طريقها إلى موقع فقسها عند العودة للتكاثر. ما نوع هذا السلوك؟",
    options: ["التعود", "الإدراكي الحسي", "الطبع", "الإشراط الإجرائي"],
    answer: 2,
    explanation: "يرتبط التعرف المبكر على الإشارات البيئية ثم الاحتفاظ بها بسلوك الطبع، ويساعد السلمون على العودة إلى موطن فقسه.",
  },
  {
    id: "6ad0150c63cd9c24f9f4192c", page: 42, number: 20, subject: "أحياء",
    text: "ما وظيفة بكتيريا العقد الجذرية في كثير من النباتات البقولية؟",
    options: ["تثبيت ثاني أكسيد الكربون", "تثبيت الأكسجين", "تثبيت الكربون", "تثبيت النيتروجين"],
    answer: 3,
    explanation: "تثبت بكتيريا العقد الجذرية النيتروجين الجوي وتحوله إلى مركبات نيتروجينية يستفيد منها النبات.",
  },
  {
    id: "6ad0150c63cd9c24f9f4192d", page: 42, number: 21, subject: "أحياء",
    text: "أي الحيوانات الآتية يُتوقع أن يكون معدل الأيض لكل وحدة كتلة فيه أعلى؟",
    options: ["فأر", "إنسان", "فيل", "غزال"],
    answer: 0,
    explanation: "يكون معدل الأيض لكل وحدة كتلة عادةً أعلى في الحيوانات الأصغر؛ لذلك يكون الفأر أعلى من الفيل والإنسان والغزال في هذا السياق.",
  },
] as const;

const rejected = [
  {
    id: "6ad0150c63cd9c24f9f4191d", page: 33, number: 42,
    note: "حُجب السؤال: خيار الرادار في الطائرة وخيار الأشعة السينية في التصوير الطبي كلاهما يستخدم موجات كهرومغناطيسية، لذلك يحتوي السؤال على إجابتين صحيحتين.",
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
          subject: item.subject,
          subcategory: item.subject,
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || item.subject,
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
          reviewerNotes: "تمت مراجعة صياغة السؤال والحل ومفتاح الإجابة بمقابلتها مع المصدر، وأضيف شرح توضيحي.",
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
