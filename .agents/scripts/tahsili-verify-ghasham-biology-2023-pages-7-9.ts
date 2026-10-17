import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103063cd9c24f9f40c4d", page: 7, number: 1, text: "درس باحث أحياء الهندسة الوراثية لنباتات لزيادة مقاومتها للحشرات والأمراض. ما المجال الذي يخدمه هذا البحث مباشرة؟", options: ["البحث في الأمراض", "حماية البيئة", "تحسين الزراعة", "دراسة الأنواع"], answer: 2, explanation: "توظيف الهندسة الوراثية لزيادة مقاومة النباتات للآفات والأمراض يدعم تحسين المحاصيل والإنتاج الزراعي." },
  { id: "6ad0103063cd9c24f9f40c4e", page: 7, number: 2, text: "ما المصطلح الذي يصف تنظيم الظروف الداخلية للفرد للمحافظة على حياته؟", options: ["الاتزان الداخلي", "الاستجابة", "التكيف", "التكاثر العذري"], answer: 0, explanation: "الاتزان الداخلي هو تنظيم الظروف الداخلية للمخلوق الحي وإبقاؤها ضمن حدود مناسبة." },
  { id: "6ad0103063cd9c24f9f40c4f", page: 7, number: 3, text: "زرع باحث نبتتين، وأضاف سمادًا يحتوي على النيتروجين إلى الأولى وسمادًا لا يحتوي عليه إلى الثانية. أي متغير يقيس أثر اختلاف السماد؟", options: ["نوع السماد هو المتغير التابع", "الضوء هو المتغير التابع", "الضوء هو المتغير المستقل", "نمو النبات هو المتغير التابع"], answer: 3, explanation: "نوع السماد هو العامل الذي غيّره الباحث، أما نمو النبات فهو النتيجة التي يقيسها؛ لذلك يكون النمو المتغير التابع." },
  { id: "6ad0103063cd9c24f9f40c50", page: 7, number: 4, text: "راقب باحث خفاشًا ثم استدل من صفاته على أنه من الثدييات. ما اسم هذا العمل؟", options: ["ملاحظة", "تحليل", "استنتاج", "فرضية"], answer: 2, explanation: "مراقبة الخفاش ملاحظة، أما تفسير صفاته والحكم بأنه من الثدييات فهو استنتاج مبني على الملاحظة والمعرفة السابقة." },
  { id: "6ad0103063cd9c24f9f40c51", page: 7, number: 5, text: "لاحظ عالم نمو نبات في الضوء وجمع معلومات عنه. ما الخطوة العلمية التالية؟", options: ["صياغة الفرضية", "إجراء التجربة", "استخلاص النتيجة", "اختبار الفرضية"], answer: 0, explanation: "بعد الملاحظة وجمع المعلومات يصوغ الباحث فرضية قابلة للاختبار، ثم يصمم تجربة لاختبارها." },
  { id: "6ad0103063cd9c24f9f40c52", page: 7, number: 6, text: "شاهدت حيوانًا للمرة الأولى ودوّنت معلومات عنه. ما العملية العلمية التي قمت بها؟", options: ["استنتاج", "فرضية", "تجربة", "ملاحظة"], answer: 3, explanation: "تسجيل ما تراه أو تسمعه أو تقيسه عن الحيوان مباشرة هو ملاحظة، وليس تفسيرًا أو فرضية." },
  { id: "6ad0103063cd9c24f9f40c53", page: 7, number: 7, text: "أي الكميات الآتية وصف نوعي لا كمي؟", options: ["الحجم", "الكتلة", "اللون", "الطول"], answer: 2, explanation: "اللون وصف نوعي لا يعبَّر عنه عادةً بقياس عددي، بينما الحجم والكتلة والطول كميات يمكن قياسها." },
  { id: "6ad0103063cd9c24f9f40c54", page: 7, number: 8, text: "كيف يمكن للعلماء التحقق من موثوقية نتائج دراسة أو تجربة؟", options: ["استخدام النظام المتري فقط", "استخلاص استنتاج جديد", "مراجعة الأقران", "تكوين فرضية جديدة"], answer: 2, explanation: "تتيح مراجعة الأقران لعلماء آخرين فحص المنهج والبيانات والاستنتاجات قبل قبول النتائج." },
  { id: "6ad0103063cd9c24f9f40c55", page: 7, number: 9, text: "لاحظ عالم سلوكًا غير مألوف لدى الفقمة ويريد دراسته. ما الخطوة الأنسب؟", options: ["جمع معلومات أكثر", "استخدام النظام المتري", "جمع معلومات أقل", "مراجعة الأقران قبل إجراء الدراسة"], answer: 0, explanation: "يبدأ الباحث بجمع ملاحظات ومعلومات إضافية عن السلوك وسياقه قبل تفسيره أو تصميم تجربة لاختباره." },
  { id: "6ad0103063cd9c24f9f40c56", page: 7, number: 10, text: "أي كتابة تمثل الاسم العلمي الصحيح للقط المنزلي وفق التسمية الثنائية؟", options: ["felis catus", "Felis catus", "Felis Catus", "felis Catus"], answer: 1, explanation: "يبدأ اسم الجنس بحرف كبير واسم النوع بحرف صغير؛ لذلك تكتب التسمية Felis catus." },
  { id: "6ad0103063cd9c24f9f40c57", page: 8, number: 11, text: "ما الترتيب الصحيح لمستويات التنظيم من الأصغر إلى الأكبر في المخلوق الحي؟", options: ["أعضاء، أجهزة، أنسجة، خلايا", "خلايا، أنسجة، أجهزة، أعضاء", "أنسجة، أعضاء، خلايا، أجهزة", "خلايا، أنسجة، أعضاء، أجهزة"], answer: 3, explanation: "تتجمع الخلايا لتكوّن أنسجة، والأنسجة تكوّن أعضاء، والأعضاء تعمل معًا ضمن أجهزة." },
  { id: "6ad0103063cd9c24f9f40c58", page: 8, number: 12, text: "افترض عالم أن زيادة شدة الضوء ترفع معدل البناء الضوئي. ما الإجراء الذي يختبر الفرضية بجمع معلومات تحت ظروف مضبوطة؟", options: ["التجربة", "الملاحظة", "الاستنتاج", "الاستقصاء المكتبي"], answer: 0, explanation: "التجربة تغيّر شدة الضوء مع ضبط العوامل الأخرى وقياس معدل البناء الضوئي لاختبار الفرضية." },
  { id: "6ad0103063cd9c24f9f40c59", page: 8, number: 13, text: "في تجربة زراعة تُروى فيها نبتتان بكمّيتين مختلفتين من الماء، ما المتغير المستقل؟", options: ["نوعية التربة", "كمية الماء", "نمو النبات", "كمية الضوء الساقط"], answer: 1, explanation: "كمية الماء هي العامل الذي يغيّره الباحث بين النبتتين، لذا فهي المتغير المستقل. أما نمو النبات فهو نتيجة يمكن قياسها." },
  { id: "6ad0103063cd9c24f9f40c5a", page: 8, number: 14, text: "بأي خطوة تبدأ عادةً الدراسة العلمية؟", options: ["الفرضية", "الملاحظة", "التجربة", "الاستنتاج"], answer: 1, explanation: "تبدأ الدراسة العلمية بملاحظة ظاهرة أو طرح سؤال عنها، ثم تُبنى الفرضيات وتُختبر." },
  { id: "6ad0103063cd9c24f9f40c5b", page: 8, number: 15, text: "أثناء دراسة حقلية لفت انتباهك نبات غريب. ما أول خطوة علمية تقوم بها لبدء البحث؟", options: ["استخلاص الاستنتاج", "ملاحظة النبات وتسجيل صفاته", "افتراض الفرضية دون جمع معلومات", "إجراء تجربة مباشرة"], answer: 1, explanation: "تبدأ الدراسة بتوثيق الملاحظات عن النبات وصفاته، ثم تُطرح الأسئلة وتُصاغ فرضية مناسبة." },
  { id: "6ad0103063cd9c24f9f40c5d", page: 8, number: 17, text: "في تجربة يُسقى فيها النبات الأول مرة أسبوعيًا والثاني ثلاث مرات أسبوعيًا، ما دور عدد مرات إضافة الماء؟", options: ["متغير مستقل", "معايرة", "متغير تابع", "ضابط"], answer: 0, explanation: "عدد مرات السقي هو العامل الذي غيّره الباحث عمدًا؛ لذلك فهو المتغير المستقل." },
  { id: "6ad0103063cd9c24f9f40c5e", page: 8, number: 18, text: "يحافظ الجسم على متغير داخلي قريبًا من المستوى الطبيعي، ويستجيب عندما يقترب من حد أعلى أو أدنى ليعود إلى ذلك المستوى. ما خاصية الحياة التي يصفها هذا؟", options: ["التعضي", "التكاثر", "النمو", "الاتزان الداخلي"], answer: 3, explanation: "الاتزان الداخلي هو المحافظة على استقرار البيئة الداخلية ضمن حدود مناسبة رغم تغير الظروف." },
  { id: "6ad0103063cd9c24f9f40c5f", page: 8, number: 19, text: "تتكيف النباتات الصحراوية مع قلة الماء بتحور أوراقها. أي مما يأتي لا يساعد على تقليل فقد الماء؟", options: ["وجود الثغور في تجاويف", "التفاف الأوراق", "زيادة مساحة سطح الورقة", "قلة عدد الثغور"], answer: 2, explanation: "زيادة مساحة سطح الورقة ترفع مساحة التبخر عادةً، فلا تساعد على تقليل فقد الماء؛ أما الثغور الغائرة والالتفاف وقلة الثغور فتحد منه." },
  { id: "6ad0103063cd9c24f9f40c60", page: 8, number: 20, text: "وفق مفهوم النوع الحيوي، بين أي أفراد يحدث التزاوج الذي ينتج نسلًا قادرًا على التكاثر؟", options: ["أفراد العائلة الواحدة", "أفراد النوع الواحد", "أفراد الرتبة الواحدة", "أفراد الفصيلة نفسها"], answer: 1, explanation: "يتكون النوع الحيوي من أفراد يمكنها التزاوج فيما بينها وإنتاج نسل خصب في الظروف الطبيعية." },
  { id: "6ad0103063cd9c24f9f40c62", page: 9, number: 21, text: "يتكون الاسم العلمي في التسمية الثنائية من اسمَي:", options: ["الجنس والنوع", "الفصيلة والرتبة", "المملكة والشعبة", "الجنس والطائفة"], answer: 0, explanation: "تتكون التسمية الثنائية من اسم الجنس متبوعًا باسم النوع." },
  { id: "6ad0103063cd9c24f9f40c63", page: 9, number: 22, text: "ما المصطلح الذي يستخدم بديلًا عن «الشعبة» في تصنيف النباتات والبكتيريا؟", options: ["رتبة", "قسم", "نوع", "طائفة"], answer: 1, explanation: "يستخدم مصطلح «القسم» في تصنيف النباتات وبعض المجموعات مثل البكتيريا بدلًا من مصطلح «الشعبة»." },
  { id: "6ad0103063cd9c24f9f40c64", page: 9, number: 23, text: "أي وحدة مناسبة لقياس كتلة دب الباندا؟", options: ["الكيلوجرام", "البوصة", "اللتر", "اللون"], answer: 0, explanation: "تقاس الكتلة بوحدات مثل الكيلوجرام؛ أما البوصة للطول واللتر للحجم، واللون وصف نوعي." },
  { id: "6ad0103063cd9c24f9f40c65", page: 9, number: 24, text: "ما الاستجابة التي تساعد الإنسان على المحافظة على درجة حرارة جسمه عند تعرضه لحرارة ورطوبة مرتفعتين؟", options: ["زيادة درجة حرارته", "زيادة ضربات القلب فقط", "زيادة التعرق", "زيادة إفراز الهرمونات"], answer: 2, explanation: "يساعد التعرق وتبخر العرق من سطح الجلد على تبديد الحرارة وخفض درجة حرارة الجسم." },
  { id: "6ad0103063cd9c24f9f40c66", page: 9, number: 25, text: "أي ترتيب يضع مستويات التصنيف من الأكبر إلى الأصغر؟", options: ["فوق مملكة، مملكة، شعبة، طائفة، رتبة، فصيلة، نوع، جنس", "فوق مملكة، مملكة، شعبة، طائفة، رتبة، فصيلة، جنس، نوع", "فوق مملكة، مملكة، طائفة، شعبة، فصيلة، رتبة، جنس، نوع", "فوق مملكة، مملكة، رتبة، فصيلة، شعبة، طائفة، جنس، نوع"], answer: 1, explanation: "الترتيب هو: فوق المملكة، المملكة، الشعبة، الطائفة، الرتبة، الفصيلة، الجنس، النوع." },
  { id: "6ad0103063cd9c24f9f40c67", page: 9, number: 26, text: "أي مستويات التصنيف الآتية أوسع؟", options: ["المملكة", "الطائفة", "الجنس", "النوع"], answer: 0, explanation: "المملكة تضم مجموعات تصنيفية كثيرة، ومنها الشعب والطوائف والأجناس والأنواع؛ لذا هي الأوسع بين الخيارات." },
  { id: "6ad0103063cd9c24f9f40c68", page: 9, number: 27, text: "في تجربة تدرس أثر زيادة تركيز الأملاح في إنبات البذور خلال مدة ثابتة، ما المتغير التابع؟", options: ["تركيز الأملاح", "الفترة الزمنية", "نوع البذور", "إنبات البذور"], answer: 3, explanation: "تركيز الأملاح هو العامل الذي غُيّر، أما إنبات البذور فهو الاستجابة التي تُقاس، ولذلك يمثل المتغير التابع." },
  { id: "6ad0103063cd9c24f9f40c69", page: 9, number: 28, text: "افترض ألكسندر فلمنج أن فطر البنسيليوم يفرز مادة تقتل البكتيريا. ما نوع هذه العبارة العلمية؟", options: ["ملاحظة", "فرضية", "استنتاج", "قانون"], answer: 1, explanation: "العبارة تفسير مقترح قابل للاختبار، لذلك تعد فرضية." },
  { id: "6ad0103063cd9c24f9f40c6a", page: 9, number: 29, text: "عند ترتيب مستويات التصنيف الثمانية من الأكبر إلى الأصغر، ما المستوى الثالث؟", options: ["الطائفة", "الشعبة", "فوق المملكة", "المملكة"], answer: 1, explanation: "يبدأ الترتيب بفوق المملكة ثم المملكة ثم الشعبة؛ لذلك المستوى الثالث هو الشعبة." },
  { id: "6ad0103063cd9c24f9f40c6b", page: 9, number: 30, text: "أي كتابة تمثل الاسم العلمي الصحيح للبرتقال وفق التسمية الثنائية؟", options: ["Citrus sinensis", "Citrus Sinensis", "citrus sinensis", "citrus Sinensis"], answer: 0, explanation: "يبدأ اسم الجنس Citrus بحرف كبير، ويكتب اسم النوع sinensis بحروف صغيرة." },
] as const;

