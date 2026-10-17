import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6363cd9c24f9f40a20", page: 101, number: 29, topic: "قوانين نيوتن - القصور الذاتي", text: "ما الخاصية التي تمنع الجسم من تغيير حالته الحركية؟", options: ["رد الفعل", "قانون حفظ الزخم", "الاحتكاك الحركي", "القصور الذاتي"], answer: 3, explanation: "القصور الذاتي هو ممانعة الجسم لأي تغير في حالته من السكون أو الحركة المنتظمة، وهو ما يعبّر عنه قانون نيوتن الأول." },
  { id: "6ad00e6363cd9c24f9f40a21", page: 102, number: 37, topic: "قوانين نيوتن - القوة المحصلة", text: "حبل كتلته 0.5 kg تؤثر فيه قوتان متعاكستان: 20 N إلى اليمين وF إلى اليسار. إذا تحرك بتسارع 2 m/s² إلى اليمين، فما مقدار F؟", options: ["22 N", "19 N", "12 N", "10 N"], answer: 1, explanation: "القوة المحصلة إلى اليمين تساوي ma=0.5×2=1 N. إذن 20−F=1، ومنه F=19 N." },
  { id: "6ad00e6363cd9c24f9f40a22", page: 102, number: 38, topic: "المتجهات - الإزاحة", text: "سار محمد 8 m شمالًا، ثم 12 m شرقًا، ثم 8 m شمالًا مرة أخرى. ما مقدار إزاحته؟", options: ["10 m", "14 m", "20 m", "28 m"], answer: 2, explanation: "المحصلة 16 m شمالًا و12 m شرقًا. مقدار الإزاحة=√(16²+12²)=√400=20 m." },
  { id: "6ad00e6363cd9c24f9f40a23", page: 102, number: 39, topic: "الحركة - السرعة عند الارتفاع نفسه", text: "يمثل الشكل مقذوفًا يتحرك في مسار إلى أعلى ثم إلى أسفل. إذا كانت النقطتان a وc على الارتفاع نفسه، فأي العبارات صحيحة لمقداري السرعة؟", options: ["v_b=v_a", "v_b=v_c", "v_a=v_c", "v_a=v_b=v_c"], answer: 2, explanation: "بإهمال مقاومة الهواء، عند الارتفاع نفسه تكون طاقة الحركة ومقدار السرعة متساويين؛ لذلك v_a=v_c." },
  { id: "6ad00e6363cd9c24f9f40a24", page: 102, number: 41, topic: "الحركة الدائرية - التسارع المركزي", text: "تقف نحلة على حافة عجلة دوارة على بعد 2 m من المركز. إذا كان مقدار سرعتها المماسية 3 m/s، فما مقدار تسارعها المركزي؟", options: ["18 m/s²", "6 m/s²", "4.5 m/s²", "1.5 m/s²"], answer: 2, explanation: "التسارع المركزي a_c=v²/r=3²/2=4.5 m/s²." },
  { id: "6ad00e6363cd9c24f9f40a25", page: 103, number: 44, topic: "القوى - القوة العمودية", text: "جسم وزنه W ينزلق على سطح مائل دون احتكاك. أي سهم في الشكل يمثل القوة العمودية F_N؟", options: ["السهم 1", "السهم 2", "السهم 3", "السهم 4"], answer: 1, explanation: "القوة العمودية تكون متعامدة مع السطح المائل ومتجهة بعيدًا عنه؛ في الشكل يمثّلها السهم 2." },
  { id: "6ad00e6363cd9c24f9f40a26", page: 104, number: 51, topic: "الجاذبية - تسارع الجاذبية", text: "إذا تضاعفت كتلة الأرض مع ثبات نصف قطرها، فكيف يتغير تسارع الجاذبية عند سطحها؟", options: ["ينقص إلى النصف", "ينقص إلى الربع", "يتضاعف", "لا يتغير"], answer: 2, explanation: "g=GM/R²؛ مع ثبات R يتناسب g طرديًا مع كتلة الأرض M، لذا يتضاعف g عند مضاعفة M." },
  { id: "6ad00e6363cd9c24f9f40a27", page: 104, number: 52, topic: "الجاذبية - تسارع الجاذبية", text: "ما تسارع الجاذبية على بعد 9.6×10⁶ m من مركز الأرض، إذا كان نصف قطر الأرض 6.4×10⁶ m؟", options: ["(2/3)g", "(4/9)g", "(3/2)g", "(9/4)g"], answer: 1, explanation: "تسارع الجاذبية على بعد r من المركز يساوي g(R/r)². النسبة R/r=6.4/9.6=2/3؛ لذا التسارع=(4/9)g." },
  { id: "6ad00e6363cd9c24f9f40a28", page: 104, number: 55, topic: "الحركة الدورانية - الإزاحة الزاوية", text: "ماذا يسمى التغير في الزاوية أثناء دوران الجسم؟", options: ["التردد الزاوي", "التسارع الزاوي", "الإزاحة الزاوية", "السرعة الزاوية"], answer: 2, explanation: "التغير في الموضع الزاوي للجسم أثناء الدوران يسمى الإزاحة الزاوية." },
  { id: "6ad00e6363cd9c24f9f40a29", page: 104, number: 56, topic: "الحركة الدورانية - الإزاحة الزاوية", text: "عندما يتم الجسم دورة كاملة، فما إزاحته الزاوية بوحدة الراديان؟", options: ["π/2", "π", "2π", "2π/2"], answer: 2, explanation: "الدورة الكاملة تساوي 360°، أي 2π راديان." },
  { id: "6ad00e6363cd9c24f9f40a2a", page: 104, number: 58, topic: "الحركة الدورانية - الإزاحة الزاوية", text: "تحرك عقرب الثواني خمس دقائق؛ فما مقدار إزاحته الزاوية؟", options: ["5π rad", "10π rad", "2.5π rad", "25π rad"], answer: 1, explanation: "عقرب الثواني يكمل دورة كل دقيقة؛ في خمس دقائق يكمل 5 دورات، وإزاحته الزاوية مقدارًا 5×2π=10π rad." },
  { id: "6ad00e6363cd9c24f9f40a2b", page: 105, number: 60, topic: "الحركة الدورانية - السرعة الزاوية", text: "إطار سيارة نصف قطره 0.4 m وسرعته الخطية 40 m/s. ما سرعته الزاوية؟", options: ["1 rad/s", "10 rad/s", "100 rad/s", "1600 rad/s"], answer: 2, explanation: "السرعة الزاوية ω=v/r=40/0.4=100 rad/s." },
  { id: "6ad00e6363cd9c24f9f40a2c", page: 106, number: 67, topic: "الاتزان - العزم", text: "في أي موضع من الشكل تكون أقل قوة لازمة لإمالة البرميل؟", options: ["الموضع A", "الموضع B", "الموضع C", "الموضع D"], answer: 2, explanation: "العزم يساوي القوة مضروبة في ذراعها. أكبر ذراع دوران يكون عند تطبيق القوة في أعلى موضع (C)، لذا تكفي أقل قوة لإحداث العزم نفسه." },
  { id: "6ad00e6363cd9c24f9f40a2d", page: 106, number: 68, topic: "الاتزان - العزوم", text: "إذا اتزن الكتلتان A وB على الرافعة في الشكل، وكانت A أقرب إلى نقطة الارتكاز، فما العبارة الصحيحة؟", options: ["كتلة A أكبر من كتلة B", "كتلة A تساوي كتلة B", "كتلة A أصغر من كتلة B", "وزن A يساوي وزن B"], answer: 0, explanation: "عند الاتزان تتساوى العزوم: وزن A×ذراع A=وزن B×ذراع B. ولأن ذراع A أقصر، يجب أن يكون وزن وكتلة A أكبر." },
  { id: "6ad00e6363cd9c24f9f40a2e", page: 106, number: 69, topic: "الاتزان - شروط الاتزان الميكانيكي", text: "يتزن جسم واقع تحت تأثير قوتين أو أكثر عندما تكون محصلة القوى ومحصلة العزوم:", options: ["القوى لا تساوي صفرًا، والعزوم تساوي صفرًا", "القوى لا تساوي صفرًا، والعزوم لا تساوي صفرًا", "القوى تساوي صفرًا، والعزوم لا تساوي صفرًا", "القوى تساوي صفرًا، والعزوم تساوي صفرًا"], answer: 3, explanation: "شرطا الاتزان الميكانيكي هما انعدام محصلة القوى وانعدام محصلة العزوم." },
  { id: "6ad00e6363cd9c24f9f40a2f", page: 106, number: 70, topic: "الاتزان - الاتزان الانتقالي والدوراني", text: "إذا كانت محصلة القوى المؤثرة في جسم ومحصلة العزوم المؤثرة فيه تساويان صفرًا، فهذا يعني أن الجسم:", options: ["في اتزان انتقالي وليس دورانيًا", "ليس في اتزان انتقالي وهو في اتزان دوراني", "في اتزان انتقالي ودوراني", "ليس في اتزان انتقالي ولا دوراني"], answer: 2, explanation: "انعدام محصلة القوى يحقق الاتزان الانتقالي، وانعدام محصلة العزوم يحقق الاتزان الدوراني؛ لذا الجسم في كليهما." },
  { id: "6ad00e6363cd9c24f9f40a31", page: 107, number: 1, topic: "الأنظمة والتصادمات - الأنظمة", text: "النظام الذي لا يكتسب كتلة ولا يفقدها يسمى نظامًا:", options: ["مفتوحًا", "مغلقًا", "مرنًا", "غير مرن"], answer: 1, explanation: "النظام المغلق لا يكتسب كتلة من محيطه ولا يفقدها إليه." },
  { id: "6ad00e6363cd9c24f9f40a32", page: 108, number: 9, topic: "الشغل والطاقة - شغل الاحتكاك", text: "يدفع شخص صندوقًا كتلته 40 kg مسافة 10 m بسرعة ثابتة على سطح أفقي، ومعامل الاحتكاك الحركي μ=0.1. ما شغل مقاومة الاحتكاك؟ (g=10 m/s²)", options: ["−4 J", "−40 J", "−400 J", "−4000 J"], answer: 2, explanation: "قوة الاحتكاك μmg=0.1×40×10=40 N. واتجاهها عكس الحركة، لذا شغلها −Fd=−40×10=−400 J." },
  { id: "6ad00e6363cd9c24f9f40a33", page: 108, number: 10, topic: "الشغل والطاقة - الطاقة الحركية", text: "تتناسب الطاقة الحركية لجسم مع أي كمية؟", options: ["عكسيًا مع مربع سرعته", "طرديًا مع مربع سرعته", "عكسيًا مع كتلته", "طرديًا مع مربع كتلته"], answer: 1, explanation: "الطاقة الحركية KE=½mv²؛ لذا عند ثبات الكتلة تتناسب طرديًا مع مربع السرعة." },
  { id: "6ad00e6363cd9c24f9f40a34", page: 108, number: 11, topic: "الشغل والطاقة - الطاقة الحركية", text: "جسم كتلته 2 kg وسرعته 1 m/s؛ ما مقدار طاقته الحركية؟", options: ["0.25 J", "0.5 J", "0.75 J", "1 J"], answer: 3, explanation: "KE=½mv²=½×2×1²=1 J." },
  { id: "6ad00e6363cd9c24f9f40a35", page: 108, number: 13, topic: "الشغل والطاقة - حفظ الطاقة", text: "عند أقصى إزاحة لبندول عن وضع الاتزان تكون طاقة وضعه 10 J. إذا كانت كتلة كرته 5 kg، فما أقصى سرعة لها أثناء التأرجح؟", options: ["0 m/s", "2 m/s", "4 m/s", "10 m/s"], answer: 1, explanation: "تتحول طاقة الوضع إلى طاقة حركة عند أسفل المسار: 10=½(5)v²؛ إذن v²=4 وأقصى سرعة 2 m/s." },
  { id: "6ad00e6363cd9c24f9f40a36", page: 108, number: 16, topic: "الشغل والطاقة - مبرهنة الشغل والطاقة", text: "تحرك جسم من السكون على سطح خشن. إذا أنجزت قوة شغلًا مقداره 50 J وكان شغل الاحتكاك المقاوم 20 J، فما مقدار التغير في الطاقة الحركية؟", options: ["120 J", "90 J", "80 J", "30 J"], answer: 3, explanation: "بحسب مبرهنة الشغل والطاقة، ΔKE يساوي الشغل الكلي. شغل القوة 50 J وشغل الاحتكاك −20 J، لذا ΔKE=50−20=30 J." },
  { id: "6ad00e6363cd9c24f9f40a37", page: 109, number: 17, topic: "الطاقة المختزنة - طاقة الوضع", text: "ماذا تسمى الطاقة التي يحتفظ بها الجسم؟", options: ["طاقة الوضع", "الطاقة الحركية", "الطاقة الضوئية", "الطاقة الكهربائية"], answer: 0, explanation: "الطاقة المختزنة في الجسم أو النظام بسبب موضعه أو ترتيبه تسمى طاقة وضع." },
  { id: "6ad00e6363cd9c24f9f40a38", page: 110, number: 25, topic: "القدرة - تعريف القدرة", text: "الشغل المبذول مقسومًا على الزمن اللازم لإنجازه يساوي:", options: ["الزخم", "الطاقة", "الدفع", "القدرة"], answer: 3, explanation: "تعرف القدرة بأنها معدل إنجاز الشغل: P=W/t." },
  { id: "6ad00e6363cd9c24f9f40a39", page: 110, number: 26, topic: "القدرة - وحدات القياس", text: "ما وحدة قياس القدرة؟", options: ["الواط", "الفولت", "الأمبير", "الجول"], answer: 0, explanation: "وحدة القدرة في النظام الدولي هي الواط (W)، ويساوي جولًا لكل ثانية." },
  { id: "6ad00e6363cd9c24f9f40a3a", page: 110, number: 27, topic: "القدرة - وحدات القياس", text: "ما الوحدة المكافئة للواط بوحدات النظام الدولي الأساسية؟", options: ["kg·m/s²", "kg·m²/s²", "kg·m²/s³", "kg·m³/s³"], answer: 2, explanation: "W=J/s، والجول=kg·m²/s²؛ لذلك الواط=kg·m²/s³." },
  { id: "6ad00e6363cd9c24f9f40a3b", page: 110, number: 28, topic: "القدرة - مسائل تطبيقية", text: "رفعت حاوية وزنها 3×10³ N رأسيًا مسافة 9 m خلال 10 s. ما قدرة المحرك بالواط؟", options: ["27 W", "7×10³ W", "27×10² W", "27×10⁴ W"], answer: 2, explanation: "الشغل=F d=3000×9=27000 J. القدرة=الشغل/الزمن=27000/10=2700 W=27×10² W." },
  { id: "6ad00e6363cd9c24f9f40a3c", page: 110, number: 29, topic: "القدرة - مسائل تطبيقية", text: "يرفع محرك كهربائي مصعدًا مسافة 5 m خلال 10 s بقوة رأسية مقدارها 20000 N. ما القدرة بوحدة kW؟", options: ["200 kW", "100 kW", "20 kW", "10 kW"], answer: 3, explanation: "P=Fd/t=20000×5/10=10000 W=10 kW." },
] as const;
const rejected = [
  { id: "6ad00e6363cd9c24f9f40a30", page: 106, note: "رُفض من النشر: لا يمكن استنتاج نوع حركة الجسم أو تسارعه من كون محصلة القوى غير صفرية وحدها؛ الخيارات لا تتضمن وصفًا لازمًا وصحيحًا." },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  if (!await connectToMongoDB()) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") throw new Error("Refusing any database except Replit preview database test.");
  const ids = [...approved, ...rejected].map((item) => item.id);
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
  for (const item of rejected) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || draft.sourceId !== SOURCE_ID || draft.status !== "pending_review") failures.push(`rejection p${item.page}: source/page/status mismatch`);
  }
  if (failures.length) throw new Error(JSON.stringify({ mode: apply ? "apply" : "dry-run", failures }));
  const summary = { mode: apply ? "apply" : "dry-run", database: TahsiliQuestionDraft.db.name, sourceId: SOURCE_ID, reviewed: drafts.length, approved: approved.length, rejected: rejected.length, changed: false };
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
  for (const item of rejected) {
    await TahsiliQuestionDraft.updateOne({ _id: item.id, sourceId: SOURCE_ID, status: "pending_review" }, { $set: {
      status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
