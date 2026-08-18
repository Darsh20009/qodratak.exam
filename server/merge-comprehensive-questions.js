import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { questions } from '../shared/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قاموس لتحويل الفئات العربية إلى فئات النظام
const categoryMapping = {
  'الفيزياء': 'tahsili',
  'الكيمياء': 'tahsili', 
  'الأحياء': 'tahsili',
  'الرياضيات': 'tahsili',
  'علم البيئة': 'tahsili',
  'الجيولوجيا': 'tahsili',
  'الجغرافيا': 'tahsili',
  'التاريخ': 'tahsili',
  'اللغة العربية': 'verbal',
  'اللغة الإنجليزية': 'verbal',
  'الأدب': 'verbal',
  'النحو والصرف': 'verbal',
  'البلاغة': 'verbal',
  'الإحصاء': 'quantitative',
  'الجبر': 'quantitative',
  'الهندسة': 'quantitative',
  'المنطق': 'quantitative',
  'العلوم الدينية': 'tahsili',
  'الفقه': 'tahsili',
  'التوحيد': 'tahsili',
  'الحديث': 'tahsili',
  'default': 'tahsili'
};

// قاموس لتحديد مستوى الصعوبة بناءً على عنوان الاختبار
const difficultyMapping = {
  '10': 'beginner',
  '50': 'intermediate', 
  '100': 'advanced',
  '110': 'expert'
};

