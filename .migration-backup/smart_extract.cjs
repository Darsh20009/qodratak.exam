const fs = require('fs');
const http = require('http');

// Read the file line by line and build JSON manually
const fileContent = fs.readFileSync('attached_assets/Pasted--id-2019-category-text--1761602244955_1761602244956.txt', 'utf-8');

// Find the last occurrence of complete question pattern
// A complete question ends with },\n   {
const lines = fileContent.split('\n');

// Find the last line that has "}," which indicates end of a complete question
let lastCompleteIndex = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].trim() === '},') {
    lastCompleteIndex = i;
    break;
  }
}

if (lastCompleteIndex === -1) {
  console.log('Could not find any complete questions');
  process.exit(1);
}

// Build JSON from start to last complete question
// Remove the trailing comma from the last question
const questionLines = lines.slice(0, lastCompleteIndex + 1);
questionLines[questionLines.length - 1] = questionLines[questionLines.length - 1].replace(/,\s*$/, '');
const completeJson = questionLines.join('\n') + '\n]';

// Try to parse
let questions;
try {
  questions = JSON.parse(completeJson);
  console.log(`✅ Successfully parsed ${questions.length} complete questions`);
} catch (error) {
  console.error('❌ Error parsing JSON:', error.message);
  // Save the attempted JSON for debugging
  fs.writeFileSync('/tmp/debug_questions.json', completeJson);
  console.log('Saved debug JSON to /tmp/debug_questions.json');
  process.exit(1);
}

// Create the payload
const payload = JSON.stringify({
  questions: questions
});

console.log(`📤 Sending ${questions.length} questions to API...`);

// HTTP request options
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/questions/bulk',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

// Make the request
const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log(`✅ Successfully added ${response.count} quantitative questions to the database!`);
        console.log(`📚 These questions cover various topics:`);
        console.log(`   - المعادلات (Equations)`);
        console.log(`   - الهندسة (Geometry)`);
        console.log(`   - المقارنات (Comparisons)`);
        console.log(`   - الحركة والأنماط (Motion & Patterns)`);
        console.log(`   - الإحصاء (Statistics)`);
        console.log(`   - and more!`);
      } else {
        console.log('❌ API Error:', response.message);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(payload);
req.end();
