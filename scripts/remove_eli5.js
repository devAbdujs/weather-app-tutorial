const fs = require('fs');
const path = '/home/abdu/scraping/ethio-exam-app/src/components/ai/AITutorDrawer.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the start and end of the eli5 button
const startRegex = /<button[^>]*onClick=\{\(\) => handlePrompt\('eli5'\)\}[^>]*>/;
const match = content.match(startRegex);
if (match) {
  const startIndex = match.index;
  // find the closing </button> after this
  const closingTag = '</button>';
  const endIndex = content.indexOf(closingTag, startIndex) + closingTag.length;
  
  // Cut it out
  content = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Removed ELI5 button successfully.");
} else {
  console.log("Could not find ELI5 button.");
}
