const fs = require('fs');

// Read the original file as text
const content = fs.readFileSync('attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751431158905.json', 'utf8');

try {
  // Try to parse the original file
  const data = JSON.parse(content);
  
  // If successful, write a clean version
  fs.writeFileSync('server/data/questions_new.json', JSON.stringify(data, null, 2), 'utf8');
  
  console.log('JSON cleaned successfully!');
  console.log('Total verbal questions:', data.verbal.length);
  console.log('Total quantitative questions:', data.quantitative.length);
  
} catch (e) {
  console.log('Original file also has JSON errors:', e.message);
  
  // Let's try to fix basic issues line by line
  const lines = content.split('\n');
  let cleanContent = '';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Remove any control characters
    line = line.replace(/[\x00-\x1F\x7F]/g, '');
    
    cleanContent += line + '\n';
  }
  
  try {
    const data = JSON.parse(cleanContent);
    fs.writeFileSync('server/data/questions_new.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('JSON cleaned and fixed successfully!');
    console.log('Total verbal questions:', data.verbal.length);
    console.log('Total quantitative questions:', data.quantitative.length);
  } catch (e2) {
    console.log('Still has errors after cleaning:', e2.message);
  }
}