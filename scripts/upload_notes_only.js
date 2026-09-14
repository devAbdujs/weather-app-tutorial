const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function execute() {
  console.log("🚀 Starting Notes Upload to Supabase Storage...");
  
  // 1. Create Storage Bucket (just in case)
  console.log("\n[1/3] Ensuring 'study_notes' bucket exists...");
  await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: 'study_notes', name: 'study_notes', public: true })
  });
  console.log("✅ Bucket step complete.");

  // 2. Upload Files
  console.log("\n[2/3] Uploading 38 Markdown notes to CDN...");
  const notesDir = path.join(__dirname, 'data', 'notes_markdown');
  const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
  
  let successCount = 0;

  for (const file of files) {
    const filePath = path.join(notesDir, file);
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

    if (uploadRes.ok) successCount++;
  }
  console.log(`✅ Uploaded ${successCount}/${files.length} files to Edge CDN.`);

  // 3. Update Database Rows via REST API
  console.log("\n[3/3] Linking CDN URLs in database...");
  const rawJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'study_notes_cleaned.json')));
  let linkedCount = 0;
  
  for (const note of rawJson) {
    const safeDept = note.department.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '');
    const filename = `${note.exam_type}-${safeDept}.md`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/study_notes/${filename}`;

    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/study_notes?id=eq.${note.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content_url: publicUrl, exam_type: note.exam_type, department: note.department })
    });
    
    if (updateRes.ok) linkedCount++;
    else console.error(`❌ DB Link failed for ${note.id}:`, await updateRes.text());
  }
  
  console.log(`✅ Linked ${linkedCount} notes to their new CDN URLs.`);
  console.log("\n🎉 ALL DONE! Short Notes migration complete!");
}

execute().catch(console.error);
