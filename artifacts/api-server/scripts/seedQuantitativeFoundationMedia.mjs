import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI is required');

const workspaceRoot = new URL('../../../', import.meta.url);
const videoTargetRoot = new URL('../../qodratak/public/foundation/quantitative/', import.meta.url);

const lessons = [
  {
    slug: 'operations',
    title: 'العمليات الحسابية',
    order: 1,
    videoFile: 'شرح_العمليات_الحسابيه_1_mp4_@btt0bot_mp4_@btt0bot_1790005825502.mp4',
    quizTitle: 'اختبار العمليات الحسابية',
    questions: [
      ['ما ناتج ٤٨ + ٣٧؟', ['٧٥', '٨٥', '٩٥', '١٠٥'], 1, 'نجمع الآحاد ثم العشرات: ٤٨ + ٣٧ = ٨٥.'],
      ['ما ناتج ٧ × ٨؟', ['٤٨', '٥٦', '٦٤', '٧٢'], 1, 'حاصل ضرب ٧ في ٨ يساوي ٥٦.'],
      ['ما ناتج ١٤٤ ÷ ١٢؟', ['١٠', '١٢', '١٤', '١٦'], 1, 'لأن ١٢ × ١٢ = ١٤٤، فالناتج ١٢.'],
      ['ما قيمة ٣/٤ + ١/٤؟', ['١/٢', '٣/٤', '١', '٥/٤'], 2, 'المقامات متساوية، لذلك نجمع البسطين: ٤/٤ = ١.'],
      ['ما قيمة ٢³ + ٤؟', ['٨', '١٠', '١٢', '١٦'], 2, '٢³ = ٨، ثم ٨ + ٤ = ١٢.'],
    ],
  },
  {
    slug: 'equations',
    title: 'المعادلات',
    order: 2,
    videoFile: 'المنصف_في_القدرات_أفضل_منصة_تدريب_على_اختبار_القدرات1_mp4_@btt_1790006148168.mp4',
    quizTitle: 'اختبار المعادلات',
    questions: [
      ['إذا كان س + ٧ = ١٩، فما قيمة س؟', ['١٠', '١١', '١٢', '١٣'], 2, 'نطرح ٧ من الطرفين، فنحصل على س = ١٢.'],
      ['إذا كان ٣س = ٢٧، فما قيمة س؟', ['٦', '٧', '٨', '٩'], 3, 'نقسم الطرفين على ٣، فنحصل على س = ٩.'],
      ['إذا كان ٢س + ٥ = ١٧، فما قيمة س؟', ['٥', '٦', '٧', '٨'], 1, 'نطرح ٥ ثم نقسم على ٢: س = ٦.'],
      ['إذا كان س ÷ ٤ = ٦، فما قيمة س؟', ['١٠', '١٨', '٢٤', '٣٠'], 2, 'نضرب الطرفين في ٤، فتكون س = ٢٤.'],
      ['إذا كان ٥(س - ٢) = ٢٠، فما قيمة س؟', ['٤', '٥', '٦', '٧'], 2, 'نقسم على ٥ فنحصل على س - ٢ = ٤، إذن س = ٦.'],
    ],
  },
  {
    slug: 'ratio-proportion',
    title: 'النسبة والتناسب وأفكار أخرى',
    order: 3,
    videoFile: 'المنصف_في_القدرات_أفضل_منصة_تدريب_على_اختبار_القدرات4_mp4_@btt_1790006401227.mp4',
    quizTitle: 'اختبار النسبة والتناسب',
    questions: [
      ['إذا كانت النسبة بين عددين ٢ : ٣ ومجموعهما ٤٠، فما العدد الأصغر؟', ['١٢', '١٦', '٢٠', '٢٤'], 1, 'مجموع الأجزاء ٥، وقيمة الجزء ٨، فالعدد الأصغر ٢ × ٨ = ١٦.'],
      ['إذا كانت النسبة بين عددين ٤ : ٥ وكان العدد الأول ١٢، فما العدد الثاني؟', ['١٤', '١٥', '١٦', '٢٠'], 1, 'معامل التكبير ٣، لذلك العدد الثاني ٥ × ٣ = ١٥.'],
      ['إذا كان ٣/٤ = س/٢٠، فما قيمة س؟', ['١٢', '١٥', '١٦', '١٨'], 1, 'س = ٢٠ × ٣ ÷ ٤ = ١٥.'],
      ['إذا كان سعر ٣ أقلام ١٨ ريالًا، فما سعر ٥ أقلام بالسعر نفسه؟', ['٢٤', '٢٧', '٣٠', '٣٦'], 2, 'سعر القلم ٦ ريالات، إذن سعر ٥ أقلام ٣٠ ريالًا.'],
      ['قطع طالب ٤٥ كيلومترًا في ٣ ساعات. ما سرعته المتوسطة؟', ['١٢', '١٥', '١٨', '٢٠'], 1, 'السرعة = المسافة ÷ الزمن = ٤٥ ÷ ٣ = ١٥ كلم/ساعة.'],
    ],
  },
  {
    slug: 'percentage',
    title: 'النسبة المئوية',
    order: 4,
    videoFile: 'المنصف_في_القدرات_أفضل_منصة_تدريب_على_اختبار_القدرات3_mp4_@btt_1790006686000.mp4',
    quizTitle: 'اختبار النسبة المئوية',
    questions: [
      ['ما قيمة ٢٠٪ من ١٥٠؟', ['٢٠', '٢٥', '٣٠', '٣٥'], 2, '٢٠٪ = ٠٫٢، و٠٫٢ × ١٥٠ = ٣٠.'],
      ['سلعة سعرها ١٠٠ ريال، خُفّضت بنسبة ٢٠٪. ما سعرها الجديد؟', ['٧٠', '٨٠', '٨٥', '٩٠'], 1, 'قيمة الخصم ٢٠ ريالًا، فيكون السعر الجديد ٨٠ ريالًا.'],
      ['زاد سعر من ٥٠ إلى ٦٠ ريالًا. ما نسبة الزيادة؟', ['١٠٪', '١٥٪', '٢٠٪', '٢٥٪'], 2, 'الزيادة ١٠، ونسبتها إلى ٥٠ هي ٢٠٪.'],
      ['إذا كانت ٢٥٪ من عدد تساوي ٤٥، فما العدد؟', ['١٢٠', '١٥٠', '١٨٠', '٢٢٥'], 2, 'العدد = ٤٥ ÷ ٠٫٢٥ = ١٨٠.'],
      ['اشترى تاجر سلعة بـ٢٠٠ ريال وباعها بـ٢٥٠ ريالًا. ما نسبة الربح؟', ['٢٠٪', '٢٥٪', '٣٠٪', '٥٠٪'], 1, 'الربح ٥٠ ريالًا، و٥٠ ÷ ٢٠٠ = ٢٥٪.'],
    ],
  },
  {
    slug: 'statistics',
    title: 'الإحصاء',
    order: 5,
    videoFile: 'المنصف_في_القدرات_أفضل_منصة_تدريب_على_اختبار_القدرات2_mp4_@btt_1790006904410.mp4',
    quizTitle: 'اختبار الإحصاء',
    questions: [
      ['ما المتوسط الحسابي للأعداد ٤، ٦، ٨؟', ['٥', '٦', '٧', '٨'], 1, 'مجموع القيم ١٨، وبقسمته على ٣ يكون المتوسط ٦.'],
      ['ما الوسيط للأعداد ٢، ٩، ٥، ٤، ٧؟', ['٤', '٥', '٦', '٧'], 1, 'بعد الترتيب: ٢، ٤، ٥، ٧، ٩؛ فالعدد الأوسط ٥.'],
      ['ما المدى للقيم ٣، ١٢، ٨، ٥؟', ['٧', '٨', '٩', '١٠'], 2, 'المدى = أكبر قيمة - أصغر قيمة = ١٢ - ٣ = ٩.'],
      ['ما المنوال للقيم ٢، ٣، ٣، ٤، ٥؟', ['٢', '٣', '٤', '٥'], 1, 'المنوال هو الأكثر تكرارًا، وهو ٣.'],
      ['إذا كان متوسط خمسة أعداد يساوي ١٢، فما مجموعها؟', ['١٧', '٤٨', '٦٠', '٧٢'], 2, 'المجموع = المتوسط × عدد القيم = ١٢ × ٥ = ٦٠.'],
    ],
  },
  {
    slug: 'mixed-ideas',
    title: 'أفكار متنوعة',
    order: 6,
    videoFile: 'افكار_متنوعه.mp4_@btt0bot.mp4_@btt0bot_1790007215453.mp4',
    quizTitle: 'اختبار الأفكار المتنوعة',
    questions: [
      ['ما العدد التالي في النمط: ٢، ٤، ٨، ١٦، ...؟', ['٢٠', '٢٤', '٣٠', '٣٢'], 3, 'كل حد يساوي الحد السابق مضروبًا في ٢، إذن التالي ٣٢.'],
      ['ما المضاعف المشترك الأصغر للعددين ٦ و٨؟', ['١٢', '١٨', '٢٤', '٤٨'], 2, 'أصغر عدد يقبل القسمة على ٦ و٨ هو ٢٤.'],
      ['مربع محيطه ٣٦ سم. ما طول ضلعه؟', ['٦', '٨', '٩', '١٢'], 2, 'طول الضلع = المحيط ÷ ٤ = ٣٦ ÷ ٤ = ٩ سم.'],
      ['إذا كان نصف عدد يساوي ١٨، فما العدد؟', ['٩', '٢٧', '٣٦', '٤٨'], 2, 'العدد كاملًا يساوي ١٨ × ٢ = ٣٦.'],
      ['ما قيمة ١٠٪ من ٧٠ زائد ٥؟', ['٧', '١٢', '١٥', '٧٥'], 1, '١٠٪ من ٧٠ تساوي ٧، ثم ٧ + ٥ = ١٢.'],
    ],
  },
];

