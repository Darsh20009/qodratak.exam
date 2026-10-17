import { connectToMongoDB, disconnectFromMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-biology-2023";
const REVIEWER = "source-verified-content-audit";
const approvals = [
  { id: "6ad0103163cd9c24f9f40e41", page: 87, number: 1, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ما إحدى وظائف كيس المح في المراحل المبكرة من نمو الجنين البشري؟", options: ["المساهمة في تكوين خلايا الدم للجنين", "تزويد الجنين بمخزون الغذاء طوال الحمل", "تكوين خلايا الدم البيضاء", "التخلص من فضلات الجنين"], answer: 0, explanation: "يسهم كيس المح في المراحل المبكرة من نمو الجنين البشري في تكوين خلايا الدم، قبل اكتمال تكون نخاع العظم." },
  { id: "6ad0103163cd9c24f9f40e42", page: 87, number: 2, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ما العامل الذي يساعد الجنين في أواخر الحمل على المحافظة على حرارة جسمه بعد الولادة؟", options: ["تراكم الدهون تحت الجلد", "الاستجابة للمثيرات الخارجية", "اكتمال الرئة وحده", "تكوّن الأنسجة والأعضاء"], answer: 0, explanation: "يساعد تراكم النسيج الدهني تحت الجلد في أواخر الحمل على العزل الحراري والمحافظة على حرارة الجسم بعد الولادة." },
  { id: "6ad0103163cd9c24f9f40e43", page: 87, number: 3, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي وظيفة تتأثر مباشرة عند حدوث خلل في الخصية؟", options: ["إنتاج السائل المنوي كاملًا", "إفراز هرمون الثيروكسين", "إفراز هرمون الإنسولين", "إنتاج الحيوانات المنوية"], answer: 3, explanation: "تنتج الخصيتان الحيوانات المنوية وتفرزان هرمون التستوستيرون؛ أما الإنسولين والثيروكسين فيصدران من غدد أخرى." },
  { id: "6ad0103163cd9c24f9f40e44", page: 87, number: 4, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي مما يأتي لا ينتقل عادةً من الأم إلى الجنين عبر المشيمة؟", options: ["خلايا الدم الحمراء", "المواد المغذية", "الأكسجين", "بعض الأجسام المضادة"], answer: 0, explanation: "ينتقل الأكسجين والمواد المغذية وبعض الأجسام المضادة عبر المشيمة، بينما لا تعبر خلايا الدم الحمراء السليمة عادةً إلى الجنين." },
  { id: "6ad0103163cd9c24f9f40e45", page: 87, number: 5, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي تركيب ينظم تبادل المواد بين الأم والجنين؟", options: ["المشيمة", "الكبد", "الكلية", "الرحم"], answer: 0, explanation: "تسمح المشيمة بتبادل الأكسجين والمواد المغذية والفضلات بين دورتي الأم والجنين دون اختلاط مباشر لمعظم خلايا الدم." },
  { id: "6ad0103163cd9c24f9f40e47", page: 87, number: 7, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "وفق مرجع هذه المجموعة، في أي أسبوع يكتمل نمو المشيمة ضمن الخيارات؟", options: ["الأسبوع الرابع", "الأسبوع السادس", "الأسبوع الثامن", "الأسبوع العاشر"], answer: 3, explanation: "مفتاح الإجابة المطبوع في المصدر يحدد الأسبوع العاشر. هذه الإجابة مرتبطة بصياغة ومرجع السؤال؛ وتستمر المشيمة في النمو والتغير خلال الحمل." },
  { id: "6ad0103163cd9c24f9f40e48", page: 87, number: 8, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي هرمون يحفز ظهور الصفات الجنسية الثانوية الذكرية؟", options: ["الإستروجين", "البروجستيرون", "هرمون النمو", "التستوستيرون"], answer: 3, explanation: "يسهم التستوستيرون في ظهور الصفات الجنسية الثانوية الذكرية، كما يؤدي دورًا في تكوين الحيوانات المنوية." },
  { id: "6ad0103163cd9c24f9f40e49", page: 87, number: 9, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "في أي تركيب تُخزن الحيوانات المنوية وتنضج بعد إنتاجها في الخصية؟", options: ["الإحليل", "البربخ", "الأسهر", "الأنابيب المنوية"], answer: 1, explanation: "تنتقل الحيوانات المنوية من الأنابيب المنوية إلى البربخ، حيث تنضج وتُخزن قبل انتقالها عبر الأسهر." },
  { id: "6ad0103163cd9c24f9f40e4a", page: 87, number: 10, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي تغير قد يظهر خلال الأشهر الثلاثة الأولى من نمو الجنين؟", options: ["فتح العينين", "تراكم الدهون تحت الجلد", "تكوّن الشعر", "ظهور بصمات الأصابع"], answer: 3, explanation: "تبدأ البصمات بالتشكل خلال المرحلة الجنينية المبكرة؛ أما فتح العينين وتراكم الدهون فيحدثان في مراحل لاحقة." },
  { id: "6ad0103163cd9c24f9f40e4b", page: 87, number: 11, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ما الترتيب الصحيح لمراحل الانقسام المبكر للجنين؟", options: ["اللاقحة ← التوتة ← الكيسة الأريمية", "التوتة ← اللاقحة ← الكيسة الأريمية", "اللاقحة ← الكيسة الأريمية ← التوتة", "التوتة ← اللاقحة ← الجاسترولا"], answer: 0, explanation: "بعد الإخصاب تتكون اللاقحة، ثم التوتة، ثم الكيسة الأريمية التي تنغرس في بطانة الرحم." },
  { id: "6ad0103163cd9c24f9f40e4c", page: 87, number: 12, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أين تنضج الحيوانات المنوية بعد إنتاجها؟", options: ["البربخ", "الإحليل", "الخصية", "البروستاتا"], answer: 0, explanation: "تُنتج الحيوانات المنوية في الأنابيب المنوية، ثم تنضج في البربخ." },
  { id: "6ad0103163cd9c24f9f40e4d", page: 87, number: 13, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي هرمون مما يأتي يُفرز من المبيض؟", options: ["الجلوكاجون", "التستوستيرون", "البروجستيرون", "الأوكسيتوسين"], answer: 2, explanation: "يفرز المبيض هرموني الإستروجين والبروجستيرون؛ أما الخيارات الأخرى فليست من هرموناته الأساسية." },
  { id: "6ad0103163cd9c24f9f40e4e", page: 88, number: 14, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ما وظيفة رئيسية لهرمون التستوستيرون؟", options: ["المساهمة في إنتاج الحيوانات المنوية وظهور الصفات الجنسية الثانوية الذكرية", "تنظيم الحمل والولادة لدى النساء", "رفع مستوى سكر الدم", "تقليل الالتهابات"], answer: 0, explanation: "يسهم التستوستيرون في تكوين الحيوانات المنوية وظهور الصفات الجنسية الثانوية الذكرية." },
  { id: "6ad0103163cd9c24f9f40e4f", page: 88, number: 15, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ما التركيب الذي ينظم انتقال المواد بين الأم والجنين في الثدييات؟", options: ["الرحم", "الأغشية الجنينية", "الغشاء الأمنيوسي", "المشيمة"], answer: 3, explanation: "تتولى المشيمة تبادل المواد بين الأم والجنين، ومنها الأكسجين والمواد الغذائية والفضلات." },
  { id: "6ad0103163cd9c24f9f40e50", page: 88, number: 16, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ما أحد الأخطار المعروفة لنقص حمض الفوليك لدى الأم في بداية الحمل؟", options: ["نقص وزن المولود حتمًا", "زيادة وزن المولود", "لا يتأثر الجنين", "اضطراب اكتمال نمو الدماغ والأنبوب العصبي"], answer: 3, explanation: "يرتبط نقص الفولات في بداية الحمل بزيادة خطر عيوب الأنبوب العصبي، ومنها عيوب تؤثر في الدماغ والحبل الشوكي." },
  { id: "6ad0103163cd9c24f9f40e51", page: 88, number: 17, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي جزء من الحيوان المنوي يحتوي على الميتوكوندريا التي تمده بالطاقة للحركة؟", options: ["الذيل", "الرأس", "القطعة الوسطى", "النواة"], answer: 2, explanation: "تحتوي القطعة الوسطى على ميتوكوندريا تنتج الطاقة اللازمة لحركة الذيل." },
  { id: "6ad0103163cd9c24f9f40e52", page: 88, number: 18, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ما الهرمون الجنسي الرئيس المرتبط بالصفات الذكرية؟", options: ["البروجستيرون", "الإستروجين", "التستوستيرون", "الإنسولين"], answer: 2, explanation: "التستوستيرون هو الهرمون الجنسي الذكري الرئيس، وتنتجه الخصيتان." },
  { id: "6ad0103163cd9c24f9f40e53", page: 88, number: 19, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "يُظهر الرسم انخفاض معدل عيوب الأنبوب العصبي بمرور السنوات مع ازدياد الاهتمام بتناول حمض الفوليك. ما الاستنتاج الأنسب؟", options: ["انخفض المعدل بسبب الوعي بمخاطر العقاقير فقط", "انخفض المعدل بسبب زواج الأقارب", "ارتبط ازدياد تناول حمض الفوليك بانخفاض المعدل", "ارتفع المعدل مع زيادة تناول حمض الفوليك"], answer: 2, explanation: "يوضح الرسم اتجاهًا تنازليًا لمعدل الحالات مع مرور الوقت، ويتوافق ذلك مع ارتباط زيادة تناول الفولات بانخفاض خطر عيوب الأنبوب العصبي. الارتباط في الرسم لا يثبت وحده السببية." },
  { id: "6ad0103163cd9c24f9f40e54", page: 88, number: 20, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "ماذا يحدث للجسم الأصفر عادة بعد حدوث الإخصاب؟", options: ["يستمر ولا يضمحل، ويبقى إفراز البروجستيرون مرتفعًا في البداية", "يرتفع البروجستيرون ثم يضمحل الجسم الأصفر فورًا", "ينخفض البروجستيرون ويضمحل الجسم الأصفر", "ينخفض البروجستيرون ولا يضمحل الجسم الأصفر"], answer: 0, explanation: "بعد الإخصاب المبكر يحافظ هرمون hCG على الجسم الأصفر فترةً من الزمن ليستمر في إفراز البروجستيرون الداعم لبطانة الرحم." },
  { id: "6ad0103163cd9c24f9f40e55", page: 88, number: 21, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "تحتوي حبوب منع الحمل الهرمونية المركبة عادةً على مركب يحاكي أي هرمون؟", options: ["FSH", "LH", "البروجستيرون", "الإنسولين"], answer: 2, explanation: "تحتوي كثير من الحبوب المركبة على بروجستين، وهو مركب يحاكي تأثير البروجستيرون ويساعد مع الإستروجين على منع الإباضة." },
  { id: "6ad0103163cd9c24f9f40e56", page: 88, number: 22, subcategory: "أجهزة جسم الإنسان - التكاثر والنمو", text: "أي عضو ينتج البويضات ويفرز هرموني الإستروجين والبروجستيرون؟", options: ["المبيض", "الرحم", "قناة فالوب", "عنق الرحم"], answer: 0, explanation: "ينتج المبيض البويضات ويفرز هرموني الإستروجين والبروجستيرون. أزيل الاعتماد على أرقام الشكل وخياراته المكررة." },
  { id: "6ad0103163cd9c24f9f40e57", page: 89, number: 1, subcategory: "أجهزة جسم الإنسان - المناعة", text: "ما الخلايا التي تتذكر مسبب المرض وتتيح استجابة أسرع عند التعرض له مرة أخرى؟", options: ["الخلايا الأكولة", "الخلايا الذاكرة", "الخلايا البلازمية", "خلايا الدم الحمراء"], answer: 1, explanation: "تحتفظ الخلايا الذاكرة بمعلومات عن مولد الضد، فتسهم في استجابة مناعية أسرع وأقوى عند التعرض اللاحق." },
  { id: "6ad0103163cd9c24f9f40e58", page: 89, number: 2, subcategory: "أجهزة جسم الإنسان - المناعة", text: "ما البروتين الذي تفرزه خلايا مصابة بفيروس ويساعد على الحد من تضاعفه في الخلايا المجاورة؟", options: ["المخاط", "بروتينات المتممة", "الإنترفيرون", "اللمف"], answer: 2, explanation: "تفرز الخلايا المصابة بالفيروس الإنترفيرونات، وهي إشارات تساعد الخلايا المجاورة على مقاومة تضاعف الفيروس." },
  { id: "6ad0103163cd9c24f9f40e59", page: 89, number: 3, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أي مما يأتي ليس عضوًا من أعضاء الجهاز اللمفي؟", options: ["الغدة الزعترية", "اللوزتان", "الطحال", "البنكرياس"], answer: 3, explanation: "الغدة الزعترية واللوزتان والطحال أجزاء من الجهاز اللمفي؛ أما البنكرياس فغدة هضمية وصماء." },
  { id: "6ad0103163cd9c24f9f40e5a", page: 89, number: 4, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أي عبارة صحيحة عن خط الدفاع المناعي الأول؟", options: ["يرفع الدهون", "يشكل الجلد حاجزًا دفاعيًا أوليًا", "يحطم الدم", "هو دفاع متخصص فقط"], answer: 1, explanation: "يشكل الجلد، مع الحواجز الكيميائية والمخاطية، خط دفاع أول غير متخصص أمام كثير من مسببات المرض." },
  { id: "6ad0103163cd9c24f9f40e5b", page: 89, number: 5, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أي مكوّن من الآتي يشارك في مقاومة العدوى عند الطفل؟", options: ["الخلايا البانية", "الصفائح الدموية", "خلايا الدم الحمراء", "خلايا الدم البيضاء"], answer: 3, explanation: "تشارك خلايا الدم البيضاء في التعرف على مسببات المرض ومقاومتها." },
  { id: "6ad0103163cd9c24f9f40e5c", page: 89, number: 6, subcategory: "أجهزة جسم الإنسان - المناعة", text: "ما الأثر المحتمل لانخفاض عدد كريات الدم البيضاء عند الأطفال؟", options: ["ضعف المناعة", "تعزيز المناعة", "نقص الأكسجين مباشرة", "صعوبة الإصابة بالبكتيريا والفيروسات"], answer: 0, explanation: "قد يؤدي انخفاض كريات الدم البيضاء إلى ضعف قدرة الجسم على مقاومة العدوى، بحسب نوع الخلايا ومقدار الانخفاض." },
  { id: "6ad0103163cd9c24f9f40e5d", page: 89, number: 7, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أي مكوّن من الدم قد يرتفع عدده استجابةً لالتهاب بكتيري؟", options: ["خلايا الدم الحمراء", "خلايا الدم البيضاء", "البلازما", "الصفائح الدموية"], answer: 1, explanation: "قد يرتفع عدد بعض أنواع خلايا الدم البيضاء عند الإصابة بعدوى بكتيرية؛ ويعتمد ذلك على نوع العدوى واستجابة الجسم." },
  { id: "6ad0103163cd9c24f9f40e5e", page: 89, number: 8, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أي عبارة صحيحة عن دفاعات جسم الإنسان؟", options: ["كل دخول للبكتيريا يسبب المرض حتمًا", "المناعة السلبية تنتج من المرض أو التطعيم", "المناعة الإيجابية تنتقل من الأم إلى الجنين", "الجلد خط دفاع مناعي أول"], answer: 3, explanation: "الجلد حاجز دفاعي أول. أما انتقال الأجسام المضادة من الأم للجنين فيمنح مناعة سلبية، والتطعيم يحفز مناعة نشطة." },
  { id: "6ad0103163cd9c24f9f40e5f", page: 89, number: 9, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أين تنضج الخلايا التائية؟", options: ["الغدة الزعترية", "اللوزتان", "الطحال", "الغدة الصنوبرية"], answer: 0, explanation: "تنضج الخلايا التائية في الغدة الزعترية، ثم تكتسب القدرة على أداء وظائفها المناعية." },
  { id: "6ad0103163cd9c24f9f40e60", page: 89, number: 10, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أي مثال يمثل مناعة سلبية مكتسبة اصطناعيًا؟", options: ["حقن شخص سليم بفيروس مضعف", "حقن أجسام مضادة جاهزة لسم العقرب", "التطعيم ضد شلل الأطفال", "حقن شخص سليم بفيروس ميت"], answer: 1, explanation: "إعطاء أجسام مضادة جاهزة يمنح حماية سلبية مؤقتة؛ أما اللقاح فيحفز الجسم على تكوين استجابة مناعية نشطة." },
  { id: "6ad0103163cd9c24f9f40e61", page: 89, number: 11, subcategory: "أجهزة جسم الإنسان - المناعة", text: "ما إحدى وظائف العقد اللمفاوية؟", options: ["تجديد كريات الدم الحمراء", "الدفاع عن الجسم", "تجلط الدم", "ترشيح السائل اللمفي"], answer: 3, explanation: "ترشح العقد اللمفاوية السائل اللمفي وتساعد الخلايا المناعية على التقاط مسببات المرض ومقاومتها." },
  { id: "6ad0103163cd9c24f9f40e62", page: 89, number: 12, subcategory: "أجهزة جسم الإنسان - المناعة", text: "أي خلايا يستهدفها فيروس نقص المناعة البشرية HIV على نحو رئيس؟", options: ["الخلايا التي تحمل مادته الوراثية", "الخلايا التي يلتصق بها", "الخلايا التائية المساعدة", "الخلايا البائية"], answer: 2, explanation: "يستهدف HIV خصوصًا الخلايا التائية المساعدة CD4، ما يضعف تنسيق الاستجابة المناعية." },
  { id: "6ad0103163cd9c24f9f40e63", page: 90, number: 13, subcategory: "أجهزة جسم الإنسان - المناعة", text: "إلى أي جهاز ينتمي الطحال؟", options: ["الجهاز اللمفي", "الجهاز العصبي", "الجهاز الهيكلي", "الجهاز الإخراجي"], answer: 0, explanation: "الطحال عضو من أعضاء الجهاز اللمفي، ويسهم في وظائف مناعية وترشيح الدم." },
  { id: "6ad0103163cd9c24f9f40e64", page: 90, number: 14, subcategory: "أجهزة جسم الإنسان - المناعة", text: "ما نوع المناعة التي يكتسبها الطفل بعد التطعيم ضد شلل الأطفال؟", options: ["مناعة نشطة", "مناعة سلبية", "أجسام مضادة جاهزة", "حماية مؤقتة فقط"], answer: 0, explanation: "يحفز اللقاح الجهاز المناعي على تكوين استجابة وذاكرة مناعية؛ لذلك تعد المناعة الناتجة نشطة." },
  { id: "6ad0103163cd9c24f9f40e65", page: 90, number: 15, subcategory: "أجهزة جسم الإنسان - المناعة", text: "كيف تساعد العقد اللمفاوية في حماية الجسم من الأمراض المعدية؟", options: ["تنظيم ضغط الدم", "وقف نزيف الدم", "تحديد كريات الدم الحمراء", "ترشيح اللمف والتقاط مسببات المرض"], answer: 3, explanation: "تسهم العقد اللمفاوية في الحماية عبر ترشيح اللمف وإتاحة تعرف الخلايا المناعية على مسببات المرض." },
] as const;
const rejections = [
  { id: "6ad0103163cd9c24f9f40e46", page: 87, number: 6, reason: "السؤال لا يصف نوع التشوه أو علامته، لذلك لا توجد معلومة تحدد هل المقصود الجلد أو الجهاز العصبي أو القدم أو الساق. لا يكفي مفتاح الإجابة وحده لإثبات الاختيار." },
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
      subject: "أحياء", subcategory: item.subcategory, text: item.text, options: [...item.options], correctOptionIndex: item.answer,
      difficulty: draft.difficulty || "intermediate", topic: item.subcategory, explanation: item.explanation,
      sourcePage: draft.sourcePage, sourceQuestionNumber, printedQuestionNumber: item.number, sourceBlockIndex: draft.sourceBlockIndex,
      ...(draft.sourceImageObjectKey ? { sourceImageObjectKey: draft.sourceImageObjectKey } : {}),
      sourceBook: draft.sourceBook, answerConfidence: "verified", reviewedBy: REVIEWER, reviewedAt, updatedAt: reviewedAt,
    }, $setOnInsert: { createdAt: reviewedAt } }, { upsert: true, returnDocument: "after", runValidators: true });
    await TahsiliQuestionDraft.updateOne({ _id: draft._id, sourceId: SOURCE_ID, status: { $in: ["pending_review", "approved"] } }, { $set: {
      status: "approved", subject: "أحياء", subcategory: item.subcategory, text: item.text, options: [...item.options], explanation: item.explanation,
      reviewedBy: REVIEWER, reviewedAt, reviewerNotes: "تمت مراجعة السؤال مع المصدر ومفتاحه ومعلومة الأحياء؛ عُدلت الصياغة وأزيل الاعتماد غير الضروري على الرسم.", updatedAt: reviewedAt,
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
