import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

type SourceId =
  | "friday-evening-p2-biology-2024"
  | "friday-evening-p2-chemistry-2024"
  | "friday-evening-p2-physics-2024";

type Correction = {
  sourceId: SourceId;
  number: number;
  page: number;
  correctOptionIndex: number;
  optionMustContain: string[];
  text: string;
  explanation: string;
  reviewerNote?: string;
};

type Rejection = {
  sourceId: SourceId;
  number: number;
  page: number;
  note: string;
};

const REVIEWER = "source-verified-content-audit";
const SOURCE_COUNTS: Record<SourceId, number> = {
  "friday-evening-p2-biology-2024": 23,
  "friday-evening-p2-chemistry-2024": 23,
  "friday-evening-p2-physics-2024": 16,
};

const CORRECTIONS: Correction[] = [
  // Biology: answers checked against the provided solved PDF; two source-key errors corrected.
  { sourceId: "friday-evening-p2-biology-2024", number: 2, page: 2, correctOptionIndex: 0, optionMustContain: ["السيالن"], text: "أيُّ الأمراض الآتية مرض بكتيري ينتقل عبر الاتصال الجنسي؟", explanation: "السيلان عدوى بكتيرية تنتقل غالبًا عبر الاتصال الجنسي؛ أما الإيدز والقوباء التناسلية فسببهما فيروسات، والتيتانوس ليس عدوى منقولة جنسيًا." },
  { sourceId: "friday-evening-p2-biology-2024", number: 3, page: 2, correctOptionIndex: 1, optionMustContain: ["عديد"], text: "إلى أي نوع من الكربوهيدرات ينتمي النشا؟", explanation: "النشا يتكون من سلاسل طويلة من وحدات الجلوكوز؛ لذلك يصنف عديدَ السكاريد. مفتاح الإجابة المطبوع يختار البروتين، وهو خطأ علمي، لذا صُحح إلى الخيار ب.", reviewerNote: "صُحح المفتاح المطبوع بعد التحقق العلمي: النشا عديد السكاريد، وليس بروتينًا." },
  { sourceId: "friday-evening-p2-biology-2024", number: 4, page: 3, correctOptionIndex: 3, optionMustContain: ["جلوكوز"], text: "في التنفس الخلوي الهوائي، أيُّ المواد الآتية لا ينتج؟", explanation: "ينتج التنفس الخلوي الهوائي الماء وثاني أكسيد الكربون والطاقة، بينما يُستهلك الجلوكوز في بداية العملية؛ لذلك لا يكون ناتجًا." },
  { sourceId: "friday-evening-p2-biology-2024", number: 5, page: 3, correctOptionIndex: 0, optionMustContain: ["المانع"], text: "ما الهرمون الذي يزداد إفرازه عند الجلوس مدة طويلة تحت الشمس؟", explanation: "التعرق والتعرض للحرارة يقللان ماء الجسم؛ فيزداد إفراز الهرمون المضاد لإدرار البول للمساعدة على حفظ الماء وتقليل فقده في البول." },
  { sourceId: "friday-evening-p2-biology-2024", number: 9, page: 4, correctOptionIndex: 1, optionMustContain: ["غيرمتخصصة", "متخصصة"], text: "ما إحدى ميزات الخلايا الجذعية؟", explanation: "الخلايا الجذعية غير متخصصة، ويمكنها التمايز إلى خلايا متخصصة عند توفر الإشارات المناسبة." },
  { sourceId: "friday-evening-p2-biology-2024", number: 11, page: 5, correctOptionIndex: 0, optionMustContain: ["السوطيات"], text: "ما المجموعة التي تسبب ظاهرة المد الأحمر في البحار؟", explanation: "يرتبط المد الأحمر عادةً بالازدهار الكثيف للسوطيات الدوارة، وهي من العوالق النباتية." },
  { sourceId: "friday-evening-p2-biology-2024", number: 12, page: 5, correctOptionIndex: 0, optionMustContain: ["فكوكها"], text: "لماذا تستطيع الأفعى ابتلاع أجسام كبيرة نسبيًا؟", explanation: "ترتبط قدرة الأفعى على ابتلاع فريسة كبيرة بمرونة فكّيها واتساعهما؛ وليس بحجم العينين أو عضو جاكبسون." },
  { sourceId: "friday-evening-p2-biology-2024", number: 16, page: 7, correctOptionIndex: 3, optionMustContain: ["القطأقلمن"], text: "قارن معدل الأيض النوعي لقط كتلته 10 kg وفيل كتلته 1000 kg وفأر كتلته 0.8 kg. أيُّ العبارات صحيحة؟", explanation: "معدل الأيض لكل وحدة كتلة يكون أعلى عادةً في الحيوانات الأصغر؛ لذلك يكون معدل الأيض النوعي للقط أقل من الفأر." },
  { sourceId: "friday-evening-p2-biology-2024", number: 19, page: 8, correctOptionIndex: 3, optionMustContain: ["سلحفاه"], text: "أيُّ الحيوانات الآتية يفرز فضلات نيتروجينية على هيئة حمض البوليك؟", explanation: "السلحفاة من الزواحف، والزواحف تطرح الفضلات النيتروجينية غالبًا على هيئة حمض البوليك للمحافظة على الماء." },
  { sourceId: "friday-evening-p2-biology-2024", number: 21, page: 8, correctOptionIndex: 1, optionMustContain: ["القاطور"], text: "أيُّ الزواحف الآتية يمتلك قلبًا مكوّنًا من أربع حجرات؟", explanation: "القاطور من التمساحيات، وتمتلك التمساحيات قلبًا من أربع حجرات، بخلاف معظم الزواحف الأخرى." },
  { sourceId: "friday-evening-p2-biology-2024", number: 22, page: 9, correctOptionIndex: 0, optionMustContain: ["القرد"], text: "أيُّ الحيوانات الآتية لا يعيش في الصحراء؟", explanation: "القرد ليس حيوانًا صحراويًا في هذا السياق؛ أما الجمل والضب وكثير من الأفاعي فتوجد أنواع منها متكيفة مع البيئات الصحراوية." },
  { sourceId: "friday-evening-p2-biology-2024", number: 24, page: 9, correctOptionIndex: 2, optionMustContain: ["الليمفي", "المناعي"], text: "إلى أي جهازين يُنسب الطحال؟", explanation: "الطحال عضو من الجهاز الليمفي، وله دور أساسي في المناعة؛ لذا ينسب إلى الجهازين الليمفي والمناعي." },
  { sourceId: "friday-evening-p2-biology-2024", number: 31, page: 12, correctOptionIndex: 0, optionMustContain: ["وجوداطراف"], text: "بماذا يتشابه الضفدع والسلمندر البالغان؟", explanation: "كلاهما من البرمائيات، وللضفدع والسلمندر البالغين أطراف؛ أما وجود الذيل فليس صفة مشتركة بينهما." },
  { sourceId: "friday-evening-p2-biology-2024", number: 35, page: 13, correctOptionIndex: 2, optionMustContain: ["عدموجودمثانةبولية"], text: "أيُّ التكيفات الآتية يساعد الطيور على الطيران؟", explanation: "عدم وجود مثانة بولية يقلل كتلة الجسم، وهو من التكيفات التي تساعد الطيور على الطيران." },
  { sourceId: "friday-evening-p2-biology-2024", number: 36, page: 13, correctOptionIndex: 3, optionMustContain: ["اجرائيشرطي"], text: "تأتي قرود البابون إلى السيارات بعد أن اعتادت الحصول على الطعام من الأشخاص. ما نوع التعلم؟", explanation: "ارتباط الاقتراب من السيارة بالحصول على الطعام هو تعلم بالتعزيز؛ لذلك يصنف ضمن الإشراط الإجرائي. مفتاح المصدر يختار الإدراكي، وهو غير مطابق لوصف السلوك.", reviewerNote: "صُحح المفتاح المطبوع: الحصول على الطعام نتيجة للسلوك يمثل تعزيزًا وإشراطًا إجرائيًا." },

  // Chemistry: numerical notation in Arabic PDF text is normalized where needed.
  { sourceId: "friday-evening-p2-chemistry-2024", number: 1, page: 2, correctOptionIndex: 0, optionMustContain: ["اليوريا"], text: "ما الاسم الشائع للمركب CO(NH₂)₂؟", explanation: "المركب CO(NH₂)₂ هو اليوريا، وتسمى أيضًا كارباميد." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 2, page: 2, correctOptionIndex: 1, optionMustContain: ["الستراتوسفير"], text: "في أي طبقات الغلاف الجوي تتركز طبقة الأوزون؟", explanation: "تتركز طبقة الأوزون أساسًا في الستراتوسفير، حيث تمتص جزءًا كبيرًا من الأشعة فوق البنفسجية." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 3, page: 2, correctOptionIndex: 3, optionMustContain: ["تغيرفيزيائي"], text: "ما نوع التغير الذي لا يفقد المادة خواصها ولا ينتج مواد جديدة؟", explanation: "في التغير الفيزيائي يتغير شكل المادة أو حالتها دون تكوّن مادة جديدة؛ لذا تبقى هويتها الكيميائية كما هي." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 4, page: 3, correctOptionIndex: 1, optionMustContain: ["2", "o"], text: "أيُّ المركبات الآتية أعلى في درجة الغليان: C₆H₆ أم H₂O أم CH₄ أم NH₃؟", explanation: "لجزيئات الماء روابط هيدروجينية قوية بين الجزيئات، فتحتاج طاقة أكبر للانفصال؛ لذلك درجة غليانه أعلى من الخيارات الأخرى." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 5, page: 3, correctOptionIndex: 0, optionMustContain: ["هايزن"], text: "ما المبدأ الذي يقرر استحالة تحديد موضع الإلكترون وزخمه بدقة في الوقت نفسه؟", explanation: "مبدأ هايزنبرغ لعدم اليقين يضع حدًا لدقة معرفة موضع الجسيم وزخمه معًا." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 6, page: 4, correctOptionIndex: 1, optionMustContain: ["nh", "4"], text: "ما الحمض المرافق للقاعدة NH₃؟", explanation: "يتكون الحمض المرافق بإضافة بروتون H⁺ إلى القاعدة: NH₃ + H⁺ → NH₄⁺." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 8, page: 4, correctOptionIndex: 2, optionMustContain: ["hg"], text: "أيُّ الأيونات الآتية أسهل اختزالًا وفق أنصاف التفاعلات المعطاة؟", explanation: "الأيون ذو جهد الاختزال الأعلى يكتسب الإلكترونات بسهولة أكبر. جهد اختزال Hg²⁺/Hg أعلى قليلًا من Ag⁺/Ag، لذا يكون اختزال Hg²⁺ هو الأسهل بين الخيارات." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 10, page: 5, correctOptionIndex: 0, optionMustContain: ["خليةجافة"], text: "ما نوع الخلية التي يكون محلولها الموصل خليطًا كيميائيًا مع الماء على هيئة عجينة رطبة؟", explanation: "وجود الإلكتروليت على هيئة عجينة رطبة من صفات الخلية الجافة." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 11, page: 5, correctOptionIndex: 1, optionMustContain: ["قاعده"], text: "إذا كانت قيمة pH لمحلول أكبر من 7، فما صفته؟", explanation: "عند 25°C يكون المحلول قاعديًا إذا تجاوزت قيمة pH العدد 7." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 13, page: 6, correctOptionIndex: 2, optionMustContain: ["يتحللالسكر"], text: "أيُّ العبارات الآتية تصف خاصية كيميائية؟", explanation: "تحلل السكر إلى مواد جديدة تغير كيميائي؛ أما اللون والحالة الصلبة فهما صفتان فيزيائيتان." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 16, page: 7, correctOptionIndex: 0, optionMustContain: ["atp"], text: "أيُّ المركبات الآتية مصدر مباشر للطاقة الكيميائية في الخلية؟", explanation: "ATP هو جزيء نقل الطاقة المباشر الأكثر استخدامًا في الخلايا." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 23, page: 9, correctOptionIndex: 0, optionMustContain: ["222", "rn"], text: "عند اضمحلال الراديوم-226 بإصدار جسيم ألفا، ما النواة الناتجة؟", explanation: "في اضمحلال ألفا ينقص العدد الكتلي 4 والعدد الذري 2؛ لذلك ²²⁶₈₈Ra ينتج ²²²₈₆Rn." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 24, page: 10, correctOptionIndex: 0, optionMustContain: ["hcl"], text: "أيُّ المواد الآتية حمض أرهينيوس؟", explanation: "حمض أرهينيوس يزيد تركيز أيونات H⁺ في الماء؛ ويتأين HCl ليعطي H⁺ وCl⁻." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 25, page: 10, correctOptionIndex: 0, optionMustContain: ["بيتا"], text: "ما اسم الإشعاع المكوّن من إلكترونات ذات شحنة سالبة واحدة؟", explanation: "جسيم بيتا السالب هو إلكترون سريع يحمل شحنة −1." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 27, page: 11, correctOptionIndex: 3, optionMustContain: ["تصادمها"], text: "لماذا يزداد حجم بالون الهيليوم عند تعرضه لأشعة الشمس؟", explanation: "تسخين الغاز يزيد متوسط الطاقة الحركية لجسيماته؛ فتزداد سرعة تصادمها بجدران البالون ويتمدد حتى يتوازن الضغط." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 29, page: 11, correctOptionIndex: 2, optionMustContain: ["فوتون"], text: "أيُّ الجسيمات الآتية يحمل طاقة ولا يملك كتلة سكون؟", explanation: "الفوتون كمّ الضوء، يحمل طاقة وزخمًا، وكتلة سكونه تساوي صفرًا." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 30, page: 12, correctOptionIndex: 2, optionMustContain: ["oh"], text: "ما تعريف القاعدة حسب أرهينيوس؟", explanation: "قاعدة أرهينيوس مادة تزيد تركيز أيونات OH⁻ عند ذوبانها في الماء." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 31, page: 12, correctOptionIndex: 0, optionMustContain: ["8", "8"], text: "إذا كان pH كريم البشرة 5.2، فما قيمة pOH عند 25°C؟", explanation: "عند 25°C: pH+pOH=14. إذن pOH=14−5.2=8.8.", reviewerNote: "نُظّم اتجاه الأرقام في السؤال من 2.5 إلى 5.2 وفق قراءة المصدر ومفتاحه؛ الإجابة 8.8." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 32, page: 12, correctOptionIndex: 0, optionMustContain: ["القاعدية"], text: "إذا كانت قيمة pH لمحلول تساوي 13، فما صفته؟", explanation: "القيمة 13 أكبر من 7؛ لذلك المحلول قاعدي." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 33, page: 13, correctOptionIndex: 0, optionMustContain: ["حمض"], text: "إذا كانت قيمة pOH لمحلول 8.5، فما صفته عند 25°C؟", explanation: "pH=14−8.5=5.5، وهي أقل من 7؛ لذلك المحلول حمضي.", reviewerNote: "نُظّم اتجاه الأرقام في السؤال إلى pOH=8.5؛ عندها pH=5.5 والإجابة حمض." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 34, page: 13, correctOptionIndex: 0, optionMustContain: ["هايزنبرج"], text: "أيُّ مبدأ يفسر استحالة تحديد موضع الإلكترون وسرعته بدقة في الوقت نفسه؟", explanation: "مبدأ هايزنبرغ لعدم اليقين يمنع تحديد موضع الإلكترون وزخمه بدقة مطلقة في اللحظة نفسها." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 35, page: 13, correctOptionIndex: 1, optionMustContain: ["hcl", "naoh"], text: "أيُّ تفاعل تعادل من الآتي يعطي محلولًا متعادلًا تقريبًا عند نقطة التكافؤ؟", explanation: "تفاعل الحمض القوي HCl مع القاعدة القوية NaOH ينتج ماءً وملحًا متعادلًا؛ لذا يكون pH عند نقطة التكافؤ قريبًا من 7." },
  { sourceId: "friday-evening-p2-chemistry-2024", number: 40, page: 15, correctOptionIndex: 2, optionMustContain: ["co2"], text: "ما الغاز الذي يؤدي إلى انتفاخ العجين بعد إضافة الخميرة؟", explanation: "تنتج الخميرة غاز ثاني أكسيد الكربون أثناء التخمر؛ فتحتجزه فقاعات العجين ويتمدد." },

  // Physics: one printed key was inconsistent with the photoelectric equation and is corrected.
  { sourceId: "friday-evening-p2-physics-2024", number: 1, page: 1, correctOptionIndex: 0, optionMustContain: ["2π", "18"], text: "تدور كرة دورة كاملة كل 18 ساعة. ما سرعتها الزاوية بوحدة rad/h؟", explanation: "السرعة الزاوية لدورة كاملة هي ω=2π/T؛ وبما أن T=18 h فإن ω=2π/18=π/9 rad/h." },
  { sourceId: "friday-evening-p2-physics-2024", number: 8, page: 4, correctOptionIndex: 2, optionMustContain: ["تبعث", "2"], text: "انتقلت طاقة اهتزاز الذرة من 5hf إلى 3hf. ماذا يحدث؟", explanation: "انخفضت طاقة الذرة بمقدار 5hf−3hf=2hf؛ لذلك تبعث الذرة فوتونًا طاقته 2hf." },
  { sourceId: "friday-evening-p2-physics-2024", number: 9, page: 4, correctOptionIndex: 1, optionMustContain: ["210", "84"], text: "ما الرمز الصحيح للنواة الناتجة X في اضمحلال بيتا السالب للنواة ²¹⁰₈₃Bi؟", explanation: "في اضمحلال بيتا السالب يتحول نيوترون إلى بروتون؛ يبقى العدد الكتلي 210 ويزداد العدد الذري من 83 إلى 84، فتكون النواة X هي ²¹⁰₈₄X." },
  { sourceId: "friday-evening-p2-physics-2024", number: 10, page: 4, correctOptionIndex: 1, optionMustContain: ["ضغطالهواء"], text: "كيف ينتقل الصوت من المصدر إلى السامع في الهواء؟", explanation: "ينتقل الصوت في الهواء على هيئة تضاغطات وتخلخلات؛ أي تغيرات متتابعة في ضغط الهواء." },
  { sourceId: "friday-evening-p2-physics-2024", number: 11, page: 5, correctOptionIndex: 2, optionMustContain: ["لنز"], text: "ما القانون الذي ينص على أن اتجاه التيار الحثي يعاكس التغير في المجال المغناطيسي المسبب له؟", explanation: "هذا هو قانون لنز؛ يحدد اتجاه التيار الحثي بحيث يعاكس التغير في الفيض المغناطيسي الذي أنشأه." },
  { sourceId: "friday-evening-p2-physics-2024", number: 12, page: 5, correctOptionIndex: 0, optionMustContain: ["مغلقا"], text: "متى يُحفظ زخم نظام مكوّن من كرتين؟", explanation: "يبقى الزخم الكلي ثابتًا عندما يكون النظام معزولًا عن محصلة القوى الخارجية؛ ويعبّر خيار النظام المغلق والمعزول عن هذا الشرط." },
  { sourceId: "friday-evening-p2-physics-2024", number: 14, page: 6, correctOptionIndex: 1, optionMustContain: ["عددلفات"], text: "أيُّ العوامل الآتية يؤثر في شدة المجال المغناطيسي لملف لولبي؟", explanation: "شدة المجال داخل الملف اللولبي تتناسب طرديًا مع عدد لفاته لكل وحدة طول عند ثبات التيار." },
  { sourceId: "friday-evening-p2-physics-2024", number: 15, page: 6, correctOptionIndex: 1, optionMustContain: ["باشن"], text: "إلى أي سلسلة ينتمي انتقال الإلكترون من المستوى 5 إلى المستوى 3؟", explanation: "كل انتقال ينتهي عند المستوى n=3 ينتمي إلى سلسلة باشن." },
  { sourceId: "friday-evening-p2-physics-2024", number: 16, page: 6, correctOptionIndex: 3, optionMustContain: ["β"], text: "ما الإشعاع الذي يتكون من إلكترون يحمل شحنة سالبة واحدة؟", explanation: "جسيم بيتا السالب هو إلكترون، وشحنته −e." },
  { sourceId: "friday-evening-p2-physics-2024", number: 17, page: 7, correctOptionIndex: 0, optionMustContain: ["التجربة"], text: "ما الخطوة التي تأتي عادةً بعد صياغة الفرضية في المنهج العلمي؟", explanation: "تُختبر الفرضية بإجراء تجربة أو تحقق مناسب، ثم تُحلل النتائج ويُستخلص الاستنتاج." },
  { sourceId: "friday-evening-p2-physics-2024", number: 18, page: 7, correctOptionIndex: 0, optionMustContain: ["طاقةوزخم"], text: "ما خواص الفوتون؟", explanation: "للفوتون طاقة وزخم، لكن كتلته السكونية تساوي صفرًا." },
  { sourceId: "friday-evening-p2-physics-2024", number: 20, page: 8, correctOptionIndex: 0, optionMustContain: ["فولت"], text: "ما اسم الطاقة التي يكتسبها إلكترون عند تسارعه عبر فرق جهد مقداره فولت واحد؟", explanation: "تسمى هذه الطاقة إلكترون فولت (eV)، وهي مقدار الطاقة التي يكتسبها إلكترون عند عبوره فرق جهد 1 V." },
  { sourceId: "friday-evening-p2-physics-2024", number: 21, page: 8, correctOptionIndex: 1, optionMustContain: ["يتحرر"], text: "يسقط فوتون تردده f₀ على فلز دالة شغله hf₀. ماذا يحدث للإلكترون؟", explanation: "طاقة الفوتون hf₀ تساوي دالة الشغل؛ لذلك يتحرر الإلكترون عند الحد الفاصل من دون طاقة حركة زائدة. مفتاح المصدر يختار طاقة حركة hf₀، وهو يخالف معادلة الظاهرة الكهروضوئية.", reviewerNote: "صُحح مفتاح المصدر: إذا كانت طاقة الفوتون مساوية لدالة الشغل فالطاقة الحركية صفر، وليس hf₀." },
  { sourceId: "friday-evening-p2-physics-2024", number: 22, page: 8, correctOptionIndex: 3, optionMustContain: ["ينقصw", "تبقىm"], text: "جسم كتلته m ووزنه W عند سطح الأرض. ماذا يحدث عند نقله إلى ارتفاع كبير؟", explanation: "الكتلة خاصية للجسم لا تتغير بتغيير موقعه، بينما يقل تسارع الجاذبية مع الارتفاع؛ لذلك يبقى m ثابتًا ويقل الوزن W." },
  { sourceId: "friday-evening-p2-physics-2024", number: 24, page: 9, correctOptionIndex: 3, optionMustContain: ["2"], text: "جسم طوله 5 cm أمام مرآة محدبة على بعد 25 cm، وتبعد صورته 10 cm عن المرآة. ما طول الصورة؟", explanation: "مقدار التكبير = |dᵢ/dₒ|=10/25=0.4. طول الصورة =0.4×5=2 cm." },
  { sourceId: "friday-evening-p2-physics-2024", number: 25, page: 9, correctOptionIndex: 0, optionMustContain: ["الديسبل"], text: "ما وحدة قياس مستوى شدة الصوت؟", explanation: "يقاس مستوى شدة الصوت بالديسيبل (dB)، وليس بالجول أو الهرتز أو الواط." },
];

