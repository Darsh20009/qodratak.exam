// Temporary script to fix toast titles
const fs = require('fs');

let content = fs.readFileSync('client/src/pages/ProfilePage.tsx', 'utf8');

// Fix all JSX toast titles to be strings
content = content.replace(
  /title:\s*<div className="flex items-center"><\w+ className="[^"]*"\s*\/>[^<]*<\/div>/g,
  (match) => {
    const text = match.match(/>([^<]+)</)[1];
    return `title: "${text}"`;
  }
);

// Fix JSX descriptions to be strings
content = content.replace(
  /description:\s*<div[^>]*>([^<]+(?:<br\/>[^<]+)*)<\/div>/g,
  (match, text) => {
    const cleanText = text.replace(/<br\/>/g, '\\n').replace(/<[^>]*>/g, '');
    return `description: \`${cleanText}\``;
  }
);

fs.writeFileSync('client/src/pages/ProfilePage.tsx', content);
console.log('Fixed toast titles and descriptions');