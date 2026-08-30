const fs = require('fs');

console.log('Extracting all questions from the attached file...');

try {
    const content = fs.readFileSync('attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751771110746.json', 'utf8');
    
    // More robust extraction approach
    const lines = content.split('\n');
    const verbal = [];
    const quantitative = [];
    
    let currentQuestion = null;
    let currentSection = null;
    let inOptions = false;
    let options = [];
    let questionText = '';
    let explanation = '';
    let collectingText = false;
    let collectingExplanation = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect section starts
        if (line === '"verbal": [') {
            currentSection = 'verbal';
            continue;
        } else if (line === '"quantitative": [') {
            currentSection = 'quantitative';
            continue;
        }
        
        if (!currentSection) continue;
        
        // Start of a new question
        if (line === '{') {
            currentQuestion = {};
            options = [];
            questionText = '';
            explanation = '';
            inOptions = false;
            collectingText = false;
            collectingExplanation = false;
        }
        
        // End of a question
        else if ((line === '},' || line === '}') && currentQuestion) {
            if (currentQuestion.id && questionText && options.length > 0) {
                currentQuestion.text = questionText.replace(/"/g, '').trim();
                currentQuestion.options = options;
                if (explanation) {
                    currentQuestion.explanation = explanation.replace(/"/g, '').trim();
                }
                
                if (currentSection === 'verbal') {
                    verbal.push({...currentQuestion});
                } else if (currentSection === 'quantitative') {
                    quantitative.push({...currentQuestion});
                }
            }
            currentQuestion = null;
        }
        
        // Extract question properties
        else if (currentQuestion) {
            if (line.includes('"id":')) {
                const match = line.match(/"id":\s*(\d+)/);
                if (match) currentQuestion.id = parseInt(match[1]);
            }
            else if (line.includes('"category":')) {
                const match = line.match(/"category":\s*"([^"]+)"/);
                if (match) currentQuestion.category = match[1];
            }
            else if (line.includes('"correctOptionIndex":')) {
                const match = line.match(/"correctOptionIndex":\s*(\d+)/);
                if (match) currentQuestion.correctOptionIndex = parseInt(match[1]);
            }
            else if (line.includes('"text":')) {
                const match = line.match(/"text":\s*"(.*)"/);
                if (match) {
                    questionText = match[1];
                    collectingText = !line.trim().endsWith('",');
                } else if (line.includes('"text":')) {
                    collectingText = true;
                    questionText = line.replace(/"text":\s*"/, '').replace(/,?\s*$/, '');
                }
            }
            else if (collectingText && !line.includes('"options"')) {
                questionText += line.replace(/"/g, '').replace(/,?\s*$/, '');
                if (line.trim().endsWith('",')) {
                    collectingText = false;
                }
            }
            else if (line.includes('"options":')) {
                inOptions = true;
                options = [];
            }
            else if (inOptions) {
                if (line.includes('"')) {
                    const optionMatch = line.match(/"([^"]+)"/);
                    if (optionMatch) {
                        options.push(optionMatch[1]);
                    }
                }
                if (line.includes(']')) {
                    inOptions = false;
                }
            }
            else if (line.includes('"explanation":')) {
                const match = line.match(/"explanation":\s*"(.*)"/);
                if (match) {
                    explanation = match[1];
                    collectingExplanation = !line.trim().endsWith('"');
                } else if (line.includes('"explanation":')) {
                    collectingExplanation = true;
                    explanation = line.replace(/"explanation":\s*"/, '').replace(/,?\s*$/, '');
                }
            }
            else if (collectingExplanation) {
                explanation += line.replace(/"/g, '').replace(/,?\s*$/, '');
                if (line.trim().endsWith('"')) {
                    collectingExplanation = false;
                }
            }
        }
    }
    
    console.log(`Extracted ${verbal.length} verbal questions`);
    console.log(`Extracted ${quantitative.length} quantitative questions`);
    
    // Create the final JSON structure
    const finalData = {
        verbal: verbal,
        quantitative: quantitative
    };
    
    // Write the extracted data
    fs.writeFileSync('server/questions.json', JSON.stringify(finalData, null, 2), 'utf8');
    console.log('Successfully wrote all questions to questions.json');
    
    // Verify the JSON is valid
    const testData = JSON.parse(fs.readFileSync('server/questions.json', 'utf8'));
    console.log('Verification: JSON is valid');
    console.log(`Final count: ${testData.verbal.length} verbal, ${testData.quantitative.length} quantitative`);
    
} catch (error) {
    console.error('Error:', error.message);
    console.log('Attempting fallback method...');
    
    // Fallback: use regex to extract questions more aggressively
    try {
        const content = fs.readFileSync('attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751771110746.json', 'utf8');
        
        // Extract verbal questions using regex
        const verbalSection = content.match(/"verbal":\s*\[(.*?)(?="quantitative"|$)/s);
        const quantitativeSection = content.match(/"quantitative":\s*\[(.*?)\]\s*}/s);
        
        const verbal = [];
        const quantitative = [];
        
        if (verbalSection) {
            const questions = verbalSection[1].match(/{\s*"id"[^}]+}/gs);
            if (questions) {
                questions.forEach(q => {
                    try {
                        // Clean up the question JSON
                        let cleanQ = q.replace(/,(\s*[}\]])/g, '$1');
                        const question = JSON.parse(cleanQ);
                        if (question.id && question.text && question.options) {
                            verbal.push(question);
                        }
                    } catch (e) {
                        // Skip malformed questions
                    }
                });
            }
        }
        
        if (quantitativeSection) {
            const questions = quantitativeSection[1].match(/{\s*"id"[^}]+}/gs);
            if (questions) {
                questions.forEach(q => {
                    try {
                        let cleanQ = q.replace(/,(\s*[}\]])/g, '$1');
                        const question = JSON.parse(cleanQ);
                        if (question.id && question.text && question.options) {
                            quantitative.push(question);
                        }
                    } catch (e) {
                        // Skip malformed questions
                    }
                });
            }
        }
        
        console.log(`Fallback extracted ${verbal.length} verbal questions`);
        console.log(`Fallback extracted ${quantitative.length} quantitative questions`);
        
        if (verbal.length > 0 || quantitative.length > 0) {
            const fallbackData = { verbal, quantitative };
            fs.writeFileSync('server/questions.json', JSON.stringify(fallbackData, null, 2), 'utf8');
            console.log('Fallback extraction completed successfully');
        }
    } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
    }
}