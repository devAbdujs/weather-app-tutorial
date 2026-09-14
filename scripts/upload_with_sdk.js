require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const notesDir = path.join(__dirname, 'data', 'notes_markdown');
  const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
  
  for (const file of files) {
    const filePath = path.join(notesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const { data, error } = await supabase.storage
      .from('study_notes')
      .upload(file, content, { contentType: 'text/markdown', upsert: true });
      
    if (error) console.error(`Failed ${file}:`, error.message);
    else console.log(`Uploaded ${file}`);
  }
}
run();
