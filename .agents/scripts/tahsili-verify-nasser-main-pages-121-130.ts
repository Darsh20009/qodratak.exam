import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6363cd9c24f9f40a60", page: 121, number: 1, topic: "الضوء - البصريات الهندسية", text: "ما العلم الذي يدرس الضوء باعتباره أشعة، بغض النظر عن طبيعته الموجية أو الجسيمية؟", options: ["ميكانيكا الكم", "البصريات", "الفيزياء النسبية", "فيزياء الليزر"], answer: 1, explanation: "تدرس البصريات الهندسية انتشار الضوء على هيئة أشعة، ولا تتناول طبيعته الموجية أو الجسيمية." },
  { id: "6ad00e6363cd9c24f9f40a61", page: 122, number: 9, topic: "الضوء - الانعكاس", text: "يسقط شعاع ضوئي على مرآة مستوية كما في الشكل. أي العبارات صحيحة؟", options: ["θ₁=θ₂", "θ₁=θ₃", "θ₁=θ₄", "θ₂=θ₄"], answer: 0, explanation: "وفق قانون الانعكاس، زاوية السقوط تساوي زاوية الانعكاس، وتقاسان من العمود المقام على السطح؛ لذلك θ₁=θ₂." },
  { id: "6ad00e6363cd9c24f9f40a63", page: 122, number: 11, topic: "الضوء - الانعكاس", text: "في الشكل، سقط الشعاع 1 عموديًا على سطح عاكس. ما الشعاع المنعكس؟", options: ["الشعاع 2", "الشعاع 3", "الشعاع 4", "الشعاع 5"], answer: 0, explanation: "عند السقوط العمودي تكون زاوية السقوط صفرًا، فينعكس الشعاع على مساره نفسه إلى أعلى؛ وهو الشعاع 2 في الشكل." },
  { id: "6ad00e6363cd9c24f9f40a64", page: 122, number: 12, topic: "الضوء - المرايا المستوية", text: "مرآة صورتها وهمية ومعكوسة جانبيًا، وحجم الصورة يساوي حجم الجسم. ما نوعها؟", options: ["مقعرة", "محدبة", "مستوية", "محدبة ومقعرة"], answer: 2, explanation: "المرآة المستوية تكوّن صورة وهمية معتدلة ومعكوسة جانبيًا، مساوية للجسم في الحجم." },
  { id: "6ad00e6363cd9c24f9f40a65", page: 122, number: 13, topic: "الضوء - المرايا الكروية", text: "ما نوع المرايا التي تستخدم في جوانب السيارات؟", options: ["مقعرة", "مستوية", "محدبة", "مستوية ومقعرة"], answer: 2, explanation: "تستخدم المرآة المحدبة لتوفير مجال رؤية أوسع، مع إظهار صورة معتدلة مصغرة." },
  { id: "6ad00e6363cd9c24f9f40a66", page: 122, number: 14, topic: "الضوء - المرايا الكروية", text: "ما النقطة التي تتجمع فيها الأشعة الساقطة موازية للمحور الرئيس بعد انعكاسها عن المرآة المقعرة؟", options: ["البؤرة", "مركز التكور", "قطب المرآة", "منتصف المرآة"], answer: 0, explanation: "الأشعة الموازية للمحور الرئيس في المرآة المقعرة تنعكس مارّة بالبؤرة." },
  { id: "6ad00e6363cd9c24f9f40a67", page: 122, number: 15, topic: "الضوء - المرايا الكروية", text: "كل شعاع موازٍ للمحور الرئيس لمرآة مقعرة ينعكس مارًا بـ:", options: ["مركز التكور", "بين مركز التكور والبؤرة", "بين قطب المرآة والبؤرة", "البؤرة"], answer: 3, explanation: "الشعاع الموازي للمحور الرئيس ينعكس مارًا ببؤرة المرآة المقعرة." },
  { id: "6ad00e6363cd9c24f9f40a68", page: 123, number: 17, topic: "الضوء - الصور في المرايا الكروية", text: "وُضع جسم على بعد 15 cm أمام مرآة مقعرة بعدها البؤري 30 cm. ما صفة الصورة المتكونة؟", options: ["حقيقية ومصغرة", "وهمية ومصغرة", "حقيقية ومكبرة", "وهمية ومكبرة"], answer: 3, explanation: "الجسم داخل البعد البؤري للمرآة المقعرة. من معادلة المرآة تكون الصورة وهمية ومعتدلة ومكبرة." },
  { id: "6ad00e6363cd9c24f9f40a69", page: 124, number: 24, topic: "الضوء - الانعكاس الكلي الداخلي", text: "يحدث الانعكاس الكلي الداخلي للضوء عندما تكون زاوية السقوط:", options: ["أكبر من الزاوية الحرجة", "مساوية للزاوية الحرجة", "أصغر من الزاوية الحرجة", "نصف الزاوية الحرجة"], answer: 0, explanation: "يشترط للانعكاس الكلي الداخلي انتقال الضوء من وسط أعلى معامل انكسار إلى أقل، وأن تتجاوز زاوية السقوط الزاوية الحرجة." },
  { id: "6ad00e6363cd9c24f9f40a6a", page: 124, number: 26, topic: "الضوء - الانعكاس الكلي الداخلي", text: "في الشكل، أي رقم يمثل زاوية السقوط الحرجة؟", options: ["الزاوية 1", "الزاوية 2", "الزاوية 3", "الزاوية 4"], answer: 2, explanation: "عند الزاوية الحرجة ينكسر الشعاع على امتداد السطح الفاصل؛ والشعاع ذي الرقم 3 في الشكل يحقق هذه الحالة، فتكون زاوية سقوطه هي الزاوية الحرجة." },
  { id: "6ad00e6363cd9c24f9f40a6b", page: 124, number: 27, topic: "الضوء - الألياف البصرية", text: "تعتمد الألياف البصرية في توجيه الضوء على:", options: ["الانكسار الكلي الداخلي", "الانعكاس الكلي الداخلي", "الانكسار", "الانعكاس"], answer: 1, explanation: "تحبس الألياف البصرية الضوء داخلها بتكرار الانعكاس الكلي الداخلي عند الحد الفاصل." },
  { id: "6ad00e6363cd9c24f9f40a6c", page: 124, number: 28, topic: "الضوء - الانكسار", text: "ما سبب حدوث ظاهرة السراب؟", options: ["انعكاس الضوء", "انكسار الضوء", "حيود الضوء", "تداخل الضوء"], answer: 1, explanation: "ينحرف الضوء بالانكسار خلال طبقات الهواء المختلفة في درجة الحرارة والكثافة الضوئية، فتظهر صورة السراب." },
  { id: "6ad00e6363cd9c24f9f40a6d", page: 124, number: 29, topic: "الضوء - قوس المطر", text: "أي مما يلي لا يؤثر في تشكيل قوس المطر؟", options: ["الحيود", "التشتت", "الانعكاس", "الانكسار"], answer: 0, explanation: "يتكوّن قوس المطر من انكسار الضوء وتشتته وانعكاسه داخليًا في قطرات الماء؛ أما الحيود فليس من آلياته." },
  { id: "6ad00e6363cd9c24f9f40a6e", page: 124, number: 30, topic: "الضوء - التكبير في المرايا", text: "مرآة كروية تكبيرها 3. إذا كان طول الجسم 10 cm، فما طول صورته؟", options: ["60 cm", "30 cm", "20 cm", "10 cm"], answer: 1, explanation: "مقدار التكبير=طول الصورة/طول الجسم؛ لذلك طول الصورة=3×10=30 cm." },
  { id: "6ad00e6363cd9c24f9f40a6f", page: 124, number: 31, topic: "الضوء - التكبير في المرايا", text: "وُضع جسم على بعد 10 cm أمام مرآة مقعرة، فتكوّنت له صورة حقيقية مكبرة 3 مرات. ما بعد الصورة؟", options: ["15 cm", "30 cm", "60 cm", "120 cm"], answer: 1, explanation: "مقدار التكبير للمرآة يساوي |d_i/d_o|. إذن بعد الصورة=3×10=30 cm." },
  { id: "6ad00e6363cd9c24f9f40a70", page: 125, number: 32, topic: "الضوء - العدسات الرقيقة", text: "وُضع جسم على بعد 4 cm من عدسة محدبة فتكوّنت له صورة حقيقية على بعد 4 cm. ما البعد البؤري للعدسة؟", options: ["1/8 cm", "1/2 cm", "2 cm", "4 cm"], answer: 2, explanation: "من معادلة العدسة 1/f=1/d_o+1/d_i=1/4+1/4=1/2؛ لذلك f=2 cm." },
  { id: "6ad00e6363cd9c24f9f40a71", page: 126, number: 40, topic: "الضوء - عيوب النظر", text: "ما عيب النظر الذي لا يستطيع المصاب به رؤية الجسم القريب بوضوح؟", options: ["قصر النظر", "طول النظر", "الزوغان الكروي", "الزوغان اللوني"], answer: 1, explanation: "في طول النظر تتكوّن صورة الجسم القريب خلف الشبكية، فيصعب رؤيته بوضوح." },
  { id: "6ad00e6363cd9c24f9f40a72", page: 126, number: 43, topic: "الضوء - التداخل", text: "تُستخدم تجربة شقي يونج لإظهار:", options: ["انعكاس الضوء", "انكسار الضوء", "تداخل الضوء", "حيود الضوء"], answer: 2, explanation: "تنتج تجربة شقي يونج أهدابًا مضيئة ومعتمة من تداخل موجات الضوء." },
  { id: "6ad00e6363cd9c24f9f40a73", page: 126, number: 44, topic: "الضوء - تجربة شقي يونج", text: "في تجربة شقي يونج، إذا كانت λ طول الموجة، وd المسافة بين الشقين، وx المسافة بين الأهداب، وL المسافة إلى الشاشة، فما L؟", options: ["xλd", "λd/x", "xd/λ", "λ/(xd)"], answer: 2, explanation: "المسافة بين الأهداب x=λL/d؛ بحل العلاقة لإيجاد L نحصل على L=xd/λ." },
  { id: "6ad00e6363cd9c24f9f40a74", page: 126, number: 46, topic: "الضوء - الحيود", text: "ما الأداة المستخدمة لتكوين أنماط الحيود؟", options: ["محزوز الحيود", "المطياف", "العدسات اللونية", "شقا يونج"], answer: 0, explanation: "يتكون نمط الحيود عند مرور الضوء عبر شقوق محزوز الحيود." },
  { id: "6ad00e6363cd9c24f9f40a75", page: 127, number: 1, topic: "الكهرباء - الشحن بالدلك", text: "ما طريقة الشحن التي تسبب الفرقعة التي قد تُسمع عند المشي فوق سجادة؟", options: ["التوصيل", "الحث", "التأريض", "الدلك"], answer: 3, explanation: "احتكاك الحذاء بالسجادة ينقل إلكترونات بين المادتين، فيشحن الجسمان بالدلك وقد يحدث تفريغ كهربائي مسموع." },
  { id: "6ad00e6363cd9c24f9f40a76", page: 128, number: 8, topic: "الكهرباء - الموصلات والعوازل", text: "أي المواد التالية موصلة للكهرباء؟", options: ["الزجاج", "البلاستيك", "الهواء الجاف", "الفضة"], answer: 3, explanation: "الفضة فلز موصل جيد للكهرباء، بينما الزجاج والبلاستيك والهواء الجاف عوازل في الظروف المعتادة." },
  { id: "6ad00e6363cd9c24f9f40a77", page: 128, number: 9, topic: "الكهرباء - قانون كولوم", text: "إذا تضاعفت المسافة بين شحنتين نقطيتين، فكيف تتغير القوة الكهربائية المتبادلة بينهما؟", options: ["تصبح F/4", "تصبح F/2", "تصبح 2F", "تصبح 4F"], answer: 0, explanation: "وفق قانون كولوم تتناسب القوة عكسيًا مع مربع المسافة؛ وعند مضاعفة المسافة تصبح القوة ربع قيمتها." },
  { id: "6ad00e6363cd9c24f9f40a78", page: 128, number: 10, topic: "الكهرباء - قانون كولوم", text: "ما مقدار القوة الكهربائية التي تؤثر بها شحنة 4×10⁻⁹ C في شحنة اختبار موجبة مقدارها 1 C تبعد عنها 1 m؟ (k=9×10⁹ N·m²/C²)", options: ["4×10⁻⁹ N", "4 N", "36×10⁻⁹ N", "36 N"], answer: 3, explanation: "من قانون كولوم F=k|q₁q₂|/r²=9×10⁹×4×10⁻⁹×1/1²=36 N." },
  { id: "6ad00e6363cd9c24f9f40a79", page: 128, number: 12, topic: "الكهرباء - القوة الكهربائية", text: "في الشكل، تقع الشحنة الموجبة q₃ في منتصف المسافة بين الشحنتين المتماثلتين q₁ وq₂. ما محصلة القوى المؤثرة في q₃؟", options: ["صفر", "kq²/r", "kq²/r²", "2kq²/r²"], answer: 0, explanation: "تؤثر الشحنتان المتساويتان والمتماثلتان في q₃ بقوتين متساويتين مقدارًا ومتعاكستين اتجاهًا، فتكون المحصلة صفرًا." },
  { id: "6ad00e6363cd9c24f9f40a7b", page: 130, number: 22, topic: "الكهرباء - الجهد الكهربائي", text: "ما الكمية التي تساوي نسبة الشغل اللازم لتحريك شحنة إلى مقدار تلك الشحنة؟", options: ["القوة الكهربائية", "المجال الكهربائي", "الجهد الكهربائي", "السعة الكهربائية"], answer: 2, explanation: "فرق الجهد الكهربائي يساوي الشغل المبذول لكل وحدة شحنة: V=W/q." },
  { id: "6ad00e6363cd9c24f9f40a7c", page: 130, number: 23, topic: "الكهرباء - الجهد الكهربائي", text: "ما الوحدة المكافئة لـ J/C؟", options: ["الفولت (V)", "التسلا (T)", "الأمبير (A)", "النيوتن (N)"], answer: 0, explanation: "الجول لكل كولوم يساوي فولتًا واحدًا." },
  { id: "6ad00e6363cd9c24f9f40a7d", page: 130, number: 24, topic: "الكهرباء - فرق الجهد والشغل", text: "لنقل شحنة مقدارها 4 C خلال فرق جهد 200 V، ما الشغل المبذول؟", options: ["25 J", "800 J", "8000 J", "80000 J"], answer: 1, explanation: "الشغل W=qΔV=4×200=800 J." },
  { id: "6ad00e6363cd9c24f9f40a7e", page: 130, number: 27, topic: "الكهرباء - المجال والجهد", text: "المسافة بين لوحين متوازيين مشحونين 0.75 cm، ومقدار المجال الكهربائي بينهما 1200 N/C. ما فرق الجهد بين اللوحين؟", options: ["1600 V", "900 V", "16 V", "9 V"], answer: 3, explanation: "نحوّل المسافة إلى 0.0075 m، ثم ΔV=Ed=1200×0.0075=9 V." },
  { id: "6ad00e6363cd9c24f9f40a7f", page: 130, number: 28, topic: "الكهرباء - المجال والجهد", text: "بين لوحين متوازيين فرق مسافة 3 m ومجال كهربائي منتظم مقداره 2000 N/C. ما فرق الجهد بينهما؟", options: ["3000 V", "6000 V", "300 V", "600 V"], answer: 1, explanation: "في المجال المنتظم ΔV=Ed=2000×3=6000 V." },
] as const;
const rejected = [
  { id: "6ad00e6363cd9c24f9f40a7a", page: 129, note: "رُفض من النشر: المسودة تجمع نصوصًا وخيارات غير متوافقة من سؤالين متجاورين، ولا تمثل سجلًا واحدًا يمكن تصحيحه بثقة. يلزم فصل السؤالين من المصدر قبل إضافتهما." },
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
