import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6363cd9c24f9f40aa1", page: 141, number: 1, topic: "الفيزياء الحديثة - تكميم الطاقة", text: "إذا كانت طاقة اهتزاز الذرات مكممة، فأي القيم التالية غير ممكنة وفق النموذج المعروض؟", options: ["hf", "0.5hf", "2hf", "3hf"], answer: 1, explanation: "في النموذج المعروض تكون طاقة الاهتزاز مضاعفًا صحيحًا لـhf؛ لذلك 0.5hf ليست قيمة مسموحة." },
  { id: "6ad00e6363cd9c24f9f40aa2", page: 142, number: 8, topic: "الفيزياء الحديثة - التأثير الكهروضوئي", text: "إذا كان تردد العتبة لفلز 4.4×10¹⁴ Hz، فما مقدار الطاقة اللازمة لتحرير إلكترون من سطح الفلز؟", options: ["h+4.4×10¹⁴", "h−4.4×10¹⁴", "4.4×10¹⁴h", "4.4×10¹⁴/h"], answer: 2, explanation: "دالة الشغل تساوي حاصل ضرب ثابت بلانك في تردد العتبة: W=h f₀=4.4×10¹⁴h." },
  { id: "6ad00e6363cd9c24f9f40aa3", page: 142, number: 10, topic: "الفيزياء الحديثة - التأثير الكهروضوئي", text: "افترض أينشتاين أن الضوء موجود على شكل حزم منفصلة من الطاقة تسمى:", options: ["إلكترونات", "بروتونات", "نيوترونات", "فوتونات"], answer: 3, explanation: "فسر أينشتاين التأثير الكهروضوئي بافتراض أن الضوء يتكون من حزم طاقة منفصلة تسمى الفوتونات." },
  { id: "6ad00e6363cd9c24f9f40aa4", page: 142, number: 13, topic: "الفيزياء الحديثة - طاقة الفوتون", text: "تتناسب طاقة الفوتون:", options: ["طرديًا مع طوله الموجي", "عكسيًا مع طوله الموجي", "طرديًا مع كتلته", "عكسيًا مع كتلته"], answer: 1, explanation: "من E=hf=hc/λ، تتناسب طاقة الفوتون عكسيًا مع طوله الموجي." },
  { id: "6ad00e6363cd9c24f9f40aa5", page: 142, number: 14, topic: "الفيزياء الحديثة - طاقة الفوتون", text: "ما طاقة فوتون تردده 1×10¹⁵ Hz إذا كان ثابت بلانك 6.62×10⁻³⁴ J/Hz؟", options: ["1.5×10⁴⁹ J", "6.62×10¹⁹ J", "6.62×10⁻¹⁹ J", "1.5×10⁻⁴⁹ J"], answer: 2, explanation: "E=hf=6.62×10⁻³⁴×1×10¹⁵=6.62×10⁻¹⁹ J." },
  { id: "6ad00e6363cd9c24f9f40aa6", page: 144, number: 23, topic: "الفيزياء الحديثة - مبدأ عدم اليقين", text: "لا يمكن معرفة سرعة الإلكترون ومكانه في الوقت نفسه على نحو دقيق. ما المبدأ الذي يصف ذلك؟", options: ["مبدأ هايزنبرج للشك", "مبدأ باولي للاستبعاد", "مبدأ بور", "قاعدة هوند"], answer: 0, explanation: "ينص مبدأ هايزنبرج لعدم اليقين على استحالة تحديد موضع الجسيم وكمية حركته بدقة تامة في الوقت نفسه." },
  { id: "6ad00e6363cd9c24f9f40aa7", page: 144, number: 24, topic: "الفيزياء الحديثة - موجة دي برولي", text: "ما اسم طول الموجة المرتبط بالجسم المتحرك؟", options: ["طول موجة الإشعاع", "طول الموجة الموقوفة", "طول الموجة المستقرة", "طول موجة دي برولي"], answer: 3, explanation: "يرتبط بالجسم المتحرك طول موجي يسمى طول موجة دي برولي، ويعطى بالعلاقة λ=h/(mv)." },
  { id: "6ad00e6363cd9c24f9f40aa8", page: 144, number: 25, topic: "الفيزياء الحديثة - موجة دي برولي", text: "في معادلة دي برولي λ=h/(mv)، إلى ماذا يرمز λ؟", options: ["طول الموجة", "تردد الموجة", "سعة الموجة", "طاقة الموجة"], answer: 0, explanation: "يرمز λ إلى طول موجة دي برولي المصاحبة للجسيم." },
  { id: "6ad00e6363cd9c24f9f40aa9", page: 144, number: 26, topic: "الفيزياء الحديثة - النموذج النووي", text: "من مكتشف نواة الذرة؟", options: ["بور", "رذرفورد", "طومسون", "رونتجن"], answer: 1, explanation: "قاد تفسير رذرفورد لتشتت جسيمات ألفا إلى استنتاج وجود نواة صغيرة موجبة في مركز الذرة." },
  { id: "6ad00e6463cd9c24f9f40aaa", page: 144, number: 29, topic: "الفيزياء الحديثة - نموذج بور", text: "أي نظرية تفترض أن قوانين الكهرومغناطيسية لا تنطبق على الإلكترونات داخل الذرة؟", options: ["نظرية طومسون", "نظرية رذرفورد", "نظرية جابر", "نظرية بور"], answer: 3, explanation: "افترض نموذج بور أن الإلكترون في مدارات مسموحة داخل الذرة لا يشع طاقة كما تتنبأ به قوانين الكهرومغناطيسية الكلاسيكية." },
  { id: "6ad00e6463cd9c24f9f40aab", page: 145, number: 31, topic: "الفيزياء الحديثة - مستويات ذرة الهيدروجين", text: "ما طاقة المستوى الثاني لذرة الهيدروجين؟", options: ["54.4 eV", "−54.4 eV", "3.4 eV", "−3.4 eV"], answer: 3, explanation: "طاقة مستوى الهيدروجين Eₙ=−13.6/n² eV؛ عند n=2 تكون E₂=−13.6/4=−3.4 eV." },
  { id: "6ad00e6463cd9c24f9f40aac", page: 146, number: 39, topic: "الفيزياء الحديثة - التحليل الطيفي", text: "ما الأداة المتوافرة الوحيدة لدراسة مكونات النجوم البعيدة؟", options: ["المركبات الفضائية", "التحليل الطيفي", "التلسكوبات الراديوية", "قذائف البروتونات"], answer: 1, explanation: "يحلل العلماء الضوء القادم من النجوم باستخدام التحليل الطيفي لمعرفة العناصر الموجودة فيها." },
  { id: "6ad00e6463cd9c24f9f40aad", page: 146, number: 42, topic: "الفيزياء الحديثة - أطياف الهيدروجين", text: "انتقال إلكترون ذرة الهيدروجين من المستوى الرابع إلى المستوى الثاني ينتج سلسلة:", options: ["باشن", "ليمان", "بالمر", "امتصاص"], answer: 2, explanation: "الانتقالات التي تنتهي عند المستوى الثاني تكوّن سلسلة بالمر، ومنها الانتقال من n=4 إلى n=2." },
  { id: "6ad00e6463cd9c24f9f40aae", page: 146, number: 43, topic: "الفيزياء الحديثة - أطياف الهيدروجين", text: "عندما ينتقل إلكترون الهيدروجين من المستوى الرابع إلى المستوى الثالث، تنتج أشعة:", options: ["تحت حمراء", "ضوئية", "فوق بنفسجية", "راديوية"], answer: 0, explanation: "الانتقالات التي تنتهي عند المستوى الثالث تنتمي إلى سلسلة باشن، وتقع إشعاعاتها في نطاق الأشعة تحت الحمراء." },
  { id: "6ad00e6463cd9c24f9f40aaf", page: 147, number: 46, topic: "الفيزياء الحديثة - الليزر", text: "ما الذي يضخم الضوء بالانبعاث المحرض للإشعاع؟", options: ["الأشعة السينية", "الليزر", "تحليل الضوء", "تجميع الضوء"], answer: 1, explanation: "كلمة ليزر تصف تضخيم الضوء بواسطة الانبعاث المحرض للإشعاع." },
  { id: "6ad00e6463cd9c24f9f40ab0", page: 148, number: 53, topic: "الفيزياء الحديثة - أشباه الموصلات", text: "ما ناقلات الشحنة الأغلبية في شبه الموصل من النوع p؟", options: ["الإلكترونات", "الأيونات السالبة", "الأيونات الموجبة", "الفجوات"], answer: 3, explanation: "تكون الفجوات هي ناقلات الشحنة الأغلبية في شبه الموصل من النوع p، بينما تكون الإلكترونات الأقلية." },
  { id: "6ad00e6463cd9c24f9f40ab1", page: 148, number: 54, topic: "الفيزياء الحديثة - أشباه الموصلات", text: "ما الجهاز المتكون من قطعة شبه موصلة من النوع p موصولة بقطعة من النوع n؟", options: ["مكثف", "ترانزستور", "دايود", "رقائق ميكروية"], answer: 2, explanation: "يتكون الدايود من وصلة p-n بين شبه موصل من النوع p وآخر من النوع n." },
  { id: "6ad00e6463cd9c24f9f40ab2", page: 148, number: 55, topic: "الفيزياء الحديثة - الدايود", text: "في الدايود المنحاز أماميًا كما في الشكل، إلى أي اتجاه يتحرك كل من الإلكترون a في منطقة n والفجوة b في منطقة p؟", options: ["a إلى اليمين وb إلى اليسار", "a إلى اليسار وb إلى اليمين", "يتجه a وb إلى اليمين", "يتجه a وb إلى اليسار"], answer: 1, explanation: "في الانحياز الأمامي تتحرك الإلكترونات من منطقة n نحو الوصلة، أي إلى اليسار في الشكل، وتتحرك الفجوات من منطقة p نحو الوصلة، أي إلى اليمين." },
  { id: "6ad00e6463cd9c24f9f40ab3", page: 149, number: 1, topic: "الفيزياء النووية - تركيب النواة", text: "العدد الذري للذرة يساوي:", options: ["عدد النيوترونات", "عدد البروتونات والإلكترونات", "عدد البروتونات", "العدد الذري وعدد النيوترونات"], answer: 2, explanation: "العدد الذري Z يساوي عدد البروتونات في نواة الذرة؛ ويساوي عدد الإلكترونات فقط في الذرة المتعادلة." },
  { id: "6ad00e6463cd9c24f9f40ab4", page: 150, number: 10, topic: "الفيزياء النووية - النظائر", text: "أي نظائر الكربون التالية كتلته أكبر؟", options: ["¹¹₆C", "¹²₆C", "¹³₆C", "¹⁴₆C"], answer: 3, explanation: "للنظائر عدد البروتونات نفسه، وتختلف في عدد النيوترونات؛ والنظير ذو العدد الكتلي 14 هو الأكبر كتلة." },
  { id: "6ad00e6463cd9c24f9f40ab5", page: 150, number: 11, topic: "الفيزياء النووية - استقرار النواة", text: "ما النسبة الرئيسة المستخدمة في تقدير استقرار النواة؟", options: ["عدد النيوترونات إلى عدد البروتونات", "عدد النيوترونات إلى عدد الإلكترونات", "عدد البروتونات إلى عدد الإلكترونات", "عدد الإلكترونات إلى عدد النيوترونات"], answer: 0, explanation: "يرتبط استقرار النواة بنسبة عدد النيوترونات إلى عدد البروتونات؛ وتختلف النسبة المستقرة باختلاف العدد الذري." },
  { id: "6ad00e6463cd9c24f9f40ab6", page: 150, number: 12, topic: "الفيزياء النووية - طاقة الربط", text: "تحسب طاقة الربط النووي من العلاقة:", options: ["E=mc", "E=m/c", "E=mc²", "E=m/c²"], answer: 2, explanation: "تعادل طاقة الربط النقص في الكتلة مضروبًا في مربع سرعة الضوء: E=Δmc²." },
  { id: "6ad00e6463cd9c24f9f40ab7", page: 150, number: 14, topic: "الفيزياء النووية - شحنة النواة", text: "ما شحنة نواة الهيليوم؟", options: ["1.6×10⁻¹⁹ C", "3.2×10⁻¹⁹ C", "4.8×10⁻¹⁹ C", "6.4×10⁻¹⁹ C"], answer: 1, explanation: "تحتوي نواة الهيليوم على بروتونين، وشحنتها +2e=2×1.6×10⁻¹⁹=3.2×10⁻¹⁹ C." },
  { id: "6ad00e6463cd9c24f9f40ab8", page: 150, number: 15, topic: "الفيزياء النووية - إشعاع ألفا", text: "أشعة ألفا عبارة عن نوى:", options: ["⁴₂He", "³₂He", "²₂He", "¹₂He"], answer: 0, explanation: "جسيم ألفا نواة هيليوم تحتوي على بروتونين ونيوترونين، ويرمز لها ⁴₂He." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = approved.map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({ _id: { $in: ids }, sourceId: SOURCE_ID })
    .select("_id questionId sourceKey sourceId sourceOrdinal sourcePage sourceQuestionNumber sourceBlockIndex sourceBook difficulty status subject sourceImageObjectKey")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== ids.length || ids.length !== new Set(ids).size) failures.push(`expected ${ids.length} unique source rows, found ${drafts.length}`);
  for (const item of approved) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || draft.sourceId !== SOURCE_ID || draft.status !== "pending_review" || !draft.sourceKey?.startsWith(`${SOURCE_ID}:`)) failures.push(`q${item.number} p${item.page}: source/page/status mismatch`);
    if (draft?.sourceOrdinal && draft.sourceOrdinal !== SOURCE_ORDINAL) failures.push(`q${item.number} p${item.page}: unexpected source ordinal`);
    if (item.options.length !== 4 || new Set(item.options).size !== 4 || item.answer < 0 || item.answer > 3) failures.push(`q${item.number} p${item.page}: invalid cleaned options/key`);
    if (draft?.sourceKey && await TahsiliQuestion.exists({ sourceKey: draft.sourceKey })) failures.push(`q${item.number} p${item.page}: published record already exists`);
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    if (await TahsiliQuestion.exists({ subject: "فيزياء", sourcePage: item.page, sourceQuestionNumber, sourceKey: { $ne: draft?.sourceKey } })) failures.push(`q${item.number} p${item.page}: source question-number collision`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approved.length, rejected: 0, changed: false };
  if (!apply) { console.log(JSON.stringify(summary, null, 2)); return; }
  const reviewedAt = new Date();
  for (const item of approved) {
    const draft = byId.get(item.id)!;
    const sourceQuestionNumber = SOURCE_ORDINAL * 100_000 + item.page * 100 + item.number;
    await TahsiliQuestion.findOneAndUpdate({ sourceKey: draft.sourceKey }, { $set: {
      questionId: draft.questionId, sourceId: SOURCE_ID, sourceKey: draft.sourceKey, sourceOrdinal: SOURCE_ORDINAL,
      subject: "فيزياء", subcategory: item.topic, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.topic, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number,
      ...(draft.sourceBlockIndex != null ? { sourceBlockIndex: draft.sourceBlockIndex } : {}),
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: SOURCE_BOOK, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: "pending_review" }, { $set: {
      sourceOrdinal: SOURCE_ORDINAL, status: "approved", subject: "فيزياء", subcategory: item.topic,
      text: item.text, options: [...item.options], explanation: item.explanation, sourceQuestionNumber,
      printedQuestionNumber: item.number, sourceBook: SOURCE_BOOK,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تم التحقق يدويًا من صفحة المصدر؛ أعيدت صياغة المسودة المشوشة دون تغيير مضمون السؤال أو مفتاحه.", updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
