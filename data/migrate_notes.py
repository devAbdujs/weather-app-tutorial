"""
Migrate study_notes from SQLite (cleaned JSON) → Supabase.

Steps:
1. Read the cleaned JSON
2. Create study_notes table via Supabase REST API (if not exists)
3. Upsert all 38 notes in one batch
"""

import json
import os
import urllib.request
import urllib.error

SUPABASE_URL = "https://uzqynyffsqmgsptxcyno.supabase.co"
# Use service role key if available, otherwise fall back to anon key (needs RLS disabled)
SUPABASE_KEY = "sb_publishable_XvkyRQ5DxdnMe-e50FfFSw_JBf1Nabt"

NOTES_FILE = "/home/abdu/scraping/ethio-exam-app/data/study_notes_cleaned.json"

def supabase_request(method, path, body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read()
            return resp.status, body.decode() if body else ""
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def main():
    with open(NOTES_FILE) as f:
        notes = json.load(f)

    print(f"Loaded {len(notes)} notes from cleaned JSON")

    # Try upserting in one batch (Supabase supports up to ~500 rows per request)
    status, body = supabase_request("POST", "study_notes", notes)
    
    if status in (200, 201, 204):
        print(f"✅ Successfully upserted {len(notes)} notes (HTTP {status})")
    else:
        print(f"❌ Batch failed (HTTP {status}): {body[:500]}")
        print("\nTrying row-by-row fallback...")
        success = 0
        for note in notes:
            s, b = supabase_request("POST", "study_notes", note)
            if s in (200, 201, 204):
                success += 1
            else:
                print(f"  ❌ Failed '{note['department']}': {b[:200]}")
        print(f"Row-by-row: {success}/{len(notes)} succeeded")

if __name__ == "__main__":
    main()
