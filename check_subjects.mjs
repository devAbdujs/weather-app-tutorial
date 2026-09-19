import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/home/abdu/scraping/ethio-exam-app/.env.local', 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => l.split('='))
    .map(([k, ...v]) => [k.trim(), v.join('=').trim()])
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await supabase
  .from('questions')
  .select('subject')
  .eq('exam_type', 'freshman')
  .limit(1000);

const subjects = [...new Set(data.map(q => q.subject))].sort();
console.log('=== DISTINCT FRESHMAN SUBJECTS IN DB ===');
subjects.forEach(s => console.log(JSON.stringify(s)));
