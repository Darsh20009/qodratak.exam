import { disconnectFromMongoDB, connectToMongoDB } from "../../artifacts/api-server/src/mongodb/connection";
import { TahsiliQuestion, TahsiliQuestionDraft } from "../../artifacts/api-server/src/mongodb/models";

const SOURCE_ID = "ghasham-practice-physics-period-1";
const REVIEWER = "source-verified-content-audit";

const approvals = [
  {
    id: "6ad0103563cd9c24f9f41778",
    page: 12,
    number: 74,
    text: "ماذا ينتج من ضرب مربع شدة التيار الكهربائي المار في مقاومة R؟",
    options: ["المقاومة", "فرق الجهد", "شدة التيار", "القدرة الكهربائية"],
    answer: 3,
    explanation: "من العلاقة P=I²R، فإن حاصل ضرب مربع التيار في المقاومة يساوي القدرة الكهربائية.",
  },
  {
    id: "6ad0103563cd9c24f9f4177a",
    page: 12,
    number: 76,
    text: "ما نوع الأشعة المستخدمة في تجربة رذرفورد لرقاقة الذهب؟",
    options: ["جسيمات ألفا", "جسيمات بيتا", "أشعة جاما", "الأشعة السينية"],
    answer: 0,
    explanation: "وجّه رذرفورد جسيمات ألفا نحو رقيقة الذهب، واستدل من انحراف بعضها على وجود نواة صغيرة موجبة في الذرة.",
  },
  {
    id: "6ad0103563cd9c24f9f4177b",
    page: 12,
    number: 77,
    text: "أُسقطت كرتان من الارتفاع نفسه، إحداهما على القمر والأخرى على الأرض. كيف تقارن سرعة الكرة عند وصولها إلى الأسفل على القمر بسرعتها على الأرض؟",
    options: ["أكبر", "أصغر", "مساوية", "لا تسقط الكرة على القمر"],
    answer: 1,
    explanation: "تسارع الجاذبية على القمر أقل من تسارعه على الأرض. ومن العلاقة v=√(2gh) للسقوط من السكون من الارتفاع نفسه، تكون سرعة الكرة النهائية على القمر أصغر.",
  },
  {
    id: "6ad0103563cd9c24f9f4177c",
    page: 12,
    number: 79,
    text: "ما درجة الحرارة المكافئة لـ100 K على مقياس سلسيوس؟",
    options: ["173°C", "−173°C", "−100°C", "100°C"],
    answer: 1,
    explanation: "نحوّل من كلفن إلى سلسيوس بالعلاقة T_C=T_K−273.15؛ لذلك 100−273.15≈−173°C.",
  },
  {
    id: "6ad0103563cd9c24f9f4177d",
    page: 12,
    number: 81,
    text: "ما الكمية التي تساوي نسبة فرق الجهد بين طرفي موصل إلى التيار المار فيه؟",
    options: ["السعة الكهربائية", "القدرة الكهربائية", "المقاومة الكهربائية", "المجال الكهربائي"],
    answer: 2,
    explanation: "من قانون أوم R=V/I، فإن النسبة بين فرق الجهد والتيار تساوي المقاومة الكهربائية.",
  },
  {
    id: "6ad0103563cd9c24f9f4177e",
    page: 13,
    number: 82,
    text: "اهتز نابض 60 اهتزازة خلال 20 s. ما تردده بوحدة الهرتز؟",
    options: ["1/3 Hz", "3 Hz", "1/2 Hz", "1/6 Hz"],
    answer: 1,
    explanation: "التردد هو عدد الاهتزازات على الزمن: f=60÷20=3 Hz.",
  },
  {
    id: "6ad0103563cd9c24f9f4177f",
    page: 13,
    number: 83,
    text: "عند رصد نجمين متقاربين زاويًا، ما المعيار البصري المستخدم لتحديد إمكانية تمييزهما كنجمين منفصلين؟",
    options: ["معيار رايلي", "مطياف الكتلة", "تأثير دوبلر", "ثابت بلانك"],
    answer: 0,
    explanation: "يُستخدم معيار رايلي لتحديد حدّ القدرة الفاصلة للأداة البصرية، أي متى يمكن تمييز مصدرين ضوئيين متقاربين.",
  },
  {
    id: "6ad0103563cd9c24f9f41781",
    page: 13,
    number: 85,
    text: "ما اللون الناتج عن تداخل الضوءين الأحمر والأخضر؟",
    options: ["الأزرق", "الأبيض", "الأصفر", "البنفسجي"],
    answer: 2,
    explanation: "في مزج الأضواء الإضافي، يؤدي تداخل الأحمر والأخضر إلى اللون الأصفر.",
  },
  {
    id: "6ad0103563cd9c24f9f41782",
    page: 13,
    number: 86,
    text: "أي عالم يرتبط بمبدأ استحالة تحديد موضع جسيم وزخمه بدقة تامة في الوقت نفسه؟",
    options: ["هايزنبرغ", "دي برولي", "أينشتاين", "كومبتون"],
    answer: 0,
    explanation: "هذا هو مبدأ عدم اليقين لهايزنبرغ: لا يمكن تحديد موضع الجسيم وزخمه معًا بدقة مطلقة في اللحظة نفسها.",
  },
  {
    id: "6ad0103563cd9c24f9f41784",
    page: 13,
    number: 89,
    text: "تباطأت سيارة بانتظام من سرعة 12 m/s حتى توقفت خلال 3 s. ما سرعتها المتوسطة خلال التباطؤ؟",
    options: ["2 m/s", "4 m/s", "6 m/s", "8 m/s"],
    answer: 2,
    explanation: "عند التسارع المنتظم تكون السرعة المتوسطة=(v_i+v_f)/2=(12+0)/2=6 m/s.",
  },
  {
    id: "6ad0103563cd9c24f9f41785",
    page: 13,
    number: 90,
    text: "إذا بقي الشغل ثابتًا وقل الزمن اللازم لإنجازه، فماذا يحدث للقدرة؟",
    options: ["تزداد", "لا يؤثر فيها الزمن", "تتأثر بكمية الشغل فقط", "تقل"],
    answer: 0,
    explanation: "القدرة P=W/t. عند ثبات الشغل، تقليل الزمن يزيد القدرة.",
  },
  {
    id: "6ad0103563cd9c24f9f41786",
    page: 14,
    number: 91,
    text: "أُطلقت قذيفة بسرعة 80 m/s بزاوية 45° مع الأفقي. ما مركبة سرعتها الأفقية؟",
    options: ["80 m/s", "80√2 m/s", "40√2 m/s", "40 m/s"],
    answer: 2,
    explanation: "المركبة الأفقية v_x=v cosθ=80 cos45°=80(√2/2)=40√2 m/s.",
  },
  {
    id: "6ad0103563cd9c24f9f41787",
    page: 14,
    number: 92,
    text: "يعمل سخان عند 220 V لمدة 2 h لتسخين كمية ماء. كم يلزم لتسخين الكمية نفسها عند 110 V إذا بقي التيار ثابتًا؟",
    options: ["2 h", "4 h", "6 h", "8 h"],
    answer: 1,
    explanation: "للكمية نفسها من الحرارة يكون الشغل الكهربائي ثابتًا، ومع ثبات التيار W=VIt. خفض الجهد إلى النصف يتطلب مضاعفة الزمن: 4 h.",
  },
  {
    id: "6ad0103563cd9c24f9f41789",
    page: 14,
    number: 97,
    text: "وُضع جسم على بعد 30 cm أمام مرآة مقعرة بعدها البؤري 10 cm. ما بعد صورته؟",
    options: ["60 cm", "30 cm", "15 cm", "10 cm"],
    answer: 2,
    explanation: "من معادلة المرآة 1/f=1/d_o+1/d_i: 1/d_i=1/10−1/30=1/15، إذن d_i=15 cm.",
  },
  {
    id: "6ad0103563cd9c24f9f4178a",
    page: 15,
    number: 99,
    text: "بإعادة ترتيب قانون نيوتن الثاني ΣF=ma، وباستخدام a=Δv/Δt، أي علاقة صحيحة؟",
    options: ["F=mΔv", "FΔt=mΔv", "Δt=F·ma", "a=mf·Δv"],
    answer: 1,
    explanation: "بالتعويض عن a في ΣF=ma ثم الضرب في Δt نحصل على FΔt=mΔv، وهي علاقة الدفع والتغير في الزخم.",
  },
  {
    id: "6ad0103563cd9c24f9f4178b",
    page: 15,
    number: 100,
    text: "استطاع طالب تحريك صندوق بسهولة عندما غُمِر بالماء. ما التفسير الأقرب؟",
    options: ["قل وزنه وكتلته", "زاد وزنه وقلت كتلته", "قل وزنه وبقيت كتلته ثابتة", "بقي وزنه وكتلته ثابتين"],
    answer: 2,
    explanation: "قوة الطفو التي يؤثر بها الماء تقلل الوزن الظاهري للصندوق، بينما تبقى كتلته ثابتة.",
  },
  {
    id: "6ad0103563cd9c24f9f4178c",
    page: 15,
    number: 101,
    text: "فجوة الطاقة في الجرمانيوم 0.7 eV وفي السيليكون 1.1 eV. أيهما أكثر توصيلًا للكهرباء عند درجة الحرارة نفسها؟",
    options: ["الجرمانيوم", "السيليكون", "السيليكون موصل والجرمانيوم عازل", "الجرمانيوم موصل والسيليكون عازل"],
    answer: 0,
    explanation: "فجوة الطاقة الأصغر تسهّل انتقال الإلكترونات إلى نطاق التوصيل. ولأن فجوة الجرمانيوم أصغر، يكون أكثر توصيلًا من السيليكون عند درجة الحرارة نفسها.",
  },
  {
    id: "6ad0103563cd9c24f9f4178d",
    page: 15,
    number: 102,
    text: "ما الشرطان اللازمان لاتزان جسم صلب اتزانًا تامًا؟",
    options: [
      "Στ=0 وΣF=0",
      "Στ≠0 وΣF=0",
      "Στ=0 وΣF≠0",
      "Στ≠0 وΣF≠0",
    ],
    answer: 0,
    explanation: "يلزم للاتزان الانتقالي أن تكون محصلة القوى صفرًا، وللاتزان الدوراني أن تكون محصلة العزوم صفرًا.",
  },
  {
    id: "6ad0103563cd9c24f9f4178e",
    page: 15,
    number: 103,
    text: "ما الذي يميز المواد الموصلة عن المواد العازلة؟",
    options: ["الشحنات الموجبة فقط", "الشحنات السالبة فقط", "الإلكترونات المرتبطة", "الإلكترونات الحرة"],
    answer: 3,
    explanation: "تحتوي المواد الموصلة على إلكترونات حرة الحركة نسبيًا، ما يسمح بانتقال الشحنة الكهربائية خلالها.",
  },
  {
    id: "6ad0103563cd9c24f9f4178f",
    page: 15,
    number: 104,
    text: "تتشابه موجات الراديو والميكروويف في الخصائص الآتية ما عدا:",
    options: ["كلتاهما موجات كهرومغناطيسية", "لهما الطول الموجي نفسه", "تنتقلان بالسرعة نفسها في الفراغ", "تقترب سرعتهما من السرعة نفسها في الهواء"],
    answer: 1,
    explanation: "الراديو والميكروويف موجتان كهرومغناطيسيتان، ولهما سرعة الانتشار نفسها في الفراغ تقريبًا، لكنهما لا تملكان الطول الموجي نفسه.",
  },
  {
    id: "6ad0103563cd9c24f9f41790",
    page: 15,
    number: 105,
    text: "في سلسلة لايمان لذرة الهيدروجين، إلى أي مستوى نهائي ينتقل الإلكترون من مستوى أعلى؟",
    options: ["المستوى الأول", "المستوى الثاني", "المستوى الثالث", "المستوى الرابع"],
    answer: 0,
    explanation: "تتضمن سلسلة لايمان الانتقالات التي تنتهي عند المستوى الأول n=1.",
  },
  {
    id: "6ad0103563cd9c24f9f41791",
    page: 15,
    number: 106,
    text: "ما مقدار القوة الكهربائية المؤثرة في إلكترون شحنته 1.6×10⁻¹⁹ C داخل مجال شدته 200 N/C؟",
    options: ["8×10⁻²² N", "2×10²⁰ N", "3.2×10⁻¹⁷ N", "3.2×10¹⁷ N"],
    answer: 2,
    explanation: "مقدار القوة F=|q|E=(1.6×10⁻¹⁹)(200)=3.2×10⁻¹⁷ N.",
  },
  {
    id: "6ad0103563cd9c24f9f41792",
    page: 15,
    number: 107,
    text: "ما اسم الظاهرة التي ينتج عنها ضوء يهتز في مستوى واحد؟",
    options: ["الاستقطاب", "الحيود", "التداخل", "التشتت"],
    answer: 0,
    explanation: "الاستقطاب يجعل اهتزازات الموجة الضوئية محصورة في مستوى واحد.",
  },
  {
    id: "6ad0103563cd9c24f9f41793",
    page: 16,
    number: 108,
    text: "إلكترون شحنته 1.6×10⁻¹⁹ C يتحرك عموديًا على مجال مغناطيسي شدته 0.4 T بسرعة 5×10⁶ m/s. ما مقدار القوة المغناطيسية عليه؟",
    options: ["2×10⁻¹³ N", "2×10¹³ N", "3.2×10⁻¹³ N", "3.2×10¹³ N"],
    answer: 2,
    explanation: "لأن الحركة عمودية على المجال، F=|q|vB=(1.6×10⁻¹⁹)(5×10⁶)(0.4)=3.2×10⁻¹³ N.",
  },
  {
    id: "6ad0103563cd9c24f9f41794",
    page: 16,
    number: 109,
    text: "إذا انتشرت موجات بالسرعة نفسها، فبماذا يتناسب معدل نقل الطاقة فيها؟",
    options: ["سرعتها", "سعتها", "مربع سرعتها", "مربع سعتها"],
    answer: 3,
    explanation: "عند ثبات سرعة الانتشار، يتناسب معدل انتقال الطاقة في الموجة طرديًا مع مربع السعة.",
  },
  {
    id: "6ad0103563cd9c24f9f41795",
    page: 16,
    number: 110,
    text: "يُستخدم جهاز مطياف الكتلة لدراسة:",
    options: ["التأثير الكهروضوئي", "عمر النصف", "النشاط الإشعاعي", "النظائر"],
    answer: 3,
    explanation: "يفصل مطياف الكتلة الأيونات بحسب نسبة الكتلة إلى الشحنة؛ ومن تطبيقاته تحديد كتل النظائر وتمييزها.",
  },
  {
    id: "6ad0103563cd9c24f9f41796",
    page: 16,
    number: 111,
    text: "ما أقل طاقة لازمة لتحرير إلكترون من سطح معدن تردده الحرج 4.4×10¹⁴ Hz؟",
    options: ["(4.4×10¹⁴)/h", "4.4×10¹⁴ h", "4.4×10¹⁴+h", "4.4×10¹⁴−h"],
    answer: 1,
    explanation: "دالة الشغل تساوي hf₀. لذلك φ=h(4.4×10¹⁴) J، حيث h ثابت بلانك.",
  },
  {
    id: "6ad0103563cd9c24f9f41797",
    page: 16,
    number: 112,
    text: "عند توصيل مصدر جهد متناوب بسلك هوائي، ما المجالين اللذين يتولدّان حوله؟",
    options: [
      "مجال مغناطيسي متغير ومجال كهربائي متغير",
      "مجال مغناطيسي ثابت ومجال كهربائي متغير",
      "مجال مغناطيسي متغير ومجال كهربائي ثابت",
      "مجال مغناطيسي ثابت ومجال كهربائي ثابت",
    ],
    answer: 0,
    explanation: "التيار والجهد المتناوبان يولدان مجالين كهربائيًا ومغناطيسيًا متغيرين، ويرتبط تغيرهما بانتشار الموجة الكهرومغناطيسية.",
  },
  {
    id: "6ad0103563cd9c24f9f41798",
    page: 16,
    number: 114,
    text: "ما القوة التي تنشأ بين البروتون والنيوترون داخل النواة؟",
    options: ["القوة الكهرومغناطيسية", "القوة الكهربائية", "قوة الجاذبية", "القوة النووية القوية"],
    answer: 3,
    explanation: "تربط القوة النووية القوية البروتونات والنيوترونات داخل النواة على الرغم من التنافر الكهربائي بين البروتونات.",
  },
  {
    id: "6ad0103563cd9c24f9f41799",
    page: 16,
    number: 115,
    text: "ضغط غاز 5 atm عند درجة حرارة 200 K. إذا أصبحَت درجة حرارته 300 K عند ثبات الحجم، فما ضغطه؟",
    options: ["12 atm", "15 atm", "10 atm", "7.5 atm"],
    answer: 3,
    explanation: "عند ثبات الحجم P₁/T₁=P₂/T₂، لذا P₂=5×(300/200)=7.5 atm.",
  },
  {
    id: "6ad0103563cd9c24f9f4179a",
    page: 16,
    number: 116,
    text: "ماذا تمثل المساحة تحت منحنى القوة مقابل الزمن؟",
    options: ["الدفع", "الزخم", "التسارع", "السرعة"],
    answer: 0,
    explanation: "المساحة تحت منحنى القوة والزمن تساوي ∫F dt، أي الدفع، وهو يساوي التغير في الزخم.",
  },
  {
    id: "6ad0103563cd9c24f9f4179b",
    page: 16,
    number: 117,
    text: "لتقليل القدرة الكهربائية المفقودة في أسلاك نقل الطاقة لمسافات بعيدة، أين يلزم استخدام محول رافع للجهد؟",
    options: ["عند مناطق الاستهلاك", "عند محطة التوليد", "محول خافض عند محطة التوليد", "يُوصل بمكثف غير مشحون"],
    answer: 1,
    reviewNote: "تم تصحيح مفتاح المصدر: الإجابة الصحيحة هي المحول الرافع عند محطة التوليد (ب)، لا المفتاح المطبوع (أ). رفع الجهد يقلل التيار لنقل القدرة نفسها ويخفض الفقد I²R.",
    explanation: "تُرفع قيمة الجهد عند محطة التوليد قبل النقل. للقدرة نفسها يقل التيار، فتقل خسائر الأسلاك التي تتناسب مع I²R. ثم يُخفض الجهد قرب مناطق الاستهلاك.",
  },
  {
    id: "6ad0103563cd9c24f9f4179c",
    page: 17,
    number: 118,
    text: "ماذا تصبح حالة الذرة عندما تكون في المستوى الأرضي؟",
    options: ["مستقرة", "مثارة", "مشعة", "على وشك الإشعاع"],
    answer: 0,
    explanation: "المستوى الأرضي هو أدنى مستوى طاقة مسموح للذرة، وتكون الذرة فيه في حالتها المستقرة غير المثارة.",
  },
  {
    id: "6ad0103563cd9c24f9f4179d",
    page: 17,
    number: 119,
    text: "لوحان متوازيان بينهما مجال كهربائي شدته 1800 N/C والمسافة بينهما 1.5 cm. ما فرق الجهد بينهما؟",
    options: ["27 V", "270 V", "35 V", "350 V"],
    answer: 0,
    explanation: "نحوّل 1.5 cm إلى 0.015 m، ثم ΔV=Ed=1800×0.015=27 V.",
  },
  {
    id: "6ad0103563cd9c24f9f4179f",
    page: 17,
    number: 122,
    text: "أنجز أربعة أشخاص المقدار نفسه من الشغل في أزمنة 24 s و20 s و18 s و34 s على الترتيب. من صاحب القدرة الأكبر؟",
    options: ["الأول", "الثاني", "الثالث", "الرابع"],
    answer: 2,
    explanation: "القدرة P=W/t. عند تساوي الشغل، يكون صاحب الزمن الأقل صاحب القدرة الأكبر؛ وأقصر زمن هو 18 s للشخص الثالث.",
  },
  {
    id: "6ad0103563cd9c24f9f417a0",
    page: 17,
    number: 124,
    text: "في تجربة قطرة الزيت لمليكان، لماذا تطفو القطرة ساكنة؟",
    options: [
      "لأن المجالين الكهربائي والمغناطيسي متساويان",
      "لأن القوة الكهربائية تعادل قوة الجاذبية",
      "بسبب التوزيع المتعادل للشحنة",
      "لأن القوتين الكهربائية والمغناطيسية متساويتان",
    ],
    answer: 1,
    explanation: "تطفو القطرة عندما تتزن القوى عليها؛ أي تتساوى القوة الكهربائية المتجهة إلى أعلى مع قوة الجاذبية المتجهة إلى أسفل.",
  },
  {
    id: "6ad0103563cd9c24f9f417a1",
    page: 17,
    number: 125,
    text: "قُرّب قضيب سالب من كرة موصلة متعادلة، ثم أُرضت الكرة، وفُصل التأريض قبل إبعاد القضيب. ما شحنة الكرة بعد إبعاد القضيب؟",
    options: ["موجبة", "سالبة", "متعادلة", "تكتسب شحنة القضيب نفسها"],
    answer: 0,
    explanation: "القضيب السالب يطرد الإلكترونات من الكرة إلى الأرض. عند فصل التأريض تبقى الكرة بنقص في الإلكترونات، أي بشحنة موجبة. إزالة القضيب بعد ذلك لا تعيد شحنة سالبة إليها.",
  },
] as const;

