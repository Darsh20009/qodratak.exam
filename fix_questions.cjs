const fs = require('fs');

// Read the attached file
let content = fs.readFileSync('attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751431158905.json', 'utf8');

// Try to fix common JSON issues step by step
console.log('Original file size:', content.length);

// First, let's try to identify the structure
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Look for the start of verbal and quantitative sections
let verbalStart = -1;
let quantitativeStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"verbal"')) {
    verbalStart = i;
    console.log('Found verbal section at line:', i + 1);
  }
  if (lines[i].includes('"quantitative"')) {
    quantitativeStart = i;
    console.log('Found quantitative section at line:', i + 1);
    break;
  }
}

if (verbalStart >= 0 && quantitativeStart >= 0) {
  // Extract sections manually
  const verbalSection = lines.slice(verbalStart + 1, quantitativeStart - 1).join('\n');
  const quantitativeSection = lines.slice(quantitativeStart + 1, -2).join('\n'); // -2 to exclude closing braces
  
  // Create a proper JSON structure
  const newContent = `{
  "verbal": [${verbalSection.replace(/^\s*\[/, '').replace(/\]$/, '')}],
  "quantitative": [${quantitativeSection.replace(/^\s*\[/, '').replace(/\]$/, '')}]
}`;

  try {
    // Test if this parses correctly
    const data = JSON.parse(newContent);
    
    // Write the corrected file
    fs.writeFileSync('server/data/questions_new.json', JSON.stringify(data, null, 2), 'utf8');
    
    console.log('Success! Questions extracted:');
    console.log('Verbal questions:', data.verbal.length);
    console.log('Quantitative questions:', data.quantitative.length);
    
  } catch (e) {
    console.log('Error with manual extraction:', e.message);
    
    // Fallback: Use the original working questions but with correct structure
    const originalQuestions = {
      "verbal": [
        {
          "id": 1,
          "category": "التناظر اللفظي",
          "text": "غرفة : باب",
          "options": ["قفل : مفتاح", "نافذة : بيت", "زرع : حصاد", "باخرة : بحر"],
          "correctOptionIndex": 0,
          "explanation": "العلاقة هي أن الباب جزء أساسي من الغرفة ووسيلة للدخول إليها."
        }
      ],
      "quantitative": [
        {
          "id": 1,
          "category": "الإحصاء",
          "text": "ما هو المتوسط الحسابي للأعداد 4، 8، 12؟",
          "options": ["6", "8", "10", "12"],
          "correctOptionIndex": 1,
          "explanation": "المتوسط الحسابي = (4 + 8 + 12) ÷ 3 = 24 ÷ 3 = 8"
        }
      ]
    };
    
    fs.writeFileSync('server/data/questions_new.json', JSON.stringify(originalQuestions, null, 2), 'utf8');
    console.log('Using fallback structure with sample questions');
  }
} else {
  console.log('Could not find proper structure in the file');
}