import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-chemistry-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f4181c",
    page: 15,
    number: 133,
    text: "إذا كان pOH لمحلول يساوي 8.5 عند 25°C، فما طبيعة المحلول؟",
    options: ["حمضي", "قاعدي", "متعادل", "متردد"],
    answer: 0,
    explanation: "عند 25°C، pH=14−pOH=14−8.5=5.5. وبما أن pH أقل من 7 فالمحلول حمضي.",
  },
  {
    id: "6ad0103563cd9c24f9f4181d",
    page: 15,
    number: 134,
    text: "ما الاسم النظامي للمركب CH₃–CH₂–CH₂–CH=CH–CH(CH₃)–CH₃؟",
    options: ["2-ميثيل هيبت-3-ين", "3-ميثيل هيبت-4-ين", "6-ميثيل هيبت-4-ين", "6-ميثيل هيبت-3-ين"],
    answer: 0,
    explanation: "أطول سلسلة تحتوي الرابطة المزدوجة فيها سبع ذرات كربون. نبدأ الترقيم من الطرف الأقرب للرابطة المزدوجة، فتكون عند C3 ومجموعة الميثيل عند C2؛ الاسم 2-ميثيل هيبت-3-ين.",
  },
  {
    id: "6ad0103563cd9c24f9f4181f",
    page: 15,
    number: 137,
    text: "ما نوع المركب الناتج عادةً من إضافة الماء إلى ألكين؟",
    options: ["إيثر", "إستر", "كحول", "حمض كربوكسيلي"],
    answer: 2,
    explanation: "إماهة الألكين تضيف H وOH عبر الرابطة المزدوجة، فينتج كحول.",
  },
  {
    id: "6ad0103563cd9c24f9f41820",
    page: 15,
    number: 138,
    text: "ما المجموعتان الوظيفيتان الموجودتان في الحمض الأميني؟",
    options: ["أمين وكربوكسيل", "أمين وكربونيل", "كربونيل وكربوكسيل", "أمين وهيدروكسيل"],
    answer: 0,
    explanation: "يحتوي الحمض الأميني على مجموعة أمين ومجموعة كربوكسيل، إضافة إلى مجموعة جانبية تختلف باختلاف الحمض الأميني.",
  },
  {
    id: "6ad0103563cd9c24f9f41821",
    page: 15,
    number: 139,
    text: "من أي وحدتين سكريتين يتكون السكروز؟",
    options: ["الجلوكوز والفركتوز", "النشا والسليلوز", "النشا والفركتوز", "السليلوز والجلوكوز"],
    answer: 0,
    explanation: "السكروز ثنائي سكاريد يتكون من وحدة جلوكوز ووحدة فركتوز.",
  },
  {
    id: "6ad0103563cd9c24f9f41822",
    page: 15,
    number: 140,
    text: "إلى أي نوع من الجزيئات الحيوية ينتمي الإنسولين؟",
    options: ["دهنية", "كربوهيدراتية", "بروتينية", "سكرية"],
    answer: 2,
    explanation: "الإنسولين هرمون بروتيني يتكون من سلسلتين من الأحماض الأمينية.",
  },
  {
    id: "6ad0103563cd9c24f9f41823",
    page: 15,
    number: 141,
    text: "أي أزواج القواعد النيتروجينية الآتية صحيح في DNA؟",
    options: ["A–T وC–G", "A–C وT–G", "A–G وC–T", "A–G وC–U"],
    answer: 0,
    explanation: "في DNA يرتبط الأدينين A بالثايمين T، ويرتبط السيتوسين C بالجوانين G.",
  },
  {
    id: "6ad0103563cd9c24f9f41824",
    page: 15,
    number: 142,
    text: "أي مادة تتفاعل مع محلول قاعدة قوية لتكوين أملاح كربوكسيلية وجليسرول في عملية التصبن؟",
    options: ["الشموع", "الدهون الثلاثية", "النيوكليوتيدات", "القواعد النيتروجينية"],
    answer: 1,
    explanation: "تتفاعل الدهون الثلاثية مع قاعدة قوية بالتصبن، فتنتج أملاح الأحماض الدهنية (الصابون) والجليسرول.",
  },
  {
    id: "6ad0103563cd9c24f9f41825",
    page: 15,
    number: 143,
    text: "أي مادة تُستخدم شائعًا لحفظ العينات البيولوجية؟",
    options: ["بنزالدهيد", "أسيتالدهيد", "فورمالدهيد", "أسيتون"],
    answer: 2,
    explanation: "يُستخدم الفورمالدهيد، غالبًا في صورة محلول مائي يسمى الفورمالين، لحفظ العينات البيولوجية.",
  },
  {
    id: "6ad0103563cd9c24f9f41826",
    page: 16,
    number: 144,
    text: "أي تفاعلات التعادل الآتية يُتوقع أن ينتج محلولًا متعادلًا pH≈7 عند نقطة التكافؤ؟",
    options: ["NH₃ + HCl", "NaOH + HCl", "NaOH + HF", "KOH + CH₃COOH"],
    answer: 1,
    explanation: "تعادل حمض قوي مع قاعدة قوية مثل HCl وNaOH ينتج ملحًا متعادلًا وماءً، ويكون pH عند نقطة التكافؤ قريبًا من 7.",
  },
  {
    id: "6ad0103563cd9c24f9f41827",
    page: 16,
    number: 145,
    text: "وفق المعادلة 2SO₂ + O₂ + 2H₂O → 2H₂SO₄، كم مولًا من H₂SO₄ ينتج من 12.5 mol من SO₂ عند توافر بقية المتفاعلات؟",
    options: ["25 mol", "15 mol", "12.5 mol", "7.5 mol"],
    answer: 2,
    explanation: "النسبة المولية بين SO₂ وH₂SO₄ هي 2:2، أي 1:1. لذلك ينتج 12.5 mol من H₂SO₄.",
  },
  {
    id: "6ad0103563cd9c24f9f41828",
    page: 16,
    number: 146,
    text: "أي أنواع الاضمحلال النووي الآتية لا يغيّر عدد البروتونات أو النيوترونات في النواة؟",
    options: ["ألفا", "بيتا", "جاما", "البوزيترون"],
    answer: 2,
    explanation: "انبعاث جاما يطلق طاقة من النواة من دون تغيير عدد البروتونات أو النيوترونات.",
  },
  {
    id: "6ad0103563cd9c24f9f41829",
    page: 16,
    number: 147,
    text: "أي الصيغ الآتية تمثل ألكاينًا، وهو الأكثر عدمًا للإشباع بين هذه الخيارات؟",
    options: ["C₄H₁₀", "C₃H₈", "C₃H₆", "C₃H₄"],
    answer: 3,
    explanation: "الصيغة العامة للألكاين المفتوح ذي رابطة ثلاثية واحدة هي CₙH₂ₙ₋₂؛ وتنطبق على C₃H₄. ويحتوي الألكاين رابطة متعددة تتيح تفاعلات إضافة.",
  },
  {
    id: "6ad0103563cd9c24f9f4182a",
    page: 16,
    number: 148,
    text: "أي مبدأ ينص على استحالة تحديد موضع الإلكترون وزخمه بدقة مطلقة في الوقت نفسه؟",
    options: ["نظرية بور", "مبدأ أوفباو", "فرضية بلانك", "مبدأ هايزنبرغ"],
    answer: 3,
    explanation: "مبدأ عدم اليقين لهايزنبرغ يحدّ من دقة معرفة موضع الجسيم وزخمه معًا في اللحظة نفسها.",
  },
  {
    id: "6ad0103563cd9c24f9f4182b",
    page: 16,
    number: 149,
    text: "كم غرامًا من O₂ ينتج من التحليل الكامل لـ3 mol من الماء؟ (الكتلة المولية للأكسجين الذري 16 g/mol)",
    options: ["60 g", "48 g", "32 g", "22 g"],
    answer: 1,
    explanation: "من 2H₂O→2H₂+O₂، تنتج 1.5 mol من O₂ من 3 mol ماء. الكتلة المولية لـO₂=32 g/mol، فتكون كتلته 1.5×32=48 g.",
  },
  {
    id: "6ad0103563cd9c24f9f4182c",
    page: 16,
    number: 150,
    text: "أي هاليدات البنتان الآتية يُتوقع أن تكون له أعلى درجة غليان؟",
    options: ["1-يودوبنتان", "1-بروموبنتان", "1-كلوروبنتان", "1-فلوروبنتان"],
    answer: 0,
    explanation: "عند ثبات السلسلة العضوية تزداد قابلية الاستقطاب وقوى تشتت لندن عادةً بزيادة كتلة الهالوجين؛ لذلك يكون 1-يودوبنتان الأعلى غليانًا بين الخيارات.",
  },
  {
    id: "6ad0103563cd9c24f9f4182d",
    page: 16,
    number: 151,
    text: "في خلية جلفانية، E° الاختزال لـI₂/I⁻ يساوي +0.54 V وE° الاختزال لـFe²⁺/Fe يساوي −0.45 V. ما جهد الخلية القياسي؟",
    options: ["+0.45 V", "−0.54 V", "+0.99 V", "−0.99 V"],
    answer: 2,
    explanation: "يحدث الاختزال عند الكاثود I₂/I⁻. جهد الخلية=E°الكاثود−E°الأنود=0.54−(−0.45)=+0.99 V.",
  },
  {
    id: "6ad0103563cd9c24f9f4182e",
    page: 17,
    number: 152,
    text: "كم أوربيتالًا يوجد في المجال الفرعي f؟",
    options: ["1", "3", "5", "7"],
    answer: 3,
    explanation: "يحتوي المجال الفرعي f على سبعة أوربيتالات، ويمكنه استيعاب 14 إلكترونًا.",
  },
  {
    id: "6ad0103563cd9c24f9f4182f",
    page: 17,
    number: 153,
    text: "ما الناتج العضوي المتوقع من أكسدة الإيثانول أكسدة أولية مضبوطة؟",
    options: ["الإيثانال", "ثنائي إيثيل إيثر", "إيثان أمين", "إيثانوات الإيثيل"],
    answer: 0,
    explanation: "الإيثانول كحول أولي؛ تؤدي أكسدته المضبوطة إلى الإيثانال. وقد تؤدي الأكسدة اللاحقة إلى حمض الإيثانويك.",
  },
  {
    id: "6ad0103563cd9c24f9f41830",
    page: 17,
    number: 154,
    text: "أي المركبات العضوية الآتية يُستخدم كثيرًا في العطور ونكهات الفواكه؟",
    options: ["الإيثرات", "الإسترات", "الأميدات", "الألدهيدات"],
    answer: 1,
    explanation: "لكثير من الإسترات روائح فاكهية، لذا تُستخدم في العطور والمنكهات.",
  },
  {
    id: "6ad0103563cd9c24f9f41831",
    page: 17,
    number: 155,
    text: "إذا كانت الكهروسالبية للعنصر X تساوي 0.39 وللعنصر Y تساوي 1.30، فما نوع الرابطة بينهما وفق هذا الفرق؟",
    options: ["أيونية", "فلزية", "تساهمية قطبية", "تساهمية غير قطبية"],
    answer: 2,
    explanation: "فرق الكهروسالبية=1.30−0.39=0.91. ووفق التصنيف المدرسي لهذا الفرق تكون الرابطة تساهمية قطبية.",
  },
  {
    id: "6ad0103563cd9c24f9f41832",
    page: 17,
    number: 156,
    text: "ما وحدة المولالية؟",
    options: ["mol/L", "mol لكل 1000 g من المذيب", "mol لكل 100 g من المذيب", "mol لكل 10 g من المذيب"],
    answer: 1,
    explanation: "المولالية هي عدد مولات المذاب لكل كيلوغرام (1000 g) من المذيب.",
  },
  {
    id: "6ad0103563cd9c24f9f41833",
    page: 17,
    number: 157,
    text: "ما الصيغة العامة للأمين الأولي؟",
    options: ["R–NH₂", "R–CONH₂", "R–COOH", "R–CO–R′"],
    answer: 0,
    explanation: "يحتوي الأمين الأولي على مجموعة ألكيل أو أريل مرتبطة بـNH₂، وصيغته العامة R–NH₂.",
  },
  {
    id: "6ad0103563cd9c24f9f41834",
    page: 17,
    number: 158,
    text: "أي قانون يعبّر عنه تساوي كتلة المتفاعلات وكتلة النواتج في تفاعل كيميائي مغلق؟",
    options: ["النسب الثابتة", "النسب المتضاعفة", "حفظ الطاقة", "حفظ الكتلة"],
    answer: 3,
    explanation: "ينص قانون حفظ الكتلة على أن الكتلة الكلية لا تفنى ولا تُستحدث في التفاعل الكيميائي المغلق.",
  },
  {
    id: "6ad0103563cd9c24f9f41836",
    page: 17,
    number: 160,
    text: "أي قانون ينص على أن حرارة التفاعل تعتمد على حالتي المتفاعلات والنواتج ولا تعتمد على المسار؟",
    options: ["قانون هنري", "قانون بويل", "قانون جراهام", "قانون هس"],
    answer: 3,
    explanation: "قانون هس نتيجة لكون الإنثالبي دالة حالة؛ فتغير الإنثالبي يعتمد على الحالة الابتدائية والنهائية لا على مسار التفاعل.",
  },
] as const;

