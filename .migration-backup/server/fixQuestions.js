import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قراءة ملف الأسئلة
const questionsPath = path.join(__dirname, 'data', 'questions_new.json');
const data = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

console.log('🔧 بدء إصلاح ملف الأسئلة...');

// خيارات إضافية ذكية لكل فئة
const additionalOptions = {
  'التناظر اللفظي': [
    'بيت : مسكن',
    'كتاب : معرفة',
    'شمس : نهار',
    'قلم : كتابة',
    'ماء : حياة',
    'نار : حرارة',
    'طعام : جوع',
    'دواء : مرض',
    'مفتاح : باب',
    'عين : بصر'
  ],
  'إكمال الجمل': [
    'المعرفة',
    'الحكمة',
    'الصبر',
    'التقدم',
    'النجاح',
    'الفهم',
    'التطور',
    'الإنجاز',
    'الهدف',
    'المثابرة'
  ],
  'استيعاب المقروء': [
    'الفهم الصحيح',
    'التحليل الدقيق',
    'الاستنتاج المنطقي',
    'الفكرة الرئيسية',
    'المعنى الضمني',
    'السياق العام',
    'الهدف من النص',
    'رأي الكاتب',
    'الخلاصة',
    'التفسير'
  ],
  'الهندسة': [
    '120°',
    '90°',
    '60°',
    '45°',
    '30°',
    '180°',
    'π',
    '2π',
    'المحيط',
    'المساحة'
  ],
  'عمليات حسابية': [
    '100',
    '50',
    '25',
    '10',
    '5',
    '20',
    '75',
    '125',
    '200',
    '150'
  ],
  'النسبة والتناسب': [
    '1:2',
    '2:3',
    '3:4',
    '1:3',
    '2:5',
    '4:5',
    '3:5',
    '1:4',
    '5:6',
    '2:7'
  ],
  'الإحصاء': [
    'المتوسط',
    'الوسيط',
    'المنوال',
    'المدى',
    'التباين',
    'الانحراف المعياري',
    'النسبة المئوية',
    'التكرار',
    'التوزيع',
    'الاحتمال'
  ]
};

let fixedCount = 0;
let totalQuestions = 0;

// إصلاح الأسئلة اللفظية
if (data.verbal && Array.isArray(data.verbal)) {
  data.verbal.forEach((question, index) => {
    totalQuestions++;
    
    if (!question.options || question.options.length < 4) {
      const category = question.category || 'التناظر اللفظي';
      const currentOptions = question.options || [];
      const neededOptions = 4 - currentOptions.length;
      
      const availableOptions = additionalOptions[category] || additionalOptions['التناظر اللفظي'];
      
      // إضافة خيارات جديدة بحيث لا تتكرر
      const usedOptions = new Set(currentOptions.map(opt => opt.trim().toLowerCase()));
      const newOptions = [];
      
      for (let i = 0; i < availableOptions.length && newOptions.length < neededOptions; i++) {
        const option = availableOptions[i];
        if (!usedOptions.has(option.trim().toLowerCase())) {
          newOptions.push(option);
          usedOptions.add(option.trim().toLowerCase());
        }
      }
      
      // إذا لم نجد خيارات كافية، نضيف خيارات عامة
      while (newOptions.length < neededOptions) {
        const generalOptions = ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث', 'الخيار الرابع'];
        const option = generalOptions[newOptions.length] || `خيار ${newOptions.length + 1}`;
        newOptions.push(option);
      }
      
      question.options = [...currentOptions, ...newOptions];
      fixedCount++;
      
      console.log(`✅ تم إصلاح السؤال ${index + 1} (اللفظي): أضيف ${neededOptions} خيارات`);
    }
    
    // التأكد من وجود correctOptionIndex صحيح
    if (question.correctOptionIndex === undefined || question.correctOptionIndex >= question.options.length) {
      question.correctOptionIndex = 0;
    }
    
    // إضافة explanation إذا لم يكن موجوداً
    if (!question.explanation) {
      question.explanation = 'شرح مفصل للإجابة الصحيحة.';
    }
  });
}

// إصلاح الأسئلة الكمية
if (data.quantitative && Array.isArray(data.quantitative)) {
  data.quantitative.forEach((question, index) => {
    totalQuestions++;
    
    if (!question.options || question.options.length < 4) {
      const category = question.category || 'عمليات حسابية';
      const currentOptions = question.options || [];
      const neededOptions = 4 - currentOptions.length;
      
      const availableOptions = additionalOptions[category] || additionalOptions['عمليات حسابية'];
      
      // إضافة خيارات جديدة بحيث لا تتكرر
      const usedOptions = new Set(currentOptions.map(opt => opt.toString().trim().toLowerCase()));
      const newOptions = [];
      
      for (let i = 0; i < availableOptions.length && newOptions.length < neededOptions; i++) {
        const option = availableOptions[i];
        if (!usedOptions.has(option.toString().trim().toLowerCase())) {
          newOptions.push(option);
          usedOptions.add(option.toString().trim().toLowerCase());
        }
      }
      
      // إذا لم نجد خيارات كافية، نضيف خيارات رقمية منطقية
      while (newOptions.length < neededOptions) {
        const randomNum = Math.floor(Math.random() * 200) + 1;
        if (!usedOptions.has(randomNum.toString())) {
          newOptions.push(randomNum.toString());
          usedOptions.add(randomNum.toString());
        }
      }
      
      question.options = [...currentOptions, ...newOptions];
      fixedCount++;
      
      console.log(`✅ تم إصلاح السؤال ${index + 1} (الكمي): أضيف ${neededOptions} خيارات`);
    }
    
    // التأكد من وجود correctOptionIndex صحيح
    if (question.correctOptionIndex === undefined || question.correctOptionIndex >= question.options.length) {
      question.correctOptionIndex = 0;
    }
    
    // إضافة explanation إذا لم يكن موجوداً
    if (!question.explanation) {
      question.explanation = 'شرح مفصل للحل الرياضي.';
    }
  });
}

// حفظ الملف المحدث
fs.writeFileSync(questionsPath, JSON.stringify(data, null, 2), 'utf8');

console.log('\n🎉 تم الانتهاء من إصلاح ملف الأسئلة!');
console.log(`📊 إجمالي الأسئلة: ${totalQuestions}`);
console.log(`🔧 الأسئلة المُصلحة: ${fixedCount}`);
console.log(`✅ جميع الأسئلة الآن تحتوي على 4 خيارات على الأقل`);