import fs from 'node:fs';
import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI is required');

const attachmentRoot = new URL('../../qodratak/public/foundation/quantitative/', import.meta.url);
const collection = [
  {
    slug: 'operations',
    title: 'العمليات الحسابية',
    description: 'أساسيات العمليات الحسابية والحساب الذهني والتقدير في القدرات الكمية.',
    order: 1,
    originalName: 'العمليات الحسابية.pdf',
  },
  {
    slug: 'ratio-proportion',
    title: 'النسبة والتناسب وأفكار أخرى',
    description: 'فهم النسبة والتناسب والمعدلات وربط الكميات بطريقة منظمة.',
    order: 2,
    originalName: 'النسبة والتناسب وأفكار أخرى.pdf',
  },
  {
    slug: 'percentage',
    title: 'النسبة المئوية',
    description: 'الزيادة والخصم والربح والخسارة والتغير المئوي.',
    order: 3,
    originalName: 'النسبة المئوية.pdf',
  },
  {
    slug: 'equations',
    title: 'المعادلات',
    description: 'تبسيط المعادلات والأنماط وتطبيق القواعد على مسائل القدرات.',
    order: 4,
    originalName: 'المعادلات.pdf',
  },
  {
    slug: 'geometry',
    title: 'الهندسة',
    description: 'المحيط والمساحة والزوايا والأشكال الهندسية الأساسية.',
    order: 5,
    originalName: 'الهندسة.pdf',
  },
  {
    slug: 'comparisons',
    title: 'المقارنات',
    description: 'استراتيجيات مقارنة كميتين واختيار المعطى الأكثر كفاية.',
    order: 6,
    originalName: 'المقارنات.pdf',
  },
  {
    slug: 'statistics',
    title: 'الإحصاء',
    description: 'المتوسط والوسيط والمدى وقراءة الجداول والبيانات.',
    order: 7,
    originalName: 'الإحصاء.pdf',
  },
  {
    slug: 'mixed-ideas',
    title: 'أفكار متنوعة',
    description: 'تدريبات متنوعة تجمع مهارات التأسيس الكمي وتزيد سرعة الحل.',
    order: 8,
    originalName: 'أفكار متنوعة.pdf',
  },
];

await mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000,
});

try {
  const foundationContent = mongoose.connection.collection('foundationcontents');
  const results = [];

  for (const lesson of collection) {
    const filePath = new URL(`${lesson.slug}.pdf`, attachmentRoot);
    const bytes = fs.statSync(filePath).size;
    const attachment = {
      id: `qudrat-quantitative-${lesson.slug}`,
      type: 'pdf',
      title: `ملزمة ${lesson.title}`,
      url: `/foundation/quantitative/${lesson.slug}.pdf`,
      originalName: lesson.originalName,
      contentType: 'application/pdf',
      bytes,
    };
    const result = await foundationContent.updateOne(
      {
        program: 'qudrat',
        subjectId: 'subject.qudrat.quantitative',
        title: lesson.title,
      },
      {
        $set: {
          program: 'qudrat',
          subjectId: 'subject.qudrat.quantitative',
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          published: true,
          attachments: [attachment],
          version: 1,
        },
        $setOnInsert: {
          videoUrl: '',
          sections: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    results.push({
      title: lesson.title,
      matched: result.matchedCount,
      created: result.upsertedCount,
      bytes,
    });
  }

  console.log(JSON.stringify({ program: 'qudrat', subjectId: 'subject.qudrat.quantitative', lessons: results }, null, 2));
} finally {
  await mongoose.disconnect();
}