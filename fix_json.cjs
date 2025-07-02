const fs = require('fs');

try {
  // Read the file
  let content = fs.readFileSync('server/data/questions_new.json', 'utf8');
  
  // Fix common JSON issues
  // Replace unescaped quotes in explanations
  content = content.replace(/"explanation": "([^"]*)"([^"]*)"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3, p4, p5) => {
    return `"explanation": "${p1}${p2}${p3}${p4}${p5}"`;
  });
  
  // Remove any invalid trailing commas
  content = content.replace(/,(\s*[}\]])/g, '$1');
  
  // Try to parse and validate
  const data = JSON.parse(content);
  
  // Write the fixed content back
  fs.writeFileSync('server/data/questions_new.json', JSON.stringify(data, null, 2), 'utf8');
  
  console.log('JSON fixed successfully!');
  console.log('Total verbal questions:', data.verbal.length);
  console.log('Total quantitative questions:', data.quantitative.length);
  
} catch (e) {
  console.log('Error:', e.message);
  
  // If still failing, let's create a minimal valid JSON structure
  const content = fs.readFileSync('server/data/questions_new.json', 'utf8');
  const lines = content.split('\n');
  
  // Find the approximate position of the error
  if (e.message.includes('position')) {
    const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
    let currentPos = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length >= pos) {
        console.log(`Error around line ${i + 1}:`);
        console.log('Line content:', lines[i]);
        break;
      }
      currentPos += lines[i].length + 1;
    }
  }
}