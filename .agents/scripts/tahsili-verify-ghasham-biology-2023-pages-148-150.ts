import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40fa0", page: 148, number: 1, topic: "الأحياء - السلوك", text: "يستخدم قرد حجرًا لكسر ثمار صلبة والوصول إلى بذورها. ما نوع السلوك الذي يتطلب حل مشكلة؟", options: ["تعلم إجرائي شرطي", "تعلم كلاسيكي شرطي", "سلوك إدراكي", "سلوك غريزي"], answer: 2, explanation: "اختيار أداة واستخدامها للوصول إلى الغذاء يتطلب حل مشكلة، ويعد مثالًا على السلوك الإدراكي." },
  { id: "6ad0103163cd9c24f9f40fa1", page: 148, number: 2, topic: "الأحياء - السلوك", text: "تعلم حمام في قفص الضغط على رافعة للحصول على الطعام. ما نوع التعلم؟", options: ["تعلم كلاسيكي شرطي", "التعود", "تعلم إجرائي شرطي", "سلوك مطبوع"], answer: 2, explanation: "في التعلم الإجرائي الشرطي يتعلم الحيوان ربط سلوكه بنتيجة؛ فالضغط على الرافعة يتبعه الحصول على الطعام." },
  { id: "6ad0103163cd9c24f9f40fa3", page: 148, number: 4, topic: "الأحياء - السلوك", text: "حيوان كان ينزعج من اقتراب البشر، ثم قلّت استجابته بعد تعرضه المتكرر لهم دون ضرر. ما نوع السلوك؟", options: ["التعود", "تعلم إجرائي", "تعلم كلاسيكي", "سلوك مطبوع"], answer: 0, explanation: "التعود هو انخفاض الاستجابة لمثير متكرر غير مؤذٍ ولا يترتب عليه مكافأة أو عقاب." },
  { id: "6ad0103163cd9c24f9f40fa4", page: 148, number: 5, topic: "الأحياء - السلوك", text: "أي السلوكيات الآتية غريزي؟", options: ["الهروب من صوت مرتفع بعد تعلمه", "السير في مسار معتاد", "تعلم الكتابة", "وقوف مولود الغزال بعد الولادة"], answer: 3, explanation: "وقوف صغير الغزال بعد ولادته سلوك فطري يظهر دون تدريب سابق." },
  { id: "6ad0103163cd9c24f9f40fa5", page: 148, number: 6, topic: "الأحياء - السلوك", text: "اتباع بعض صغار الطيور أول جسم متحرك تراه خلال فترة حساسة بعد الفقس يسمى:", options: ["سلوكًا إدراكيًا", "سلوكًا مطبوعًا", "تعودًا", "تعلمًا شرطيًا"], answer: 1, explanation: "الطبع تعلم سريع يحدث في فترة حساسة مبكرة، مثل اتباع بعض صغار الطيور أول جسم متحرك تراه." },
  { id: "6ad0103163cd9c24f9f40fa6", page: 148, number: 7, topic: "الأحياء - السلوك", text: "ربط الحيوان بين صوت الجرس والطعام بعد اقترانهما مرارًا مثال على:", options: ["التعلم الكلاسيكي الشرطي", "التعود", "التعلم الإجرائي الشرطي", "سلوك الحضانة"], answer: 0, explanation: "في التعلم الكلاسيكي الشرطي يرتبط مثير محايد، مثل صوت الجرس، بمثير آخر، مثل الطعام، فيثير استجابة متعلمة." },
  { id: "6ad0103163cd9c24f9f40fa7", page: 148, number: 8, topic: "الأحياء - السلوك", text: "إذا ربّت لبؤة صغير قرد خلال فترة حساسة من حياته، فما نوع التعلم الذي قد يكوّن به الصغير ارتباطًا بالأم البديلة؟", options: ["إدراكي", "إجرائي", "مطبوع", "التعود"], answer: 2, explanation: "قد يحدث الطبع خلال فترة حساسة مبكرة، فيتعلق الصغير بأول كائن يرعاه ويتبعه." },
  { id: "6ad0103163cd9c24f9f40fa8", page: 148, number: 9, topic: "الأحياء - السلوك", text: "إذا تعلّمت بقرة الذهاب إلى مكان معين لأن الرعاة يقدمون لها بعد ذلك نتيجة محببة، فما نوع التعلم؟", options: ["كلاسيكي شرطي", "إجرائي شرطي", "إدراكي", "تعود"], answer: 1, explanation: "التعلم الإجرائي يربط السلوك بنتيجته؛ ويزداد احتمال تكرار السلوك عندما يعقبه تعزيز." },
  { id: "6ad0103163cd9c24f9f40fa9", page: 148, number: 10, topic: "الأحياء - السلوك الاجتماعي", text: "أي تنظيم اجتماعي قد يقلل الصراعات المتكررة داخل جماعة من الحيوانات؟", options: ["تكوّن ترتيب سيادة", "الهجرة الدائمة", "منطقة نفوذ واحدة لكل فرد", "الإيثار"], answer: 0, explanation: "قد ينظم ترتيب السيادة الوصول إلى الموارد ويقلل تكرار الصراعات المباشرة داخل الجماعة." },
  { id: "6ad0103163cd9c24f9f40faa", page: 148, number: 11, topic: "الأحياء - السلوك والتواصل", text: "أي عبارة غير صحيحة عن الفيرمونات؟", options: ["تستطيع المفترسات دائمًا تمييزها", "تستخدمها الحيوانات للتواصل", "قد تسهم في سلوك التكاثر", "هي مواد كيميائية"], answer: 0, explanation: "الفيرمونات مواد كيميائية تستخدمها أفراد النوع للتواصل، وقد تؤثر في التكاثر؛ ولا يصح التعميم بأن المفترسات تستطيع دائمًا تمييزها." },
  { id: "6ad0103163cd9c24f9f40fac", page: 149, number: 13, topic: "الأحياء - السلوك", text: "يرمي السنجاب ثمارًا صلبة في طريق السيارات ثم يجمعها بعد أن تنكسر. ما نوع السلوك الذي يظهره؟", options: ["تنافسي", "غريزي", "إدراكي", "مطبوع"], answer: 2, explanation: "استخدام السنجاب حدثًا أو أداة في البيئة لحل مشكلة الوصول إلى الغذاء مثال على السلوك الإدراكي." },
  { id: "6ad0103163cd9c24f9f40fad", page: 149, number: 14, topic: "الأحياء - السلوك والتواصل", text: "أي مما يأتي مثال على إشارة كيميائية تستخدمها الحيوانات للتواصل؟", options: ["عواء الذئب", "جمع النحل لرحيق الأزهار", "بول الفهد على الأشجار", "جمع الغذاء"], answer: 2, explanation: "قد يحتوي البول الذي يتركه الفهد علامات كيميائية، ومنها الفيرمونات، تساعد في التواصل وتحديد المنطقة." },
  { id: "6ad0103163cd9c24f9f40fae", page: 149, number: 15, topic: "الأحياء - السلوك", text: "يفرد الطاووس ريشه الملون أمام الأنثى. ما الوظيفة السلوكية الأوضح؟", options: ["المغازلة", "جمع الطعام", "تعلم شرطي", "التعود"], answer: 0, explanation: "استعراض الريش الملون سلوك مغازلة يساعد على جذب الشريك." },
  { id: "6ad0103163cd9c24f9f40faf", page: 149, number: 16, topic: "الأحياء - السلوك والتواصل", text: "كيف تتبع النملة غالبًا مسار النملات الأخريات إلى مصدر الغذاء؟", options: ["بتتبع أثر الفيرمونات", "بتذوق الطعام في الهواء", "باستخدام الزوائد وحدها", "بتتبع الهيكل"], answer: 0, explanation: "تضع النملات في كثير من الأنواع أثرًا كيميائيًا من الفيرمونات، فتتبعه النملات الأخرى." },
  { id: "6ad0103163cd9c24f9f40fb0", page: 149, number: 17, topic: "الأحياء - السلوك الاجتماعي", text: "ما اسم السلوك الذي يساعد فيه الحيوان فردًا آخر مع تحمّله كلفة أو مخاطرة؟", options: ["المغازلة", "الحضانة", "الهجرة", "الإيثار"], answer: 3, explanation: "الإيثار سلوك يعود بالنفع على فرد آخر مع وجود كلفة على الفرد الذي يؤديه." },
  { id: "6ad0103163cd9c24f9f40fb1", page: 149, number: 18, topic: "الأحياء - السلوك الاجتماعي", text: "ماذا يسمى ترتيب أفراد الجماعة من الأعلى إلى الأدنى في أولوية الوصول إلى الموارد؟", options: ["الصراع", "السلوك المطبوع", "الحضانة", "ترتيب السيادة"], answer: 3, explanation: "ترتيب السيادة يحدد المكانة أو أولوية الوصول إلى الموارد بين أفراد الجماعة." },
  { id: "6ad0103163cd9c24f9f40fb2", page: 149, number: 19, topic: "الأحياء - السلوك الاجتماعي", text: "إرضاع أنثى القرد لصغارها ورعايتهم مثال على:", options: ["السلوك المطبوع", "الحضانة والرعاية الأبوية", "السلوك الإدراكي", "التعلم الإجرائي"], answer: 1, explanation: "توفير الغذاء والحماية للصغار من صور الحضانة والرعاية الأبوية." },
  { id: "6ad0103163cd9c24f9f40fb3", page: 149, number: 20, topic: "الأحياء - السلوك والتواصل", text: "تستخدم الحيوانات الفيرمونات أساسًا في:", options: ["النمو", "التواصل", "التمثيل الضوئي", "إنتاج العظام"], answer: 1, explanation: "الفيرمونات إشارات كيميائية تطلقها الحيوانات وتؤثر في سلوك أفراد أخرى من النوع نفسه." },
  { id: "6ad0103163cd9c24f9f40fb4", page: 149, number: 21, topic: "الأحياء - السلوك", text: "أي مما يأتي مثال على نمط يومي في سلوك الحيوان؟", options: ["النوم والاستيقاظ", "السبات الشتوي", "الهجرة الموسمية", "التزاوج مرة واحدة في العمر"], answer: 0, explanation: "النوم والاستيقاظ يتكرران وفق نمط يومي منتظم مرتبط بالساعة الحيوية والضوء والظلام." },
  { id: "6ad0103163cd9c24f9f40fb5", page: 149, number: 22, topic: "الأحياء - السلوك", text: "ما اسم انخفاض استجابة الحيوان لمثير متكرر لا يحمل له فائدة أو ضررًا؟", options: ["السلوك المطبوع", "السلوك الإدراكي", "التعود", "التعلم الإجرائي"], answer: 2, explanation: "يحدث التعود عندما تقل استجابة الحيوان لمثير متكرر غير ذي أهمية بعد أن يتعلم أنه لا يمثل تهديدًا أو منفعة." },
  { id: "6ad0103163cd9c24f9f40fb6", page: 149, number: 23, topic: "الأحياء - السلوك الاجتماعي", text: "تتعاون النحلات في رعاية اليرقات وجمع الغذاء للخلية. ما نوع السلوك؟", options: ["الصراع", "السيادة", "الحضانة وحدها", "التعاون"], answer: 3, explanation: "تقسيم المهام والعمل المشترك لرعاية أفراد الخلية وجمع الغذاء مثال على التعاون الاجتماعي." },
  { id: "6ad0103163cd9c24f9f40fb7", page: 149, number: 24, topic: "الأحياء - السلوك الاجتماعي", text: "تصدر جماعة من القرود نداءات تحذيرية عندما تقترب جماعة أخرى من موطنها. ما السلوك الذي توضحه؟", options: ["الصراع", "السيادة", "الإيثار", "تحديد منطقة النفوذ"], answer: 3, explanation: "قد تستخدم الحيوانات النداءات لتحذير الجماعات الأخرى من الاقتراب من منطقة نفوذها." },
  { id: "6ad0103163cd9c24f9f40fb8", page: 150, number: 25, topic: "الأحياء - السلوك والتواصل", text: "في قصة النمل، تحذر النملة أفراد جماعتها وتطلب منهم دخول مساكنهم عند اقتراب خطر. ما نوع السلوك؟", options: ["التواصل", "السيادة", "الحضانة", "جمع الطعام"], answer: 0, explanation: "إصدار النملة تحذيرًا لأفراد جماعتها ينقل معلومات عن خطر، لذلك يعد سلوك تواصل." },
  { id: "6ad0103163cd9c24f9f40fb9", page: 150, number: 26, topic: "الأحياء - السلوك", text: "أي المصطلحات يصف سلوكًا يعتمد بدرجة كبيرة على الوراثة ويظهر دون تعلم سابق؟", options: ["إدراكي", "مطبوع", "مكتسب", "غريزي"], answer: 3, explanation: "السلوك الغريزي موروث ويظهر دون حاجة إلى تعلمه بالتجربة." },
  { id: "6ad0103163cd9c24f9f40fba", page: 150, number: 27, topic: "الأحياء - السلوك والتواصل", text: "ما اسم المواد الكيميائية التي تستخدمها بعض الحيوانات للتواصل مع أفراد النوع نفسه؟", options: ["الهرمونات", "الفيرمونات", "البروتينات", "الدهون"], answer: 1, explanation: "الفيرمونات إشارات كيميائية تنتقل بين أفراد النوع نفسه وتؤثر في سلوكهم أو استجاباتهم." },
  { id: "6ad0103163cd9c24f9f40fbb", page: 150, number: 28, topic: "الأحياء - السلوك والتواصل", text: "تسير النملات في طريق محدد وتتبع بعضها بعضًا للوصول إلى الغذاء. ما الإشارة التي تعتمد عليها غالبًا؟", options: ["رائحة أثر كيميائي", "طعم مادة في الطعام", "أصوات النمل", "حركة النملة السابقة فقط"], answer: 0, explanation: "تترك النملات أثرًا من الفيرمونات على المسار، فتتبعه النملات الأخرى إلى مصدر الغذاء." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40fa2", page: 148, number: 3, reason: "نص السؤال لا يوضح ما السلوك أو التجربة التي ينبغي استنتاجها من الصور المصغرة؛ كما يتداخل المثال مع سؤال الجرس والطعام الواضح في الصفحة نفسها. تعذر اعتماد مفتاح واحد بثقة من الرسم وحده." },
  { id: "6ad0103163cd9c24f9f40fab", page: 149, number: 12, reason: "مكرر في المهارة والإجابة لسؤال الحمام الذي يضغط رافعة للحصول على الطعام في الصفحة السابقة؛ كلاهما مثال على التعلم الإجرائي بالتعزيز." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = [...approvals.map((item) => item.id), ...rejections.map((item) => item.id)];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: ids }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== ids.length) failures.push(`expected ${ids.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number} p${item.page}: published record conflicts with this review`);
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "rejected"].includes(draft.status)) failures.push(`q${item.number} p${item.page}: rejection source/page/status mismatch`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: rejected draft already has a published row`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approvals.length, rejected: rejections.length, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approvals) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = draft.sourceOrdinal * 100_000 + draft.sourcePage * 100 + draft.sourceBlockIndex;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
      subject: "أحياء", subcategory: item.topic, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.topic, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject: "أحياء", subcategory: item.topic, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة مفتاح الإجابة والشرح مع المصدر، وتنقيح الصياغة للحفاظ على سؤال واضح ومفهوم.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.reason, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
