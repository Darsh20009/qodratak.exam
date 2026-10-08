export type FoundationPlacementProgram = 'qudrat' | 'tahsili';
export type FoundationPlacementDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type FoundationPlacementConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export const FOUNDATION_PLACEMENT_VERSION = 'v1';

export interface FoundationPlacementQuestion {
  id: string;
  program: FoundationPlacementProgram;
  areaKey: string;
  areaLabel: string;
  subjectId: string;
  difficulty: FoundationPlacementDifficulty;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface PublicFoundationPlacementQuestion
  extends Omit<FoundationPlacementQuestion, 'correctOptionIndex'> {}

export interface FoundationPlacementAreaResult {
  key: string;
  label: string;
  subjectId: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  difficultyCoverage: Array<{
    difficulty: FoundationPlacementDifficulty;
    totalQuestions: number;
    correctAnswers: number;
  }>;
}

export interface FoundationPlacementResult {
  program: FoundationPlacementProgram;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  answeredQuestions: number;
  confidence: {
    level: FoundationPlacementConfidence;
    label: string;
    note: string;
  };
  areas: FoundationPlacementAreaResult[];
  focusArea: FoundationPlacementAreaResult | null;
  recommendation: {
    title: string;
    reason: string;
    href: string;
    startingLevel: 'foundation' | 'practice' | 'program_overview';
  };
}

const difficulties: FoundationPlacementDifficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
];

function question(
  program: FoundationPlacementProgram,
  areaKey: string,
  areaLabel: string,
  difficulty: FoundationPlacementDifficulty,
  id: string,
  text: string,
  options: string[],
  correctOptionIndex: number,
): FoundationPlacementQuestion {
  return {
    id,
    program,
    areaKey,
    areaLabel,
    subjectId: `subject.${program}.${areaKey}`,
    difficulty,
    text,
    options,
    correctOptionIndex,
  };
}

const qudratQuestions: FoundationPlacementQuestion[] = [
  question('qudrat', 'verbal', 'القدرات اللفظية', 'beginner', 'qv-b-01',
    'ما أقرب معنى لكلمة «يؤازر»؟',
    ['يساند', 'يعارض', 'يتردد', 'ينسى'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'beginner', 'qv-b-02',
    'أكمل الجملة: يراجع الطالب أخطاءه باستمرار كي ___ أداءه.',
    ['يحسّن', 'يؤجل', 'يخفي', 'يشتت'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'beginner', 'qv-b-03',
    'البوصلة تحدد الاتجاه، كما أن الساعة تحدد ___ .',
    ['الوقت', 'المسافة', 'الوزن', 'الحرارة'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'intermediate', 'qv-i-01',
    'ما أقرب معنى لكلمة «مقتصد» في وصف شخص؟',
    ['غير مسرف', 'كثير السفر', 'سريع الغضب', 'محب للمنافسة'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'intermediate', 'qv-i-02',
    'أكمل الجملة: لم يعتمد نجاح الفريق على موهبة أفراده وحدها، بل على ___ بينهم.',
    ['التعاون', 'التردد', 'التنافس المنفرد', 'تبادل اللوم'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'intermediate', 'qv-i-03',
    'اقرأ: «يساعد تقسيم المراجعة على أيام متعددة الطالب على استرجاع المعلومات واكتشاف ما نسيه». ما الفكرة الرئيسة؟',
    ['توزيع المراجعة يدعم تثبيت المعلومات', 'المراجعة لا تفيد قبل الاختبار', 'جلسة واحدة تكفي دائمًا', 'النسيان يمنع التعلم'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'advanced', 'qv-a-01',
    'بذرة : شجرة، كما أن فكرة : ___ .',
    ['مشروع', 'قلم', 'نافذة', 'ميزان'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'advanced', 'qv-a-02',
    'اقرأ: «قد ينجز الطالب ساعات طويلة من التدريب، لكن مراجعة الإجابات تكشف له سبب الخطأ وتساعده على تجنبه». أي استنتاج تدعمه العبارة؟',
    ['تحليل الخطأ جزء مهم من فائدة التدريب', 'زيادة الوقت وحدها تضمن الإجابة الصحيحة', 'ينبغي تجنب مراجعة الإجابات', 'الأخطاء لا تتكرر أبدًا'], 0),
  question('qudrat', 'verbal', 'القدرات اللفظية', 'advanced', 'qv-a-03',
    'أكمل: كلما اتضحت المعطيات، ___ اختيار العلاقة المناسبة.',
    ['سَهُلَ', 'استحال', 'تأخر عن', 'انقطع عن'], 0),

  question('qudrat', 'quantitative', 'القدرات الكمية', 'beginner', 'qq-b-01',
    'كم يساوي 25٪ من 80؟',
    ['10', '20', '25', '40'], 1),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'beginner', 'qq-b-02',
    'تقسم كمية بنسبة 2 : 3 وكان مجموع الجزأين 25. كم يساوي الجزء الأكبر؟',
    ['10', '12', '15', '18'], 2),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'beginner', 'qq-b-03',
    'إذا كان ثمن 3 أقلام 12 ريالًا، فما ثمن 5 أقلام بالسعر نفسه؟',
    ['15', '18', '20', '24'], 2),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'intermediate', 'qq-i-01',
    'إذا كان 3س + 5 = 20، فما قيمة س؟',
    ['3', '5', '7', '15'], 1),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'intermediate', 'qq-i-02',
    'سيارة تسير بسرعة ثابتة 60 كيلومترًا في الساعة لمدة ساعتين ونصف. ما المسافة التي تقطعها؟',
    ['120 كم', '140 كم', '150 كم', '180 كم'], 2),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'intermediate', 'qq-i-03',
    'مثلث قاعدته 10 سم وارتفاعه 6 سم. ما مساحته؟',
    ['16 سم²', '30 سم²', '60 سم²', '120 سم²'], 1),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'advanced', 'qq-a-01',
    'متوسط أربعة أعداد يساوي 12. إذا كانت ثلاثة منها 9 و12 و15، فما العدد الرابع؟',
    ['10', '12', '14', '16'], 1),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'advanced', 'qq-a-02',
    'سعر سلعة 200 ريال. خُفّض السعر 20٪ ثم زيد السعر الجديد 25٪. ما السعر النهائي؟',
    ['180 ريالًا', '190 ريالًا', '200 ريال', '210 ريالات'], 2),
  question('qudrat', 'quantitative', 'القدرات الكمية', 'advanced', 'qq-a-03',
    'لدى متجر 48 قطعة. باع ثلثها صباحًا، ثم باع ربع ما تبقى عصرًا. كم قطعة بقيت؟',
    ['20', '24', '28', '32'], 1),
];

