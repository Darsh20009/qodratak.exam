import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40f37", page: 136, number: 13, topic: "علم البيئة - دورات العناصر", text: "لماذا قد تسهم العواصف الرعدية في زيادة النترات المتاحة للنباتات؟", options: ["لأن البرق يبعد الآفات الزراعية", "لأن البرق يوفر الماء للمحاصيل مباشرة", "لأن البرق يثبت بعض النيتروجين، ثم تصل مركباته إلى التربة مع المطر", "لأن البرق يثبت الأكسجين في المطر"], answer: 2, explanation: "تساعد طاقة البرق على تحويل جزء من النيتروجين الجوي إلى مركبات نيتروجينية، وقد تصل هذه المركبات إلى التربة مع المطر." },
  { id: "6ad0103163cd9c24f9f40f38", page: 136, number: 14, topic: "علم البيئة - العلاقات الغذائية", text: "ما الوصف البيئي للمخلوقات الرمية التي تحصل على غذائها من بقايا المخلوقات الميتة؟", options: ["رمية", "طفيلية", "تكافلية", "مفترسة"], answer: 0, explanation: "تتغذى المخلوقات الرمية على المواد العضوية المتحللة أو بقايا الكائنات الميتة، بخلاف الطفيليات التي تعتمد على مضيف حي." },
  { id: "6ad0103163cd9c24f9f40f39", page: 136, number: 15, topic: "علم البيئة - العلاقات الغذائية", text: "تعيش بعض النباتات اللاحمة في مستنقعات فقيرة بالنيتروجين. كيف تحصل على جزء من حاجتها إلى هذا العنصر؟", options: ["التطفل على نباتات أخرى", "تبادل المنفعة مع البكتيريا فقط", "اصطياد الحشرات وهضمها", "تحليل الحيوانات الميتة بنفسها"], answer: 2, explanation: "تلتقط النباتات اللاحمة الحشرات وتهضمها للحصول على عناصر معدنية، ومنها النيتروجين، في البيئات الفقيرة به." },
  { id: "6ad0103163cd9c24f9f40f3a", page: 136, number: 16, topic: "علم البيئة - مستويات التنظيم", text: "ماذا تسمى مجموعة أفراد من النوع نفسه تعيش في منطقة جغرافية واحدة؟", options: ["نظام بيئي", "جماعة حيوية", "مجتمع بلازمي", "غلاف حيوي"], answer: 1, explanation: "الجماعة الحيوية مجموعة أفراد من النوع نفسه تعيش في المكان والوقت نفسيهما." },
  { id: "6ad0103163cd9c24f9f40f3b", page: 136, number: 17, topic: "علم البيئة - العوامل البيئية", text: "ما العامل اللاحيوي الذي قد يحفز بعض الحيوانات على الدخول في السبات الشتوي؟", options: ["انخفاض درجة الحرارة", "قلة مصادر الغذاء", "زيادة المنافسة على الموارد", "ازدياد أعداد المفترسات"], answer: 0, explanation: "انخفاض درجة الحرارة عامل لاحيوي موسمي قد يدفع بعض الحيوانات إلى السبات؛ أما توافر الغذاء والمنافسون والمفترسون فعوامل حيوية." },
  { id: "6ad0103163cd9c24f9f40f3c", page: 136, number: 18, topic: "علم البيئة - العلاقات الغذائية", text: "ما اسم الحيوان الذي يتغذى على جثث الحيوانات التي قتلها أو ماتت لأسباب أخرى؟", options: ["آكل لحوم فقط", "كانس", "ذاتي التغذية", "قارت"], answer: 1, explanation: "الحيوان الكانس يتغذى على الجيف أو بقايا الحيوانات الميتة بدلًا من قتل الفريسة الحية بالضرورة." },
  { id: "6ad0103163cd9c24f9f40f3e", page: 136, number: 20, topic: "علم البيئة - مستويات التنظيم", text: "أي مستوى من مستويات التنظيم البيئي الآتية أقل تعقيدًا؟", options: ["النظام البيئي", "المنطقة الحيوية", "المجتمع الحيوي", "الجماعة الحيوية"], answer: 3, explanation: "الجماعة الحيوية تضم أفراد النوع نفسه، وهي أقل تعقيدًا من المجتمع الحيوي الذي يضم جماعات أنواع مختلفة، ومن النظام البيئي والمنطقة الحيوية." },
  { id: "6ad0103163cd9c24f9f40f3f", page: 136, number: 21, topic: "علم البيئة - العلاقات البيئية", text: "تضع أنثى طائر بيضها في عش طائر آخر، وقد تتخلص من بيضه أو صغاره، ثم يعتمد صغارها على الطائر المضيف في الرعاية. ما نوع العلاقة؟", options: ["افتراس", "تطفل حضانة", "تقايض", "تعايش"], answer: 1, explanation: "يستفيد الطائر الذي يضع بيضه، بينما يتحمل الطائر المضيف كلفة حضانة الصغار ورعايتها؛ وهذا مثال على تطفل الحضانة." },
  { id: "6ad0103163cd9c24f9f40f40", page: 136, number: 22, topic: "علم البيئة - العلاقات البيئية", text: "عندما يقل الماء في منطقة ما، تتنافس المخلوقات عليه وقد تموت الكائنات الأقل قدرة على الحصول عليه. ما العلاقة التي تفسر ذلك؟", options: ["تنافس", "تقايض", "تعايش", "تطفل"], answer: 0, explanation: "يحدث التنافس عندما تستخدم مخلوقات متعددة موردًا محدودًا مثل الماء." },
  { id: "6ad0103163cd9c24f9f40f41", page: 136, number: 23, topic: "علم البيئة - العلاقات البيئية", text: "تزيل بعض الطيور الحشرات الماصة للدم عن جلد وحيد القرن وتتغذى عليها. ما نوع العلاقة المرجح؟", options: ["تنافس", "تقايض (تبادل منفعة)", "تعايش", "تطفل"], answer: 1, explanation: "تحصل الطيور على الغذاء، ويستفيد وحيد القرن من إزالة بعض الطفيليات؛ لذا يستفيد الطرفان." },
  { id: "6ad0103163cd9c24f9f40f42", page: 137, number: 24, topic: "علم البيئة - العلاقات الغذائية", text: "ما اسم مخطط يوضح عدة مسارات مترابطة لانتقال الغذاء والطاقة بين أنواع متعددة؟", options: ["سلسلة غذائية", "شبكة غذائية", "هرم كتلة", "كتلة حيوية"], answer: 1, explanation: "تجمع الشبكة الغذائية سلاسل غذائية متعددة مترابطة، وتوضح أكثر من مسار لانتقال الطاقة." },
  { id: "6ad0103163cd9c24f9f40f43", page: 137, number: 27, topic: "علم البيئة - مستويات التنظيم", text: "ما اسم مجموعة جماعات حيوية لأنواع مختلفة تعيش وتتفاعل في المكان نفسه؟", options: ["الجماعة الحيوية", "المنطقة الحيوية", "المجتمع الحيوي", "النظام البيئي"], answer: 2, explanation: "يتكون المجتمع الحيوي من جماعات أنواع مختلفة تعيش وتتفاعل في مساحة واحدة؛ ويشمل النظام البيئي أيضًا العوامل اللاحيوية." },
  { id: "6ad0103163cd9c24f9f40f44", page: 137, number: 28, topic: "علم البيئة - العلاقات البيئية", text: "إذا أُدخل مخلوق حي إلى بيئة للحد من مخلوق حي آخر، فقد تقوم بينهما أي علاقة؟", options: ["تطفل أو افتراس", "تطفل أو تقايض", "افتراس أو تعايش", "تكافل أو تقايض"], answer: 0, explanation: "قد يحد المخلوق المدخل من الآخر بافتراسه أو بالتطفل عليه؛ ويعتمد نوع المكافحة الحيوية على الكائنين المستخدمين." },
  { id: "6ad0103163cd9c24f9f40f45", page: 137, number: 29, topic: "علم البيئة - السلاسل الغذائية", text: "أي تسلسل في الجدول يمثل انتقال الطاقة من المنتج إلى مستهلكات أعلى؟", options: ["منتج ← قارت ← آكل أعشاب ← آكل لحوم", "منتج ← آكل أعشاب ← قارت ← آكل لحوم", "منتج ← آكل لحوم ← آكل أعشاب ← قارت", "قارت ← منتج ← آكل أعشاب ← آكل لحوم"], answer: 1, explanation: "يبدأ المسار بالمنتج، ثم يمكن أن تنتقل الطاقة إلى آكل الأعشاب، ثم إلى قارت أو مستهلك أعلى، ثم إلى آكل اللحوم." },
  { id: "6ad0103163cd9c24f9f40f46", page: 137, number: 30, topic: "علم البيئة - المستويات الغذائية", text: "أي الحيوانات الآتية لا يعد عادة مستهلكًا ثانويًا؟", options: ["الذئب", "النمر", "الأسد", "الفيل"], answer: 3, explanation: "الفيل عاشب في الغالب ويتغذى على النباتات، بينما الذئب والنمر والأسد مفترسات وقد تعمل مستهلكات ثانوية أو أعلى بحسب السلسلة الغذائية." },
  { id: "6ad0103163cd9c24f9f40f48", page: 137, number: 32, topic: "علم البيئة - المستويات الغذائية", text: "هرم بيئي يبيّن أن كتلة المستوى الأدنى 1000 كغ، والذي يليه 100 كغ، ثم 10 كغ، ثم 1 كغ. ما نوعه؟", options: ["هرم طاقة", "هرم كتلة حيوية", "هرم أعداد", "هرم انتقال"], answer: 1, explanation: "تعرض القيم كتلة المخلوقات في كل مستوى غذائي؛ لذلك يمثل الشكل هرم كتلة حيوية." },
  { id: "6ad0103163cd9c24f9f40f49", page: 137, number: 33, topic: "علم البيئة - العوامل البيئية", text: "أي كائن حساس يُستخدم مؤشرًا حيويًا لمراقبة جودة الهواء والتلوث؟", options: ["الأشنات", "الحشائش", "أعداد الحشرات وحدها", "أعداد الحيوانات"], answer: 0, explanation: "تتأثر الأشنات بملوثات الهواء، لذلك يستخدم وجودها أو تراجعها مؤشرًا حيويًا عند تقييم جودة الهواء." },
  { id: "6ad0103163cd9c24f9f40f4a", page: 137, number: 34, topic: "علم البيئة - العلاقات البيئية", text: "ما العلاقة التي يستفيد فيها كلا المخلوقين؟", options: ["تعايش يستفيد فيه طرف واحد", "تطفل", "افتراس", "تقايض (تبادل منفعة)"], answer: 3, explanation: "في التقايض أو تبادل المنفعة يستفيد كلا الطرفين من العلاقة." },
  { id: "6ad0103163cd9c24f9f40f4b", page: 137, number: 35, topic: "علم البيئة - المستويات الغذائية", text: "يوضح شكل مستويات غذائية مع أعداد 1000 ثم 100 ثم 10 ثم 1 فرد. ما نوع الهرم؟", options: ["هرم أعداد", "هرم كتلة", "هرم طاقة", "هرم انتقال"], answer: 0, explanation: "يعرض الشكل عدد الأفراد في كل مستوى غذائي، لذلك فهو هرم أعداد." },
  { id: "6ad0103163cd9c24f9f40f4c", page: 138, number: 36, topic: "علم البيئة - السلاسل الغذائية", text: "في سلسلة نباتات ← حشرات ← ضفادع ← ثعابين، أي مجموعة تكون عادة الأقل عددًا؟", options: ["النباتات", "الحشرات", "الضفادع", "الثعابين"], answer: 3, explanation: "ينتقل مقدار أقل من الطاقة إلى المستويات الغذائية الأعلى، لذا يكون عدد المفترسات العليا مثل الثعابين عادة أقل." },
  { id: "6ad0103163cd9c24f9f40f4d", page: 138, number: 37, topic: "علم البيئة - العلاقات البيئية", text: "ما العلاقة بين الفطر والطحلب في الأشنات؟", options: ["تبادل منفعة", "افتراس", "تطفل", "تنافس"], answer: 0, explanation: "يوفر الفطر للطحلب الحماية والاحتفاظ بالماء، ويصنع الطحلب مواد عضوية بالتمثيل الضوئي؛ لذا يستفيد الطرفان." },
  { id: "6ad0103163cd9c24f9f40f4e", page: 138, number: 38, topic: "علم البيئة - دورات العناصر", text: "أي مركب يمكن أن يخزن الكربون والأكسجين في صورة طويلة الأمد ضمن الصخور؟", options: ["كربونات الكالسيوم", "الفوسفات", "الأمونيوم", "النترات"], answer: 0, explanation: "تحتوي كربونات الكالسيوم في الصخور الرسوبية والأصداف على الكربون والأكسجين، وقد تخزنهما مددًا طويلة." },
  { id: "6ad0103163cd9c24f9f40f4f", page: 138, number: 39, topic: "علم البيئة - العوامل البيئية", text: "أي مما يأتي عامل لاحيوي يؤثر في المناطق العشبية؟", options: ["نمو الفطريات والطحالب", "قلة الأمطار الموسمية", "زيادة آكلات العشب", "قلة أعداد آكلات اللحوم"], answer: 1, explanation: "كمية الأمطار وتوقيتها عاملان لاحيويان يؤثران في نمو النباتات وتوزع الكائنات في المناطق العشبية." },
  { id: "6ad0103163cd9c24f9f40f50", page: 138, number: 40, topic: "علم البيئة - تدفق الطاقة", text: "أي مجموعة توفر الطاقة الكيميائية ومصدر الغذاء الأولي لمعظم الشبكات الغذائية؟", options: ["المخلوقات الذاتية التغذية", "المحللات", "القارتة", "الكانسة"], answer: 0, explanation: "تحول المخلوقات الذاتية التغذية الطاقة، غالبًا من الشمس، إلى مادة عضوية تبدأ منها معظم الشبكات الغذائية." },
  { id: "6ad0103163cd9c24f9f40f51", page: 138, number: 41, topic: "علم البيئة - العلاقات الغذائية", text: "إذا كان قرد البابون يأكل النباتات والحيوانات، فما نمط تغذيته؟", options: ["آكل أعشاب", "آكل لحوم", "كانس", "قارت"], answer: 3, explanation: "القارت يتغذى على مواد نباتية وحيوانية؛ ويعد البابون مثالًا على ذلك." },
  { id: "6ad0103163cd9c24f9f40f52", page: 138, number: 42, topic: "علم البيئة - المناطق الحيوية", text: "أي منطقة حيوية باردة تخلو غالبًا من الأشجار ويعيش فيها الدب القطبي؟", options: ["التندرا", "الغابات الشمالية", "المناطق العشبية", "المناطق الاستوائية"], answer: 0, explanation: "التندرا القطبية منطقة شديدة البرودة وقليلة الأشجار، وتوجد في نطاق القطب الشمالي الذي يعيش فيه الدب القطبي." },
  { id: "6ad0103163cd9c24f9f40f54", page: 138, number: 44, topic: "علم البيئة - العلاقات الغذائية", text: "ما المخلوقات التي تفكك بقايا المخلوقات الميتة والمخلفات العضوية؟", options: ["المفترسات", "المحللات", "المجترات", "القارتة"], answer: 1, explanation: "تفرز المحللات إنزيمات تفكك المواد العضوية في البقايا والفضلات إلى مركبات أبسط." },
  { id: "6ad0103163cd9c24f9f40f55", page: 138, number: 45, topic: "علم البيئة - السلاسل الغذائية", text: "أي عمود في الجدول يمثل تسلسلًا غذائيًا صحيحًا يبدأ بمنتج ثم ينتقل إلى مستهلكات أعلى؟", options: ["العمود 1", "العمود 2", "العمود 3", "العمود 4"], answer: 1, explanation: "يبدأ العمود الثاني بمنتج، ثم يليه آكل أعشاب، ثم مستهلك أعلى، بما يتفق مع انتقال الطاقة من المنتج إلى مستويات المستهلكين." },
  { id: "6ad0103163cd9c24f9f40f56", page: 138, number: 46, topic: "علم البيئة - دورات العناصر", text: "إذا كان حقل فقيرًا بالنيتروجين، فلماذا قد تساعد زراعة البقوليات على تحسين خصوبة تربته؟", options: ["تضيف الكربون من الهواء مباشرة", "تستضيف بكتيريا تثبت النيتروجين", "تنتج الفوسفور", "تضيف البوتاسيوم إلى التربة"], answer: 1, explanation: "تعيش بكتيريا مثبتة للنيتروجين في عقد جذور كثير من البقوليات، وتحول النيتروجين الجوي إلى مركبات يمكن أن تستفيد منها النباتات." },
  { id: "6ad0103163cd9c24f9f40f57", page: 138, number: 47, topic: "علم البيئة - مستويات التنظيم", text: "ماذا تسمى مجموعة أسماك من النوع نفسه تعيش وتتكاثر في المكان نفسه؟", options: ["المجتمع الحيوي", "الجماعة الحيوية", "النظام البيئي", "الغلاف الحيوي"], answer: 1, explanation: "تسمى مجموعة أفراد النوع نفسه التي تعيش وتتكاثر في مكان واحد جماعة حيوية." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40f3d", page: 136, number: 19, reason: "مكرر في المهارة والإجابة لسؤال الجيف والكانسات في الصفحة نفسها؛ يكرر مثالًا آخر على النسور بعد سؤال سابق عن الضباع التي تتغذى على الجيف." },
  { id: "6ad0103163cd9c24f9f40f47", page: 137, number: 31, reason: "يعرض «هرمًا افتراضيًا» مقلوبًا من دون تحديد ما إذا كان هرم أعداد أو كتلة أو طاقة، ثم يطلب توقع أثره على الكائنات؛ لا تكفي البيانات لتحديد نتيجة وحيدة، وهرم الطاقة لا يكون مقلوبًا." },
  { id: "6ad0103163cd9c24f9f40f53", page: 138, number: 43, reason: "مكرر مباشرة لسؤال الأشنات في الصفحة السابقة عن استخدامها مؤشرًا للتلوث وجودة الهواء." },
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
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة مفتاح الإجابة والشرح مع المصدر، وتصحيح المفتاح أو إزالة الاعتماد على صورة عند الحاجة.", updatedAt: reviewedAt,
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
