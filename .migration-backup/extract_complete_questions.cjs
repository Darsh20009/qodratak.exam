const fs = require('fs');

console.log('استخراج جميع الأسئلة مع الشروحات الكاملة...');

try {
    const content = fs.readFileSync('attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751771110746.json', 'utf8');
    
    // استخراج أدق باستخدام regex patterns متقدمة
    console.log('جاري استخراج الأسئلة اللفظية...');
    
    // البحث عن القسم اللفظي
    const verbalMatch = content.match(/"verbal":\s*\[(.*?)(?="quantitative")/s);
    const quantitativeMatch = content.match(/"quantitative":\s*\[(.*?)\]\s*}/s);
    
    const verbal = [];
    const quantitative = [];
    
    // معالجة الأسئلة اللفظية
    if (verbalMatch) {
        const verbalContent = verbalMatch[1];
        // البحث عن كل سؤال كامل مع جميع الخصائص
        const verbalQuestions = verbalContent.match(/{\s*"id":\s*\d+[\s\S]*?"explanation":\s*"[^"]*"[^}]*}/g);
        
        if (verbalQuestions) {
            verbalQuestions.forEach((qStr, index) => {
                try {
                    // تنظيف النص
                    let cleanQuestion = qStr.replace(/,(\s*[}\]])/g, '$1');
                    
                    // استخراج المعلومات يدوياً للتأكد من عدم فقدان البيانات
                    const idMatch = cleanQuestion.match(/"id":\s*(\d+)/);
                    const categoryMatch = cleanQuestion.match(/"category":\s*"([^"]+)"/);
                    const textMatch = cleanQuestion.match(/"text":\s*"([^"]+)"/);
                    const optionsMatch = cleanQuestion.match(/"options":\s*\[(.*?)\]/s);
                    const correctMatch = cleanQuestion.match(/"correctOptionIndex":\s*(\d+)/);
                    const explanationMatch = cleanQuestion.match(/"explanation":\s*"([^"]*)"/);
                    
                    if (idMatch && textMatch && optionsMatch && correctMatch) {
                        const options = optionsMatch[1].match(/"([^"]+)"/g);
                        
                        const question = {
                            id: parseInt(idMatch[1]),
                            category: categoryMatch ? categoryMatch[1] : "التناظر اللفظي",
                            text: textMatch[1],
                            options: options ? options.map(opt => opt.replace(/"/g, '')) : [],
                            correctOptionIndex: parseInt(correctMatch[1]),
                            explanation: explanationMatch ? explanationMatch[1] : ""
                        };
                        
                        if (question.options.length > 0) {
                            verbal.push(question);
                        }
                    }
                } catch (e) {
                    console.warn(`خطأ في معالجة السؤال اللفظي ${index + 1}:`, e.message);
                }
            });
        }
        
        // محاولة استخراج الأسئلة الناقصة بطريقة أخرى
        if (verbal.length < 1500) {
            console.log('محاولة استخراج إضافي للأسئلة اللفظية...');
            const allVerbalChunks = verbalContent.split(/(?={\s*"id":)/);
            
            allVerbalChunks.forEach((chunk, index) => {
                if (chunk.trim() && chunk.includes('"id":')) {
                    try {
                        const idMatch = chunk.match(/"id":\s*(\d+)/);
                        const textMatch = chunk.match(/"text":\s*"([^"]+)"/);
                        const categoryMatch = chunk.match(/"category":\s*"([^"]+)"/);
                        
                        if (idMatch && textMatch) {
                            const id = parseInt(idMatch[1]);
                            
                            // تحقق إذا كان السؤال موجود بالفعل
                            const exists = verbal.find(q => q.id === id);
                            if (!exists) {
                                // استخراج الخيارات
                                const optionsStart = chunk.indexOf('"options":');
                                const optionsEnd = chunk.indexOf(']', optionsStart) + 1;
                                let options = [];
                                
                                if (optionsStart !== -1 && optionsEnd !== -1) {
                                    const optionsText = chunk.substring(optionsStart, optionsEnd);
                                    const optMatches = optionsText.match(/"([^"]+)"/g);
                                    if (optMatches) {
                                        options = optMatches.slice(1).map(opt => opt.replace(/"/g, ''));
                                    }
                                }
                                
                                const correctMatch = chunk.match(/"correctOptionIndex":\s*(\d+)/);
                                const explanationMatch = chunk.match(/"explanation":\s*"([^"]*)"/);
                                
                                if (options.length > 0 && correctMatch) {
                                    verbal.push({
                                        id: id,
                                        category: categoryMatch ? categoryMatch[1] : "التناظر اللفظي",
                                        text: textMatch[1],
                                        options: options,
                                        correctOptionIndex: parseInt(correctMatch[1]),
                                        explanation: explanationMatch ? explanationMatch[1] : ""
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        // تجاهل الأخطاء في الاستخراج الإضافي
                    }
                }
            });
        }
    }
    
    // معالجة الأسئلة الكمية
    console.log('جاري استخراج الأسئلة الكمية...');
    if (quantitativeMatch) {
        const quantContent = quantitativeMatch[1];
        const quantQuestions = quantContent.match(/{\s*"id":\s*\d+[\s\S]*?"explanation":\s*"[^"]*"[^}]*}/g);
        
        if (quantQuestions) {
            quantQuestions.forEach((qStr, index) => {
                try {
                    let cleanQuestion = qStr.replace(/,(\s*[}\]])/g, '$1');
                    
                    const idMatch = cleanQuestion.match(/"id":\s*(\d+)/);
                    const categoryMatch = cleanQuestion.match(/"category":\s*"([^"]+)"/);
                    const textMatch = cleanQuestion.match(/"text":\s*"([^"]+)"/);
                    const optionsMatch = cleanQuestion.match(/"options":\s*\[(.*?)\]/s);
                    const correctMatch = cleanQuestion.match(/"correctOptionIndex":\s*(\d+)/);
                    const explanationMatch = cleanQuestion.match(/"explanation":\s*"([^"]*)"/);
                    
                    if (idMatch && textMatch && optionsMatch && correctMatch) {
                        const options = optionsMatch[1].match(/"([^"]+)"/g);
                        
                        const question = {
                            id: parseInt(idMatch[1]),
                            category: categoryMatch ? categoryMatch[1] : "الحساب",
                            text: textMatch[1],
                            options: options ? options.map(opt => opt.replace(/"/g, '')) : [],
                            correctOptionIndex: parseInt(correctMatch[1]),
                            explanation: explanationMatch ? explanationMatch[1] : ""
                        };
                        
                        if (question.options.length > 0) {
                            quantitative.push(question);
                        }
                    }
                } catch (e) {
                    console.warn(`خطأ في معالجة السؤال الكمي ${index + 1}:`, e.message);
                }
            });
        }
        
        // استخراج إضافي للأسئلة الكمية
        if (quantitative.length < 1000) {
            console.log('محاولة استخراج إضافي للأسئلة الكمية...');
            const allQuantChunks = quantContent.split(/(?={\s*"id":)/);
            
            allQuantChunks.forEach((chunk, index) => {
                if (chunk.trim() && chunk.includes('"id":')) {
                    try {
                        const idMatch = chunk.match(/"id":\s*(\d+)/);
                        const textMatch = chunk.match(/"text":\s*"([^"]+)"/);
                        const categoryMatch = chunk.match(/"category":\s*"([^"]+)"/);
                        
                        if (idMatch && textMatch) {
                            const id = parseInt(idMatch[1]);
                            
                            const exists = quantitative.find(q => q.id === id);
                            if (!exists) {
                                const optionsStart = chunk.indexOf('"options":');
                                const optionsEnd = chunk.indexOf(']', optionsStart) + 1;
                                let options = [];
                                
                                if (optionsStart !== -1 && optionsEnd !== -1) {
                                    const optionsText = chunk.substring(optionsStart, optionsEnd);
                                    const optMatches = optionsText.match(/"([^"]+)"/g);
                                    if (optMatches) {
                                        options = optMatches.slice(1).map(opt => opt.replace(/"/g, ''));
                                    }
                                }
                                
                                const correctMatch = chunk.match(/"correctOptionIndex":\s*(\d+)/);
                                const explanationMatch = chunk.match(/"explanation":\s*"([^"]*)"/);
                                
                                if (options.length > 0 && correctMatch) {
                                    quantitative.push({
                                        id: id,
                                        category: categoryMatch ? categoryMatch[1] : "الحساب",
                                        text: textMatch[1],
                                        options: options,
                                        correctOptionIndex: parseInt(correctMatch[1]),
                                        explanation: explanationMatch ? explanationMatch[1] : ""
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        // تجاهل الأخطاء
                    }
                }
            });
        }
    }
    
    // ترتيب الأسئلة حسب المعرف
    verbal.sort((a, b) => a.id - b.id);
    quantitative.sort((a, b) => a.id - b.id);
    
    console.log(`تم استخراج ${verbal.length} سؤال لفظي`);
    console.log(`تم استخراج ${quantitative.length} سؤال كمي`);
    
    // حساب الشروحات
    const verbalWithExpl = verbal.filter(q => q.explanation && q.explanation.trim() !== '').length;
    const quantWithExpl = quantitative.filter(q => q.explanation && q.explanation.trim() !== '').length;
    
    console.log(`أسئلة لفظية بشرح: ${verbalWithExpl}`);
    console.log(`أسئلة كمية بشرح: ${quantWithExpl}`);
    
    // إنشاء البنية النهائية
    const finalData = {
        verbal: verbal,
        quantitative: quantitative
    };
    
    // كتابة الملف
    fs.writeFileSync('server/questions.json', JSON.stringify(finalData, null, 2), 'utf8');
    console.log('تم حفظ جميع الأسئلة مع الشروحات بنجاح');
    
    // التحقق من صحة JSON
    const testData = JSON.parse(fs.readFileSync('server/questions.json', 'utf8'));
    console.log('تم التحقق: الملف صالح');
    console.log(`العدد النهائي: ${testData.verbal.length} لفظي، ${testData.quantitative.length} كمي`);
    
} catch (error) {
    console.error('خطأ:', error.message);
}