const tahsiliQuestions: FoundationPlacementQuestion[] = [
  question('tahsili', 'math', 'الرياضيات', 'beginner', 'tm-b-01',
    'ما قيمة س في المعادلة 2س + 5 = 15؟',
    ['3', '5', '7', '10'], 1),
  question('tahsili', 'math', 'الرياضيات', 'beginner', 'tm-b-02',
    'مستطيل طوله 6 سم وعرضه 4 سم. ما مساحته؟',
    ['10 سم²', '20 سم²', '24 سم²', '48 سم²'], 2),
  question('tahsili', 'math', 'الرياضيات', 'beginner', 'tm-b-03',
    'ما قيمة 3² + 4؟',
    ['13', '18', '25', '49'], 0),
  question('tahsili', 'math', 'الرياضيات', 'intermediate', 'tm-i-01',
    'ما ميل المستقيم المار بالنقطتين (2، 3) و(4، 7)؟',
    ['1', '2', '3', '4'], 1),
  question('tahsili', 'math', 'الرياضيات', 'intermediate', 'tm-i-02',
    'تقسم كمية بنسبة 3 : 5 وكان مجموعها 40. ما قيمة الجزء الأصغر؟',
    ['12', '15', '20', '25'], 1),
  question('tahsili', 'math', 'الرياضيات', 'intermediate', 'tm-i-03',
    'ارتفعت قيمة من 80 إلى 100. ما نسبة الزيادة؟',
    ['20٪', '25٪', '40٪', '80٪'], 1),
  question('tahsili', 'math', 'الرياضيات', 'advanced', 'tm-a-01',
    'ما حلا المعادلة س² − 5س + 6 = 0؟',
    ['1 و6', '2 و3', '−2 و−3', '−1 و−6'], 1),
  question('tahsili', 'math', 'الرياضيات', 'advanced', 'tm-a-02',
    'في كيس 4 كرات حمراء و3 زرقاء. سُحبت كرتان متتاليتان دون إرجاع. ما احتمال أن تكونا حمراوين؟',
    ['1/7', '2/7', '3/7', '4/7'], 1),

  question('tahsili', 'physics', 'الفيزياء', 'beginner', 'tp-b-01',
    'قطع جسم مسافة 120 مترًا في 10 ثوانٍ. ما متوسط سرعته؟',
    ['10 م/ث', '12 م/ث', '20 م/ث', '120 م/ث'], 1),
  question('tahsili', 'physics', 'الفيزياء', 'beginner', 'tp-b-02',
    'ما وحدة قياس القوة في النظام الدولي؟',
    ['الجول', 'النيوتن', 'الواط', 'الباسكال'], 1),
  question('tahsili', 'physics', 'الفيزياء', 'beginner', 'tp-b-03',
    'ما وزن جسم كتلته 2 كجم قرب سطح الأرض إذا اعتُبر تسارع الجاذبية 10 م/ث²؟',
    ['2 نيوتن', '10 نيوتن', '20 نيوتن', '200 نيوتن'], 2),
  question('tahsili', 'physics', 'الفيزياء', 'intermediate', 'tp-i-01',
    'أثرت قوة محصلة مقدارها 12 نيوتن في جسم كتلته 3 كجم. ما تسارعه؟',
    ['3 م/ث²', '4 م/ث²', '9 م/ث²', '36 م/ث²'], 1),
  question('tahsili', 'physics', 'الفيزياء', 'intermediate', 'tp-i-02',
    'جسم كتلته 2 كجم على ارتفاع 5 أمتار. احسب طاقة وضعه، بافتراض g = 10 م/ث².',
    ['25 جول', '50 جول', '100 جول', '200 جول'], 2),
  question('tahsili', 'physics', 'الفيزياء', 'intermediate', 'tp-i-03',
    'وُصلت مقاومتان 2 أوم و3 أوم على التوالي. ما المقاومة المكافئة؟',
    ['1 أوم', '2.5 أوم', '5 أوم', '6 أوم'], 2),
  question('tahsili', 'physics', 'الفيزياء', 'advanced', 'tp-a-01',
    'ما الطاقة الحركية لجسم كتلته 4 كجم ويتحرك بسرعة 5 م/ث؟',
    ['20 جول', '40 جول', '50 جول', '100 جول'], 2),
  question('tahsili', 'physics', 'الفيزياء', 'advanced', 'tp-a-02',
    'مقاومتان 6 أوم و3 أوم موصولتان على التوازي. ما مقاومتهما المكافئة؟',
    ['1 أوم', '2 أوم', '3 أوم', '9 أوم'], 1),

  question('tahsili', 'chemistry', 'الكيمياء', 'beginner', 'tc-b-01',
    'ما العدد الذري لعنصر الكربون؟',
    ['4', '6', '8', '12'], 1),
  question('tahsili', 'chemistry', 'الكيمياء', 'beginner', 'tc-b-02',
    'أي رابطة تتكون عندما تتشارك الذرات بالإلكترونات؟',
    ['أيونية', 'تساهمية', 'فلزية', 'هيدروجينية'], 1),
  question('tahsili', 'chemistry', 'الكيمياء', 'beginner', 'tc-b-03',
    'عند درجة حرارة 25°م، ما قيمة pH للمحلول المتعادل؟',
    ['1', '5', '7', '14'], 2),
  question('tahsili', 'chemistry', 'الكيمياء', 'intermediate', 'tc-i-01',
    'ما المعاملات الصحيحة لمعادلة تكوين الماء: H₂ + O₂ → H₂O؟',
    ['1، 1، 1', '2، 1، 2', '1، 2، 1', '2، 2، 1'], 1),
  question('tahsili', 'chemistry', 'الكيمياء', 'intermediate', 'tc-i-02',
    'كم عدد مولات الماء في 36 غرامًا؟ (الكتلة المولية للماء 18 غ/مول)',
    ['1 مول', '2 مول', '18 مولًا', '36 مولًا'], 1),
  question('tahsili', 'chemistry', 'الكيمياء', 'intermediate', 'tc-i-03',
    'أي محلول مما يلي حمضي؟',
    ['pH = 3', 'pH = 7', 'pH = 9', 'pH = 12'], 0),
  question('tahsili', 'chemistry', 'الكيمياء', 'advanced', 'tc-a-01',
    'أُذيب 0.5 مول من مادة في 2 لتر من المحلول. ما التركيز المولاري؟',
    ['0.25 مول/لتر', '1 مول/لتر', '2.5 مول/لتر', '4 مول/لتر'], 0),
  question('tahsili', 'chemistry', 'الكيمياء', 'advanced', 'tc-a-02',
    'ما عدد أكسدة الأكسجين في فوق أكسيد الهيدروجين H₂O₂؟',
    ['−2', '−1', '0', '+1'], 1),

  question('tahsili', 'biology', 'الأحياء', 'beginner', 'tb-b-01',
    'أي عضية ترتبط بإنتاج معظم جزيئات ATP في الخلية؟',
    ['النواة', 'الميتوكوندريا', 'جهاز جولجي', 'الريبوسوم'], 1),
  question('tahsili', 'biology', 'الأحياء', 'beginner', 'tb-b-02',
    'ما التركيب الذي يحيط بالخلية النباتية ويوفر لها دعامة؟',
    ['الجدار الخلوي', 'الغشاء النووي', 'الجسم المركزي', 'الريبوسوم'], 0),
  question('tahsili', 'biology', 'الأحياء', 'beginner', 'tb-b-03',
    'أين توجد المادة الوراثية DNA في الخلية حقيقية النواة غالبًا؟',
    ['النواة', 'جهاز جولجي', 'الفجوة العصارية', 'الغشاء الخلوي فقط'], 0),
  question('tahsili', 'biology', 'الأحياء', 'intermediate', 'tb-i-01',
    'إذا تزاوج فردان طرازهما الجيني Aa، فما احتمال ظهور الطراز aa في النسل؟',
    ['0٪', '25٪', '50٪', '75٪'], 1),
  question('tahsili', 'biology', 'الأحياء', 'intermediate', 'tb-i-02',
    'أين تحدث معظم تفاعلات البناء الضوئي التي تعتمد على الضوء في الخلية النباتية؟',
    ['البلاستيدات الخضراء', 'الميتوكوندريا', 'النواة', 'الليسوسومات'], 0),
  question('tahsili', 'biology', 'الأحياء', 'intermediate', 'tb-i-03',
    'ما الوظيفة الرئيسة للريبوسومات؟',
    ['تصنيع البروتين', 'تخزين الماء', 'إنتاج الضوء', 'هضم الجلوكوز خارج الخلية'], 0),
  question('tahsili', 'biology', 'الأحياء', 'advanced', 'tb-a-01',
    'في تزاوج AaBb × AaBb، ومع استقلال توريث الجينين، ما احتمال النمط الجيني aabb؟',
    ['1/4', '1/8', '1/16', '3/16'], 2),
  question('tahsili', 'biology', 'الأحياء', 'advanced', 'tb-a-02',
    'أي وصف يطابق تضاعف DNA شبه المحافظ؟',
    ['كل جزيء جديد يحوي شريطًا قديمًا وآخر جديدًا', 'كل جزيء جديد مكوّن من شريطين قديمين', 'يتحول DNA كله إلى RNA', 'ينتج شريط واحد فقط في كل مرة'], 0),
];

