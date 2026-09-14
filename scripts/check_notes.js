require('dotenv').config({ path: '.env.local' });
async function check() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/study_notes?select=exam_type,department`, {
    headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  const freshman = data.filter(n => n.exam_type === 'freshman');
  console.log('Freshman Notes in Supabase:', freshman);
}
check();
