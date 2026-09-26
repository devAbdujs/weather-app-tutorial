#!/usr/bin/env python3
"""
Temari Short Note Ingestion CLI
Extracts text from PDF files, formats educational content into clean Markdown 
with LaTeX equations via Gemini 3.6 Flash, and inserts it directly into Supabase 'study_notes'.

Usage:
  python3 scripts/ingest_note_pdf.py \
    --pdf "path/to/chapter.pdf" \
    --exam-type freshman \
    --department "Applied Mathematics I" \
    --title "Chapter 1: Vectors and Vector Spaces"
"""

import os
import sys
import argparse
import subprocess
import json
import uuid
import urllib.request
import re

# Load environment variables from .env.local if available
def load_env():
    env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env.local')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    os.environ[k] = v

load_env()

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Find Gemini API keys from loaded environment
def get_gemini_keys():
    keys = []
    for k, v in os.environ.items():
        if k.lower().startswith('gemini_api_key'):
            keys.append(v)
    return keys

def extract_pdf_text(pdf_path: str) -> str:
    """Extracts raw text from PDF using pdftotext CLI."""
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    result = subprocess.run(['pdftotext', pdf_path, '-'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"pdftotext failed: {result.stderr}")
    
    return result.stdout.strip()

def format_with_gemini(raw_text: str, exam_type: str, department: str, title: str) -> str:
    """Uses Gemini 3.6 Flash to format raw educational text into clean Markdown with LaTeX math."""
    keys = get_gemini_keys()
    
    prompt = f"""You are an elite educational content formatter for Ethiopian students.
I am providing you with the extracted text from a textbook chapter/short note for:
- Exam Type: {exam_type}
- Course/Department: {department}
- Chapter Title: {title}

STRICT INSTRUCTIONS:
1. DO NOT summarize or shorten the educational content. Keep 100% of definitions, concepts, examples, formulas, and explanations.
2. Format the text into beautiful GitHub Markdown:
   - Use proper headings (#, ##, ###)
   - Use bullet points and numbered lists where appropriate
   - Bold key terms and definitions
   - Convert all mathematical and physical equations into LaTeX syntax ($...$ for inline, $$...$$ for block formulas).
3. Do not include introductory conversational text (e.g. "Here is the formatted note:"). Start directly with the main chapter heading.
4. Output ONLY the clean Markdown text.

Here is the raw text:
{raw_text[:35000]}
"""

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }).encode('utf-8')

    for key in keys:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={key}"
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                candidate = data.get('candidates', [{}])[0]
                text = candidate.get('content', {}).get('parts', [{}])[0].get('text', '')
                if text:
                    # Strip any wrapping ```markdown blocks if present
                    text = re.sub(r'^```markdown\s*', '', text)
                    text = re.sub(r'```$', '', text.strip())
                    return text.strip()
        except Exception as e:
            print(f"Key error ({key[:10]}...): {e}, trying next key...")
            continue
            
    raise RuntimeError("All Gemini API keys failed or timed out.")

def insert_into_supabase(exam_type: str, department: str, title: str, content: str):
    """Inserts formatted note into Supabase 'study_notes' table."""
    note_id = str(uuid.uuid4())
    url = f"{SUPABASE_URL}/rest/v1/study_notes"
    
    payload = json.dumps({
        "id": note_id,
        "exam_type": exam_type,
        "department": department,
        "title": title,
        "content": content
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    )

    with urllib.request.urlopen(req) as resp:
        if resp.status in (200, 201):
            return note_id
        else:
            raise RuntimeError(f"Supabase returned status {resp.status}")

def main():
    parser = argparse.ArgumentParser(description="Ingest a PDF short note into Temari App")
    parser.add_argument('--pdf', required=True, help="Path to the PDF file")
    parser.add_argument('--exam-type', required=True, choices=['entrance', 'freshman', 'exit'], help="Target exam category")
    parser.add_argument('--department', required=True, help="Course or Subject name (e.g. 'Applied Mathematics I', 'Biology')")
    parser.add_argument('--title', required=True, help="Chapter or Topic title (e.g. 'Chapter 1: Vectors and Vector Spaces')")

    args = parser.parse_args()

    print(f"📖 Step 1/3: Extracting text from {args.pdf}...")
    raw_text = extract_pdf_text(args.pdf)
    print(f"   ✓ Extracted {len(raw_text)} characters.")

    print(f"🧠 Step 2/3: Formatting into Markdown & LaTeX via Gemini 3.6 Flash...")
    markdown_content = format_with_gemini(raw_text, args.exam_type, args.department, args.title)
    print(f"   ✓ Generated {len(markdown_content)} characters of clean Markdown.")

    print(f"🚀 Step 3/3: Inserting into Supabase ('study_notes')...")
    note_id = insert_into_supabase(args.exam_type, args.department, args.title, markdown_content)
    print(f"   ✅ SUCCESS! Note saved to database with ID: {note_id}")
    print(f"   🔗 Accessible at: /notes/{urllib.parse.quote(args.department)}?examType={args.exam_type}")

if __name__ == '__main__':
    main()