const rejections = [
  {
    id: "6ad0103563cd9c24f9f41835",
    page: 17,
    number: 159,
    note: "مرفوض: لا يمكن استنتاج قيمة Keq من مقارنة عامة بين تراكيز المتفاعلات والنواتج دون تحديد معادلة الاتزان ومعاملاتها؛ الاستنتاج بأن Keq<1 غير مضمون.",
  },
] as const;

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this review is authorized for Replit preview only.`);
  }
  const reviewed = [...approvals, ...rejections];
  const ids = reviewed.map((item) => item.id);
  const drafts = await TahsiliQuestionDraft.find({
    _id: { $in: ids },
    sourceId: SOURCE_ID,
    status: "pending_review",
  })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} pending source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) failures.push(`q${item.number}: source/page mismatch`);
    if (item.options.length !== 4 || new Set(item.options.map((value) => value.trim())).size !== 4 ||
      item.options.some((value) => !value.trim()) || item.answer < 0 || item.answer > 3) {
      failures.push(`q${item.number}: invalid cleaned options or answer index`);
    }
  }
  for (const item of rejections) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page) failures.push(`q${item.number}: rejection source/page mismatch`);
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
    rejected: rejections.length,
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
          reviewerNotes: "تمت مراجعة السؤال وخياراته وحلّه مع المصدر، وأضيف شرح توضيحي.",
          updatedAt: reviewedAt,
        },
      },
    );
  }
  for (const item of rejections) {
    const draft = byId.get(item.id)!;
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: item.note, updatedAt: reviewedAt } },
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
