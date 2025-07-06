const fs = require('fs');

// Read the original file
const filePath = 'attached_assets/قدراتك بنك الأسئبة المعدل النسخة الاخيرة_1751771110746.json';
const outputPath = 'server/questions.json';

try {
  console.log('Reading file...');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  console.log('Cleaning content...');
  // Remove any potential BOM or invisible characters
  const cleanContent = fileContent.replace(/^\uFEFF/, '').trim();
  
  console.log('Parsing JSON...');
  const data = JSON.parse(cleanContent);
  
  console.log('Writing cleaned JSON...');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  
  console.log('JSON file cleaned successfully!');
  console.log(`Verbal questions: ${data.verbal ? data.verbal.length : 0}`);
  console.log(`Quantitative questions: ${data.quantitative ? data.quantitative.length : 0}`);
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Position:', error.toString().match(/position (\d+)/)?.[1]);
  
  // Try to fix specific JSON issues
  if (error.message.includes('Expected double-quoted property name')) {
    console.log('Attempting to fix property name issues...');
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix common JSON issues
      content = content.replace(/^\uFEFF/, ''); // Remove BOM
      content = content.replace(/[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/g, ''); // Remove control characters
      
      // Try to parse again
      const data = JSON.parse(content);
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log('Fixed and saved successfully!');
    } catch (fixError) {
      console.error('Could not fix automatically:', fixError.message);
    }
  }
}