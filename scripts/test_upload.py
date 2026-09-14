import os
import urllib.request

env = {}
with open('.env.local') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

filepath = 'data/notes_markdown/entrance-biology.md'
with open(filepath, 'rb') as f:
    data = f.read()

url = f"{supabase_url}/storage/v1/object/study_notes/entrance-biology.md"
req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Authorization', f'Bearer {service_key}')
req.add_header('apikey', service_key)
req.add_header('Content-Type', 'text/markdown')
req.add_header('x-upsert', 'true')

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode())
except urllib.error.HTTPError as e:
    print("Error Status:", e.code)
    print("Error Body:", e.read().decode())