const rejections = [
  {
    id: "6ad0103563cd9c24f9f4179e",
    page: 17,
    number: 121,
    note: "مرفوض من البنك المنشور: خيار «تكتسب الفوتونات طاقة عند اصطدامها» تعميم غير محدد علميًا؛ يتوقف تبادل الطاقة على نوع التفاعل، فلا يصلح مفتاح واحد بصيغته الحالية.",
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
    .select("_id questionId sourceKey sourceId sourceOrdinal subject text options sourcePage sourceQuestionNumber sourceBlockIndex sourceImageObjectKey requiresImage sourceBook subcategory topic difficulty")
    .lean() as any[];
  const byId = new Map(drafts.map((draft) => [String(draft._id), draft]));
  const failures: string[] = [];
  if (drafts.length !== reviewed.length) failures.push(`expected ${reviewed.length} pending source rows, found ${drafts.length}`);
  for (const item of approvals) {
    const draft = byId.get(item.id);
    if (!draft || draft.sourcePage !== item.page || !draft.sourceKey) {
      failures.push(`q${item.number}: source/page mismatch`);
      continue;
    }
    if (item.options.length !== 4 || item.options.some((option) => !option.trim()) ||
      !Number.isInteger(item.answer) || item.answer < 0 || item.answer > 3) {
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
          subcategory: draft.subcategory || "فيزياء",
          text: item.text,
          options: [...item.options],
          correctOptionIndex: item.answer,
          difficulty: draft.difficulty || "intermediate",
          topic: draft.topic || draft.subcategory || "فيزياء",
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
          reviewerNotes: ("reviewNote" in item && item.reviewNote) ||
            "تم التحقق من نص السؤال والخيارات والحل مع المصدر، وأضيف شرح واضح.",
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