const videoUrl = (slug) => `/foundation/quantitative/${slug}.mp4`;

await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
});

try {
  const questions = mongoose.connection.collection('questions');
  const foundationContent = mongoose.connection.collection('foundationcontents');
  const now = new Date();
  const summary = [];

  for (const lesson of lessons) {
    const sourcePath = new URL(`attached_assets/${encodeURIComponent(lesson.videoFile)}`, workspaceRoot);
    const targetPath = new URL(`${lesson.slug}.mp4`, videoTargetRoot);
    fs.copyFileSync(sourcePath, targetPath);

    const questionIds = [];
    for (let index = 0; index < lesson.questions.length; index += 1) {
      const [text, options, correctOptionIndex, explanation] = lesson.questions[index];
      const sourceQuestionId = `foundation-quantitative-${lesson.slug}-${index + 1}`;
      const result = await questions.findOneAndUpdate(
        { 'source.type': 'manual', 'source.questionId': sourceQuestionId },
        {
          $set: {
            questionId: 100000 + lessons.indexOf(lesson) * 100 + index + 1,
            category: 'quantitative',
            subcategory: lesson.title,
            text,
            options,
            correctOptionIndex,
            difficulty: index < 2 ? 'beginner' : 'intermediate',
            topic: lesson.title,
            dialect: 'standard',
            keywords: [lesson.slug, 'تأسيس كمي'],
            section: 1,
            explanation,
            studentTip: 'اقرأ المعطيات وحدد العملية أو القاعدة المطلوبة قبل البدء.',
            answerStatus: 'approved',
            source: {
              type: 'manual',
              formTitle: lesson.quizTitle,
              questionId: sourceQuestionId,
              subcategory: lesson.title,
            },
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: 'after' },
      );
      questionIds.push(result.value?._id || result._id);
    }

    const update = await foundationContent.updateOne(
      { program: 'qudrat', subjectId: 'subject.qudrat.quantitative', title: lesson.title },
      {
        $set: {
          videoUrl: videoUrl(lesson.slug),
          order: lesson.order,
          quiz: {
            title: lesson.quizTitle,
            instructions: 'شاهد الفيديو واقرأ الملزمة، ثم أجب عن أسئلة هذا القسم.',
            questionIds,
            passingScore: 60,
            timeLimitMinutes: 10,
          },
          updatedAt: now,
        },
      },
    );
    if (!update.matchedCount) throw new Error(`Foundation lesson not found: ${lesson.title}`);

    summary.push({
      title: lesson.title,
      video: videoUrl(lesson.slug),
      videoBytes: fs.statSync(targetPath).size,
      quizQuestions: questionIds.length,
    });
  }

  await foundationContent.updateOne(
    { program: 'qudrat', subjectId: 'subject.qudrat.quantitative', title: 'الهندسة' },
    { $set: { order: 7, updatedAt: now } },
  );
  await foundationContent.updateOne(
    { program: 'qudrat', subjectId: 'subject.qudrat.quantitative', title: 'المقارنات' },
    { $set: { order: 8, updatedAt: now } },
  );

  console.log(JSON.stringify({ lessons: summary }, null, 2));
} finally {
  await mongoose.disconnect();
}