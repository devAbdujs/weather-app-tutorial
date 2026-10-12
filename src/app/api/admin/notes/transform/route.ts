import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/app/actions/admin';
import { getNextGeminiKey, markKeyRateLimited } from '@/lib/geminiKeyRotation';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

// Maximum execution time for long document extraction
export const maxDuration = 60;

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.txt': 'text/plain',
  '.md': 'text/plain',
};

import { hasPermission } from '@/lib/adminPermissions';
import { normalizeMarkdownLaTeX } from '@/lib/latex';

export function safeParseAiNote(raw: string, fallbackTitle: string): { title: string; content: string } {
  if (!raw) return { title: fallbackTitle, content: '' };
  let cleaned = raw.trim();

  // Strip code block wrappers if any
  cleaned = cleaned.replace(/^```(?:json)?\s*\n/i, '').replace(/\n```\s*$/i, '').trim();

  // 1. First attempt: standard JSON.parse
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.content) {
        return { title: parsed.title || fallbackTitle, content: parsed.content };
      }
    }
  } catch {}

  // 2. Second attempt: fix unescaped solitary LaTeX backslashes & unescaped control chars
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let candidate = jsonMatch[0];
      // Escape solitary backslashes not followed by valid JSON escape characters (" \ / b f n r t or uXXXX)
      candidate = candidate.replace(/(?<!\\)\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\');
      // Normalize literal raw newlines inside "content": "..."
      candidate = candidate.replace(/"content"\s*:\s*"([\s\S]*?)"\s*\}/, (_, inner) => {
        const escapedInner = inner.replace(/\r?\n/g, '\\n');
        return `"content": "${escapedInner}"}`;
      });
      const parsed = JSON.parse(candidate);
      if (parsed.content) {
        return { title: parsed.title || fallbackTitle, content: parsed.content };
      }
    }
  } catch {}

  // 3. Third attempt: regex extraction of title and content fields
  const titleMatch = cleaned.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  const contentMatch = cleaned.match(/"content"\s*:\s*"([\s\S]*)"\s*\}?\s*$/);
  if (contentMatch) {
    const unescapedContent = contentMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n');
    const unescapedTitle = titleMatch ? titleMatch[1].replace(/\\"/g, '"') : fallbackTitle;
    return { title: unescapedTitle, content: unescapedContent };
  }

  // 4. Fallback: if Gemini returned plain Markdown instead of JSON
  const headingMatch = cleaned.match(/^#+\s*([^\n]+)/m);
  const extractedTitle = headingMatch ? headingMatch[1].trim() : fallbackTitle;
  return { title: extractedTitle, content: cleaned };
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(admin, 'notes:write')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions to transform study notes' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const examType = (formData.get('examType') as string) || 'freshman';
    const department = (formData.get('department') as string) || '';
    const chapterHint = (formData.get('chapterTitle') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!department) {
      return NextResponse.json({ success: false, error: 'Course/Department is required' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const mimeType = MIME_MAP[ext] || file.type || 'application/octet-stream';

    // ── Handle Plain Text / Markdown directly ─────────────────────────────────
    if (ext === '.txt' || ext === '.md') {
      const rawText = await file.text();
      // Basic artifact cleanup
      let cleanContent = rawText.replace(/\b\d+(more_horiz)?\.\n/g, '\n');
      cleanContent = cleanContent.replace(/\[\d+\]/g, '').trim();
      cleanContent = normalizeMarkdownLaTeX(cleanContent);

      // Derive title from filename or hint
      let derivedTitle = chapterHint;
      if (!derivedTitle) {
        const base = path.basename(file.name, ext);
        derivedTitle = base.replace(/[-_]/g, ' ');
      }

      return NextResponse.json({
        success: true,
        title: derivedTitle,
        content: cleanContent,
      });
    }

    // ── Multimodal Processing via Gemini Files API ────────────────────────────
    const geminiKey = getNextGeminiKey();
    if (!geminiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI transformation service is currently busy or rate-limited. Please retry in 30 seconds.',
      }, { status: 503 });
    }

    // Write file to temporary folder for upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `temari_doc_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`);
    await fs.promises.writeFile(tempFilePath, buffer);

    const fileManager = new GoogleAIFileManager(geminiKey);
    const ai = new GoogleGenerativeAI(geminiKey);

    let uploadUri: string | null = null;
    let fileResourceName: string | null = null;

    try {
      const uploadRes = await fileManager.uploadFile(tempFilePath, {
        mimeType,
        displayName: file.name,
      });
      uploadUri = uploadRes.file.uri;
      fileResourceName = uploadRes.file.name;

      const model = ai.getGenerativeModel({ 
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
You are an expert curriculum summarizer and university tutor for Ethiopian students.
I have uploaded a prepared lecture/chapter document for the course "${department}" (${examType} exam level).
File name: "${file.name}"
${chapterHint ? `Target Chapter Title Hint: "${chapterHint}"` : ''}

Your task:
1. Extract and infer the official Chapter Title (e.g., "Chapter 1: Vectors and Vector Spaces" or "Chapter 2: Theory of Demand and Supply").
2. Transform the entire document into clean, comprehensive, highly readable study notes in standard Markdown.
3. Formatting Rules:
   - Use ## for main section titles and ### for sub-sections.
   - Use concise, high-yield bullet points for definitions, core principles, and exam takeaways.
   - Include comparison tables where appropriate (using Markdown tables).
   - If this is a slide deck (PPTX/PPT) or lecture notes, convert fragmented slide bullet points into clear, continuous, well-explained paragraphs and notes.
   - Format ALL math, physics, and economics equations in standard LaTeX:
     * Inline math MUST be enclosed in single dollar signs (e.g. $E = mc^2$, $\\lim_{x \\to 0}$, $P^*$).
     * Display/block formulas MUST be enclosed in double dollar signs on separate lines:
       $$
       x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
       $$
   - Do NOT wrap your entire response or the JSON content value in code blocks (do not wrap in \`\`\`markdown ... \`\`\`).
   - Do NOT include conversational filler (do NOT say "Here is the summary" or "Sure!").
   - Do NOT use Mermaid diagrams, class diagrams, or code diagrams (do NOT use \`\`\`mermaid ... \`\`\`). Represent all lifecycles, flows, hierarchies, taxonomies, and classifications using structured Markdown bullet lists, numbered sequences, or Markdown comparison tables.

Return the response strictly as a JSON object with this exact structure:
{
  "title": "the inferred or specified chapter title",
  "content": "the complete markdown study note"
}
`;

      const result = await model.generateContent([
        { fileData: { mimeType, fileUri: uploadUri } },
        { text: prompt },
      ]);

      const rawResponse = result.response.text();
      const defaultTitle = chapterHint || file.name.replace(ext, '').replace(/[-_]/g, ' ');

      // Robust multi-tier extraction: handles standard JSON, unescaped LaTeX backslashes,
      // unescaped literal newlines, regex field slicing, and raw markdown fallback
      const parsed = safeParseAiNote(rawResponse, defaultTitle);
      const cleanedContent = normalizeMarkdownLaTeX(parsed.content || '');

      return NextResponse.json({
        success: true,
        title: parsed.title || defaultTitle,
        content: cleanedContent,
      });

    } catch (err: any) {
      if (err.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED')) {
        markKeyRateLimited(geminiKey);
      }
      throw err;
    } finally {
      // Clean up local temp file
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch {}

      // Clean up remote Gemini file to avoid accumulating quota
      if (fileResourceName) {
        try {
          await fileManager.deleteFile(fileResourceName);
        } catch {}
      }
    }

  } catch (error: any) {
    console.error('[Document Transform Error]', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error while processing document',
    }, { status: 500 });
  }
}
