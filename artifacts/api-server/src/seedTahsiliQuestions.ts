import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { questions } from "@workspace/db";
import * as fs from 'fs';
import * as path from 'path';

// إعداد قاعدة البيانات
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface TahsiliOption {
  text: string;
  rationale: string;
  isCorrect: boolean;
}

interface TahsiliQuestion {
  questionNumber: number;
  category: string;
  question: string;
  answerOptions: TahsiliOption[];
  hint?: string;
}

interface ExamData {
  title: string;
  subject: string;
  questions: TahsiliQuestion[];
}

// تحويل فئات الأسئلة من العربية إلى الإنجليزية للاتساق مع قاعدة البيانات
const categoryMap: { [key: string]: string } = {
  'الفيزياء': 'tahsili',
  'الكيمياء': 'tahsili',
  'الأحياء': 'tahsili',
  'الرياضيات': 'tahsili',
  'علم البيئة': 'tahsili'
};

// تحويل الصعوبة إلى مستوى مناسب
const getDifficultyLevel = (examTitle: string): string => {
  if (examTitle.includes('50 سؤالًا')) return 'intermediate';
  if (examTitle.includes('تجريبي')) return 'intermediate';
  if (examTitle.includes('100') && examTitle.includes('متقدم')) return 'advanced';
  return 'intermediate';
};

async function seedTahsiliQuestions() {
  console.log('🎓 بدء إضافة أسئلة التحصيلي...');

  const examFiles = [
    'Pasted--title-50-subject-questions-q-1758497339676_1758497339677.txt',
    'Pasted--title-subject-questions-questi-1758497370915_1758497370915.txt',
    'Pasted--title-100-subject-questions--1758497926989_1758497926991.txt'
  ];

  // ملفات الاختبارات الجديدة في مجلد البيانات
  const newExamFiles = [
    'exam-10.json',
    'exam-50.json', 
    'exam-100.json',
    'exam-110.json'
  ];

  let totalQuestionsAdded = 0;

  // معالجة الملفات القديمة من attached_assets
  for (const fileName of examFiles) {
    try {
      console.log(`📖 قراءة ملف: ${fileName}`);
      
      const filePath = path.join(process.cwd(), '..', 'attached_assets', fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  الملف غير موجود: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const examData: ExamData = JSON.parse(fileContent);
      
      console.log(`📋 تم العثور على ${examData.questions.length} سؤال في ${examData.title}`);
      
      const difficulty = getDifficultyLevel(examData.title);
      
      // تحضير الأسئلة للإدراج
      const questionsToInsert = examData.questions.map((q) => {
        // تحضير الخيارات
        const options = q.answerOptions.map(option => option.text);
        const correctOptionIndex = q.answerOptions.findIndex(option => option.isCorrect);
        const explanation = q.answerOptions.find(option => option.isCorrect)?.rationale || '';
        
        return {
          category: categoryMap[q.category] || 'tahsili',
          subcategory: q.category, // نحتفظ بالفئة العربية كفئة فرعية
          text: q.question,
          options: JSON.stringify(options),
          correctOptionIndex: correctOptionIndex,
          difficulty: difficulty,
          topic: examData.title,
          dialect: 'standard' as const,
          keywords: JSON.stringify([q.category, 'التحصيلي', examData.subject]),
          section: 1,
          explanation: explanation
        };
      });

      // إدراج الأسئلة في قاعدة البيانات
      for (let i = 0; i < questionsToInsert.length; i += 100) {
        const batch = questionsToInsert.slice(i, i + 100);
        
        await db.insert(questions).values(batch);
        console.log(`✅ تم إدراج ${batch.length} سؤال (${i + batch.length}/${questionsToInsert.length})`);
      }

      totalQuestionsAdded += questionsToInsert.length;
      console.log(`🎉 تم إضافة جميع أسئلة ${examData.title} بنجاح!`);

    } catch (error) {
      console.error(`❌ خطأ في معالجة الملف ${fileName}:`, error);
    }
  }

  // معالجة الملفات الجديدة من server/data
  for (const fileName of newExamFiles) {
    try {
      console.log(`📖 قراءة ملف جديد: ${fileName}`);
      
      const filePath = path.join(process.cwd(), 'server', 'data', fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  الملف غير موجود: ${filePath}`);
        continue;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const examData: ExamData = JSON.parse(fileContent);
      
      console.log(`📋 تم العثور على ${examData.questions.length} سؤال في ${examData.title}`);
      
      const difficulty = getDifficultyLevel(examData.title);
      
      // تحضير الأسئلة للإدراج
      const questionsToInsert = examData.questions.map((q) => {
        // تحضير الخيارات
        const options = q.answerOptions.map(option => option.text);
        const correctOptionIndex = q.answerOptions.findIndex(option => option.isCorrect);
        const explanation = q.answerOptions.find(option => option.isCorrect)?.rationale || '';
        
        return {
          category: categoryMap[q.category] || 'tahsili',
          subcategory: q.category, // نحتفظ بالفئة العربية كفئة فرعية
          text: q.question,
          options: JSON.stringify(options),
          correctOptionIndex: correctOptionIndex,
          difficulty: difficulty,
          topic: examData.title,
          dialect: 'standard' as const,
          keywords: JSON.stringify([q.category, 'التحصيلي', examData.subject]),
          section: 1,
          explanation: explanation
        };
      });

      // إدراج الأسئلة في قاعدة البيانات
      for (let i = 0; i < questionsToInsert.length; i += 100) {
        const batch = questionsToInsert.slice(i, i + 100);
        
        await db.insert(questions).values(batch);
        console.log(`✅ تم إدراج ${batch.length} سؤال (${i + batch.length}/${questionsToInsert.length})`);
      }

      totalQuestionsAdded += questionsToInsert.length;
      console.log(`🎉 تم إضافة جميع أسئلة ${examData.title} بنجاح!`);

    } catch (error) {
      console.error(`❌ خطأ في معالجة الملف ${fileName}:`, error);
    }
  }

  console.log(`\n🏆 تم الانتهاء! تم إضافة ${totalQuestionsAdded} سؤال إجمالي للتحصيلي`);
}

// تشغيل العملية
seedTahsiliQuestions()
  .then(() => {
    console.log('✨ تم الانتهاء بنجاح من إضافة أسئلة التحصيلي!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 فشل في إضافة أسئلة التحصيلي:', error);
    process.exit(1);
  });

export { seedTahsiliQuestions };