const rejections = [
  { id: "6ad0103063cd9c24f9f40c5c", page: 8, number: 16, note: "حُجب السؤال: خيار «تنظيم داخلي» وخيار «إظهار التنظيم (التعضي)» متداخلان في المعنى، فلا يضمن وجود إجابة واحدة واضحة." },
  { id: "6ad0103063cd9c24f9f40c6c", page: 9, number: 31, note: "حُجب السؤال: الخيارات «الصفات المشتركة والتكاثر» و«الشكل الخارجي والسلوك» تتداخل في وصف أسس تصنيف لينيوس، ولا يحدد النص المقصود بدقة كافية." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const reviewed = [...approvals, ...rejections];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: reviewed.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey sourceBook subcategory topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text options correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: already-published record conflicts with this verified review`);
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !["pending_review", "rejected"].includes(draft.status)) failures.push(`q${item.number}: rejection source/page/status mismatch`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number}: rejected item unexpectedly exists in published bank`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: rejections.length, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate(
      { sourceKey: draft.sourceKey },
      { $set: {
        questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
        subject: "أحياء", subcategory: "علم الأحياء والتصنيف", text: item.text, options: [...item.options], correctOptionIndex: item.answer,
        difficulty: draft.difficulty || "intermediate", topic: draft.topic || "مبادئ علم الأحياء", explanation: item.explanation,
        sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
        ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
        sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
      }, $setOnInsert: { createdAt: reviewedAt } },
      { upsert: true, returnDocument: "after", runValidators: true },
    );
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } },
      { $set: {
        status: "approved", subject: "أحياء", subcategory: "علم الأحياء والتصنيف", text: item.text, options: [...item.options],
        explanation: item.explanation, reviewedBy: REVIEWER, reviewedAt,
        reviewerNotes: "تمت مراجعة السؤال مع مصدره؛ وجرى استبدال العبارات المرتبطة بالصور بوصف نصي عندما كان ذلك واضحًا.",
        updatedAt: reviewedAt,
      } },
    );
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } },
      { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt } },
    );
  }
  summary.changed = true;
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
