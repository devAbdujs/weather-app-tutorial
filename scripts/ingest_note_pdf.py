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

def split_into_chunks(text: str, max_chunk_size: int = 14000) -> list:
    """Splits raw text into logical paragraph chunks without breaking sentences."""
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    current = []
    current_len = 0
    
    paragraphs = text.split('\n\n')
    for p in paragraphs:
        if current_len + len(p) > max_chunk_size and current:
            chunks.append('\n\n'.join(current).strip())
            current = [p]
            current_len = len(p)
        else:
            current.append(p)
            current_len += len(p) + 2
            
    if current:
        chunks.append('\n\n'.join(current).strip())
    return chunks

def call_gemini_with_rotation(prompt: str) -> str:
    """Calls Gemini 3.6 Flash using key rotation pool with exponential backoff retry."""
    import time
    keys = get_gemini_keys()
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 8192}
    }).encode('utf-8')

    max_rounds = 4
    for round_num in range(max_rounds):
        for key in keys:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={key}"
                req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(req, timeout=180) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    candidate = data.get('candidates', [{}])[0]
                    parts = candidate.get('content', {}).get('parts', [])
                    text = "".join(p.get('text', '') for p in parts)
                    if text:
                        text = re.sub(r'^```markdown\s*', '', text)
                        text = re.sub(r'```$', '', text.strip())
                        return text.strip()
            except Exception as e:
                time.sleep(1)
                continue
        if round_num < max_rounds - 1:
            wait_time = (round_num + 1) * 3
            print(f"   ⏳ Round {round_num + 1} met temporary Google 503 rate/busy limits, waiting {wait_time}s...")
            time.sleep(wait_time)
            
    raise RuntimeError("All Gemini API keys failed after multiple retry rounds.")

def format_with_gemini(raw_text: str, exam_type: str, department: str, title: str) -> str:
    """Uses Gemini 3.6 Flash with smart chunking to format educational text into clean Markdown with LaTeX math."""
    chunks = split_into_chunks(raw_text, max_chunk_size=14000)
    print(f"   ℹ Splitting into {len(chunks)} chunk(s) to guarantee zero truncation...")
    
    formatted_parts = []
    for idx, chunk in enumerate(chunks, 1):
        print(f"   🧠 Formatting chunk {idx}/{len(chunks)} ({len(chunk)} chars)...")
        prompt = f"""You are an elite educational content formatter for Ethiopian university students.
I am providing you with Part {idx} of {len(chunks)} of extracted textbook material for:
- Exam Type: {exam_type}
- Course/Department: {department}
- Chapter Title: {title}

STRICT INSTRUCTIONS:
1. Format into clean, publication-grade GitHub Markdown.
2. DO NOT summarize or omit educational content. Keep all definitions, theorems, formulas, examples, and explanations.
3. Convert all mathematical and physical equations into LaTeX KaTeX syntax:
   - Use $...$ for inline equations
   - Use $$...$$ for block formulas
4. Use proper hierarchical headings (##, ###), bullet points, and bold definitions.
5. Do not include conversational introductory text (e.g. "Here is the markdown..."). Start directly with the content.

Raw Text Part {idx}/{len(chunks)}:
{chunk}
"""
        part_md = call_gemini_with_rotation(prompt)
        formatted_parts.append(part_md)
        
    full_markdown = "\n\n---\n\n".join(formatted_parts)
    return full_markdown.strip()

def insert_into_supabase(exam_type: str, department: str, title: str, content: str):
    """Upserts formatted note into Supabase 'study_notes' table."""
    import urllib.parse
    check_url = f"{SUPABASE_URL}/rest/v1/study_notes?department=eq.{urllib.parse.quote(department)}&title=eq.{urllib.parse.quote(title)}&exam_type=eq.{exam_type}"
    check_req = urllib.request.Request(
        check_url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }
    )
    
    existing_id = None
    try:
        with urllib.request.urlopen(check_req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data and len(data) > 0:
                existing_id = data[0]['id']
    except Exception:
        pass

    if existing_id:
        print(f"   🔄 Note already exists (ID: {existing_id}). Updating with complete content...")
        url = f"{SUPABASE_URL}/rest/v1/study_notes?id=eq.{existing_id}"
        payload = json.dumps({"content": content}).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            method='PATCH',
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
        )
        with urllib.request.urlopen(req) as resp:
            return existing_id

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
