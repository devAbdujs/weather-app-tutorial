const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const file = 'entrance-biology.md';
  const filePath = path.join(__dirname, 'data', 'notes_markdown', file);
  const content = fs.readFileSync(filePath);
  
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/study_notes/${file}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'text/markdown',
      'x-upsert': 'true'
    },
    body: content
  });
  console.log('Upload status:', uploadRes.status);
  console.log('Upload response:', await uploadRes.text());
}
run();
