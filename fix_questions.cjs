const fs = require('fs');

console.log('Attempting to fix questions JSON file...');

try {
    // Read the attached file
    const content = fs.readFileSync('attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751771110746.json', 'utf8');
    
    // Try to find the problematic area and fix it
    let fixedContent = content;
    
    // Look for common JSON issues and fix them
    // Fix incomplete strings that end with equals sign
    fixedContent = fixedContent.replace(/= *$/gm, '= ؟"');
    
    // Fix other potential issues
    fixedContent = fixedContent.replace(/([^"])$/gm, '$1"');
    
    // Try to parse the fixed content
    try {
        const data = JSON.parse(fixedContent);
        console.log('Successfully parsed fixed JSON');
        
        // Write the fixed content
        fs.writeFileSync('server/questions.json', fixedContent, 'utf8');
        console.log('Fixed questions file written successfully');
        
        // Print statistics
        if (data.verbal) console.log(`Verbal questions: ${data.verbal.length}`);
        if (data.quantitative) console.log(`Quantitative questions: ${data.quantitative.length}`);
        
    } catch (parseError) {
        console.log('Failed to parse fixed JSON, trying manual approach...');
        
        // If fixing didn't work, try to extract valid questions manually
        const lines = content.split('\n');
        const verbal = [];
        const quantitative = [];
        let currentQuestion = {};
        let currentSection = null;
        let inOptions = false;
        let inExplanation = false;
        let braceLevel = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line === '"verbal": [') {
                currentSection = 'verbal';
                continue;
            } else if (line === '"quantitative": [') {
                currentSection = 'quantitative';
                continue;
            }
            
            if (line.startsWith('{') && currentSection) {
                currentQuestion = {};
                braceLevel = 1;
            } else if (line.startsWith('}') && currentSection) {
                braceLevel--;
                if (braceLevel === 0) {
                    // End of question
                    if (currentQuestion.id && currentQuestion.text && currentQuestion.options) {
                        if (currentSection === 'verbal') {
                            verbal.push(currentQuestion);
                        } else {
                            quantitative.push(currentQuestion);
                        }
                    }
                }
            } else if (line.includes('"id":') && currentSection) {
                const match = line.match(/"id":\s*(\d+)/);
                if (match) currentQuestion.id = parseInt(match[1]);
            } else if (line.includes('"category":') && currentSection) {
                const match = line.match(/"category":\s*"([^"]+)"/);
                if (match) currentQuestion.category = match[1];
            } else if (line.includes('"text":') && currentSection) {
                const match = line.match(/"text":\s*"(.+)"/);
                if (match) currentQuestion.text = match[1];
            } else if (line.includes('"correctOptionIndex":') && currentSection) {
                const match = line.match(/"correctOptionIndex":\s*(\d+)/);
                if (match) currentQuestion.correctOptionIndex = parseInt(match[1]);
            } else if (line.includes('"explanation":') && currentSection) {
                const match = line.match(/"explanation":\s*"(.+)"/);
                if (match) currentQuestion.explanation = match[1];
            }
        }
        
        // Create clean JSON structure
        const cleanData = {
            verbal: verbal.slice(0, 1000), // Limit to first 1000 to avoid issues
            quantitative: quantitative.slice(0, 650) // Limit to first 650 to avoid issues
        };
        
        fs.writeFileSync('server/questions.json', JSON.stringify(cleanData, null, 2), 'utf8');
        console.log(`Manual extraction completed: ${cleanData.verbal.length} verbal, ${cleanData.quantitative.length} quantitative questions`);
    }
    
} catch (error) {
    console.error('Error:', error.message);
    
    // As a fallback, create a minimal working questions file
    const fallbackData = {
        verbal: [
            {
                id: 1,
                category: "التناظر اللفظي",
                text: "غرفة : باب",
                options: ["قفل : مفتاح", "نافذة : بيت", "زرع : حصاد", "باخرة : بحر"],
                correctOptionIndex: 0,
                explanation: "العلاقة هي أن الباب جزء أساسي من الغرفة ووسيلة للدخول إليها."
            }
        ],
        quantitative: [
            {
                id: 1,
                category: "الحساب",
                text: "ما ناتج 2 + 3؟",
                options: ["4", "5", "6", "7"],
                correctOptionIndex: 1,
                explanation: "2 + 3 = 5"
            }
        ]
    };
    
    fs.writeFileSync('server/questions.json', JSON.stringify(fallbackData, null, 2), 'utf8');
    console.log('Fallback questions file created');
}