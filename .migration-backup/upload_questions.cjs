const fs = require('fs');
const http = require('http');

// Read the questions file
const questionsData = JSON.parse(fs.readFileSync('attached_assets/Pasted--id-2019-category-text--1761602244955_1761602244956.txt', 'utf-8'));

// Create the payload
const payload = JSON.stringify({
  questions: questionsData
});

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
    console.log('Response:', data);
    const response = JSON.parse(data);
    if (response.success) {
      console.log(`✅ Successfully added ${response.count} questions!`);
    } else {
      console.log('❌ Error:', response.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(payload);
req.end();
