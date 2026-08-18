const fs = require('fs');

// قراءة الأسئلة
const questionsData = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));

// الشرح الجديد الموحد لأسئلة القلب
const getReversalExplanation = (word1, word2, ansWord1, ansWord2) => {
  return `العلاقة هي عكس الأحرف (القلب). كلمة '${word1}' عندما نقلب أحرفها (نعكسها من النهاية للبداية) تصبح '${word2}'، وكلاهما له معنى صحيح في اللغة العربية. مثلاً: '${word1}' عكسها '${word2}'، و'${ansWord1}' عكسها '${ansWord2}'. هذا النوع من التناظر يعتمد على القلب الكامل للحروف مع الحفاظ على المعنى.`;
};

// تصحيح السؤال 6
const q6 = questionsData.verbal.find(q => q.id === 6);
if (q6) {
  q6.explanation = getReversalExplanation('ولد', 'دلو', 'بحر', 'رحب');
  console.log('✅ تم تصحيح السؤال 6: ولد : دلو');
}

// تصحيح السؤال 7
const q7 = questionsData.verbal.find(q => q.id === 7);
if (q7) {
  q7.explanation = getReversalExplanation('راح', 'حار', 'لمح', 'حمل');
  console.log('✅ تم تصحيح السؤال 7: راح : حار');
}

// تصحيح السؤال 8
const q8 = questionsData.verbal.find(q => q.id === 8);
if (q8) {
  q8.explanation = getReversalExplanation('باع', 'عاب', 'مسح', 'حسم');
  console.log('✅ تم تصحيح السؤال 8: باع : عاب');
}

// حفظ الملف
fs.writeFileSync('./questions.json', JSON.stringify(questionsData, null, 2), 'utf8');
console.log('\n💾 تم حفظ التعديلات في questions.json');

// طباعة الشروحات الجديدة
console.log('\n📝 الشروحات الجديدة:\n');
[q6, q7, q8].forEach(q => {
  if (q) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📌 السؤال ${q.id}: ${q.text}`);
    console.log(`📖 الشرح الجديد:\n${q.explanation}\n`);
  }
});