async function mergeAndLoadQuestions() {
  console.log('🚀 بدء عملية دمج وتحميل الأسئلة الشاملة...');
  
  // ملفات الاختبارات المرفقة
  const examFiles = [
    'exam-10_1759141679607.json',
    'exam-50_1759141679608.json', 
    'exam-100_1759141679608.json',
    'exam-110_1759141679608.json'
  ];
  
  let comprehensiveQuestions = {
    title: "🎓 بنك الأسئلة الشامل - قدراتك الإبداعي",
    description: "مجموعة شاملة من 270+ سؤال تحصيلي متدرج الصعوبة في جميع المواد العلمية والأدبية",
    totalQuestions: 0,
    difficulty_levels: ['beginner', 'intermediate', 'advanced', 'expert'],
    categories: [],
    subjects: new Set(),
    questions: [],
    metadata: {
      created: new Date().toISOString(),
      sources: examFiles,
      version: "1.0.0",
      language: "ar",
      educational_level: "high_school_graduation"
    }
  };
  
  let totalQuestionsProcessed = 0;
  let questionsForDatabase = [];
  
  // معالجة كل ملف
  for (const fileName of examFiles) {
    try {
      console.log(`📖 معالجة ملف: ${fileName}`);
      
      const filePath = path.join(__dirname, '..', 'attached_assets', fileName);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  الملف غير موجود: ${filePath}`);
        continue;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const examData = JSON.parse(fileContent);
      
      console.log(`📋 تم العثور على ${examData.questions.length} سؤال في ${examData.title}`);
      
      // تحديد مستوى الصعوبة بناءً على اسم الملف
      let difficulty = 'intermediate';
      for (const [key, value] of Object.entries(difficultyMapping)) {
        if (fileName.includes(key)) {
          difficulty = value;
          break;
        }
      }
      
      // معالجة كل سؤال
      examData.questions.forEach((q, index) => {
        // تحضير الخيارات
        const options = q.answerOptions.map(option => option.text);
        const correctOptionIndex = q.answerOptions.findIndex(option => option.isCorrect);
        const explanation = q.answerOptions.find(option => option.isCorrect)?.rationale || q.hint || '';
        
        // تحديد الفئة
        const systemCategory = categoryMapping[q.category] || categoryMapping.default;
        
        // إضافة السؤال إلى المجموعة الشاملة
        const processedQuestion = {
          id: totalQuestionsProcessed + index + 1,
          originalFile: fileName,
          originalQuestionNumber: q.questionNumber,
          category: q.category,
          systemCategory: systemCategory,
          question: q.question,
          options: options,
          correctOptionIndex: correctOptionIndex,
          explanation: explanation,
          hint: q.hint || '',
          difficulty: difficulty,
          source: examData.title
        };
        
        comprehensiveQuestions.questions.push(processedQuestion);
        comprehensiveQuestions.subjects.add(q.category);
        
        // تحضير السؤال لقاعدة البيانات
        questionsForDatabase.push({
          category: systemCategory,
          subcategory: q.category,
          text: q.question,
          options: JSON.stringify(options),
          correctOptionIndex: correctOptionIndex,
          difficulty: difficulty,
          topic: examData.title,
          dialect: 'standard',
          keywords: JSON.stringify([q.category, 'التحصيلي', examData.subject, difficulty]),
          section: 1,
          explanation: explanation
        });
      });
      
      totalQuestionsProcessed += examData.questions.length;
      
    } catch (error) {
      console.error(`❌ خطأ في معالجة الملف ${fileName}:`, error);
    }
  }
  
  // إعداد البيانات الإحصائية
  comprehensiveQuestions.totalQuestions = totalQuestionsProcessed;
  comprehensiveQuestions.categories = Array.from(comprehensiveQuestions.subjects);
  comprehensiveQuestions.subjects = Array.from(comprehensiveQuestions.subjects);
  
  // إنشاء إحصائيات مفصلة
  const statistics = {
    totalQuestions: totalQuestionsProcessed,
    questionsByDifficulty: {},
    questionsByCategory: {},
    questionsByFile: {}
  };
  
  // حساب الإحصائيات
  comprehensiveQuestions.questions.forEach(q => {
    // إحصائيات الصعوبة
    statistics.questionsByDifficulty[q.difficulty] = (statistics.questionsByDifficulty[q.difficulty] || 0) + 1;
    
    // إحصائيات الفئات
    statistics.questionsByCategory[q.category] = (statistics.questionsByCategory[q.category] || 0) + 1;
    
    // إحصائيات الملفات
    statistics.questionsByFile[q.originalFile] = (statistics.questionsByFile[q.originalFile] || 0) + 1;
  });
  
  comprehensiveQuestions.statistics = statistics;
  
  // حفظ الملف الشامل
  const comprehensiveFilePath = path.join(__dirname, 'data', 'comprehensive-questions-bank.json');
  fs.writeFileSync(comprehensiveFilePath, JSON.stringify(comprehensiveQuestions, null, 2), 'utf-8');
  
  console.log(`✅ تم إنشاء الملف الشامل: ${comprehensiveFilePath}`);
  console.log(`📊 إجمالي الأسئلة: ${totalQuestionsProcessed}`);
  console.log(`📚 عدد المواد: ${comprehensiveQuestions.categories.length}`);
  console.log(`🎯 مستويات الصعوبة: ${Object.keys(statistics.questionsByDifficulty).join(', ')}`);
  
  // تحميل الأسئلة إلى قاعدة البيانات
  if (db) {
    try {
      console.log('🗄️ بدء تحميل الأسئلة إلى قاعدة البيانات...');
      
      // تحميل الأسئلة دفعات من 50 سؤال
      const batchSize = 50;
      for (let i = 0; i < questionsForDatabase.length; i += batchSize) {
        const batch = questionsForDatabase.slice(i, i + batchSize);
        
        try {
          await db.insert(questions).values(batch);
          console.log(`✅ تم تحميل دفعة ${Math.floor(i/batchSize) + 1}: ${batch.length} سؤال (${i + batch.length}/${questionsForDatabase.length})`);
        } catch (error) {
          console.error(`❌ خطأ في تحميل الدفعة ${Math.floor(i/batchSize) + 1}:`, error);
          // في حالة وجود خطأ، نحاول تحميل الأسئلة واحداً تلو الآخر
          for (const question of batch) {
            try {
              await db.insert(questions).values([question]);
            } catch (singleError) {
              console.error(`❌ خطأ في تحميل سؤال واحد:`, singleError);
            }
          }
        }
      }
      
      console.log('🎉 تم تحميل جميع الأسئلة إلى قاعدة البيانات بنجاح!');
      
    } catch (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
    }
  } else {
    console.warn('⚠️ لم يتم العثور على قاعدة البيانات - تم تخطي تحميل قاعدة البيانات');
  }
  
  // طباعة تقرير نهائي
  console.log('\n🎓 === تقرير الأسئلة الشاملة ===');
  console.log(`📖 إجمالي الأسئلة: ${totalQuestionsProcessed}`);
  console.log('\n📊 توزيع الأسئلة حسب الصعوبة:');
  Object.entries(statistics.questionsByDifficulty).forEach(([difficulty, count]) => {
    console.log(`   ${difficulty}: ${count} سؤال`);
  });
  
  console.log('\n📚 توزيع الأسئلة حسب المادة:');
  Object.entries(statistics.questionsByCategory).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} سؤال`);
  });
  
  console.log('\n📁 توزيع الأسئلة حسب الملف المصدر:');
  Object.entries(statistics.questionsByFile).forEach(([file, count]) => {
    console.log(`   ${file}: ${count} سؤال`);
  });
  
  console.log('\n🚀 انتهت عملية الدمج والتحميل بنجاح!');
}

// تشغيل السكريبت
mergeAndLoadQuestions().catch(console.error);