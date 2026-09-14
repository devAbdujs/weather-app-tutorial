require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false }, global: { WebSocket } }
);

async function run() {
  const notesDir = path.join(__dirname, 'data', 'notes_markdown');
  const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
  
  let count = 0;
  for (const file of files) {
    const filePath = path.join(notesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const { data, error } = await supabase.storage
      .from('study_notes')
      .upload(file, content, { contentType: 'text/markdown', upsert: true });
      
    if (error) console.error(`Failed ${file}:`, error.message);
    else { count++; console.log(`Uploaded ${file}`); }
  }
  console.log(`\n🎉 Uploaded ${count}/${files.length} markdown files!`);
}
run();
