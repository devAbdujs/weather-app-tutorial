const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

async function execute() {
  console.log("🚀 Starting fully automated notes migration...");
  
  // 1. Database Schema Update
  console.log("\n[1/4] Updating Database Schema...");
  const dbClient = new Client({ connectionString: DATABASE_URL });
  await dbClient.connect();
  try {
    await dbClient.query(`
      ALTER TABLE study_notes ADD COLUMN IF NOT EXISTS content_url TEXT;
      ALTER TABLE study_notes ALTER COLUMN content DROP NOT NULL;
    `);
    console.log("✅ Added content_url to study_notes table.");
  } catch (err) {
    console.error("❌ Schema update failed:", err.message);
  } finally {
    await dbClient.end();
  }

  // 2. Create Storage Bucket
  console.log("\n[2/4] Ensuring 'study_notes' bucket exists...");
  const createBucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: 'study_notes', name: 'study_notes', public: true })
  });
  if (createBucketRes.status === 200 || createBucketRes.status === 400 /* 400 likely means already exists */) {
    console.log("✅ Bucket ready.");
  } else {
    console.error("❌ Bucket creation error:", await createBucketRes.text());
  }

  // 3. Upload Files
  console.log("\n[3/4] Uploading 38 Markdown notes to CDN...");
  const notesDir = path.join(__dirname, 'data', 'notes_markdown');
  const files = fs.readdirSync(notesDir).filter(f => f.endsWith('.md'));
  
  let successCount = 0;
  const dbUpdates = [];

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

    if (uploadRes.ok) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/study_notes/${file}`;
      // Parse out the exam_type and department to match DB
      const parts = file.replace('.md', '').split('-');
      const examType = parts[0];
      const safeDept = parts.slice(1).join('-');
      
      dbUpdates.push({ file, publicUrl, examType, safeDept });
      successCount++;
    } else {
      console.error(`❌ Failed to upload ${file}:`, await uploadRes.text());
    }
  }
  console.log(`✅ Uploaded ${successCount}/${files.length} files to Edge CDN.`);

  // 4. Update Database Rows
  console.log("\n[4/4] Linking CDN URLs to database...");
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
      body: JSON.stringify({ content_url: publicUrl })
    });
    
    if (updateRes.ok) linkedCount++;
  }
  
  console.log(`✅ Linked ${linkedCount} notes to their new CDN URLs.`);
  console.log("\n🎉 ALL DONE! Short Notes migration complete!");
}

execute().catch(console.error);
