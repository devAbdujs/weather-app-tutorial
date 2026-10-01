#!/usr/bin/env node
/**
 * Ingest Pre-split Chapter Documents into Supabase study_notes
 *
 * Supported formats: .pdf, .docx, .doc, .pptx, .ppt, .txt, .md
 *
 * Usage:
 *   node scripts/ingest_chapters.js --dir "materials/module_by_chapter/applied mathematics I" \
 *                                   --department "Applied Mathematics I" \
 *                                   --exam freshman
 */

const fs = require('fs');
const path = require('path');

// Allow running this script from the workspace root by pointing to app dependencies
const appNodeModules = path.resolve(__dirname, '../ethio-exam-app/node_modules');
if (fs.existsSync(appNodeModules)) {
  module.paths.unshift(appNodeModules);
}

const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment from ethio-exam-app/.env.local
const envPath = path.resolve(__dirname, '../ethio-exam-app/.env.local');
const env = dotenv.parse(fs.readFileSync(envPath));

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Collect all Gemini keys for rotation
const geminiKeys = Object.keys(env)
  .filter(k => k.toLowerCase().startsWith('gemini_api_key'))
  .map(k => env[k].trim())
  .filter(Boolean);

if (geminiKeys.length === 0) {
  console.error('❌ No Gemini API keys found in .env.local');
  process.exit(1);
}

let keyIndex = 0;
function getNextKey() {
  const k = geminiKeys[keyIndex % geminiKeys.length];
  keyIndex++;
  return k;
}

// Parse CLI args
const args = process.argv.slice(2);
function getArg(flag, defaultValue = '') {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultValue;
}

const dir = getArg('--dir');
const department = getArg('--department');
const examType = getArg('--exam', 'freshman');

if (!dir || !department) {
  console.log(`
📚 Temari Pre-Split Chapter Ingestion CLI Tool

Usage:
  node scripts/ingest_chapters.js --dir <folder_path> --department <department_name> [--exam <exam_type>]

Options:
  --dir         Path to the folder containing chapter documents (required)
  --department  Course / Department name, e.g. "Applied Mathematics I" (required)
  --exam        Target exam type: freshman, entrance, exit (default: freshman)

Examples:
  node scripts/ingest_chapters.js --dir "materials/module_by_chapter/applied mathematics I" --department "Applied Mathematics I" --exam freshman
  node scripts/ingest_chapters.js --dir "materials/lecture-notes" --department "Economics" --exam freshman
`);
  process.exit(0);
}

const MIME_MAP = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.txt': 'text/plain',
  '.md': 'text/plain',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const targetDir = path.resolve(dir);
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }

  const supportedExts = Object.keys(MIME_MAP);
  const files = fs.readdirSync(targetDir)
    .filter(f => supportedExts.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (files.length === 0) {
    console.log(`⚠️  No supported files (.pdf, .docx, .pptx, .txt) found in ${targetDir}`);
    process.exit(0);
  }

  console.log(`\n======================================================`);
  console.log(`🚀 Starting Ingestion for: [${department}] (${examType})`);
  console.log(`📁 Source Folder: ${targetDir}`);
  console.log(`📄 Found ${files.length} chapter files:`);
  files.forEach((f, i) => console.log(`   ${i + 1}. ${f}`));
  console.log(`======================================================\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(targetDir, file);
    const ext = path.extname(file).toLowerCase();
    const mimeType = MIME_MAP[ext];

    console.log(`\n[${i + 1}/${files.length}] Processing: ${file}...`);

    let title = '';
    let content = '';

    if (ext === '.txt' || ext === '.md') {
      content = fs.readFileSync(filePath, 'utf-8');
      content = content.replace(/\b\d+(more_horiz)?\.\n/g, '\n').replace(/\[\d+\]/g, '').trim();
      title = path.basename(file, ext).replace(/[-_]/g, ' ');
    } else {
      const apiKey = getNextKey();
      const fileManager = new GoogleAIFileManager(apiKey);
      const ai = new GoogleGenerativeAI(apiKey);

      console.log(`  ↑ Uploading to Gemini Files API...`);
      const uploadRes = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName: file,
      });

      console.log(`  ⚙ Analyzing content, formatting LaTeX formulas & layout...`);
      const model = ai.getGenerativeModel({ model: 'gemini-3.6-flash' });

      const prompt = `
You are an expert university professor and textbook editor for Ethiopian students.
I have uploaded an already prepared chapter document for the course "${department}" (${examType} level).
File name: "${file}"

Instructions:
1. Extract or determine the clean Chapter Title (e.g. "Chapter 1: Vectors and Vector Spaces").
2. Transform the entire content into comprehensive, beautifully readable study notes in standard Markdown.
3. Rules:
   - Use ## for main section titles and ### for sub-sections.
   - Use high-yield bullet points for definitions and core takeaways.
   - Use comparison tables where applicable.
   - Format ALL math and science formulas in standard LaTeX:
     * Inline formulas MUST be wrapped in single dollar signs (e.g. $E = mc^2$, $\\lim_{x \\to 0}$, $A \\times B$).
     * Block/display formulas MUST be wrapped in double dollar signs on separate lines ($$...$$).
   - If there are slides, convert fragmented bullet points into continuous, cohesive, well-explained paragraphs.
   - If there are conceptual cycles or flowcharts, represent them with Mermaid diagram blocks (\`\`\`mermaid ... \`\`\`).
   - Do NOT include filler text (no "Here is the summary").

Return strictly valid JSON:
{
  "title": "the chapter title",
  "content": "the complete markdown content"
}
`;

      const result = await model.generateContent([
        { fileData: { mimeType, fileUri: uploadRes.file.uri } },
        { text: prompt },
      ]);

      const raw = result.response.text();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Failed to parse AI response for ${file}`);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      title = parsed.title;
      content = parsed.content;

      // Clean up remote file
      try {
        await fileManager.deleteFile(uploadRes.file.name);
      } catch {}
    }

    // Save/Update in Supabase
    console.log(`  💾 Saving to Supabase [${title}]...`);
    const { data: existing } = await supabase
      .from('study_notes')
      .select('id')
      .eq('exam_type', examType)
      .eq('department', department)
      .eq('title', title)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('study_notes')
        .update({ content })
        .eq('id', existing.id);
      console.log(`  ✅ Successfully updated existing note: ${title}`);
    } else {
      await supabase
        .from('study_notes')
        .insert({
          id: crypto.randomUUID(),
          exam_type: examType,
          department: department,
          title: title,
          content: content,
        });
      console.log(`  ✅ Successfully created new note: ${title}`);
    }

    // Small breather between files to respect rate limits
    if (i < files.length - 1) {
      console.log(`  ⏳ Waiting 6s before next file...`);
      await new Promise(r => setTimeout(r, 6000));
    }
  }

  console.log(`\n🎉 All ${files.length} chapters successfully ingested into Supabase!`);
  console.log(`Students can now view them at /notes/${encodeURIComponent(department)}?examType=${examType}\n`);
}

main().catch(err => {
  console.error('\n❌ Ingestion failed:', err);
  process.exit(1);
});
