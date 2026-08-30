const fs = require('fs');
const http = require('http');

// Read the file as text
let fileContent = fs.readFileSync('attached_assets/Pasted--id-2019-category-text--1761602244955_1761602244956.txt', 'utf-8');

// Fix the incomplete last line by completing it and closing the JSON
// Find the last complete question object
const lastCompleteObjectMatch = fileContent.lastIndexOf('},\n   {');
if (lastCompleteObjectMatch > 0) {
  // Find where the last question object starts
  const truncateAt = fileContent.lastIndexOf('\n   },\n   {');
  if (truncateAt > 0) {
    fileContent = fileContent.substring(0, truncateAt + 5) + '\n]';
  }
}

// Parse the JSON
let questions;
try {
  questions = JSON.parse(fileContent);
  console.log(`✅ Successfully parsed ${questions.length} questions`);
} catch (error) {
  console.error('❌ Error parsing JSON:', error.message);
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
        console.log(`✅ Successfully added ${response.count} questions to the database!`);
        console.log(`📊 Total quantitative questions now available`);
      } else {
        console.log('❌ Error:', response.message);
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
