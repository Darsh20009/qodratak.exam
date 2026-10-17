import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "nasser-abdulkarim-main";
const SOURCE_ORDINAL = 1;
const SOURCE_BOOK = "كتاب ناصر عبدالكريم للتحصيلي";
const REVIEWER = "source-verified-content-audit";
const approved = [
  { id: "6ad00e6363cd9c24f9f40a80", page: 131, number: 30, topic: "الكهرباء - المكثفات", text: "من استخدامات المكثف الكهربائي:", options: ["تخزين الشحنات", "تحديد نوع الشحنات", "قياس مقدار الشحنات", "الكشف عن الشحنات"], answer: 0, explanation: "يخزن المكثف الشحنات الكهربائية على لوحيه، وتتناسب الشحنة المختزنة مع فرق الجهد والسعة." },
  { id: "6ad00e6363cd9c24f9f40a81", page: 132, number: 39, topic: "الكهرباء - القدرة", text: "ما الكمية التي تمثل المعدل الزمني لتحول الطاقة؟", options: ["الطاقة", "القدرة", "شدة التيار", "فرق الجهد"], answer: 1, explanation: "القدرة هي معدل تحويل الطاقة أو بذل الشغل مع الزمن: P=ΔE/Δt." },
  { id: "6ad00e6363cd9c24f9f40a82", page: 132, number: 40, topic: "الكهرباء - القدرة والمقاومة", text: "كيف تتناسب القدرة المستنفدة في مقاومة مع المقاومة وشدة التيار المار فيها؟", options: ["عكسيًا مع المقاومة وطرديًا مع مربع التيار", "طرديًا مع المقاومة وعكسيًا مع مربع التيار", "عكسيًا مع كل من المقاومة ومربع التيار", "طرديًا مع كل من المقاومة ومربع التيار"], answer: 3, explanation: "من العلاقة P=I²R، تتناسب القدرة طرديًا مع المقاومة ومع مربع شدة التيار." },
  { id: "6ad00e6363cd9c24f9f40a83", page: 132, number: 41, topic: "الكهرباء - القدرة والتيار", text: "مصباح قدرته 5.5 W موصول بفرق جهد 220 V. ما شدة التيار المار فيه؟", options: ["0.025 A", "0.25 A", "100 A", "1000 A"], answer: 0, explanation: "نستخدم P=VI؛ إذن I=P/V=5.5/220=0.025 A." },
  { id: "6ad00e6363cd9c24f9f40a84", page: 132, number: 43, topic: "الكهرباء - القدرة الكهربائية", text: "مصباح مقاومته 4 Ω ويمر فيه تيار شدته 2 A. ما قدرته الكهربائية؟", options: ["1 W", "4 W", "16 W", "64 W"], answer: 2, explanation: "P=I²R=2²×4=16 W." },
  { id: "6ad00e6363cd9c24f9f40a85", page: 132, number: 44, topic: "الكهرباء - القدرة والمقاومة", text: "مصباح قدرته 60 W يعمل على فرق جهد 12 V. ما مقاومته؟", options: ["24 Ω", "7.2 Ω", "2.4 Ω", "0.2 Ω"], answer: 2, explanation: "من P=V²/R نحصل على R=V²/P=12²/60=2.4 Ω." },
  { id: "6ad00e6363cd9c24f9f40a86", page: 133, number: 46, topic: "الكهرباء - قانون أوم", text: "يتناسب التيار الكهربائي طرديًا مع فرق الجهد عند ثبات درجة الحرارة. ما القانون الذي تصفه العبارة؟", options: ["قانون جول", "قانون أوم", "قانون هوك", "قانون بويل"], answer: 1, explanation: "ينص قانون أوم على أن شدة التيار تتناسب طرديًا مع فرق الجهد عند ثبات درجة الحرارة، أي V=IR." },
  { id: "6ad00e6363cd9c24f9f40a87", page: 134, number: 54, topic: "الكهرباء - دوائر المقاومات", text: "ثلاث مقاومات A وB وC متصلة كما في الشكل. ما نوع الربط بينها؟", options: ["جميعها على التوالي", "A وB على التوازي وC على التوالي", "جميعها على التوازي", "A وB على التوالي وC على التوازي"], answer: 3, explanation: "في الشكل تشكل المقاومتان A وB فرعًا متصلًا على التوالي، بينما تقع C في فرع آخر بين العقدتين نفسيهما؛ لذلك يكون الفرعان على التوازي." },
  { id: "6ad00e6363cd9c24f9f40a88", page: 134, number: 56, topic: "الكهرباء - المقاومة المكافئة", text: "في الدائرة الموضحة ثلاث مقاومات قيمة كل منها 1 Ω موصولة على التوالي. ما قيمة مقاومة واحدة تكافئها وتحافظ على السطوع نفسه؟", options: ["1 Ω", "2 Ω", "3 Ω", "0.3 Ω"], answer: 2, explanation: "المقاومات المتصلة على التوالي تجمع قيمها: R_eq=1+1+1=3 Ω." },
  { id: "6ad00e6363cd9c24f9f40a89", page: 134, number: 57, topic: "الكهرباء - المقاومة المكافئة", text: "أربع مقاومات متساوية قيمة كل منها R موصولة على التوازي. ما مقاومتها المكافئة؟", options: ["R/4", "4/R", "4R", "R"], answer: 0, explanation: "لأربع مقاومات متساوية على التوازي، 1/R_eq=4/R، ومنه R_eq=R/4." },
  { id: "6ad00e6363cd9c24f9f40a8a", page: 134, number: 58, topic: "الكهرباء - دوائر التوالي", text: "عند ربط خمس مقاومات مختلفة القيمة على التوالي، ما الذي ينطبق على التيار والجهد؟", options: ["التيار والجهد متساويان على كل مقاومة", "التيار مختلف والجهد متساوٍ على كل مقاومة", "التيار متساوٍ والجهد مختلف على كل مقاومة", "التيار والجهد مختلفان على كل مقاومة"], answer: 2, explanation: "يمر التيار نفسه في جميع عناصر دائرة التوالي، بينما يتوزع فرق الجهد بحسب قيمة كل مقاومة." },
  { id: "6ad00e6363cd9c24f9f40a8b", page: 134, number: 59, topic: "الكهرباء - دوائر التوالي", text: "عند ربط مقاومتين R₁ وR₂ على التوالي مع فرق جهد V، أي علاقة تحسب التيار؟", options: ["I=V(R₁+R₂)", "I=R₁R₂/V", "I=V/(R₁+R₂)", "I=V/(R₁R₂)"], answer: 2, explanation: "المقاومة المكافئة في التوالي R₁+R₂؛ ومن قانون أوم I=V/R_eq=V/(R₁+R₂)." },
  { id: "6ad00e6363cd9c24f9f40a8c", page: 136, number: 1, topic: "المغناطيسية - التدفق المغناطيسي", text: "ما اسم عدد خطوط المجال المغناطيسي التي تخترق سطحًا ما؟", options: ["التدفق الكهرومغناطيسي", "التدفق المغناطيسي", "المجالات الكهرومغناطيسية", "المجالات المغناطيسية"], answer: 1, explanation: "التدفق المغناطيسي هو مقياس لعدد خطوط المجال المغناطيسي التي تخترق سطحًا." },
  { id: "6ad00e6363cd9c24f9f40a8d", page: 136, number: 3, topic: "المغناطيسية - المجال حول سلك", text: "ما شكل خطوط المجال المغناطيسي حول سلك مستقيم يحمل تيارًا كهربائيًا؟", options: ["حلقات بيضاوية", "حلقات إهليلجية", "حلقات دائرية", "حلقات حلزونية"], answer: 2, explanation: "تكون خطوط المجال حول السلك المستقيم حلقات دائرية مركزها السلك، ويحدد اتجاهها بقاعدة اليد اليمنى." },
  { id: "6ad00e6363cd9c24f9f40a8e", page: 136, number: 4, topic: "المغناطيسية - المجال حول سلك", text: "شدة المجال المغناطيسي المتولد حول سلك مستقيم يحمل تيارًا تتناسب:", options: ["طرديًا مع كتلة السلك", "طرديًا مع البعد عن السلك", "عكسيًا مع كتلة السلك", "عكسيًا مع البعد عن السلك"], answer: 3, explanation: "لتيار ثابت، تتناسب شدة المجال حول سلك مستقيم عكسيًا مع البعد عنه: B∝I/r." },
  { id: "6ad00e6363cd9c24f9f40a8f", page: 136, number: 5, topic: "المغناطيسية - الملفات", text: "المجال المغناطيسي الناتج عن مغناطيس دائم يشبه المجال الناتج عن مرور تيار كهربائي في:", options: ["سلك مستقيم", "ملف دائري", "ملف لولبي", "حلقة ساكنة"], answer: 2, explanation: "يشبه المجال المغناطيسي للملف اللولبي مجال مغناطيس دائم، إذ يكون له قطبان شمالي وجنوبي." },
  { id: "6ad00e6363cd9c24f9f40a90", page: 136, number: 6, topic: "المغناطيسية - الملف اللولبي", text: "أي مما يلي من العوامل المؤثرة في شدة المجال المغناطيسي المتولد حول ملف لولبي؟", options: ["فرق الجهد", "مقاومة الملف", "عدد لفات الملف", "مساحة الملف"], answer: 2, explanation: "تزداد شدة المجال داخل الملف اللولبي بزيادة عدد اللفات لكل وحدة طول، وكذلك بزيادة التيار؛ ومن الخيارات المعطاة عدد اللفات هو العامل الصحيح." },
  { id: "6ad00e6363cd9c24f9f40a91", page: 136, number: 7, topic: "المغناطيسية - القوة على سلك", text: "يسري تيار مقداره 6 A في سلك طوله 1.5 m موضوع عموديًا في مجال مغناطيسي منتظم مقداره 0.5 T. ما مقدار القوة المؤثرة في السلك؟", options: ["3 N", "4 N", "4.5 N", "6 N"], answer: 2, explanation: "لأن السلك عمودي على المجال، F=BIL=0.5×6×1.5=4.5 N." },
  { id: "6ad00e6363cd9c24f9f40a92", page: 137, number: 9, topic: "المغناطيسية - القوة على جسيم مشحون", text: "إلكترون شحنته 1.6×10⁻¹⁹ C يتحرك بسرعة 5×10⁶ m/s عموديًا على مجال مغناطيسي شدته 0.4 T. ما مقدار القوة المغناطيسية عليه؟", options: ["2×10⁻¹³ N", "2×10¹³ N", "3.2×10⁻¹³ N", "3.2×10¹³ N"], answer: 2, explanation: "للحركة العمودية F=|q|vB=1.6×10⁻¹⁹×5×10⁶×0.4=3.2×10⁻¹³ N." },
  { id: "6ad00e6363cd9c24f9f40a93", page: 137, number: 14, topic: "الكهرباء - أجهزة القياس", text: "ما الجهاز الموضح في الشكل؟ يظهر جلفانومتر موصولًا بمقاومة صغيرة على التوازي معه.", options: ["جلفانومتر", "أميتر", "فولتميتر", "أوميتر"], answer: 1, explanation: "توصيل مقاومة صغيرة على التوازي مع الجلفانومتر يحوله إلى أميتر لقياس شدة التيار." },
  { id: "6ad00e6363cd9c24f9f40a94", page: 138, number: 16, topic: "الكهرومغناطيسية - الحث", text: "من مكتشف الحث الكهرومغناطيسي؟", options: ["فاراداي", "طومسون", "مليكان", "رونتجن"], answer: 0, explanation: "اكتشف مايكل فاراداي الحث الكهرومغناطيسي، الذي يفسر تولد قوة دافعة كهربائية عند تغير التدفق المغناطيسي." },
  { id: "6ad00e6363cd9c24f9f40a95", page: 138, number: 17, topic: "الكهرومغناطيسية - الحث", text: "في تجربة سلك موصل بين قطبي مغناطيس، تُجرى الحالات: (1) يترك السلك ساكنًا، (2) يحرك إلى أعلى، (3) يحرك إلى أسفل، (4) يحرك موازيًا لخطوط المجال. في أي الحالتين يتولد تيار حثي؟", options: ["1 و4", "1 و3", "2 و4", "2 و3"], answer: 3, explanation: "يتولد التيار الحثي عندما يقطع السلك خطوط المجال؛ الحركتان إلى أعلى وإلى أسفل تقطعانها، أما السكون والحركة الموازية لها فلا." },
  { id: "6ad00e6363cd9c24f9f40a96", page: 138, number: 18, topic: "الكهرومغناطيسية - القوة الدافعة الحثية", text: "سلك طوله 1 m يتحرك بسرعة 4 m/s عموديًا على مجال مغناطيسي شدته 0.5 T. ما القوة الدافعة الكهربائية الحثية؟", options: ["2 V", "5.5 V", "6 V", "8 V"], answer: 0, explanation: "القوة الدافعة الحثية ε=BLv=0.5×1×4=2 V." },
  { id: "6ad00e6363cd9c24f9f40a97", page: 138, number: 19, topic: "الكهرومغناطيسية - التيار المتناوب", text: "مصباح متوسط قدرته 75 W. ما القيمة العظمى للقدرة المستنفدة فيه؟", options: ["3.75 W", "15 W", "37.5 W", "150 W"], answer: 3, explanation: "في التيار المتناوب الجيبي متوسط القدرة نصف قيمتها العظمى؛ لذلك P_max=2×75=150 W." },
  { id: "6ad00e6363cd9c24f9f40a98", page: 138, number: 20, topic: "الكهرومغناطيسية - القدرة في التيار المتناوب", text: "مولد تيار متناوب جهده الأعظمي 100 V، ويمر في الدائرة الخارجية تيار أعظمي 180 A. ما متوسط القدرة الناتجة؟", options: ["9000 W", "9000√2 W", "18000/√2 W", "18000 W"], answer: 0, explanation: "لموجتين جيبيتين متوافقتين P_avg=V_max I_max/2؛ إذن P_avg=100×180/2=9000 W." },
  { id: "6ad00e6363cd9c24f9f40a99", page: 138, number: 21, topic: "الكهرومغناطيسية - قانون لنز", text: "اتجاه التيار الحثي يعاكس التغير في المجال المغناطيسي الذي سبب ذلك التيار. ما القانون الذي يصف ذلك؟", options: ["قانون هنري", "قانون أورستد", "قانون فاراداي", "قانون لنز"], answer: 3, explanation: "ينص قانون لنز على أن اتجاه التيار الحثي يكون بحيث يعاكس التغير في التدفق المغناطيسي المسبب له." },
  { id: "6ad00e6363cd9c24f9f40a9a", page: 139, number: 23, topic: "الكهرومغناطيسية - المحولات", text: "ما الجهاز المستخدم لرفع الجهد المتناوب أو خفضه؟", options: ["المحول الكهربائي", "المولد الكهربائي", "مولد التيار المستمر", "مولد التيار المتناوب"], answer: 0, explanation: "يستخدم المحول الكهربائي لرفع الجهد المتناوب أو خفضه بتغير نسبة عدد لفات الملف الثانوي إلى الابتدائي." },
  { id: "6ad00e6363cd9c24f9f40a9b", page: 140, number: 31, topic: "الموجات الكهرومغناطيسية - سرعة الانتشار", text: "كم تبلغ سرعة الموجات الكهرومغناطيسية في وسط ثابت عزله الكهربائي K=4، إذا كانت سرعة الضوء في الفراغ 3×10⁸ m/s؟", options: ["6×10⁸ m/s", "3×10⁸ m/s", "2×10⁸ m/s", "1.5×10⁸ m/s"], answer: 3, explanation: "سرعة الموجة في الوسط v=c/√K؛ لذا v=3×10⁸/√4=1.5×10⁸ m/s." },
  { id: "6ad00e6363cd9c24f9f40a9c", page: 140, number: 32, topic: "الموجات الكهرومغناطيسية - الطيف", text: "أي الموجات التالية لا تعد من الموجات الكهرومغناطيسية؟", options: ["موجات الراديو", "موجات التلفاز", "موجات الميكروويف", "موجات الصوت"], answer: 3, explanation: "الصوت موجة ميكانيكية تحتاج إلى وسط مادي، أما الراديو والتلفاز والميكروويف فموجات كهرومغناطيسية." },
  { id: "6ad00e6363cd9c24f9f40a9d", page: 140, number: 33, topic: "الموجات الكهرومغناطيسية - الطيف", text: "ما الموجات ذات الطول الموجي الأكبر في الطيف الكهرومغناطيسي؟", options: ["موجات الراديو", "أشعة جاما", "موجات الميكروويف", "الأشعة السينية"], answer: 0, explanation: "موجات الراديو تقع عند الطرف ذي الأطوال الموجية الأكبر في الطيف الكهرومغناطيسي." },
  { id: "6ad00e6363cd9c24f9f40a9e", page: 140, number: 34, topic: "الموجات الكهرومغناطيسية - الطيف", text: "موجات الميكروويف وموجات الراديو تتفقان في:", options: ["التردد", "الطول الموجي", "السرعة في الفراغ", "الطاقة"], answer: 2, explanation: "تختلف موجات الراديو والميكروويف في التردد والطول الموجي والطاقة، لكنها تنتقل جميعًا في الفراغ بسرعة الضوء." },
  { id: "6ad00e6363cd9c24f9f40a9f", page: 140, number: 35, topic: "الموجات الكهرومغناطيسية - الطيف", text: "تشترك موجات الميكروويف والراديو في الخصائص جميعها عدا أنها:", options: ["موجات كهرومغناطيسية", "ذات طول موجي واحد", "تنتقل في الفراغ", "لا تحتاج إلى وسط مادي لانتقالها"], answer: 1, explanation: "كلتاهما موجتان كهرومغناطيسيتان تنتقلان في الفراغ ولا تحتاجان وسطًا ماديًا، لكن أطوالهما الموجية ليست متساوية." },
  { id: "6ad00e6363cd9c24f9f40aa0", page: 140, number: 37, topic: "الموجات الكهرومغناطيسية - الأشعة السينية", text: "من مكتشف الأشعة السينية؟", options: ["فاراداي", "هرتز", "رونتجن", "ماكسويل"], answer: 2, explanation: "اكتشف فيلهلم رونتجن الأشعة السينية." },
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
