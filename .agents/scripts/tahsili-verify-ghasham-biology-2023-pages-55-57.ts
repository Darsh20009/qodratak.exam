import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const subject = "أحياء";
const mammals = "الفقاريات - الثدييات";
const approvals = [
  { id: "6ad0103163cd9c24f9f40d53", page: 55, number: 1, text: "في أي خيار يوجد بروتين الكيراتين؟", options: ["عظام الفأر", "شعر الخروف", "قشرة جراد البحر", "أجنحة الفراشة"], answer: 1, explanation: "الكيراتين بروتين بنيوي يوجد في الشعر والأظافر والريش والقرون؛ أما قشرة جراد البحر فتتكون أساسًا من الكيتين." },
  { id: "6ad0103163cd9c24f9f40d54", page: 55, number: 2, text: "ما البروتين الرئيسي المكوّن للشعر والريش؟", options: ["الكيتين", "الكيراتين", "الجلايكوجين", "الميلانين"], answer: 1, explanation: "يتكون الشعر والريش أساسًا من بروتين الكيراتين." },
  { id: "6ad0103163cd9c24f9f40d55", page: 55, number: 3, text: "أي الحيوانات الآتية من الثدييات؟", options: ["القرش", "البطريق", "الدلفين", "الأخطبوط"], answer: 2, explanation: "الدلفين ثديي يتنفس بالرئتين ويرضع صغاره؛ القرش سمكة، والبطريق طائر، والأخطبوط رخوي." },
  { id: "6ad0103163cd9c24f9f40d56", page: 55, number: 4, text: "إلى أي مجموعة ينتمي منقار البط؟", options: ["البرمائيات", "الطيور", "الثدييات الأولية (وحيدة المسلك)", "الزواحف"], answer: 2, explanation: "منقار البط ثديي أولي يضع البيض، لكنه يرضع صغاره." },
  { id: "6ad0103163cd9c24f9f40d57", page: 55, number: 5, text: "أي المجموعات الآتية مخلوقات حقيقية النوى متعددة الخلايا وغير ذاتية التغذية؟", options: ["الحيوانات", "النباتات", "البكتيريا", "الفيروسات"], answer: 0, explanation: "الحيوانات حقيقية النوى ومتعددة الخلايا، وتعتمد على غيرها للحصول على الغذاء." },
  { id: "6ad0103163cd9c24f9f40d58", page: 55, number: 6, text: "ما الصفة التي تميز الخفاش عن الطيور رغم أن كليهما يستطيع الطيران؟", options: ["يبيض", "يطير", "يلد ويرضع صغاره", "له ريش"], answer: 2, explanation: "الخفاش من الثدييات؛ يلد صغاره ويرضعها، ولا يمتلك ريشًا." },
  { id: "6ad0103163cd9c24f9f40d59", page: 55, number: 7, text: "إلى أي مجموعة من الثدييات ينتمي الكنغر؟", options: ["الكيسية", "الأولية", "المشيمية", "الثانوية"], answer: 0, explanation: "الكنغر من الثدييات الكيسية؛ يكتمل نمو صغيره بعد الولادة داخل كيس الأم." },
  { id: "6ad0103163cd9c24f9f40d5a", page: 55, number: 8, text: "أي العينات الآتية لا تحتوي على الكيراتين؟", options: ["شعر الخروف", "قرون الغزال", "عظم الفأر", "مخلب النسر"], answer: 2, explanation: "الشعر والقرون ومخالب الطيور تحتوي على الكيراتين؛ أما العظم فيتكون أساسًا من مادة عظمية غنية بالكولاجين وأملاح الكالسيوم." },
  { id: "6ad0103163cd9c24f9f40d5b", page: 55, number: 9, text: "أي الحيوانات الآتية لا تمتلك عضلة حجاب حاجز؟", options: ["الضفدع", "الفيل", "الحوت", "الذئب"], answer: 0, explanation: "لا تمتلك البرمائيات عضلة حجاب حاجز كالتي لدى الثدييات؛ وتستخدم الضفادع آليات أخرى لتهوية الرئتين." },
  { id: "6ad0103163cd9c24f9f40d5c", page: 55, number: 10, text: "أي الحيوانات الآتية ثديي يلد صغاره ويرضعها؟", options: ["القرش", "الدلفين", "البطريق", "الضفدع"], answer: 1, explanation: "الدلفين ثديي يلد صغاره ويرضعها. صيغ السؤال بهذه الصورة لأن بعض أنواع القروش تلد صغارًا أحياء، فلا تكون كلمة «يلد» وحدها كافية لتمييز إجابة واحدة." },
  { id: "6ad0103163cd9c24f9f40d5d", page: 55, number: 11, text: "أي عملية إخراجية يفقد الجسم من خلالها الماء مع الفضلات؟", options: ["إخراج البول", "التعرق", "ممارسة الرياضة", "استخدام الأطراف"], answer: 0, explanation: "يفقد الجسم ماءً مع البول أثناء التخلص من الفضلات الذائبة. وقد يفقد الماء أيضًا بالتعرق، لكن السؤال هنا عن الإخراج البولي." },
  { id: "6ad0103163cd9c24f9f40d5e", page: 55, number: 12, text: "ما المادة الأساسية التي تدخل في تكوين الأظافر والشعر والريش؟", options: ["الكيتين", "الثيروكسين", "الكالسيتونين", "الكيراتين"], answer: 3, explanation: "الأظافر والشعر والريش تراكيب غنية ببروتين الكيراتين." },
  { id: "6ad0103163cd9c24f9f40d5f", page: 55, number: 13, text: "ما العلاقة بين كتلة الجسم ومعدل الأيض لكل وحدة من كتلة الجسم؟", options: ["كلما قلت كتلة الجسم ارتفع معدل الأيض لكل وحدة كتلة", "كلما قلت كتلة الجسم انخفض معدل الأيض لكل وحدة كتلة", "كلما زادت كتلة الجسم ارتفع معدل الأيض لكل وحدة كتلة", "لا توجد علاقة"], answer: 0, explanation: "يميل معدل الأيض لكل وحدة من كتلة الجسم إلى الارتفاع في الحيوانات الصغيرة والانخفاض في الحيوانات الأكبر. يختلف ذلك عن معدل الأيض الكلي للجسم؛ لذلك حُددت المقارنة لكل وحدة كتلة." },
  { id: "6ad0103163cd9c24f9f40d60", page: 56, number: 14, text: "ما وجه الشبه بين الخفاش والصقر؟", options: ["التنفس بالرئتين", "امتلاك الحجاب الحاجز", "امتلاك الريش", "امتلاك المنقار"], answer: 0, explanation: "الخفاش والصقر يتنفسان بالرئتين؛ أما الحجاب الحاجز والريش والمنقار فلا يشترك فيهما الحيوانان." },
  { id: "6ad0103163cd9c24f9f40d61", page: 56, number: 15, text: "ما الصفة التي تساعد الثدييات على العيش في ظروف بيئية متنوعة؟", options: ["تنظيم درجة الحرارة الخارجية", "تنظيم درجة الحرارة الداخلية", "غياب عمليات الأيض", "التنفس بالخياشيم"], answer: 1, explanation: "تحافظ الثدييات على حرارة داخلية مستقرة نسبيًا، ما يسمح لها بالنشاط في ظروف بيئية متعددة." },
  { id: "6ad0103163cd9c24f9f40d62", page: 56, number: 16, text: "ما الصفة المشتركة بين الجمل والضب بوصفهما من الفقاريات؟", options: ["ثبات درجة حرارة الجسم", "وجود العرف العصبي أثناء النمو الجنيني", "التكاثر بالولادة", "عدد حجرات القلب"], answer: 1, explanation: "كلاهما من الفقاريات، وتظهر في نمو الفقاريات تراكيب جنينية منها العرف العصبي؛ أما ثبات الحرارة والولادة وعدد حجرات القلب فتختلف بينهما." },
  { id: "6ad0103163cd9c24f9f40d63", page: 56, number: 17, text: "أي التراكيب الآتية يميز الثدييات المشيمية ولا يوجد في الزواحف؟", options: ["المشيمة", "كيس الممبار", "كيس المح", "الغشاء الرهلي"], answer: 0, explanation: "تتشارك الزواحف والثدييات في بعض الأغشية الجنينية، لكن المشيمة التي تنقل الغذاء إلى الجنين سمة للثدييات المشيمية." },
  { id: "6ad0103163cd9c24f9f40d64", page: 56, number: 18, text: "أي الحيوانات الآتية من الثدييات الأولية؟", options: ["القرد", "الأسد", "الكنغر", "منقار البط"], answer: 3, explanation: "منقار البط من الثدييات الأولية التي تضع البيض، مع امتلاكها صفات الثدييات ومنها إنتاج الحليب." },
  { id: "6ad0103163cd9c24f9f40d65", page: 56, number: 19, text: "حيوان له حافر مشقوق إلى إصبعين؛ ما نوع حافره؟", options: ["أحادي الحافر", "ثنائي الحافر", "مخلب", "قرون"], answer: 1, explanation: "الحافر الظاهر في الشكل مشقوق إلى إصبعين، لذلك يصنف ثنائي الحافر. حُولت إشارة الصورة إلى وصف نصي." },
  { id: "6ad0103163cd9c24f9f40d66", page: 56, number: 20, text: "ما الصفة المميزة للثدييات؟", options: ["القشور", "الريش", "الشعر والغدد اللبنية", "الحراشف"], answer: 2, explanation: "من أهم صفات الثدييات وجود الشعر أو الفرو وامتلاك الإناث غددًا لبنية ترضع بها الصغار." },
  { id: "6ad0103163cd9c24f9f40d67", page: 56, number: 21, text: "أي الحيوانات الآتية لا يبيض؟", options: ["البطريق", "منقار البط", "آكل النمل الشوكي", "الخفاش"], answer: 3, explanation: "الخفاش يلد صغاره؛ أما البطريق فيضع البيض، ومنقار البط وآكل النمل الشوكي من الثدييات الأولية البياضة." },
  { id: "6ad0103163cd9c24f9f40d68", page: 56, number: 22, text: "جمجمة ذات أضراس عريضة مسطحة مناسبة لطحن النباتات؛ إلى أي مستوى غذائي ينتمي الحيوان؟", options: ["آكلات أعشاب", "آكلات حشرات", "آكلات لحوم", "ذاتية التغذية"], answer: 0, explanation: "الأضراس العريضة المسطحة تطحن المواد النباتية، وهي تكيف شائع لدى آكلات الأعشاب. استُبدل الاعتماد على صورة الجمجمة بوصف صفاتها." },
  { id: "6ad0103163cd9c24f9f40d69", page: 56, number: 23, text: "أي مجموعة تتكون جميع أفرادها من الثدييات؟", options: ["خفاش، حوت، دلفين", "تمساح، منقار البط، سلمندر", "خفاش، صقر، قرد", "قرش، حوت، ورنك"], answer: 0, explanation: "الخفاش والحوت والدلفين كلها ثدييات؛ أما المجموعات الأخرى فتضم زواحف أو طيورًا أو أسماكًا." },
  { id: "6ad0103163cd9c24f9f40d6a", page: 56, number: 24, text: "أي الحيوانات الآتية ثديي بائض؟", options: ["الأبوسوم", "الكنغر", "منقار البط", "الحوت"], answer: 2, explanation: "منقار البط من الثدييات الأولية التي تضع البيض؛ أما الأبوسوم والكنغر فثدييات كيسية، والحوت ثديي مشيمي." },
  { id: "6ad0103163cd9c24f9f40d6b", page: 56, number: 25, text: "إلى أي طائفة من الثدييات ينتمي الكنغر؟", options: ["الثدييات الأولية", "الثدييات المشيمية", "الثدييات البيوضة", "الثدييات الكيسية"], answer: 3, explanation: "الكنغر من الثدييات الكيسية؛ يولد صغيره في مرحلة مبكرة ثم يكمل نموه في كيس الأم." },
  { id: "6ad0103163cd9c24f9f40d6c", page: 56, number: 26, text: "أي الحيوانات الآتية من الثدييات البيوضة؟", options: ["الأبوسوم", "الكنغر", "آكل النمل الشوكي", "عجل البحر"], answer: 2, explanation: "آكل النمل الشوكي من الثدييات الأولية التي تضع البيض." },
  { id: "6ad0103163cd9c24f9f40d6d", page: 57, number: 27, text: "ما وجه الشبه بين الخفاش ومنقار البط؟", options: ["امتلاك الأشواك", "امتلاك الريش", "إنتاج الحليب لإرضاع الصغار", "امتلاك الغدد اللبنية والريش"], answer: 2, explanation: "الخفاش ومنقار البط ثدييان، وتشتركان في إنتاج الحليب لإرضاع الصغار." },
  { id: "6ad0103163cd9c24f9f40d6e", page: 57, number: 28, text: "كيف تفيد نسبة الدهون المرتفعة في حليب الثدييات المائية صغارها؟", options: ["تمنحها طاقة عالية وتدعم النمو والحفاظ على حرارة الجسم", "تجعلها تبقى دافئة دون حاجة إلى الغذاء", "تمنعها من النمو", "لأن غذاء جميع الثدييات المائية غني بالدهون"], answer: 0, explanation: "يوفر الحليب الغني بالدهون طاقة مركزة لصغار الثدييات المائية، فتدعم نموها وعمليات إنتاج الحرارة في البيئة الباردة." },
  { id: "6ad0103163cd9c24f9f40d6f", page: 57, number: 29, text: "ما الاستجابة الفسيولوجية التي تساعد الحيوان على التخلص من الحرارة الزائدة؟", options: ["التعرق أو اللهاث لزيادة فقد الحرارة بالتبخر", "زيادة الحركة", "زيادة تناول الطعام", "تقليل الإخراج"], answer: 0, explanation: "يساعد التعرق أو اللهاث على تبخير الماء من سطح الجسم أو الجهاز التنفسي، فيفقد الجسم جزءًا من حرارته." },
  { id: "6ad0103163cd9c24f9f40d70", page: 57, number: 31, text: "أي الحيوانات الآتية يمتلك عضلة الحجاب الحاجز؟", options: ["الببغاء", "الخفاش", "العنب", "السلمون"], answer: 1, explanation: "يمتلك الخفاش، بوصفه ثدييًا، حجابًا حاجزًا يفصل التجويف الصدري عن البطني ويساعد على التنفس." },
  { id: "6ad0103163cd9c24f9f40d71", page: 57, number: 32, text: "أي الحيوانات الآتية يتغذى جنينه عبر المشيمة داخل الرحم؟", options: ["الخفاش", "الكنغر", "منقار البط", "آكل النمل الشوكي"], answer: 0, explanation: "الخفاش من الثدييات المشيمية؛ يتصل الجنين بالمشيمة التي تنقل إليه الغذاء والأكسجين داخل الرحم." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: approvals.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== approvals.length) failures.push(`expected ${approvals.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: published record conflicts with this review`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: 0, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
      subject, subcategory: mammals, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: mammals, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject, subcategory: mammals, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال وخياراته ومفتاحه مع المصدر والمعلومة العلمية، وتعديل الصياغة لتكون مستقلة عن الشكل عند الحاجة.", updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
