const fs = require('fs');

// Read the file as text and try to extract data manually
const content = fs.readFileSync('attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751431158905.json', 'utf8');

// Try to extract questions using regex patterns
const verbal = [];
const quantitative = [];

// Split by question pattern
const questionPattern = /\{\s*"id":\s*(\d+),\s*"category":\s*"([^"]+)",\s*"text":\s*"([^"]+)",\s*"options":\s*\[([^\]]+)\],\s*"correctOptionIndex":\s*(\d+),\s*"explanation":\s*"([^"]*?)"\s*\}/g;

let match;
let questionCount = 0;

// Try a simpler approach - find all complete question objects
const lines = content.split('\n');
let currentQuestion = '';
let inQuestion = false;
let braceCount = 0;

for (let line of lines) {
  line = line.trim();
  
  if (line.includes('"id":') && line.includes('"category":')) {
    inQuestion = true;
    currentQuestion = line;
    braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
  } else if (inQuestion) {
    currentQuestion += ' ' + line;
    braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    
    if (braceCount === 0 && line.includes('}')) {
      // Complete question found
      try {
        // Clean the question text
        let cleanQuestion = currentQuestion
          .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // Try to parse this individual question
        const question = JSON.parse(cleanQuestion);
        
        // Determine if it's verbal or quantitative based on category
        const verbalCategories = ['التناظر اللفظي', 'إكمال الجمل', 'الاستيعاب المقروء', 'المترادفات والأضداد', 'الأخطاء الشائعة'];
        
        if (verbalCategories.includes(question.category)) {
          verbal.push(question);
        } else {
          quantitative.push(question);
        }
        
        questionCount++;
        
      } catch (e) {
        // Skip malformed questions
        console.log('Skipped malformed question at line:', currentQuestion.substring(0, 100) + '...');
      }
      
      inQuestion = false;
      currentQuestion = '';
    }
  }
}

// Create the final structure
const finalData = {
  verbal: verbal,
  quantitative: quantitative
};

// Write the cleaned data
fs.writeFileSync('server/data/questions_new.json', JSON.stringify(finalData, null, 2), 'utf8');

console.log('Questions extracted successfully!');
console.log('Total questions processed:', questionCount);
console.log('Verbal questions:', verbal.length);
console.log('Quantitative questions:', quantitative.length);