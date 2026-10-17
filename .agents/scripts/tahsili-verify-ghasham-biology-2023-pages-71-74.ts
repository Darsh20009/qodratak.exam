import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const subject = "أحياء";
const nervous = "أجهزة جسم الإنسان - الجهاز العصبي";
const circulation = "أجهزة جسم الإنسان - الدوران والتنفس";
const approvals = [
  { id: "6ad0103163cd9c24f9f40d92", page: 71, number: 1, subcategory: nervous, text: "أي منطقة في الدماغ تربط بين تنظيم الجهاز العصبي وتنظيم الهرمونات؟", options: ["المخ", "المخيخ", "تحت المهاد", "النخاع المستطيل"], answer: 2, explanation: "يربط تحت المهاد بين الجهاز العصبي وجهاز الغدد الصماء عبر تنظيم إفرازات الغدة النخامية." },
  { id: "6ad0103163cd9c24f9f40d93", page: 71, number: 2, subcategory: nervous, text: "كيف يكون توزيع أيونات الصوديوم في الخلية العصبية وقت الراحة؟", options: ["تركيزها خارج الخلية أعلى من داخلها", "تركيزها داخل الخلية أعلى من خارجها", "تركيز أيونات البوتاسيوم خارجها أعلى من داخلها", "تكون الخلية عند جهد العتبة"], answer: 0, explanation: "في حالة الراحة يكون تركيز الصوديوم أعلى خارج الخلية العصبية، بينما يكون تركيز البوتاسيوم أعلى داخلها." },
  { id: "6ad0103163cd9c24f9f40d94", page: 71, number: 3, subcategory: nervous, text: "ما المنطقة المسؤولة عن تنظيم درجة حرارة الجسم؟", options: ["تحت المهاد", "المخ", "المخيخ", "النخاع المستطيل"], answer: 0, explanation: "يراقب تحت المهاد حرارة الجسم ويساعد على تنظيم الاستجابات اللازمة للمحافظة عليها." },
  { id: "6ad0103163cd9c24f9f40d95", page: 71, number: 4, subcategory: nervous, text: "أي منطقة في الدماغ تنظم الشعور بالجوع؟", options: ["تحت المهاد", "المخيخ", "القنطرة", "النخاع المستطيل"], answer: 0, explanation: "يسهم تحت المهاد في تنظيم الجوع والعطش ودرجة الحرارة." },
  { id: "6ad0103163cd9c24f9f40d96", page: 71, number: 5, subcategory: nervous, text: "ما الأثر المتوقع لتضرر المخيخ؟", options: ["عدم القدرة على النوم", "زيادة نبضات القلب", "بطء الكلام وحده", "اضطراب التوازن وتناسق المشي"], answer: 3, explanation: "يساعد المخيخ على الاتزان وتنسيق الحركات؛ لذلك قد يؤدي تضرره إلى اضطراب المشي والتناسق الحركي." },
  { id: "6ad0103163cd9c24f9f40d97", page: 71, number: 6, subcategory: nervous, text: "أي مادة قد يؤدي تعاطيها المزمن إلى ضمور في كتلة الدماغ؟", options: ["الكحول", "الكافيين", "مادة منبهة", "مسكنات الألم"], answer: 0, explanation: "يرتبط الاستخدام المزمن للكحول بتغيرات وضمور في أنسجة الدماغ. حُدد الاستخدام المزمن لتجنب تعميم أثر جرعة واحدة." },
  { id: "6ad0103163cd9c24f9f40d98", page: 71, number: 7, subcategory: nervous, text: "أي جزء من الدماغ يساعد على تنسيق حركات الأصابع عند استخدام لوحة المفاتيح؟", options: ["المخ", "القنطرة", "المخيخ", "النخاع المستطيل"], answer: 2, explanation: "ينسق المخيخ الحركات الدقيقة وتوقيتها، ومنها حركات الأصابع المتناسقة." },
  { id: "6ad0103163cd9c24f9f40d99", page: 71, number: 8, subcategory: nervous, text: "أي جزء من الدماغ يرتبط بوظائف الذاكرة؟", options: ["المخ", "المخيخ", "تحت المهاد", "النخاع المستطيل"], answer: 0, explanation: "ترتبط الذاكرة والتفكير والتعلم بوظائف المخ." },
  { id: "6ad0103163cd9c24f9f40d9a", page: 71, number: 9, subcategory: nervous, text: "أي جزء من الدماغ ينظم وظائف لا إرادية مثل التنفس ونبض القلب؟", options: ["المخ", "المخيخ", "النخاع المستطيل", "القنطرة"], answer: 2, explanation: "ينظم النخاع المستطيل وظائف لا إرادية مهمة، منها التنفس ومعدل ضربات القلب." },
  { id: "6ad0103163cd9c24f9f40d9b", page: 71, number: 10, subcategory: nervous, text: "أي قسم من الجهاز العصبي يهيئ الجسم لحالات الطوارئ والإجهاد؟", options: ["الجهاز العصبي المركزي", "الجهاز العصبي الجسمي", "الجهاز العصبي السمبثاوي", "الجهاز العصبي جار السمبثاوي"], answer: 2, explanation: "ينشط الجهاز العصبي السمبثاوي استجابة الكر والفر، فيهيئ الجسم للطوارئ والإجهاد." },
  { id: "6ad0103163cd9c24f9f40d9c", page: 71, number: 11, subcategory: nervous, text: "أي جهاز يفسر اتساع حدقة العين وتسارع نبضات القلب عند الإجهاد؟", options: ["الجهاز السمبثاوي", "الجهاز التنفسي", "الجهاز جار السمبثاوي", "الجهاز الهضمي"], answer: 0, explanation: "يؤدي تنشيط الجهاز السمبثاوي إلى اتساع الحدقة وتسارع نبضات القلب ضمن استجابة الإجهاد." },
  { id: "6ad0103163cd9c24f9f40d9d", page: 72, number: 12, subcategory: nervous, text: "كم زوجًا من الأعصاب الشوكية لدى الإنسان؟", options: ["6", "12", "31", "62"], answer: 2, explanation: "لدى الإنسان 31 زوجًا من الأعصاب الشوكية موزعة على مناطق العمود الفقري." },
  { id: "6ad0103163cd9c24f9f40d9e", page: 72, number: 13, subcategory: nervous, text: "أي مادة منبهة توجد في كثير من المشروبات الغازية؟", options: ["الكوكايين", "الكافيين", "البروتين", "الإنسولين"], answer: 1, explanation: "تحتوي بعض المشروبات الغازية على الكافيين، وهو مادة منبهة للجهاز العصبي." },
  { id: "6ad0103163cd9c24f9f40d9f", page: 72, number: 14, subcategory: nervous, text: "أي جزء من الدماغ يقع في مؤخرة الرأس ويساعد على الاتزان وتناسق الحركة؟", options: ["المخ", "المخيخ", "تحت المهاد", "الحبل الشوكي"], answer: 1, explanation: "يقع المخيخ في مؤخرة الدماغ، ويساعد على الاتزان وتنسيق الحركات. حُولت إشارة السهم إلى وصف نصي." },
  { id: "6ad0103163cd9c24f9f40da1", page: 72, number: 16, subcategory: nervous, text: "أي منطقة دماغية مسؤولة عن تنظيم الشعور بالعطش؟", options: ["المخيخ", "المخ", "تحت المهاد", "النخاع المستطيل"], answer: 2, explanation: "يسهم تحت المهاد في تنظيم العطش وتوازن الماء في الجسم." },
  { id: "6ad0103163cd9c24f9f40da2", page: 72, number: 17, subcategory: nervous, text: "أي أجزاء الجهاز العصبي المركزي تساعد على دقة النقر على لوحة مفاتيح الحاسوب؟", options: ["المخ", "المخيخ", "القنطرة", "النخاع المستطيل"], answer: 1, explanation: "يساعد المخيخ على تنسيق الحركات الدقيقة والمتتابعة، مثل النقر الدقيق على لوحة المفاتيح." },
  { id: "6ad0103163cd9c24f9f40da3", page: 72, number: 18, subcategory: nervous, text: "إلى أي فئة من المواد المؤثرة في الجهاز العصبي يُصنف الكحول؟", options: ["منبهات", "مضادات حيوية", "مخدرات", "مسكنات"], answer: 2, explanation: "الكحول مادة مثبطة تؤثر في الجهاز العصبي؛ ومن بين الخيارات يصنف ضمن المواد المخدرة، وليس منبهًا أو مضادًا حيويًا." },
  { id: "6ad0103163cd9c24f9f40da4", page: 72, number: 19, subcategory: nervous, text: "ما المصطلح الذي يصف اعتمادًا نفسيًا أو فسيولوجيًا على عقار؟", options: ["التحمل", "الإدمان", "المسكنات", "المنبهات"], answer: 1, explanation: "الإدمان اعتماد نفسي أو فسيولوجي على عقار، وقد يصاحبه تحمل وأعراض انسحاب." },
  { id: "6ad0103163cd9c24f9f40da5", page: 72, number: 20, subcategory: nervous, text: "إذا دخلت شوكة في إصبعك، فأي نوع من الأعصاب ينقل الإحساس بالألم إلى الجهاز العصبي المركزي؟", options: ["الحركي", "الحائر", "الشوكي", "الحسي"], answer: 3, explanation: "تنقل الأعصاب الحسية الإشارات من مستقبلات الألم في الجلد إلى الجهاز العصبي المركزي." },
  { id: "6ad0103163cd9c24f9f40da6", page: 72, number: 21, subcategory: nervous, text: "إذا تضرر المخيخ، فأي أثر حركي يُتوقع؟", options: ["فقدان التوازن", "ارتفاع الحرارة", "عدم النطق حتمًا", "فقدان الذاكرة"], answer: 0, explanation: "يؤدي تضرر المخيخ غالبًا إلى ضعف الاتزان وتناسق الحركة. حُولت إشارة الشكل إلى اسم المنطقة ووظيفتها." },
  { id: "6ad0103163cd9c24f9f40da7", page: 72, number: 22, subcategory: nervous, text: "أي مما يأتي لا يدخل مباشرة في قوس الفعل المنعكس؟", options: ["الدماغ", "الحبل الشوكي", "خلايا حسية وحركية", "خلايا بينية"], answer: 0, explanation: "يعالج الحبل الشوكي قوس الفعل المنعكس بسرعة؛ ويصل الإحساس إلى الدماغ بعد حدوث الاستجابة." },
  { id: "6ad0103163cd9c24f9f40da8", page: 72, number: 23, subcategory: nervous, text: "إذا شعرت بالحر في يوم صيفي، فأي جزء من الدماغ يساعد على إدراك الحرارة وتنظيم استجابة الجسم؟", options: ["المخ", "المخيخ", "النخاع المستطيل", "تحت المهاد"], answer: 3, explanation: "يتابع تحت المهاد حرارة الجسم وينسق استجابات مثل التعرق للمحافظة على الاتزان الحراري." },
  { id: "6ad0103163cd9c24f9f40da9", page: 72, number: 24, subcategory: nervous, text: "ما اسم الفجوة بين أغمدة الميالين على طول المحور العصبي؟", options: ["الزوائد الشجرية", "المحور", "عقدة رانفييه", "النواة"], answer: 2, explanation: "عقد رانفييه فجوات صغيرة بين أغمدة الميالين، وتساعد على انتقال السيال العصبي بسرعة. استُبدل تحديد الجزء بالدائرة بوصفه." },
  { id: "6ad0103163cd9c24f9f40daa", page: 72, number: 25, subcategory: nervous, text: "لماذا تسحب يدك بسرعة عند لمس كوب شاي شديد الحرارة؟", options: ["ينفذ الحبل الشوكي فعلًا منعكسًا سريعًا", "ينشط الجهاز السمبثاوي فقط", "يتدخل المخيخ وحده", "ينفذ النخاع المستطيل الفعل مباشرة"], answer: 0, explanation: "ينسق الحبل الشوكي الفعل المنعكس بسرعة قبل معالجة الدماغ الواعية للإحساس." },
  { id: "6ad0103163cd9c24f9f40dab", page: 73, number: 26, subcategory: nervous, text: "أي جزء من الدماغ يساعد على القفز بالحبل بسرعة مع تنسيق حركة القدمين؟", options: ["المخ", "تحت المهاد", "المخيخ", "جذع المخ"], answer: 2, explanation: "ينسق المخيخ الحركة والتوازن، بما في ذلك الحركات المتتابعة مثل القفز بالحبل." },
  { id: "6ad0103163cd9c24f9f40dac", page: 73, number: 27, subcategory: nervous, text: "ما الوظيفة الأساسية لمضخة الصوديوم والبوتاسيوم في الخلية العصبية؟", options: ["إعادة توزيع الأيونات للمحافظة على جهد الراحة", "بناء النواقل العصبية", "توليد التنبيه مباشرة", "رفع جهد العتبة"], answer: 0, explanation: "تستهلك المضخة الطاقة لنقل الصوديوم إلى خارج الخلية والبوتاسيوم إلى داخلها، فتساعد على استعادة التدرجات الأيونية وجهد الراحة." },
  { id: "6ad0103163cd9c24f9f40dad", page: 73, number: 28, subcategory: nervous, text: "خلال جهد الفعل، ماذا تسهم فيه مغادرة أيونات البوتاسيوم للخلية العصبية؟", options: ["إعادة استقطاب الغشاء واستعادة جهده", "توليد جهد العتبة", "بدء التنبيه بحد ذاته", "منع عودة الخلية إلى حالة الراحة"], answer: 0, explanation: "خروج أيونات البوتاسيوم من الخلية يسهم في إعادة استقطاب الغشاء والعودة نحو جهد الراحة." },
  { id: "6ad0103163cd9c24f9f40dae", page: 73, number: 29, subcategory: nervous, text: "أي جزء من الدماغ مسؤول عن اتزان الجسم؟", options: ["المخ", "المخيخ", "القنطرة", "النخاع المستطيل"], answer: 1, explanation: "يساعد المخيخ على حفظ التوازن وتنسيق الحركات." },
  { id: "6ad0103163cd9c24f9f40db0", page: 73, number: 31, subcategory: nervous, text: "أي جزء من الدماغ ينظم الشهيق والزفير اللاإراديين أثناء النوم؟", options: ["المخ", "المخيخ", "تحت المهاد", "النخاع المستطيل"], answer: 3, explanation: "ينظم النخاع المستطيل إيقاع التنفس ووظائف لا إرادية أخرى أثناء النوم واليقظة." },
  { id: "6ad0103163cd9c24f9f40db1", page: 73, number: 32, subcategory: nervous, text: "ما الاستجابة التي تساعد الجسم على مواجهة حيوان مفترس؟", options: ["الغدة الكظرية والجهاز جار السمبثاوي", "الغدة الكظرية والجهاز السمبثاوي", "الغدة الكظرية وحدها", "الجهاز السمبثاوي وحده"], answer: 1, explanation: "ينشط الجهاز السمبثاوي ويحفز إفراز الأدرينالين من الغدة الكظرية ضمن استجابة الكر والفر." },
  { id: "6ad0103163cd9c24f9f40db2", page: 74, number: 1, subcategory: circulation, text: "أي مكوّن من مكونات الدم يزداد عادة عند الاستجابة لعدوى بكتيرية؟", options: ["خلايا الدم الحمراء", "الصفائح الدموية", "خلايا الدم البيضاء", "البلازما"], answer: 2, explanation: "تشارك خلايا الدم البيضاء في الدفاع عن الجسم، وقد يرتفع عددها عند الإصابة بعدوى بكتيرية." },
  { id: "6ad0103163cd9c24f9f40db3", page: 74, number: 2, subcategory: circulation, text: "ضمن نظام فصائل ABO، أي فصيلة يمكنها استقبال خلايا دم حمراء من فصيلة AB؟", options: ["A", "B", "O", "AB"], answer: 3, explanation: "لا يستقبل دم AB خلايا دم حمراء من متبرع AB إلا صاحب الفصيلة AB؛ لوجود المستضدين A وB على خلايا المتبرع." },
  { id: "6ad0103163cd9c24f9f40db4", page: 74, number: 3, subcategory: circulation, text: "ما التجويفين اللذين يفصل بينهما الحجاب الحاجز؟", options: ["الرئة والقلب", "المعدة والأمعاء", "التجويف الصدري والتجويف البطني", "الدماغ والقلب"], answer: 2, explanation: "يفصل الحجاب الحاجز التجويف الصدري عن التجويف البطني." },
  { id: "6ad0103163cd9c24f9f40db5", page: 74, number: 4, subcategory: circulation, text: "عند توافق نظام ABO فقط وعدم معرفة فصيلة المريض بعد، أي فصيلة خلايا حمراء تعد المتبرع العام؟", options: ["A", "B", "AB", "O"], answer: 3, explanation: "ضمن نظام ABO فقط، خلايا فصيلة O لا تحمل مستضد A أو B. ويجب مراعاة عامل Rh والتوافق الطبي الكامل قبل نقل الدم." },
  { id: "6ad0103163cd9c24f9f40db6", page: 74, number: 5, subcategory: circulation, text: "أي عينة مناسبة لدراسة خلايا ناضجة تفتقد النواة؟", options: ["خيوط طحلب الإسبيروجيرا", "القمة النامية لنبات الفول", "الغزل الفطري لعيش الغراب", "خلايا الدم الحمراء في الجمل"], answer: 3, explanation: "تفقد خلايا الدم الحمراء الناضجة لدى الثدييات نواتها؛ وتشمل الثدييات الجمل." },
  { id: "6ad0103163cd9c24f9f40db7", page: 74, number: 6, subcategory: circulation, text: "ما التركيب الذي تفقده كريات الدم الحمراء الناضجة في الثدييات؟", options: ["الهيموغلوبين", "غشاء الخلية", "النواة", "السيتوبلازم"], answer: 2, explanation: "تفقد كريات الدم الحمراء الناضجة في الثدييات نواتها، ما يتيح مساحة أكبر للهيموغلوبين. صيغت الخيارات لتجنب وجود أكثر من إجابة صحيحة." },
  { id: "6ad0103163cd9c24f9f40db8", page: 74, number: 7, subcategory: circulation, text: "إلى أين ينقل الشريان الأبهر الدم المؤكسج من القلب؟", options: ["إلى الرئتين", "إلى أنسجة الجسم", "من الرئتين إلى القلب", "من الجسم إلى القلب"], answer: 1, explanation: "ينقل الشريان الأبهر الدم المؤكسج من البطين الأيسر إلى أنحاء الجسم." },
  { id: "6ad0103163cd9c24f9f40db9", page: 74, number: 8, subcategory: circulation, text: "ضمن نظام ABO فقط، ما الفصيلة التي ينبغي أن يتوافق معها المتبرع لصاحب فصيلة O؟", options: ["A", "B", "AB", "O"], answer: 3, explanation: "يستقبل صاحب فصيلة O خلايا دم حمراء من فصيلة O فقط ضمن نظام ABO؛ ويجب التحقق من عامل Rh والتوافق الطبي أيضًا." },
  { id: "6ad0103163cd9c24f9f40dba", page: 74, number: 9, subcategory: circulation, text: "إلى أين يذهب الدم عندما يغادر البطين الأيمن في قلب الإنسان؟", options: ["الرئتان", "الكبد", "الأمعاء", "الدماغ"], answer: 0, explanation: "يضخ البطين الأيمن الدم غير المؤكسج إلى الرئتين عبر الشريان الرئوي." },
  { id: "6ad0103163cd9c24f9f40dbb", page: 74, number: 10, subcategory: circulation, text: "ضمن نظام ABO، من أي فصائل يمكن لمتلقي فصيلة AB استقبال خلايا الدم الحمراء؟", options: ["A فقط", "B فقط", "O فقط", "A وB وAB وO"], answer: 3, explanation: "يستقبل صاحب فصيلة AB خلايا الدم الحمراء من الفصائل الأربع ضمن نظام ABO؛ ويبقى عامل Rh والتوافق الطبي ضروريين." },
  { id: "6ad0103163cd9c24f9f40dbc", page: 74, number: 11, subcategory: circulation, text: "ما وظيفة الفيبرين في الدم؟", options: ["تكوين شبكة تساعد على تجلط الدم", "التخلص من الفضلات", "تجميع الكالسيوم", "زيادة سيولة الدم"], answer: 0, explanation: "تكوّن خيوط الفيبرين شبكة تحبس خلايا الدم وتساعد على تثبيت الخثرة وإيقاف النزف." },
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
      subject, subcategory: item.subcategory, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.subcategory, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject, subcategory: item.subcategory, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال ومفتاحه ومعلومة المصدر، مع تصحيح الصياغة العلمية وإزالة الالتباس والاعتماد على الأشكال عند الحاجة.", updatedAt: reviewedAt,
    } });
  }
  summary.changed = true; console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Review batch failed."); process.exitCode = 1; })
  .finally(async () => { await disconnectFromMongoDB(); });