const REJECTIONS: Rejection[] = [
  { sourceId: "friday-evening-p2-biology-2024", number: 13, page: 6, note: "مرفوض: صياغة «أي جزء من البكتيريا يقاوم المضادات الحيوية أكثر؟» عامة ولا تحدد نوع البكتيريا أو المضاد؛ لا توجد إجابة علمية عامة وحيدة بين المحفظة والجدار الخلوي والأهداب والحمض النووي." },
  { sourceId: "friday-evening-p2-biology-2024", number: 14, page: 6, note: "مرفوض: تحديد أسبوع قياس نبض الجنين يتوقف على وسيلة القياس؛ السؤال لا يذكر هل المقصود الموجات فوق الصوتية أم السماعة، لذا لا توجد إجابة واحدة لكل طرق القياس." },
  { sourceId: "friday-evening-p2-biology-2024", number: 15, page: 6, note: "مرفوض: الخيارات تجمع علاقات مختلفة بلفظ «أو» ولا تتضمن خيارًا واحدًا محددًا لعلاقة المفترس بالفريسة؛ يلزم إعادة صياغة السؤال والخيارات من المصدر." },
  { sourceId: "friday-evening-p2-biology-2024", number: 18, page: 7, note: "مرفوض: الخلايا اللهبية صفة للديدان المفلطحة، ولا يظهر هذا الكائن ضمن الخيارات الأربعة؛ الإجابة المطبوعة «الأسكارس» لا تطابق المفهوم." },
  { sourceId: "friday-evening-p2-biology-2024", number: 23, page: 9, note: "مرفوض: صياغة «طائر لا يطير بسبب تواجد» لا تحدد نوع الطائر أو سببًا تشخيصيًا، والخيارات لا تثبت سببًا وحيدًا؛ لا أعتمد المفتاح المطبوع دون مصدر أوضح." },
  { sourceId: "friday-evening-p2-biology-2024", number: 25, page: 10, note: "مرفوض: السؤال عن المناعة النشطة/الإيجابية يحتمل أكثر من خيار؛ تكوّن خلايا الذاكرة والتطعيم بمولد ضد كلاهما يرتبطان بمناعة نشطة، فلا توجد إجابة وحيدة." },
  { sourceId: "friday-evening-p2-biology-2024", number: 26, page: 10, note: "مرفوض: السؤال يسأل عن عدد الخلايا «بعد ساعة» من دون تحديد مدة دورة الانقسام؛ والانقسام المنصف الكامل ينتج أربع خلايا لا ثمانيًا، لذلك المفتاح المطبوع لا يصلح لتصحيح السؤال." },
  { sourceId: "friday-evening-p2-biology-2024", number: 37, page: 14, note: "مرفوض: نص السؤال عن «ثلاث جزيئات سكر» وATP=114 غير مكتمل ولا يحدد مسارًا أو مادة متفاعلة يمكن منها استنتاج الإجابة." },
];

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[−–—]/g, "-").replace(/\s+/g, "").replace(/[()⟨⟩〈〉,]/g, "");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const connected = await connectToMongoDB();
  if (!connected) throw new Error("MongoDB connection unavailable; no content was changed.");
  if (TahsiliQuestionDraft.db.name !== "test") {
    throw new Error(`Refusing database "${TahsiliQuestionDraft.db.name}"; this batch is authorized for Replit preview only.`);
  }

  const sourceIds = Object.keys(SOURCE_COUNTS) as SourceId[];
  const drafts = await TahsiliQuestionDraft.find({ sourceId: { $in: sourceIds }, status: "pending_review" })
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options explanation sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const failures: string[] = [];
  for (const sourceId of sourceIds) {
    const count = drafts.filter((draft) => draft.sourceId === sourceId).length;
    if (count !== SOURCE_COUNTS[sourceId]) failures.push(`${sourceId}: المتوقع ${SOURCE_COUNTS[sourceId]} مسودة، وُجد ${count}`);
  }

  const keyed = new Map<string, any[]>();
  for (const draft of drafts) {
    const key = `${draft.sourceId}:${Number(draft.sourceQuestionNumber)}`;
    keyed.set(key, [...(keyed.get(key) || []), draft]);
  }
  const correctionsByKey = new Map(CORRECTIONS.map((item) => [`${item.sourceId}:${item.number}`, item]));
  const rejectionsByKey = new Map(REJECTIONS.map((item) => [`${item.sourceId}:${item.number}`, item]));

  for (const correction of CORRECTIONS) {
    const key = `${correction.sourceId}:${correction.number}`;
    const matches = keyed.get(key) || [];
    if (matches.length !== 1) {
      failures.push(`${key}: عدد السجلات ${matches.length}`);
      continue;
    }
    const draft = matches[0];
    if (draft.sourcePage !== correction.page || !Array.isArray(draft.options) || draft.options.length !== 4) {
      failures.push(`${key}: صفحة المصدر أو عدد الخيارات لا يطابق سجل المراجعة`);
      continue;
    }
    const selected = normalize(String(draft.options[correction.correctOptionIndex] || ""));
    if (!correction.optionMustContain.every((needle) => selected.includes(normalize(needle)))) {
      failures.push(`${key}: الخيار ${correction.correctOptionIndex} لا يطابق النص المتوقع`);
    }
  }
  for (const rejection of REJECTIONS) {
    const key = `${rejection.sourceId}:${rejection.number}`;
    const matches = keyed.get(key) || [];
    if (matches.length !== 1 || matches[0]?.sourcePage !== rejection.page) {
      failures.push(`${key}: سجل الرفض لا يطابق صفحة المصدر`);
    }
  }
  const covered = new Set([...correctionsByKey.keys(), ...rejectionsByKey.keys()]);
  const uncovered = drafts.filter((draft) => !covered.has(`${draft.sourceId}:${Number(draft.sourceQuestionNumber)}`));
  if (uncovered.length) failures.push(`هناك ${uncovered.length} سجلات غير مشمولة في مراجعة هذه الدفعة`);

  const sourceKeys = drafts.map((draft) => draft.sourceKey);
  const existingQuestions = await TahsiliQuestion.find({ sourceKey: { $in: sourceKeys } }).select("sourceKey").lean();
  const existingIds = await TahsiliQuestion.find({ questionId: { $in: drafts.map((draft) => draft.questionId) } }).select("questionId").lean();
  if (existingQuestions.length || existingIds.length) failures.push("توجد أسئلة منشورة أو أرقام مستخدمة مسبقًا؛ أوقفت الدفعة لتجنب الاستبدال.");
  if (failures.length) {
    console.log(JSON.stringify({ apply, draftsFound: drafts.length, failures }, null, 2));
    throw new Error("فشل فحص ما قبل التعديل؛ لم تُعتمد أي سجلات.");
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    database: TahsiliQuestionDraft.db.name,
    draftsFound: drafts.length,
    approved: CORRECTIONS.length,
    rejected: REJECTIONS.length,
    correctedSourceAnswerKeys: CORRECTIONS.filter((item) => item.reviewerNote).map((item) => ({ sourceId: item.sourceId, number: item.number, note: item.reviewerNote })),
    changed: false,
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const reviewedAt = new Date();
  for (const correction of CORRECTIONS) {
    const draft = keyed.get(`${correction.sourceId}:${correction.number}`)![0];
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
          subcategory: draft.subcategory || "عام",
          text: correction.text,
          options: draft.options,
          correctOptionIndex: correction.correctOptionIndex,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "عام",
          explanation: correction.explanation,
          sourcePage: draft.sourcePage,
          sourceQuestionNumber: namespacedQuestionNumber,
          printedQuestionNumber: draft.sourceQuestionNumber,
          sourceBlockIndex: draft.sourceBlockIndex,
          ...(draft.requiresImage && draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
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
          text: correction.text,
          explanation: correction.explanation,
          reviewedBy: REVIEWER,
          reviewedAt,
          reviewerNotes: correction.reviewerNote || "تمت مراجعة السؤال وخياراته وحلّه مقابل ملف المصدر؛ أضيف شرح موجز لخطوات الإجابة.",
          updatedAt: reviewedAt,
        },
      },
    );
  }
  for (const rejection of REJECTIONS) {
    const draft = keyed.get(`${rejection.sourceId}:${rejection.number}`)![0];
    await TahsiliQuestionDraft.updateOne(
      { _id: draft._id, status: "pending_review" },
      { $set: { status: "rejected", reviewedBy: REVIEWER, reviewedAt, reviewerNotes: rejection.note, updatedAt: reviewedAt } },
    );
  }
  summary.changed = true;
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Batch review failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectFromMongoDB();
  });
