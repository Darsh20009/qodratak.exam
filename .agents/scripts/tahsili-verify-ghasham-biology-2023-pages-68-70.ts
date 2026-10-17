import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const subject = "أحياء";
const subcategory = "أجهزة جسم الإنسان - الهيكل والعضلات";
const approvals = [
  { id: "6ad0103163cd9c24f9f40d72", page: 68, number: 1, text: "أي تركيب يربط العضلات بالعظام عند الحركة؟", options: ["المفاصل", "الأوتار", "الأربطة", "الأعصاب"], answer: 1, explanation: "تربط الأوتار العضلات بالعظام، بينما تربط الأربطة العظام بعضها ببعض عند المفاصل." },
  { id: "6ad0103163cd9c24f9f40d73", page: 68, number: 2, text: "إذا تضرر نخاع العظم الأحمر، فأي عملية تتأثر مباشرة؟", options: ["إنتاج الثيروكسين", "إنتاج الإنسولين", "إنتاج خلايا الدم الحمراء", "إنتاج هرمون النمو"], answer: 2, explanation: "ينتج نخاع العظم الأحمر خلايا الدم، ومنها خلايا الدم الحمراء والبيضاء والصفائح." },
  { id: "6ad0103163cd9c24f9f40d74", page: 68, number: 3, text: "أي المفاصل الآتية لا يتحرك؟", options: ["الركبة", "مفاصل الجمجمة", "الكتف", "المرفق"], answer: 1, explanation: "ترتبط عظام الجمجمة بمفاصل ثابتة لا تسمح بالحركة، باستثناء مفصل الفك." },
  { id: "6ad0103163cd9c24f9f40d75", page: 68, number: 4, text: "أي نوع من العضلات يضخ الدم من القلب إلى الأوعية الدموية؟", options: ["ملساء", "إرادية", "هيكلية", "قلبية لا إرادية مخططة"], answer: 3, explanation: "تضخ العضلة القلبية الدم من القلب، وهي عضلة لا إرادية مخططة." },
  { id: "6ad0103163cd9c24f9f40d76", page: 68, number: 5, text: "أي نوع من العضلات يوجد في جدران الشرايين ويساعد على ضبط قطرها؟", options: ["مخططة", "هيكلية", "ملساء", "قلبية"], answer: 2, explanation: "تحتوي جدران الشرايين على عضلات ملساء لا إرادية تنقبض وتنبسط لتنظيم قطر الوعاء وتدفق الدم." },
  { id: "6ad0103163cd9c24f9f40d77", page: 68, number: 6, text: "ما نوع العضلات التي توسع المثانة البولية وتقبضها؟", options: ["هيكلية", "ملساء", "قلبية", "إرادية"], answer: 1, explanation: "يتكون جزء كبير من جدار المثانة من عضلات ملساء لا إرادية تنقبض لتفريغ البول وتسترخي لامتلائها." },
  { id: "6ad0103163cd9c24f9f40d78", page: 68, number: 7, text: "أين يُخزن معظم فائض الكالسيوم في الجسم؟", options: ["العظام", "الغضاريف", "العضلات", "الكبد"], answer: 0, explanation: "تخزن العظام معظم الكالسيوم في الجسم ضمن أملاح معدنية تدخل في بنائها." },
  { id: "6ad0103163cd9c24f9f40d79", page: 68, number: 8, text: "ما نوع العضلات في ذراع الإنسان؟", options: ["هيكلية", "ملساء", "قلبية", "لا إرادية"], answer: 0, explanation: "عضلات الذراع عضلات هيكلية ترتبط بالعظام وتتحكم في حركتها إراديًا." },
  { id: "6ad0103163cd9c24f9f40d7a", page: 68, number: 9, text: "أي الوظائف الآتية تؤديها العضلات الهيكلية؟", options: ["الحركة الدودية", "تنظيم عمليات الأيض", "نبضات القلب", "تحريك الذراع"], answer: 3, explanation: "تحرك العضلات الهيكلية العظام والأطراف، ومنها عضلات الذراع." },
  { id: "6ad0103163cd9c24f9f40d7b", page: 68, number: 10, text: "ما الخلايا العظمية التي تزيل العظم القديم أو التالف؟", options: ["البانية", "الهادمة", "المحللة", "الإنزيمية"], answer: 1, explanation: "تهدم الخلايا العظمية الهادمة أجزاء العظم القديم لتسمح بإعادة تشكيله، بينما تبني الخلايا البانية نسيجًا جديدًا." },
  { id: "6ad0103163cd9c24f9f40d7c", page: 68, number: 11, text: "أي نوع من المفاصل يوجد في الورك؟", options: ["مداري", "منزلق", "كروي", "رزي"], answer: 2, explanation: "مفصل الورك كروي؛ يسمح بالحركة في اتجاهات متعددة." },
  { id: "6ad0103163cd9c24f9f40d7d", page: 68, number: 12, text: "أين تتكون خلايا الدم الحمراء والبيضاء والصفائح الدموية؟", options: ["النخاع الأحمر للعظم", "النخاع الأصفر للعظم", "الخلايا العظمية", "تجويف نخاع العظم"], answer: 0, explanation: "تتكون خلايا الدم والصفائح في نخاع العظم الأحمر؛ أما النخاع الأصفر فيختزن الدهون." },
  { id: "6ad0103163cd9c24f9f40d7e", page: 69, number: 13, text: "ما نوع العضلات المسؤولة عن تحريك الطعام داخل المعدة؟", options: ["إرادية ملساء", "إرادية مخططة", "لا إرادية ملساء", "لا إرادية مخططة"], answer: 2, explanation: "تتكون جدران المعدة من عضلات ملساء لا إرادية تحرك الطعام وتخلطه." },
  { id: "6ad0103163cd9c24f9f40d7f", page: 69, number: 14, text: "ما اسم العظم المسطح في منتصف الصدر الذي تتصل به معظم الأضلاع من الأمام؟", options: ["لوح الكتف", "الترقوة", "عظم القص", "الضلع"], answer: 2, explanation: "يقع عظم القص في منتصف الصدر، وتتصل به معظم الأضلاع عبر الغضاريف الضلعية. حُولت إشارة الشكل إلى وصف نصي." },
  { id: "6ad0103163cd9c24f9f40d80", page: 69, number: 15, text: "أي جهاز في الجسم مسؤول عن إنتاج خلايا الدم الحمراء في نخاع العظم؟", options: ["الجهاز العضلي", "الجهاز اللمفي", "الجهاز الهيكلي", "الجهاز العصبي"], answer: 2, explanation: "يوجد نخاع العظم الأحمر داخل العظام، وهو جزء من الجهاز الهيكلي وموقع تكوين خلايا الدم." },
  { id: "6ad0103163cd9c24f9f40d81", page: 69, number: 16, text: "أي العظام الآتية عظم غير منتظم الشكل؟", options: ["إحدى فقرات العمود الفقري", "عظم الجمجمة", "عظم الذراع", "عظم الساق"], answer: 0, explanation: "تصنف الفقرات عظامًا غير منتظمة الشكل؛ أما عظام الذراع والساق فعظام طويلة، وعظام الجمجمة مسطحة غالبًا." },
  { id: "6ad0103163cd9c24f9f40d82", page: 69, number: 17, text: "بماذا يتميز العظم الكثيف مقارنة بالعظم الإسفنجي؟", options: ["وجود أنظمة هافرس", "النخاع الأصفر", "الدم", "البلازما"], answer: 0, explanation: "توجد في العظم الكثيف وحدات أسطوانية تسمى أنظمة هافرس، تنظم الأوعية الدموية والأعصاب داخل العظم." },
  { id: "6ad0103163cd9c24f9f40d83", page: 69, number: 18, text: "أي نوع من المفاصل يوجد بين عظم الفخذ والحوض؟", options: ["كروي", "رزي", "مداري", "منزلق"], answer: 0, explanation: "مفصل الورك بين عظم الفخذ والحوض مفصل كروي يسمح بالحركة في اتجاهات متعددة. استُبدل الاعتماد على الرسم بوصف موضع المفصل." },
  { id: "6ad0103163cd9c24f9f40d84", page: 69, number: 19, text: "ما نوع العضلات الموجودة في معدة الإنسان؟", options: ["قلبية", "إرادية", "ملساء", "هيكلية"], answer: 2, explanation: "توجد في المعدة عضلات ملساء لا إرادية تحرك محتوياتها." },
  { id: "6ad0103163cd9c24f9f40d85", page: 69, number: 20, text: "أي هرمون يساعد على تنظيم استجابة الجسم للإجهاد ويحد من الالتهاب؟", options: ["الكورتيزول", "الأدرينالين", "الثيروكسين", "هرمون النمو"], answer: 0, explanation: "يساعد الكورتيزول على تنظيم استجابة الجسم للإجهاد، وله تأثير مضاد للالتهاب؛ ولا يعمل بوصفه مسكنًا مباشرًا للألم." },
  { id: "6ad0103163cd9c24f9f40d86", page: 69, number: 21, text: "ما نوع العظم الذي يحتوي على فراغات وترابيق كثيرة؟", options: ["العظم الكثيف", "تجويف النخاع", "العظم الإسفنجي", "الغضروف"], answer: 2, explanation: "العظم الإسفنجي نسيج عظمي ذو ترابيق وفراغات، توجد بينها عادة نخاعات وأوعية دموية." },
  { id: "6ad0103163cd9c24f9f40d87", page: 69, number: 22, text: "أي عضلة تعمل باستمرار لضخ الدم ولا تتعب كعضلات الحركة الإرادية؟", options: ["القلب", "الفخذ", "الحجاب الحاجز", "الكتف"], answer: 0, explanation: "تعمل العضلة القلبية بصورة مستمرة لضخ الدم، وهي مهيأة لمقاومة التعب. صيغ السؤال عن الاستمرار بدل ادعاء وجود عضلة «أقوى» على نحو مطلق." },
  { id: "6ad0103163cd9c24f9f40d88", page: 69, number: 23, text: "أي نوع من الغضاريف يوجد في صيوان الأذن؟", options: ["الغضروف المرن", "العظم المركب", "الغضروف غير المرن", "الأعصاب"], answer: 0, explanation: "يتكون صيوان الأذن من غضروف مرن يحافظ على شكله مع السماح بالانثناء." },
  { id: "6ad0103163cd9c24f9f40d89", page: 69, number: 24, text: "ما نوع العضلات التي تحرك الطعام داخل القناة الهضمية؟", options: ["ملساء", "مخططة", "هيكلية", "إرادية"], answer: 0, explanation: "تحرك العضلات الملساء اللاإرادية الطعام داخل القناة الهضمية بواسطة الحركة الدودية." },
  { id: "6ad0103163cd9c24f9f40d8a", page: 69, number: 25, text: "ما نوع العضلات التي يعتمد عليها الشخص في أداء التمارين الرياضية؟", options: ["لا إرادية", "قلبية", "هيكلية", "ملساء"], answer: 2, explanation: "تستخدم التمارين عضلات هيكلية إرادية تحرك العظام والأطراف." },
  { id: "6ad0103163cd9c24f9f40d8b", page: 69, number: 26, text: "أين يخزن الجسم معظم فائض الكالسيوم؟", options: ["الدم", "العظام", "البول", "الأعصاب"], answer: 1, explanation: "تخزن العظام معظم الكالسيوم في الجسم ضمن بنيتها المعدنية." },
  { id: "6ad0103163cd9c24f9f40d8c", page: 70, number: 27, text: "أي الأجزاء الآتية ليس من الهيكل المحوري؟", options: ["الجمجمة", "الكتف", "العمود الفقري", "الأضلاع"], answer: 1, explanation: "يشمل الهيكل المحوري الجمجمة والعمود الفقري والأضلاع؛ أما عظام الكتف فمن الهيكل الطرفي." },
  { id: "6ad0103163cd9c24f9f40d8d", page: 70, number: 28, text: "أي معدن يحتاجه الجسم لبناء عظام قوية، وقد تنخفض كثافته في هشاشة العظام؟", options: ["فيتامين A", "فيتامين B", "الكالسيوم", "الصوديوم"], answer: 2, explanation: "الكالسيوم معدن رئيسي في بناء العظام، وتؤدي خسارة الكتلة العظمية إلى زيادة هشاشتها." },
  { id: "6ad0103163cd9c24f9f40d8e", page: 70, number: 29, text: "عضلات لا إرادية مخططة، أليافها متفرعة ومتشابكة؛ ما نوعها؟", options: ["ملساء", "هيكلية", "إرادية", "قلبية"], answer: 3, explanation: "العضلات القلبية لا إرادية ومخططة، وتتصل أليافها المتفرعة بعضها ببعض لتعمل بتناسق." },
  { id: "6ad0103163cd9c24f9f40d8f", page: 70, number: 30, text: "خلية طويلة مغزلية الشكل ولا تظهر عليها تخطيطات؛ إلى أي نوع تنتمي؟", options: ["خلية عضلية ملساء", "خلية قلبية", "خلية هيكلية", "خلية دهنية"], answer: 0, explanation: "الخلايا العضلية الملساء مغزلية الشكل وغير مخططة. استُبدل الاعتماد على صورة الخلية بوصفها." },
  { id: "6ad0103163cd9c24f9f40d90", page: 70, number: 31, text: "ما نوع العضلات التي تحرك الغذاء من المريء إلى الأمعاء؟", options: ["إرادية", "مخططة", "ملساء", "هيكلية"], answer: 2, explanation: "تدفع العضلات الملساء الطعام عبر المريء والأمعاء بحركات دودية لا إرادية." },
  { id: "6ad0103163cd9c24f9f40d91", page: 70, number: 32, text: "ما المواد التي يفرزها الجسم طبيعيًا لتخفيف الألم عند الإصابة؟", options: ["هرمون النمو", "الإندورفينات", "الأدرينالين", "الإنسولين"], answer: 1, explanation: "الإندورفينات مواد كيميائية طبيعية تعمل على تخفيف الإحساس بالألم." },
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
      subject, subcategory, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: subcategory, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject, subcategory, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال وخياراته ومفتاحه مع المصدر والمعلومة العلمية، وتعديل الصياغة لتكون مستقلة عن الشكل عند الحاجة.", updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
