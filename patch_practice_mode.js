const fs = require('fs');
const file = 'src/components/practice/PracticeHub.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import useSearchParams if not present
if (!content.includes('useSearchParams')) {
  content = content.replace(/import \{ useRouter \} from 'next\/navigation';/, "import { useRouter, useSearchParams } from 'next/navigation';");
}

// Get mode from search Params inside PracticeHub
content = content.replace(
  /const profileTarget = useAppStore\(s => s\.userProfile\?\.target_exam\);/,
  `const searchParams = useSearchParams();\n  const mode = searchParams.get('mode') || 'exam';\n  const profileTarget = useAppStore(s => s.userProfile?.target_exam);`
);

// Update navigate function
const newNavigate = `const navigate = (examType: string, params: Record<string, string>) => {
    if (mode === 'notes') {
      const p = new URLSearchParams({ examType });
      router.push(\`/notes/\${encodeURIComponent(params.subject)}?\${p.toString()}\`);
    } else {
      const p = new URLSearchParams({ examType, ...params });
      router.push(\`/practice/sessions?\${p.toString()}\`);
    }
  };`;
content = content.replace(
  /const navigate = \(examType: string, params: Record<string, string>\) => \{[\s\S]*?router\.push\(\`\/practice\/sessions\?\$\{p\.toString\(\)\}\`\);\n  \};/,
  newNavigate
);

// Update header text based on mode
content = content.replace(
  /<h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">/,
  `<h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
              {mode === 'notes' ? 'Study Notes' : `
);
content = content.replace(
  /Practice <span className="text-primary">Hub<\/span><br\/>/,
  `Practice <span className="text-primary">Hub</span><br/>}
`
);

// Also change "Choose a subject to start practicing."
content = content.replace(
  /Choose a subject to start practicing\./,
  `{mode === 'notes' ? 'Choose a subject to read its short notes.' : 'Choose a subject to start practicing.'}`
);

fs.writeFileSync(file, content);
