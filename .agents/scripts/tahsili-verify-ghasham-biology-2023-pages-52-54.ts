import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const subject = "أحياء";
const amphibians = "الفقاريات - البرمائيات";
const reptiles = "الفقاريات - الزواحف";
const birds = "الفقاريات - الطيور";
const approvals = [
  { id: "6ad0103163cd9c24f9f40d36", page: 52, number: 12, subcategory: amphibians, text: "عندما يكون الضفدع خارج الماء، فما العضو الذي يستخدمه للتنفس؟", options: ["الطبلة", "الخياشيم", "الأطراف", "الرئات"], answer: 3, explanation: "يتنفس الضفدع البالغ بالرئتين والجلد؛ وعند وجوده خارج الماء تكون الرئتان وسيلة مهمة للتنفس." },
  { id: "6ad0103163cd9c24f9f40d37", page: 52, number: 13, subcategory: amphibians, text: "بأي عضو تتنفس يرقات الضفدع غالبًا؟", options: ["الجلد", "الخياشيم", "الأطراف", "الرئات"], answer: 1, explanation: "تتنفس يرقات الضفادع (أبو ذنيبة) في الماء بالخياشيم." },
  { id: "6ad0103163cd9c24f9f40d38", page: 52, number: 14, subcategory: amphibians, text: "ما الصفة المشتركة بين الضفدع والسلمندر البالغ؟", options: ["وجود أطراف", "وجود ذيول دائمًا", "عدم وجود أطراف", "عدم وجود ذيول"], answer: 0, explanation: "يمتلك الضفدع والسلمندر البالغان أطرافًا؛ يختلفان في بقاء الذيل بعد اكتمال النمو." },
  { id: "6ad0103163cd9c24f9f40d39", page: 52, number: 15, subcategory: amphibians, text: "أي الحيوانات الآتية متغيرة درجة الحرارة ويكون إخصابها خارجيًا غالبًا؟", options: ["الضفدع", "منقار البط", "التمساح", "السلحفاة"], answer: 0, explanation: "الضفدع متغير درجة الحرارة، ويحدث الإخصاب لدى معظم أنواعه خارجيًا في الماء." },
  { id: "6ad0103163cd9c24f9f40d3a", page: 52, number: 16, subcategory: amphibians, text: "بأي عضو تتنفس يرقات الضفدع في بداية نموها؟", options: ["القصبات الهوائية", "الجلد فقط", "الرئات", "الخياشيم"], answer: 3, explanation: "تتنفس يرقات الضفدع في الماء بالخياشيم قبل تحولها إلى ضفادع بالغة." },
  { id: "6ad0103163cd9c24f9f40d3c", page: 52, number: 18, subcategory: amphibians, text: "قلب له أذينان وبطين واحد؛ لأي مجموعة ينتمي الحيوان غالبًا؟", options: ["الطيور", "الأسماك العظمية", "البرمائيات", "الأسماك الغضروفية"], answer: 2, explanation: "يتكون قلب معظم البرمائيات من أذينين وبطين واحد، أي ثلاث حجرات." },
  { id: "6ad0103163cd9c24f9f40d3d", page: 53, number: 1, subcategory: reptiles, text: "الضفدع والضب لهما ثلاث حجرات قلبية، بينما للحوت والتمساح أربع. على أي صفة بُني هذا التقسيم؟", options: ["التنفس", "الهيكل الداخلي", "تركيب القلب", "الإخصاب"], answer: 2, explanation: "يقسم الجدول الحيوانات وفق عدد حجرات القلب: ثلاث حجرات في الضفدع والضب، وأربع في الحوت والتمساح." },
  { id: "6ad0103163cd9c24f9f40d3e", page: 53, number: 2, subcategory: reptiles, text: "أي الصفات الآتية مشتركة بين الضفادع والتماسيح؟", options: ["تنفس الأجنة بالخياشيم", "الجلد الحرشفي", "الإخصاب الخارجي", "تغير درجة حرارة الجسم تبعًا للبيئة"], answer: 3, explanation: "الضفادع والتماسيح متغيرة درجة الحرارة؛ تعتمد حرارة أجسامها على البيئة الخارجية." },
  { id: "6ad0103163cd9c24f9f40d3f", page: 53, number: 3, subcategory: reptiles, text: "أي المخلوقات الآتية يمتلك قلبًا رباعي الحجرات؟", options: ["السلاحف", "الضفادع", "الأسماك", "التماسيح"], answer: 3, explanation: "تمتلك التماسيح قلبًا مكوّنًا من أربع حجرات، بخلاف معظم الزواحف الأخرى." },
  { id: "6ad0103163cd9c24f9f40d40", page: 53, number: 4, subcategory: reptiles, text: "كيف تلتقط الأفاعي الاهتزازات الصوتية من الأرض؟", options: ["تنقل عظام الفك الاهتزازات إلى الأذن الداخلية", "تستخدم طبلة أذن خارجية", "تسمع بأعضاء جاكوبسون", "تلتقط الصوت بلسانها"], answer: 0, explanation: "لا تمتلك الأفاعي أذنًا خارجية أو طبلة ظاهرة؛ تنتقل الاهتزازات من الفك إلى تراكيب الأذن الداخلية." },
  { id: "6ad0103163cd9c24f9f40d41", page: 53, number: 5, subcategory: reptiles, text: "في أي الحيوانات يوجد عضو جاكوبسون الذي يساعد على تحليل الروائح؟", options: ["التمساح", "الإنسان", "الثعبان", "النمل"], answer: 2, explanation: "يوجد عضو جاكوبسون في الأفاعي، ويساعدها على تحليل جزيئات الرائحة التي تلتقطها بلسانها." },
  { id: "6ad0103163cd9c24f9f40d42", page: 53, number: 6, subcategory: reptiles, text: "زاحف يمتلك قلبًا من أربع حجرات؛ إلى أي رتبة ينتمي؟", options: ["الحرشفيات", "التمساحيات", "السلحفيات", "خطمية الرأس"], answer: 1, explanation: "التمساحيات هي الزواحف التي تمتلك قلبًا رباعي الحجرات." },
  { id: "6ad0103163cd9c24f9f40d44", page: 53, number: 8, subcategory: reptiles, text: "لماذا تخرج الأفعى لسانها باستمرار؟", options: ["لإخافة الفريسة", "لتنظيف الفم", "لجمع جزيئات الرائحة وتحليلها", "للتنفس"], answer: 2, explanation: "يلتقط اللسان المتشعب جزيئات الرائحة من الهواء وينقلها إلى عضو جاكوبسون لتحليلها." },
  { id: "6ad0103163cd9c24f9f40d45", page: 53, number: 9, subcategory: reptiles, text: "كيف تستطيع الأفاعي ابتلاع فرائس أكبر من رؤوسها؟", options: ["لأن عظام فكوكها تتصل بأربطة مرنة وتتحرك بصورة مستقلة نسبيًا", "لأن عيونها كبيرة", "لأن حجم أجسامها كبير", "لأنها ثابتة درجة الحرارة"], answer: 0, explanation: "تتصل عظام فك الأفعى بأربطة مرنة، ما يسمح بتوسيع الفم وابتلاع فريسة كبيرة." },
  { id: "6ad0103163cd9c24f9f40d46", page: 53, number: 10, subcategory: reptiles, text: "أي الحيوانات الآتية من مجموعة السلويات مثل التمساح؟", options: ["الأسد", "الجلكي", "القرش", "الضفدع"], answer: 0, explanation: "الأسد من الثدييات والتمساح من الزواحف، وكلاهما من السلويات؛ أما الضفدع فبرمائي، والجلكي والقرش أسماك." },
  { id: "6ad0103163cd9c24f9f40d47", page: 53, number: 11, subcategory: reptiles, text: "أي الحيوانات الآتية متغير درجة الحرارة؟", options: ["التمساح", "القرد", "البقرة", "الجمل"], answer: 0, explanation: "التمساح متغير درجة الحرارة ويعتمد على البيئة الخارجية في تدفئة جسمه." },
  { id: "6ad0103163cd9c24f9f40d48", page: 53, number: 12, subcategory: reptiles, text: "ما وظيفة كيس المح في بيضة الزواحف؟", options: ["إمداد الجنين بالغذاء", "جمع الفضلات", "تبادل الغازات", "تخزين الفضلات"], answer: 0, explanation: "يحتوي كيس المح على مخزون غذائي يمد الجنين النامي بالغذاء." },
  { id: "6ad0103163cd9c24f9f40d49", page: 53, number: 13, subcategory: reptiles, text: "ما الصفة التي تميز السلمندر عن الضب؟", options: ["عدد الأطراف", "جلد السلمندر الرطب", "عدد حجرات القلب", "مقاومة تغير درجة الحرارة"], answer: 1, explanation: "جلد السلمندر رطب ونفّاذ نسبيًا، بينما يغطي الضب جلد جاف حرشفي." },
  { id: "6ad0103163cd9c24f9f40d4a", page: 54, number: 14, subcategory: birds, text: "أي تركيب في بيضة الطيور يخزن فضلات الجنين؟", options: ["الجنين", "الغشاء الرهلي", "غشاء الكوريون", "كيس الممبار (الألنتويس)"], answer: 3, explanation: "يخزن كيس الممبار (الألنتويس) فضلات الجنين؛ أما الغشاء الرهلي فيحيط بالجنين ويحميه، والكوريون يساهم في تبادل الغازات." },
  { id: "6ad0103163cd9c24f9f40d4b", page: 54, number: 15, subcategory: birds, text: "أي عضو يساعد الطيور على طحن الطعام بعد ابتلاعه؟", options: ["الحوصلة", "القانصة", "المريء", "الرئة"], answer: 1, explanation: "تطحن القانصة الطعام، وغالبًا تساعدها حبيبات صغيرة تبتلعها الطيور؛ أما الحوصلة فتخزن الطعام مؤقتًا." },
  { id: "6ad0103163cd9c24f9f40d4c", page: 54, number: 16, subcategory: birds, text: "ما فائدة الكيس الجلدي في منقار طائر البجع؟", options: ["التقاط الأسماك من الماء", "تمزيق لحم الفريسة", "امتصاص رحيق الأزهار", "طعن الأسماك والبرمائيات الصغيرة"], answer: 0, explanation: "يستخدم البجع الكيس أسفل منقاره لالتقاط الأسماك من الماء ثم تصفية الماء." },
  { id: "6ad0103163cd9c24f9f40d4d", page: 54, number: 17, subcategory: birds, text: "ما الذي يساعد الطيور على جعل ريشها مقاومًا للماء؟", options: ["الغدة الزيتية عند قاعدة الذيل", "خفة العظام", "الأكياس الهوائية", "القصبة الهوائية"], answer: 0, explanation: "تفرز الغدة الزيتية عند قاعدة الذيل مادة تدهن الطيور بها ريشها، فتساعد على حمايته من البلل." },
  { id: "6ad0103163cd9c24f9f40d4e", page: 54, number: 18, subcategory: birds, text: "أي الحيوانات الآتية ثابت درجة الحرارة؟", options: ["ضفدع", "سلحفاة", "صقر", "ثعبان"], answer: 2, explanation: "الصقر طائر ثابت درجة الحرارة؛ يحافظ على حرارة جسمه ضمن نطاق مستقر." },
  { id: "6ad0103163cd9c24f9f40d4f", page: 54, number: 19, subcategory: birds, text: "ما شكل المنقار المناسب لطائر يتغذى على رحيق الأزهار؟", options: ["طويل ورفيع", "قصير وعريض", "طويل وعريض", "قصير ورفيع"], answer: 0, explanation: "يساعد المنقار الطويل الرفيع الطائر على الوصول إلى الرحيق داخل الأزهار." },
  { id: "6ad0103163cd9c24f9f40d50", page: 54, number: 20, subcategory: birds, text: "أي مجموعة تغيب المثانة البولية في معظم أنواعها؟", options: ["الطيور", "الثدييات", "البرمائيات", "الزواحف"], answer: 0, explanation: "تفتقر معظم الطيور إلى مثانة بولية، ما يساعد على تقليل الوزن؛ وتوجد استثناءات قليلة." },
  { id: "6ad0103163cd9c24f9f40d51", page: 54, number: 21, subcategory: birds, text: "كيف يستخدم طائر الطنان منقاره الطويل؟", options: ["لطعن الأسماك", "لامتصاص رحيق الأزهار", "لتمزيق لحم الفريسة", "لترشيح الغذاء"], answer: 1, explanation: "يستخدم طائر الطنان منقاره الطويل للوصول إلى رحيق الأزهار وامتصاصه." },
  { id: "6ad0103163cd9c24f9f40d52", page: 54, number: 22, subcategory: birds, text: "ما شكل المنقار المناسب لطائر يصطاد الأرانب والسحالي؟", options: ["عريض ومدبب", "طويل ورفيع", "حاد ومعقوف", "عريض كيسي"], answer: 2, explanation: "يساعد المنقار الحاد والمعقوف الطيور الجارحة على الإمساك بالفريسة وتمزيقها." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40d3b", page: 52, number: 17, note: "حُجب السؤال: الخيار المعتمد يعمم أن جميع عديمات الأطراف تبدأ حياتها في الماء ثم تنتقل إلى اليابسة، وهذا لا ينطبق على أنماط نمو المجموعة كلها؛ بقية الخيارات لا تحدد البرمائيات وحدها." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const reviewed = [...approvals, ...rejections];
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: reviewed.map((item) => item.id) }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceBlockIndex sourceBook topic difficulty status")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey || !["pending_review", "approved"].includes(draft.status)) failures.push(`q${item.number}: source/page/status mismatch`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.options.some((option) => !option.trim()) || item.answer < 0 || item.answer > 3) failures.push(`q${item.number}: invalid cleaned options/key`);
    const published = draft?.sourceKey ? await TahsiliQuestion.findOne({ sourceKey: draft.sourceKey }).select("text correctOptionIndex").lean() as any : null;
    if (draft?.status === "approved" && (!published || published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: approved draft does not match its published record`);
    if (published && (published.text !== item.text || published.correctOptionIndex !== item.answer)) failures.push(`q${item.number}: published record conflicts with this review`);
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
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: draft.sourceId, sourceKey: draft.sourceKey, sourceOrdinal: draft.sourceOrdinal,
      subject, subcategory: item.subcategory, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.subcategory, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject, subcategory: item.subcategory, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال وخياراته ومفتاحه مع المصدر والمعلومة العلمية، وتعديل الصياغة لتكون مستقلة عن الشكل عند الحاجة.", updatedAt: reviewedAt,
    } });
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "rejected"] } }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
