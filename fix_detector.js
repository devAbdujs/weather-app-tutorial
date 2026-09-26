const fs = require('fs');
const file = 'src/components/auth/ClientAuthDetector.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  /<LandingPage \/>[\s\S]*\}\};\n/m,
  `<LandingPage />\n  );\n};\n`
);
fs.writeFileSync(file, content);
