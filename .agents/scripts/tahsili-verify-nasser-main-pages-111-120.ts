import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6363cd9c24f9f40a3e", page: 111, number: 32, topic: "الآلات - الآلات البسيطة", text: "تسهل الآلة بذل الشغل بتغيير مقدار القوة المبذولة أو اتجاهها. ما الكمية التي يتغير مقدارها؟", options: ["السرعة", "الطاقة", "القوة", "الإزاحة"], answer: 2, explanation: "تغيّر الآلة مقدار القوة أو اتجاهها لتسهيل أداء الشغل، ولا تعني أنها تقلل الشغل الكلي المثالي." },
  { id: "6ad00e6363cd9c24f9f40a3f", page: 112, number: 1, topic: "حالات المادة - درجة الحرارة", text: "على ماذا تعتمد درجة حرارة الجسم؟", options: ["متوسط الطاقة الحركية للجسم كله", "عدد ذرات الجسم", "متوسط الطاقة الحركية لجزيئات الجسم", "عدد الجزيئات في الجسم"], answer: 2, explanation: "تعتمد درجة الحرارة على متوسط الطاقة الحركية لجزيئات المادة، لا على عدد الجزيئات وحده." },
  { id: "6ad00e6363cd9c24f9f40a40", page: 112, number: 3, topic: "حالات المادة - الاتزان الحراري", text: "ما الحالة التي يصبح عندها معدلا تدفق الطاقة الحرارية بين جسمين متساويين؟", options: ["الطاقة الحرارية", "الاتزان الحراري", "الانحدار الحراري", "درجة الحرارة"], answer: 1, explanation: "يكون الجسمان في اتزان حراري عندما تتساوى درجتا حرارتهما ويصبح صافي انتقال الطاقة الحرارية بينهما صفرًا." },
  { id: "6ad00e6363cd9c24f9f40a41", page: 112, number: 4, topic: "انتقال الحرارة - التوصيل", text: "التوصيل أحد طرق انتقال الحرارة، ويكون أسرع في:", options: ["السوائل", "الفراغ", "الغازات", "المعادن"], answer: 3, explanation: "تنتقل الطاقة بالتوصيل عبر تصادم الجسيمات، ويكون التوصيل الحراري عادة أسرع في المعادن بسبب جسيماتها وإلكتروناتها الحرة." },
  { id: "6ad00e6363cd9c24f9f40a42", page: 112, number: 5, topic: "انتقال الحرارة - الحمل", text: "ينتج انتقال الطاقة الحرارية بطريقة الحمل عن حركة:", options: ["المائع", "الموجات الكهرومغناطيسية", "الموجات الميكانيكية", "تساوي درجات الحرارة"], answer: 0, explanation: "الحمل الحراري ينقل الطاقة مع حركة المائع نفسه، سواء أكان سائلًا أم غازًا." },
  { id: "6ad00e6363cd9c24f9f40a43", page: 112, number: 6, topic: "انتقال الحرارة - الإشعاع", text: "ينتقل الإشعاع الحراري بواسطة موجات:", options: ["كهرومغناطيسية", "ميكانيكية", "طولية", "موقوفة"], answer: 0, explanation: "الإشعاع ينقل الطاقة الحرارية بموجات كهرومغناطيسية، ولا يحتاج إلى وسط مادي." },
  { id: "6ad00e6363cd9c24f9f40a44", page: 113, number: 8, topic: "الحرارة النوعية", text: "ما تعريف الحرارة النوعية؟", options: ["كمية الطاقة اللازمة لرفع درجة حرارة وحدة الكتلة من المادة درجة سيليزية واحدة", "درجة حرارة الجسم", "كمية الطاقة اللازمة لانصهار المادة", "كمية الطاقة اللازمة لتصعيد المادة"], answer: 0, explanation: "الحرارة النوعية هي الطاقة اللازمة لرفع درجة حرارة وحدة الكتلة من مادة ما درجة واحدة." },
  { id: "6ad00e6363cd9c24f9f40a45", page: 114, number: 16, topic: "الديناميكا الحرارية - المحرك الحراري", text: "محرك حراري يأخذ 2000 J من المستودع الساخن ويطرح 1500 J إلى المستودع البارد. ما كفاءته؟", options: ["3500", "500", "0.75", "0.25"], answer: 3, explanation: "الشغل الناتج=Q_h−Q_c=2000−1500=500 J. الكفاءة=الشغل/Q_h=500/2000=0.25، أي 25%." },
  { id: "6ad00e6363cd9c24f9f40a46", page: 114, number: 17, topic: "الديناميكا الحرارية - الإنتروبي", text: "اكتسبت كمية ماء حرارة مقدارها 600 J عند درجة حرارة 27°C. ما مقدار التغير في إنتروبيها؟", options: ["22.22 J/K", "2 J/K", "0.5 J/K", "20 J/K"], answer: 1, explanation: "نحوّل الحرارة إلى كلفن: T=27+273=300 K. إذن ΔS=Q/T=600/300=2 J/K." },
  { id: "6ad00e6363cd9c24f9f40a47", page: 114, number: 18, topic: "خواص الموائع", text: "الموائع هي:", options: ["الغازات فقط", "الغازات والسوائل", "السوائل فقط", "السوائل والمواد الصلبة"], answer: 1, explanation: "المائع مادة قابلة للجريان، ويشمل السوائل والغازات." },
  { id: "6ad00e6363cd9c24f9f40a48", page: 114, number: 20, topic: "الضغط", text: "إذا كان أقصى ضغط تتحمله أرضية غرفة 9.8×10³ Pa لكل مساحة 1 m²، فما أقصى وزن يمكن أن تتحمله هذه المساحة؟", options: ["9.8×10⁶ N", "9.8×10³ N", "10³ N", "9.8 N"], answer: 1, explanation: "الضغط=القوة/المساحة؛ لذلك القوة القصوى=9.8×10³×1=9.8×10³ N." },
  { id: "6ad00e6363cd9c24f9f40a49", page: 114, number: 21, topic: "الضغط - تطبيقاته", text: "حتى لا تغوص إطارات السيارة في الرمال، ينبغي:", options: ["زيادة كتلتها", "زيادة عرضها", "زيادة محيطها", "زيادة وزنها"], answer: 1, explanation: "زيادة عرض الإطار تزيد مساحة التلامس، فتقلل الضغط الواقع على الرمل عند ثبات الوزن." },
  { id: "6ad00e6363cd9c24f9f40a4a", page: 115, number: 23, topic: "حالات المادة - البلازما", text: "معظم مكونات النجوم تكون في حالة شبه غازية تسمى:", options: ["صلبة", "سائلة", "غازية", "بلازما"], answer: 3, explanation: "تتكون البلازما من جسيمات مشحونة، وهي الحالة الشائعة للمادة في النجوم." },
  { id: "6ad00e6363cd9c24f9f40a4b", page: 116, number: 31, topic: "الموائع - مبدأ أرخميدس", text: "الجسم المغمور في سائل يتأثر بقوة طفو إلى الأعلى تساوي:", options: ["وزن السائل المزاح", "حجم السائل المزاح", "كتلة السائل المزاح", "مساحة سطح الجسم"], answer: 0, explanation: "وفق مبدأ أرخميدس، قوة الطفو تساوي وزن المائع الذي أزاحه الجسم." },
  { id: "6ad00e6363cd9c24f9f40a4c", page: 116, number: 32, topic: "الموائع - قوة الطفو", text: "استطاع طالب تحريك صندوق مغمور في الماء بسهولة لأن الصندوق:", options: ["نقص وزنه ونقصت كتلته", "نقص وزنه ولم تتغير كتلته", "زاد وزنه ونقصت كتلته", "زاد وزنه ولم تتغير كتلته"], answer: 1, explanation: "قوة الطفو تقلل الوزن الظاهري للصندوق، لكن غمره لا يغيّر كتلته." },
  { id: "6ad00e6363cd9c24f9f40a4d", page: 116, number: 33, topic: "الموائع - قوة الطفو", text: "ما مقدار قوة الطفو المؤثرة في قالب حجمه 10⁻³ m³ مغمور في ماء كثافته 10³ kg/m³؟ (g=9.8 m/s²)", options: ["2.45 N", "4.9 N", "9.8 N", "19.6 N"], answer: 2, explanation: "قوة الطفو=ρVg=10³×10⁻³×9.8=9.8 N." },
  { id: "6ad00e6363cd9c24f9f40a4e", page: 116, number: 34, topic: "الموائع - اللزوجة", text: "ما مقياس مقاومة السائل للتدفق والانسياب؟", options: ["الميوعة", "اللزوجة", "التوتر السطحي", "التماسك والتلاصق"], answer: 1, explanation: "اللزوجة مقياس مقاومة المائع للتدفق والانسياب." },
  { id: "6ad00e6363cd9c24f9f40a4f", page: 116, number: 37, topic: "المواد الصلبة - المواد البلورية", text: "ما نمط المادة الصلبة الذي يتكون بنمط ثابت ومنتظم عندما تنخفض درجة الحرارة ويقل متوسط الطاقة الحركية لجزيئاتها؟", options: ["الشبكة البلورية", "الشبكة غير البلورية", "المواد الصلبة المرنة", "المواد الصلبة غير المنتظمة"], answer: 0, explanation: "في المادة البلورية تنتظم الجسيمات في نمط متكرر ثابت، ومن أمثلتها بلورات الثلج." },
  { id: "6ad00e6363cd9c24f9f40a50", page: 116, number: 38, topic: "التمدد الحراري", text: "تُترك مسافة بين قضبان السكك الحديدية المتجاورة للسماح لها بـ:", options: ["التقلص عند التسخين", "التبريد", "التمدد عند التسخين", "زيادة سمكها"], answer: 2, explanation: "تتمدد القضبان عند ارتفاع درجة حرارتها؛ وتسمح الفجوات بالتمدد دون انبعاج المسار." },
  { id: "6ad00e6363cd9c24f9f40a51", page: 117, number: 1, topic: "الموجات والصوت - قانون هوك", text: "استطال نابض 20 cm عندما عُلّق به جسم كتلته 20 kg. ما ثابت النابض؟ (g=9.8 m/s²)", options: ["9.8 N/m", "392 N/m", "400 N/m", "980 N/m"], answer: 3, explanation: "قوة الشد عند الاتزان mg=20×9.8=196 N، والاستطالة 0.20 m. إذن k=F/x=196/0.20=980 N/m." },
  { id: "6ad00e6363cd9c24f9f40a52", page: 118, number: 8, topic: "الموجات - خصائص الموجة", text: "ما أقصى إزاحة لدقائق الوسط عن موضع اتزانها في الموجة الميكانيكية؟", options: ["سعة الموجة", "طول الموجة", "تردد الموجة", "بطن الموجة"], answer: 0, explanation: "سعة الموجة هي أقصى إزاحة لجسيمات الوسط عن موضع الاتزان." },
  { id: "6ad00e6363cd9c24f9f40a54", page: 118, number: 10, topic: "الموجات - التردد", text: "عدد الاهتزازات الكاملة في الثانية الواحدة يمثل:", options: ["الزمن الدوري", "الطور", "الطول الموجي", "التردد"], answer: 3, explanation: "التردد هو عدد الاهتزازات الكاملة التي تحدث في الثانية، ويقاس بالهرتز." },
  { id: "6ad00e6363cd9c24f9f40a55", page: 118, number: 11, topic: "الموجات - التردد", text: "اهتز نابض 60 اهتزازة كاملة خلال 20 s. ما تردده؟", options: ["1/3 Hz", "1/6 Hz", "3 Hz", "12 Hz"], answer: 2, explanation: "التردد=عدد الاهتزازات/الزمن=60/20=3 Hz." },
  { id: "6ad00e6363cd9c24f9f40a56", page: 118, number: 12, topic: "الموجات - الزمن الدوري", text: "ما الزمن الدوري لموجة ترددها 10 Hz؟", options: ["100 s", "1 s", "0.1 s", "0.01 s"], answer: 2, explanation: "الزمن الدوري T=1/f=1/10=0.1 s." },
  { id: "6ad00e6363cd9c24f9f40a57", page: 118, number: 13, topic: "الموجات - سرعة الموجة", text: "إذا كانت سرعة موجة 6 m/s وطولها الموجي 0.5 m، فما ترددها؟", options: ["0.6 Hz", "3 Hz", "6 Hz", "12 Hz"], answer: 3, explanation: "من العلاقة v=fλ، يكون f=v/λ=6/0.5=12 Hz." },
  { id: "6ad00e6363cd9c24f9f40a59", page: 119, number: 17, topic: "الموجات الكهرومغناطيسية", text: "موجة كهرومغناطيسية طولها الموجي 2×10⁻⁸ m تنتشر في الهواء. ما ترددها إذا كانت سرعة الضوء 3×10⁸ m/s؟", options: ["6.7×10⁻¹⁷ Hz", "15×10⁻¹⁵ Hz", "15×10¹⁵ Hz", "6.7×10¹⁷ Hz"], answer: 2, explanation: "التردد f=c/λ=(3×10⁸)/(2×10⁻⁸)=1.5×10¹⁶ Hz، وهو يساوي 15×10¹⁵ Hz." },
  { id: "6ad00e6363cd9c24f9f40a5a", page: 120, number: 26, topic: "الصوت - مدى السمع", text: "يسمع معظم الأشخاص الأصوات التي ترددها يتراوح بين:", options: ["20–2,000,000 Hz", "20–20,000 Hz", "2–20,000 Hz", "2–200 Hz"], answer: 1, explanation: "يتراوح مدى السمع المعتاد للإنسان تقريبًا بين 20 Hz و20,000 Hz." },
  { id: "6ad00e6363cd9c24f9f40a5b", page: 120, number: 27, topic: "الصوت - مستوى الصوت", text: "ما وحدة قياس مستوى الصوت؟", options: ["الديسيبل", "الهرتز", "دبل", "الواط"], answer: 0, explanation: "يقاس مستوى الصوت بالديسيبل (dB)." },
  { id: "6ad00e6363cd9c24f9f40a5c", page: 120, number: 28, topic: "الصوت - تأثير دوبلر", text: "ماذا يسمى تغير تردد الصوت نتيجة حركة مصدره؟", options: ["تأثير كومبتون", "تأثير دوبلر", "حيود الصوت", "صدى الصوت"], answer: 1, explanation: "تغير التردد المرصود بسبب الحركة النسبية بين المصدر والمستمع يسمى تأثير دوبلر." },
  { id: "6ad00e6363cd9c24f9f40a5d", page: 120, number: 29, topic: "الصوت - تأثير دوبلر", text: "تتحرك سيارتان في الاتجاه نفسه وبالسرعة نفسها. إذا أطلقت السيارة الأولى صوتًا بتردد 450 Hz، فما التردد الذي يسمعه قائد السيارة الثانية؟ (سرعة الصوت 343 m/s)", options: ["343 Hz", "450 Hz", "107 Hz", "900 Hz"], answer: 1, explanation: "لا توجد سرعة نسبية بين السيارتين، لذلك لا يتغير التردد المسموع ويبقى 450 Hz." },
  { id: "6ad00e6363cd9c24f9f40a5e", page: 120, number: 30, topic: "الصوت - تطبيقات تأثير دوبلر", text: "يعتمد عمل الرادار على تطبيق:", options: ["مبدأ باسكال", "تأثير دوبلر", "مبدأ برنولي", "تأثير كومبتون"], answer: 1, explanation: "يستفيد رادار قياس السرعة من تغير تردد الموجة المنعكسة عن جسم متحرك، أي تأثير دوبلر." },
  { id: "6ad00e6363cd9c24f9f40a5f", page: 120, number: 32, topic: "الصوت - الأعمدة الهوائية", text: "ما تردد الرنين الثاني لعمود هوائي مغلق من طرف واحد طوله 15 cm؟ (سرعة الصوت 343 m/s)", options: ["2287 Hz", "1143 Hz", "1715 Hz", "572 Hz"], answer: 2, explanation: "في الأنبوب المغلق تظهر الرنينات عند التوافقيات الفردية؛ الرنين الثاني له n=3. إذن f=3v/(4L)=3×343/(4×0.15)=1715 Hz." },
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
  if (drafts.length !== ids.length) failures.push(`expected ${ids.length} source rows, found ${drafts.length}`);
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
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تم التحقق من نص السؤال وخياراته وحلّه يدويًا من صفحة المصدر.", updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
