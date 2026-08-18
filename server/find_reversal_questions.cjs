const fs = require('fs');

// وظيفة لعكس الكلمة
function reverseWord(word) {
  return word.split('').reverse().join('');
}

// وظيفة لتنظيف النص
function cleanWord(word) {
  return word.trim().replace(/[:\s،؟!.]/g, '');
}

// قراءة الأسئلة
const questionsData = JSON.parse(fs.readFileSync('./questions.json', 'utf8'));
const questions = questionsData.verbal || [];

// العثور على أسئلة القلب
const reversalQuestions = [];

questions.forEach(q => {
  if (q.category !== 'التناظر اللفظي') return;
  
  // تحليل السؤال
  const questionParts = q.text.split(':');
  if (questionParts.length !== 2) return;
  
  const word1 = cleanWord(questionParts[0]);
  const word2 = cleanWord(questionParts[1]);
  
  // التحقق من القلب
  if (reverseWord(word1) === word2) {
    // التحقق من الإجابة
    let isCorrectAnswerReversal = false;
    if (q.options && q.options[q.correctOptionIndex]) {
      const answerParts = q.options[q.correctOptionIndex].split(':');
      if (answerParts.length === 2) {
        const ansWord1 = cleanWord(answerParts[0]);
        const ansWord2 = cleanWord(answerParts[1]);
        if (reverseWord(ansWord1) === ansWord2) {
          isCorrectAnswerReversal = true;
        }
      }
    }
    
    reversalQuestions.push({
      id: q.id,
      question: q.text,
      correctAnswer: q.options ? q.options[q.correctOptionIndex] : 'N/A',
      isCorrectAnswerReversal,
      currentExplanation: q.explanation || 'لا يوجد شرح'
    });
  }
});

console.log(`\n✅ تم العثور على ${reversalQuestions.length} سؤال قلب بالأحرف:\n`);
reversalQuestions.forEach(q => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📌 السؤال ${q.id}: ${q.question}`);
  console.log(`✓ الإجابة: ${q.correctAnswer}`);
  console.log(`🔄 الإجابة قلب؟ ${q.isCorrectAnswerReversal ? 'نعم ✓' : 'لا ✗'}`);
  console.log(`📝 الشرح الحالي: ${q.currentExplanation}`);
});

// حفظ في ملف JSON
fs.writeFileSync(
  './reversal_questions.json', 
  JSON.stringify(reversalQuestions, null, 2), 
  'utf8'
);

console.log(`\n\n💾 تم حفظ النتائج في: reversal_questions.json`);
