const fs = require('fs');
const file = 'src/components/practice/PracticeHub.tsx';
let content = fs.readFileSync(file, 'utf8');

const newHeader = `<h1 className="text-[28px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">
          {mode === 'notes' ? 'Short Notes' : 'Practice'}
        </h1>
        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-1">
          {mode === 'notes' ? 'Choose a subject to study' : examTypeLabel()}
        </p>`;

content = content.replace(
  /<h1 className="text-\[28px\] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none">Practice<\/h1>\s*<p className="text-\[13px\] font-bold text-gray-500 dark:text-gray-400 mt-1">\{examTypeLabel\(\)\}<\/p>/m,
  newHeader
);

fs.writeFileSync(file, content);
