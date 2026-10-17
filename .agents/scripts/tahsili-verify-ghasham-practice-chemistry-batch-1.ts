import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-chemistry-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f417a2",
    page: 3,
    number: 1,
    text: "أيّ الخواص الآتية خاصية نوعية (مكثفة) للمادة؟",
    options: ["الحجم", "الكثافة", "السرعة", "الكتلة"],
    answer: 1,
    explanation: "الكثافة خاصية مكثفة لا تعتمد على كمية العينة، بينما الحجم والكتلة يعتمدان على كمية المادة.",
  },
  {
    id: "6ad0103563cd9c24f9f417a3",
    page: 3,
    number: 2,
    text: "جميع الخواص الآتية للألومنيوم فيزيائية ما عدا:",
    options: ["قابل للتشكّل", "فضي لامع", "ينصهر عند درجة حرارة محددة", "لا يتأكسد في الهواء الجوي"],
    answer: 3,
    explanation: "القابلية للتشكّل واللون واللمعان ودرجة الانصهار خواص فيزيائية. أما الألومنيوم فيتفاعل مع الأكسجين مكوّنًا طبقة أكسيد واقية، لذلك عبارة أنه لا يتأكسد غير صحيحة.",
  },
  {
    id: "6ad0103563cd9c24f9f417a4",
    page: 3,
    number: 3,
    text: "العبارة «الكتلة لا تفنى ولا تُستحدث أثناء التفاعل الكيميائي» تعبّر عن:",
    options: ["نظرية", "قانون علمي", "فرضية", "استنتاج"],
    answer: 1,
    explanation: "هذه صياغة لقانون حفظ الكتلة، الذي ينص على بقاء الكتلة الكلية للمواد في التفاعل الكيميائي المغلق.",
  },
  {
    id: "6ad0103563cd9c24f9f417a5",
    page: 3,
    number: 4,
    text: "أي أداة تُستخدم لقياس كمية الأوزون في الغلاف الجوي؟",
    options: ["جهاز رذرفورد", "أنبوب كروكس", "مطياف دوبسون", "جهاز مليكان"],
    answer: 2,
    explanation: "مطياف دوبسون جهاز مخصص لقياس كمية الأوزون الكلية في عمود الغلاف الجوي.",
  },
  {
    id: "6ad0103563cd9c24f9f417a6",
    page: 3,
    number: 5,
    text: "ما اسم المزيج المتجانس المكوّن من مادتين نقيتين أو أكثر؟",
    options: ["المذاب", "المذيب", "المحلول", "المركب"],
    answer: 2,
    explanation: "المحلول مزيج متجانس من مذاب واحد أو أكثر ومذيب.",
  },
  {
    id: "6ad0103563cd9c24f9f417a7",
    page: 3,
    number: 6,
    text: "أي الجسيمات الآتية يحمل طاقة ولا يملك كتلة سكون؟",
    options: ["الإلكترون", "البروتون", "الفوتون", "النيوترون"],
    answer: 2,
    explanation: "الفوتون كمّ من الإشعاع الكهرومغناطيسي يحمل طاقة وزخمًا، وكتلة سكونه صفر.",
  },
  {
    id: "6ad0103563cd9c24f9f417a8",
    page: 3,
    number: 7,
    text: "أي انتقال إلكتروني من الآتي ينتج فوتونًا بأكبر تردد؟",
    options: ["E₆→E₂", "E₆→E₃", "E₃→E₂", "E₂→E₇"],
    answer: 0,
    explanation: "في الانتقال المنبعث من مستوى أعلى إلى أدنى، تردد الفوتون يتناسب مع فرق الطاقة ΔE وفق ΔE=hf. أكبر فرق بين الخيارات المصدرة هو E₆→E₂.",
  },
  {
    id: "6ad0103563cd9c24f9f417a9",
    page: 3,
    number: 8,
    text: "ما الجسيمات الموجودة في نواة الذرة؟",
    options: ["النيوترونات والبروتونات", "الإلكترونات والفوتونات", "النيوترونات والإلكترونات", "البروتونات والإلكترونات"],
    answer: 0,
    explanation: "تتكوّن نواة الذرة من بروتونات ونيوترونات، بينما توجد الإلكترونات خارج النواة.",
  },
  {
    id: "6ad0103563cd9c24f9f417aa",
    page: 3,
    number: 9,
    text: "ما طبيعة أشعة جاما؟",
    options: ["فوتونات ذات طاقة عالية", "جسيمات متفاوتة الشحنة", "جسيمات موجبة", "إلكترونات تنبعث من النواة"],
    answer: 0,
    explanation: "أشعة جاما إشعاع كهرومغناطيسي يتكوّن من فوتونات عالية الطاقة ولا يحمل شحنة كهربائية.",
  },
  {
    id: "6ad0103563cd9c24f9f417ab",
    page: 3,
    number: 10,
    text: "ما المصطلح الذي يعبّر عن مجموعة مشاهدات مضبوطة تُجرى لاختبار فرضية؟",
    options: ["التجربة", "الاستنتاج", "القانون", "النظرية"],
    answer: 0,
    explanation: "التجربة إجراء منظم ومضبوط لاختبار فرضية وجمع الأدلة المتعلقة بها.",
  },
  {
    id: "6ad0103563cd9c24f9f417ac",
    page: 3,
    number: 11,
    text: "عنصر عدده الذري 19 وعدده الكتلي 39. كم عدد النيوترونات في نواته؟",
    options: ["19", "20", "39", "48"],
    answer: 1,
    explanation: "عدد النيوترونات=العدد الكتلي−العدد الذري=39−19=20.",
  },
  {
    id: "6ad0103563cd9c24f9f417ad",
    page: 4,
    number: 12,
    text: "إذا احتوى تفاعل على أربع مواد، فكم نسبة مولية مختلفة يمكن كتابتها بين كل مادتين باتجاهي النسبة؟",
    options: ["20", "18", "12", "6"],
    answer: 2,
    explanation: "لكل مادة يمكن كتابة نسبة إليها مع كل مادة أخرى، مع مراعاة الاتجاه. العدد n(n−1)=4×3=12 نسبة.",
  },
  {
    id: "6ad0103563cd9c24f9f417ae",
    page: 4,
    number: 13,
    text: "ما أثر زيادة مساحة سطح المواد المتفاعلة في سرعة التفاعل؟",
    options: ["تقل سرعة التفاعل", "تزداد سرعة التفاعل", "لا تتأثر سرعة التفاعل", "تثبت سرعة التفاعل"],
    answer: 1,
    explanation: "زيادة مساحة السطح المعرضة تزيد فرص التصادمات الفعالة بين جسيمات المواد المتفاعلة، فترتفع سرعة التفاعل.",
  },
  {
    id: "6ad0103563cd9c24f9f417af",
    page: 4,
    number: 14,
    text: "ما نوع التفاعل الآتي؟ 2Li + 2H₂O → 2LiOH + H₂",
    options: ["إحلال بسيط", "تفكك", "تكوين", "احتراق"],
    answer: 0,
    explanation: "يحل الليثيوم محل الهيدروجين في الماء، لذا فهو تفاعل إحلال بسيط.",
  },
  {
    id: "6ad0103563cd9c24f9f417b0",
    page: 4,
    number: 15,
    text: "إذا كان قانون سرعة التفاعل R=k[A]²[B]²، فما الرتبة الكلية للتفاعل؟",
    options: ["2", "3", "4", "5"],
    answer: 2,
    explanation: "الرتبة الكلية هي مجموع أسس تراكيز المواد في قانون السرعة: 2+2=4.",
  },
  {
    id: "6ad0103563cd9c24f9f417b1",
    page: 4,
    number: 16,
    text: "عند ثبوت درجة الحرارة، كيف تتناسب قيمة ضغط كمية محددة من الغاز مع حجمه؟",
    options: ["طرديًا", "درجة الحرارة غير مؤثرة", "عكسيًا", "لا يتأثر الحجم بالضغط"],
    answer: 2,
    explanation: "وفق قانون بويل، عند ثبوت درجة الحرارة وكمية الغاز يكون الضغط متناسبًا عكسيًا مع الحجم.",
  },
  {
    id: "6ad0103563cd9c24f9f417b2",
    page: 4,
    number: 18,
    text: "ما الحالة التي توجد فيها معظم النجوم؟",
    options: ["صلبة", "سائلة", "بلازما", "غازية متعادلة"],
    answer: 2,
    explanation: "النجوم تتكون في معظمها من بلازما: غاز متأين يحتوي على جسيمات مشحونة حرة.",
  },
  {
    id: "6ad0103563cd9c24f9f417b3",
    page: 4,
    number: 19,
    text: "أي أنواع الأشعة يمتص غاز الأوزون معظمها؟",
    options: ["الأشعة تحت الحمراء", "الأشعة فوق البنفسجية", "الأشعة السينية", "أشعة جاما"],
    answer: 1,
    explanation: "تمتص طبقة الأوزون جزءًا كبيرًا من الأشعة فوق البنفسجية الضارة القادمة من الشمس.",
  },
  {
    id: "6ad0103563cd9c24f9f417b4",
    page: 4,
    number: 20,
    text: "أُذيب 52 g من LiF لتكوين محلول حجمه 2 L. ما مولارية المحلول؟ (Li=7, F=19)",
    options: ["1 M", "2 M", "13 M", "26 M"],
    answer: 0,
    explanation: "الكتلة المولية لـLiF=7+19=26 g/mol، وعدد المولات=52÷26=2 mol. المولارية=2÷2=1 M.",
  },
  {
    id: "6ad0103563cd9c24f9f417b5",
    page: 4,
    number: 21,
    text: "ما المصطلح الذي يصف جزيئات كبيرة تتكون من وحدات بنائية متكررة؟",
    options: ["الدهون", "البروتينات", "البوليمرات", "الأحماض العضوية"],
    answer: 2,
    explanation: "البوليمرات جزيئات كبيرة تتكوّن من تكرار وحدات بنائية أصغر تسمى مونومرات.",
  },
  {
    id: "6ad0103563cd9c24f9f417b6",
    page: 4,
    number: 22,
    text: "عند وزن المعادلة في وسط حمضي: 2H⁺ + 3H₂S + 2NO₃⁻ → 3S + 2NO + xH₂O، ما قيمة x؟",
    options: ["1 H₂O", "2 H₂O", "3 H₂O", "4 H₂O"],
    answer: 3,
    explanation: "على اليسار 8 ذرات هيدروجين و6 ذرات أكسجين. في النواتج تستهلك جزيئات NO ذرتين من الأكسجين، وتبقى 4 ذرات أكسجين لتكوين 4H₂O؛ كما توفر 4 جزيئات ماء 8 ذرات هيدروجين.",
  },
  {
    id: "6ad0103563cd9c24f9f417b7",
    page: 5,
    number: 23,
    text: "أي مما يأتي مثال على بطارية أولية تُستخدم عادةً مرة واحدة؟",
    options: ["بطارية السيارة الرصاصية", "خلية وقود قابلة للتغذية بالوقود", "البطارية الجافة", "بطارية حاسوب قابلة للشحن"],
    answer: 2,
    explanation: "البطارية الجافة التقليدية خلية أولية غير قابلة لإعادة الشحن في الاستخدام المعتاد. أما بطاريات السيارة والحاسوب فهي خلايا ثانوية قابلة للشحن.",
  },
  {
    id: "6ad0103563cd9c24f9f417b8",
    page: 5,
    number: 24,
    text: "أي التوزيعات الإلكترونية الآتية يخص العنصر الأقل كهروسالبية بين عناصر الدورة الثانية المذكورة؟",
    options: ["1s² 2s² 2p⁵", "1s² 2s² 2p⁴", "1s² 2s² 2p³", "1s² 2s² 2p²"],
    answer: 3,
    explanation: "تمثل التوزيعات على الترتيب F وO وN وC. تقل الكهروسالبية عند الاتجاه يسارًا في الدورة؛ لذلك يكون الكربون ذو التوزيع 1s² 2s² 2p² الأقل بين هذه الخيارات.",
  },
  {
    id: "6ad0103563cd9c24f9f417b9",
    page: 5,
    number: 25,
    text: "وفق تعريف أرهينيوس، ما الذي يفعله الحمض عند ذوبانه في الماء؟",
    options: [
      "يمنح زوجًا من الإلكترونات",
      "يستقبل زوجًا من الإلكترونات",
      "ينتج أيونات OH⁻ في الماء",
      "ينتج أيونات H⁺ في الماء",
    ],
    answer: 3,
    explanation: "حمض أرهينيوس مادة تزيد تركيز أيونات الهيدروجين H⁺ (أو أيونات الهيدرونيوم) في المحلول المائي.",
  },
  {
    id: "6ad0103563cd9c24f9f417ba",
    page: 5,
    number: 26,
    text: "ما اسم الرابطة الناتجة من التجاذب الكهروستاتيكي بين أيونات مختلفة الشحنة؟",
    options: ["الرابطة الأيونية", "الرابطة الفلزية", "الرابطة التساهمية", "الرابطة التناسقية"],
    answer: 0,
    explanation: "تتكون الرابطة الأيونية من تجاذب كهروستاتيكي بين أيونات موجبة وأيونات سالبة.",
  },
  {
    id: "6ad0103563cd9c24f9f417bb",
    page: 5,
    number: 27,
    text: "في النموذج المدرسي للخلية الجافة من الخارصين والكربون، ما الجزء الذي يعمل مجمّعًا للتيار عند القطب الموجب؟",
    options: ["وعاء الخارصين", "الإلكتروليت", "قضيب الكربون", "الفواصل الورقية"],
    answer: 2,
    explanation: "قضيب الكربون موصل يجمع التيار عند الطرف الموجب للخلية. أما تفاعل الاختزال فيجري في خليط أكسيد المنغنيز حوله.",
  },
  {
    id: "6ad0103563cd9c24f9f417bc",
    page: 5,
    number: 28,
    text: "ما نوع المخلوط الناتج من خلط الماء بالطباشير دون ذوبان الطباشير؟",
    options: ["مخلوط متجانس", "غروي", "مركب", "معلق"],
    answer: 3,
    explanation: "الطباشير لا يذوب في الماء وتبقى جسيماته معلقة ثم تترسب، لذلك يكون المخلوط معلقًا غير متجانس.",
  },
  {
    id: "6ad0103563cd9c24f9f417bd",
    page: 5,
    number: 29,
    text: "ما اسم ظاهرة تشتيت الضوء بواسطة جسيمات المذاب في مخلوط غروي؟",
    options: ["تجانس المخلوط", "الذوبانية", "تأثير تندال", "الحركة البراونية"],
    answer: 2,
    explanation: "تأثير تندال هو تشتت الضوء عند مروره في الغرويات بسبب جسيماتها المنتشرة.",
  },
  {
    id: "6ad0103563cd9c24f9f417be",
    page: 5,
    number: 30,
    text: "ما النقطة في مخطط أطوار الماء التي تمثل درجة الحرارة والضغط اللذين لا يعود بعدهما طور السائل طورًا متميزًا؟",
    options: ["النقطة الثلاثية", "النقطة الحرجة", "النقطة النشطة", "النقطة الصفرية"],
    answer: 1,
    explanation: "عند النقطة الحرجة تنتهي الحدود الفاصلة بين السائل والغاز؛ وبعدها لا يوجد طور سائل متميز عن الطور الغازي.",
  },
  {
    id: "6ad0103563cd9c24f9f417bf",
    page: 5,
    number: 31,
    text: "ما نوع الطاقة المخزنة في المادة بسبب تركيبها الكيميائي؟",
    options: ["الطاقة النووية", "طاقة الوضع الكيميائية", "الطاقة الحرارية", "الطاقة الحركية"],
    answer: 1,
    explanation: "تُخزَّن الطاقة الكيميائية كطاقة وضع في الروابط والترتيب الكيميائي للمواد، وتتحول أثناء التفاعلات.",
  },
  {
    id: "6ad0103563cd9c24f9f417c0",
    page: 5,
    number: 33,
    text: "أي المركبات الآتية يُعد حمضًا وفق تعريف أرهينيوس؟",
    options: ["NaOH", "NH₃", "HCl", "BCl₃"],
    answer: 2,
    explanation: "يتأين HCl في الماء منتجًا أيونات H⁺، لذا يعد حمض أرهينيوس. أما NaOH فينتج OH⁻، وNH₃ قاعدة برونستد، وBCl₃ حمض لويس.",
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
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) {
      failures.push(`q${item.number}: source/page mismatch`);
    }
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
          reviewerNotes: "تمت مراجعة صياغة السؤال والخيارات والحل بمقابلتها مع المصدر وحل المسألة، وأضيف شرح توضيحي.",
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