export const FOUNDATION_PLACEMENT_QUESTIONS: FoundationPlacementQuestion[] = [
  ...qudratQuestions,
  ...tahsiliQuestions,
];

export function getFoundationPlacementQuestions(program: FoundationPlacementProgram) {
  return FOUNDATION_PLACEMENT_QUESTIONS.filter((item) => item.program === program);
}

export function getFoundationPlacementQuestion(program: FoundationPlacementProgram, id: string) {
  return FOUNDATION_PLACEMENT_QUESTIONS.find((item) => item.program === program && item.id === id);
}

export function toPublicFoundationPlacementQuestion(
  item: FoundationPlacementQuestion,
): PublicFoundationPlacementQuestion {
  const { correctOptionIndex: _answerKey, ...publicQuestion } = item;
  return publicQuestion;
}

export function shuffleFoundationPlacementQuestions(
  items: FoundationPlacementQuestion[],
  random: () => number = Math.random,
) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function scoreFoundationPlacementAssessment(
  program: FoundationPlacementProgram,
  items: FoundationPlacementQuestion[],
  answers: Map<string, number>,
): FoundationPlacementResult {
  const areas = new Map<string, FoundationPlacementAreaResult>();
  let correctAnswers = 0;

  for (const item of items) {
    const area = areas.get(item.areaKey) || {
      key: item.areaKey,
      label: item.areaLabel,
      subjectId: item.subjectId,
      totalQuestions: 0,
      correctAnswers: 0,
      percentage: 0,
      difficultyCoverage: difficulties.map((difficulty) => ({
        difficulty,
        totalQuestions: 0,
        correctAnswers: 0,
      })),
    };
    const difficultyBucket = area.difficultyCoverage.find(
      (entry) => entry.difficulty === item.difficulty,
    );
    area.totalQuestions += 1;
    if (answers.get(item.id) === item.correctOptionIndex) {
      area.correctAnswers += 1;
      correctAnswers += 1;
      if (difficultyBucket) difficultyBucket.correctAnswers += 1;
    }
    if (difficultyBucket) difficultyBucket.totalQuestions += 1;
    areas.set(item.areaKey, area);
  }

  const areaResults = Array.from(areas.values()).map((area) => ({
    ...area,
    percentage: area.totalQuestions
      ? Math.round((area.correctAnswers / area.totalQuestions) * 100)
      : 0,
  }));
  const totalQuestions = items.length;
  const answeredQuestions = items.reduce(
    (count, item) => count + Number(answers.has(item.id)),
    0,
  );
  const percentage = totalQuestions
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;
  const minimumCoverage = program === 'qudrat' ? 9 : 8;
  const completeCoverage =
    answeredQuestions === totalQuestions &&
    areaResults.length === (program === 'qudrat' ? 2 : 4) &&
    areaResults.every((area) => area.totalQuestions >= minimumCoverage) &&
    areaResults.every((area) =>
      difficulties.every((difficulty) =>
        area.difficultyCoverage.some(
          (entry) => entry.difficulty === difficulty && entry.totalQuestions > 0,
        ),
      ),
    );
  const confidence = completeCoverage
    ? {
        level: 'MEDIUM' as const,
        label: 'متوسطة',
        note: 'العينة تغطي أقسام البرنامج وثلاث درجات صعوبة، لكنها تقدير بداية غير معياري ولا تتنبأ بالدرجة الرسمية.',
      }
    : {
        level: 'LOW' as const,
        label: 'منخفضة',
        note: 'الإجابات أو التغطية غير مكتملة؛ لا نعتمد عليها لتحديد نقطة بداية دقيقة.',
      };

  const orderedAreas = [...areaResults].sort(
    (left, right) =>
      left.percentage - right.percentage ||
      left.label.localeCompare(right.label, 'ar'),
  );
  const lowestArea = orderedAreas[0] || null;
  const remainingAreaAverage = orderedAreas.length > 1
    ? orderedAreas.slice(1).reduce((sum, area) => sum + area.percentage, 0) /
      (orderedAreas.length - 1)
    : 0;
  const focusArea = lowestArea &&
    remainingAreaAverage - lowestArea.percentage >= 25
    ? lowestArea
    : null;

  const startingLevel: FoundationPlacementResult['recommendation']['startingLevel'] = focusArea
    ? focusArea.percentage < 60
      ? 'foundation'
      : 'practice'
    : 'program_overview';
  const href = focusArea
    ? focusArea.percentage < 60
      ? `/foundation?program=${program}&subject=${focusArea.key}`
      : program === 'qudrat'
        ? `/learning/today?programId=program.qudrat&subjectId=${focusArea.subjectId}`
        : tahsiliPracticeHref(focusArea.key)
    : `/foundation?program=${program}`;
  const recommendation = focusArea
    ? {
        title: startingLevel === 'foundation'
          ? `ابدأ من أساسيات ${focusArea.label}`
          : `ابدأ تدريب ${focusArea.label}`,
        reason: `ظهر فرق واضح في أداء ${focusArea.label} بعد ${focusArea.totalQuestions} أسئلة موزعة على مستويات صعوبة مختلفة؛ ابدأ بهذا المسار ثم أعد القياس.`,
        href,
        startingLevel,
      }
    : {
        title: percentage < 60
          ? 'ابدأ التأسيس المتدرج في البرنامج'
          : 'اتبع ترتيب مواد البرنامج ثم أعد القياس',
        reason: 'لم يظهر فرق كافٍ بين الأقسام لتسمية مادة واحدة نقطة ضعف؛ لذلك لا نحكم من إجابة منفردة ونبدأ بمسار البرنامج المتدرج.',
        href,
        startingLevel: 'program_overview' as const,
      };

  return {
    program,
    percentage,
    correctAnswers,
    totalQuestions,
    answeredQuestions,
    confidence,
    areas: areaResults,
    focusArea,
    recommendation,
  };
}

function tahsiliPracticeHref(areaKey: string) {
  const subjects: Record<string, string> = {
    math: 'رياضيات',
    physics: 'فيزياء',
    chemistry: 'كيمياء',
    biology: 'أحياء',
  };
  const subject = subjects[areaKey];
  return subject
    ? `/tahsilik/tests/subject?subject=${encodeURIComponent(subject)}`
    : '/foundation?program=tahsili';
}
