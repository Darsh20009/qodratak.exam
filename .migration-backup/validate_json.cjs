const fs = require('fs');

const content = fs.readFileSync('server/questions.json', 'utf8');

try {
  JSON.parse(content);
  console.log('JSON is valid');
} catch (error) {
  console.log('JSON Error:', error.message);
  const position = error.message.match(/at position (\d+)/);
  if (position) {
    const pos = parseInt(position[1]);
    console.log('Context around error:');
    console.log(content.substring(Math.max(0, pos - 100), pos + 100));
    console.log('---EXACT POSITION---');
    console.log('Character at error:', JSON.stringify(content.charAt(pos)));
  }
}