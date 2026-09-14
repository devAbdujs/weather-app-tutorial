import os
import urllib.request
import glob

env = {}
with open('.env.local') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

files = glob.glob('data/notes_markdown/*.md')
success = 0

for filepath in files:
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        data = f.read()

    url = f"{supabase_url}/storage/v1/object/study_notes/{filename}"
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'Bearer {service_key}')
    req.add_header('apikey', service_key)
    req.add_header('Content-Type', 'text/markdown')
    req.add_header('x-upsert', 'true')

    try:
        with urllib.request.urlopen(req) as response:
            success += 1
            print(f"✅ Uploaded {filename}")
    except urllib.error.HTTPError as e:
        print(f"❌ Failed {filename}:", e.read().decode())

print(f"\n🎉 Successfully uploaded {success}/{len(files)} files!")
