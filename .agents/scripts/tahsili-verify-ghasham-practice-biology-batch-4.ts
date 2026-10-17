import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-biology-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0188963cd9c24f9f4461b",
    page: 12,
    number: 127,
    text: "أي المواد الآتية عديد سكاريد يحتوي على الكربون والهيدروجين والأكسجين والنيتروجين؟",
    options: ["السليلوز", "الجليكوجين", "الجلوكوز", "الكيتين"],
    answer: 3,
    explanation: "الكيتين عديد سكاريد نيتروجيني؛ إذ تحتوي وحداته على النيتروجين. أما السليلوز والجليكوجين فعديدات سكاريد لا تحتوي عادةً على النيتروجين.",
  },
  {
    id: "6ad0188963cd9c24f9f4461c",
    page: 12,
    number: 128,
    text: "في الانقسام المنصف، إذا انفصلت الكروموسومات المتماثلة إلى قطبين وبقيت الكروماتيدات الشقيقة متصلة، فأي طور يمثّل ذلك؟",
    options: ["الطور التمهيدي الأول", "الطور الاستوائي الأول", "الطور الانفصالي الأول", "الطور النهائي الثاني"],
    answer: 2,
    explanation: "في الطور الانفصالي الأول تنفصل الكروموسومات المتماثلة وتتجه إلى قطبين، بينما تبقى الكروماتيدات الشقيقة متصلة حتى الانقسام المنصف الثاني.",
  },
  {
    id: "6ad0188963cd9c24f9f4461d",
    page: 12,
    number: 129,
    text: "أي شكل مناقير الطيور أنسب لامتصاص رحيق الأزهار من داخلها؟",
    options: ["واسع وعريض", "طويل ورفيع", "حاد ومعقوف", "قصير وعريض"],
    answer: 1,
    explanation: "يساعد المنقار الطويل الرفيع على الوصول إلى الرحيق داخل الأزهار الأنبوبية.",
  },
  {
    id: "6ad0188963cd9c24f9f4461f",
    page: 12,
    number: 130,
    text: "تظهر على كريات الدم في الشكل مولدات الضد A ولا تظهر مولدات الضد B. ما فصيلة الدم وفق نظام ABO؟",
    options: ["A", "B", "AB", "O"],
    answer: 0,
    explanation: "وجود مولد الضد A وحده على كريات الدم الحمراء يدل على فصيلة A في نظام ABO.",
  },
  {
    id: "6ad0188963cd9c24f9f4461e",
    page: 12,
    number: 131,
    text: "لماذا تُخرج الأفعى لسانها باستمرار؟",
    options: ["لتذوق الطعام", "لالتقاط جزيئات الروائح ونقلها إلى عضو الشم", "لتحسس الخطر مباشرة", "لسماع الذبذبات"],
    answer: 1,
    explanation: "يلتقط اللسان جزيئات كيميائية من الهواء أو السطح، ثم ينقلها إلى عضو جاكوبسون لتحليل الروائح.",
  },
  {
    id: "6ad0188963cd9c24f9f44620",
    page: 12,
    number: 132,
    text: "أي الطلائعيات الآتية تتطفل على الحشرات، وقد تُستخدم في المكافحة الحيوية للآفات؟",
    options: ["الميكروسبوريديا", "الدياتومات", "التريبانوسوما", "الفولفوكس"],
    answer: 0,
    explanation: "الميكروسبوريديا طفيليات مجهرية تصيب حشرات، وتُدرس بعض أنواعها أو تُستخدم في المكافحة الحيوية.",
  },
  {
    id: "6ad0188963cd9c24f9f44621",
    page: 12,
    number: 133,
    text: "بعد الإخصاب في النبات الزهري، إلى ماذا يتحول مبيض الزهرة عادةً؟",
    options: ["أسدية", "بذرة", "إندوسبيرم", "ثمرة"],
    answer: 3,
    explanation: "يتحول المبيض عادةً إلى ثمرة، وتتحول البويضات المخصبة داخله إلى بذور.",
  },
  {
    id: "6ad0188963cd9c24f9f44622",
    page: 12,
    number: 134,
    text: "في أي اتجاه يمر الدم عبر الصمام الأذيني البطيني السليم؟",
    options: ["من الأذين إلى البطين", "من البطين إلى الأذين", "من البطين الأيسر إلى البطين الأيمن", "من البطين الأيمن إلى البطين الأيسر"],
    answer: 0,
    explanation: "يسمح الصمام الأذيني البطيني بمرور الدم من الأذين إلى البطين، ويمنع رجوعه عند انقباض البطين.",
  },
  {
    id: "6ad0188963cd9c24f9f44623",
    page: 12,
    number: 135,
    text: "ما اسم العلاقة التي يستفيد فيها مخلوق حي ويتضرر المخلوق الآخر؟",
    options: ["التطفل", "التعايش", "الترمم", "التنافس"],
    answer: 0,
    explanation: "في التطفل يستفيد الطفيل ويحصل على موارد من العائل، بينما يتضرر العائل.",
  },
  {
    id: "6ad0188963cd9c24f9f44624",
    page: 12,
    number: 136,
    text: "أي رتب الزواحف الآتية تمتلك أفرادها قلبًا مكوّنًا من أربع حجرات؟",
    options: ["السلحفيات", "التمساحيات", "الحرشفيات", "خطميات الرأس"],
    answer: 1,
    explanation: "تمتلك التمساحيات قلبًا من أربع حجرات، بينما يكون قلب معظم الزواحف الأخرى ثلاثي الحجرات.",
  },
  {
    id: "6ad0188963cd9c24f9f44625",
    page: 12,
    number: 137,
    text: "أي الديدان الآتية قد تصيب الإنسان عند المشي حافيًا على تربة ملوثة في المناطق الحارة؟",
    options: ["الديدان الخطافية", "دودة الشعرينة", "الدودة الدبوسية", "الفيلاريا"],
    answer: 0,
    explanation: "يمكن ليرقات الديدان الخطافية الموجودة في التربة الملوثة اختراق الجلد، خاصةً عند المشي حافيًا.",
  },
  {
    id: "6ad0188963cd9c24f9f44626",
    page: 12,
    number: 138,
    text: "ارتبط صوت جرس بتقديم الطعام لكلب، ثم صار صوت الجرس وحده يثير استجابته. ما نوع التعلم؟",
    options: ["الإشراط الإجرائي", "الإشراط الكلاسيكي", "التعلم بالملاحظة", "الطبع"],
    answer: 1,
    explanation: "في الإشراط الكلاسيكي يرتبط منبه محايد، مثل صوت الجرس، بمنبه طبيعي، مثل الطعام، حتى يثير الاستجابة وحده.",
  },
  {
    id: "6ad0188963cd9c24f9f44627",
    page: 13,
    number: 139,
    text: "أي الأنظمة البيئية الآتية يضم عادةً أعلى تنوع للأنواع؟",
    options: ["البحيرات والبرك", "الغابات الاستوائية المطيرة", "الأنهار", "الأراضي الرطبة"],
    answer: 1,
    explanation: "تتميز الغابات الاستوائية المطيرة عادةً بارتفاع كبير في تنوع الأنواع بسبب دفئها ورطوبتها وتعدد موائلها.",
  },
  {
    id: "6ad0188963cd9c24f9f44628",
    page: 13,
    number: 140,
    text: "ما الإجراء المباشر للحد من انتقال مرض النوم الإفريقي؟",
    options: ["مكافحة البعوض", "القضاء على النمل الأبيض", "مكافحة ذبابة تسي تسي", "غسل الخضروات"],
    answer: 2,
    explanation: "ينتقل مرض النوم الإفريقي بواسطة ذبابة تسي تسي؛ لذا تستهدف الوقاية مكافحة هذا الناقل.",
  },
  {
    id: "6ad0188963cd9c24f9f44629",
    page: 13,
    number: 142,
    text: "أي عضيات الخلية تصنع البروتينات؟",
    options: ["الريبوسومات", "الليسوسومات", "جهاز جولجي", "الشبكة الإندوبلازمية"],
    answer: 0,
    explanation: "تترجم الريبوسومات الرنا الرسول وتربط الأحماض الأمينية لتكوين سلاسل البروتين.",
  },
  {
    id: "6ad0188963cd9c24f9f4462a",
    page: 13,
    number: 143,
    text: "ما المصطلح الذي يصف نوعًا أدخله الإنسان إلى منطقة خارج موطنه الأصلي؟",
    options: ["نوع دخيل", "نوع نادر", "نوع مهاجر", "نوع أصلي"],
    answer: 0,
    explanation: "النوع الدخيل يوجد خارج نطاقه الأصلي بعد انتقاله إلى منطقة جديدة؛ وقد يصبح غازيًا إذا سبب ضررًا بيئيًا.",
  },
  {
    id: "6ad0188963cd9c24f9f4462b",
    page: 13,
    number: 144,
    text: "تحتوي كريات الدم الحمراء الناضجة لدى الإنسان على كل ما يأتي ما عدا:",
    options: ["السيتوبلازم", "بروتينات", "النواة", "الغشاء البلازمي"],
    answer: 2,
    explanation: "تفقد كرية الدم الحمراء الناضجة نواتها لتوفير مساحة أكبر للهيموغلوبين، لكنها تحتفظ بالغشاء والسيتوبلازم والبروتينات.",
  },
  {
    id: "6ad0188963cd9c24f9f4462c",
    page: 13,
    number: 145,
    text: "تهدف حملات مكافحة البعوض في الدول الإفريقية إلى الحد من انتشار أي مرض؟",
    options: ["البلهارسيا", "مرض النوم الإفريقي", "الملاريا", "داء الشعرينة"],
    answer: 2,
    explanation: "تنقل إناث بعوض الأنوفيلس طفيليات الملاريا؛ لذلك تساعد مكافحة هذا الناقل على خفض انتقال المرض.",
  },
  {
    id: "6ad0188963cd9c24f9f4462d",
    page: 13,
    number: 146,
    text: "ما السمة التي تميز الخلايا الجذعية عن الخلايا المتمايزة؟",
    options: ["تنقسم دائمًا بسرعة عالية", "تنقسم انقسامًا مباشرًا", "توجد في الأجنة فقط", "غير متخصصة ويمكنها التمايز"],
    answer: 3,
    explanation: "الخلايا الجذعية غير متمايزة، ويمكنها الانقسام والتمايز إلى أنواع خلوية متخصصة ضمن شروط مناسبة.",
  },
  {
    id: "6ad0188963cd9c24f9f4462e",
    page: 13,
    number: 147,
    text: "إلى أي فئة حيوية ينتمي السليلوز الموجود في جدار الخلية النباتية؟",
    options: ["الكربوهيدرات", "الدهون", "البروتينات", "الأحماض النووية"],
    answer: 0,
    explanation: "السليلوز عديد سكاريد، ولذلك يصنف ضمن الكربوهيدرات.",
  },
  {
    id: "6ad0188963cd9c24f9f4462f",
    page: 13,
    number: 148,
    text: "لسعت نحلة طفلًا عندما اقترب من زهرة، ثم بكى كلما رأى الزهرة بعد ذلك. ما نوع التعلم الذي يفسر الاستجابة؟",
    options: ["الإشراط الكلاسيكي", "السلوك الإدراكي", "الإشراط الإجرائي", "الطبع"],
    answer: 0,
    explanation: "ارتبطت الزهرة بمنبه مؤلم هو لسعة النحلة، فأصبحت الزهرة وحدها تستثير الاستجابة؛ وهذا إشراط كلاسيكي.",
  },
  {
    id: "6ad0188963cd9c24f9f44630",
    page: 13,
    number: 149,
    text: "في أي طور من الانقسام تختفي خيوط المغزل عادةً؟",
    options: ["الطور النهائي", "الطور التمهيدي", "الطور الانفصالي", "الطور الاستوائي"],
    answer: 0,
    explanation: "تتفكك خيوط المغزل في الطور النهائي بعد وصول الكروموسومات إلى قطبي الخلية.",
  },
  {
    id: "6ad0188963cd9c24f9f44631",
    page: 13,
    number: 151,
    text: "إذا كان النمط الجيني لكل من الأبوين Tt، فما الأنماط الجينية الممكنة للأبناء؟",
    options: ["TT أو Tt أو tt", "TT فقط", "TT أو tt فقط", "tt فقط"],
    answer: 0,
    explanation: "ينتج عن التزاوج Tt×Tt الأنماط الجينية TT وTt وtt بنسب متوقعة 1:2:1.",
  },
  {
    id: "6ad0188963cd9c24f9f44632",
    page: 14,
    number: 152,
    text: "ما المتلازمة المرتبطة غالبًا بالنمط الكروموسومي XXY؟",
    options: ["متلازمة كلاينفلتر", "متلازمة ثلاثية X", "متلازمة داون", "نمط طبيعي شائع"],
    answer: 0,
    explanation: "ترتبط متلازمة كلاينفلتر غالبًا بوجود كروموسوم X إضافي لدى الذكر، فيكون النمط 47,XXY.",
  },
  {
    id: "6ad0188963cd9c24f9f44633",
    page: 14,
    number: 153,
    text: "في نظام ABO، لماذا لا تحمل كريات الدم الحمراء من فصيلة O مستضدي A أو B؟",
    options: ["لأنها تحمل مستضد A", "لأنها تحمل مستضد B", "لأنها تحمل المستضدين معًا", "لأنها لا تحمل مستضد A أو B"],
    answer: 3,
    explanation: "كريات فصيلة O لا تحمل مولدات الضد A أو B، لكن توافق التبرع الفعلي يتطلب أيضًا مراعاة عامل Rh وفحوص المطابقة.",
  },
  {
    id: "6ad0188a63cd9c24f9f44634",
    page: 14,
    number: 154,
    text: "أي زوج من الوالدين لا يمكنه إنجاب طفل فصيلة دمه O وفق نظام ABO؟",
    options: ["أب A وأم B", "أب AB وأم O", "أب A وأم O", "أب O وأم A"],
    answer: 1,
    explanation: "لا يملك صاحب فصيلة AB أليل i، لذلك لا يستطيع تمريره إلى الطفل. يلزم أن يرث طفل O الأليل i من كلا الوالدين.",
  },
  {
    id: "6ad0188a63cd9c24f9f44635",
    page: 14,
    number: 155,
    text: "ما التركيب الذي قد يجعل الإسفنج غير مستساغ لبعض المفترسات؟",
    options: ["الأنسجة", "الخلايا المطوقة", "الشويكات", "الثقوب"],
    answer: 2,
    explanation: "تحتوي أجسام كثير من الإسفنجيات على شويكات صلبة قد تردع المفترسات.",
  },
  {
    id: "6ad0188a63cd9c24f9f44636",
    page: 14,
    number: 156,
    text: "كم أليلًا سائدًا يوجد في النمط الجيني AabbCC؟",
    options: ["2", "3", "5", "0"],
    answer: 1,
    explanation: "يحتوي AabbCC على ثلاثة أليلات سائدة: A واحد وC اثنان. ويحتوي على ثلاثة أليلات متنحية: a وb وb.",
  },
  {
    id: "6ad0188a63cd9c24f9f44637",
    page: 14,
    number: 157,
    text: "أي الخيارات الآتية يتكون من بروتينات؟",
    options: ["السليلوز", "الإنزيمات", "الجلوكوز", "الجلسرين"],
    answer: 1,
    explanation: "معظم الإنزيمات بروتينات تعمل كمحفزات حيوية، مع وجود استثناءات من RNA التحفيزي.",
  },
  {
    id: "6ad0188a63cd9c24f9f44638",
    page: 14,
    number: 158,
    text: "ما النسيج الذي يغلق مدخل مجرى الهواء أثناء البلع ويمنع دخول الطعام إليه؟",
    options: ["لسان المزمار", "البلعوم", "الحنجرة", "القصيبات الهوائية"],
    answer: 0,
    explanation: "ينثني لسان المزمار فوق مدخل الحنجرة أثناء البلع، فيساعد على توجيه الطعام إلى المريء.",
  },
  {
    id: "6ad0188a63cd9c24f9f44639",
    page: 14,
    number: 159,
    text: "أي جزء من الدماغ ينظم العطش ويسهم في المحافظة على توازن الماء في الجسم؟",
    options: ["تحت المهاد", "المخيخ", "المخ الكبير", "النخاع المستطيل"],
    answer: 0,
    explanation: "يراقب تحت المهاد أسمولية الدم ويسهم في تنظيم العطش وإشارات إفراز الهرمون المضاد لإدرار البول.",
  },
  {
    id: "6ad0188a63cd9c24f9f4463a",
    page: 14,
    number: 161,
    text: "يشير السهم إلى مجموعة أفراد من النوع نفسه تعيش في منطقة واحدة. ما مستوى التنظيم البيئي؟",
    options: ["المجتمع الحيوي", "الجماعة الحيوية", "المنطقة الحيوية", "النظام البيئي"],
    answer: 1,
    explanation: "الجماعة الحيوية مجموعة أفراد من النوع نفسه تعيش في المكان والزمان نفسيهما. ويضم المجتمع الحيوي جماعات من أنواع مختلفة.",
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
