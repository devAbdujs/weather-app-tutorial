require('dotenv').config({ path: '.env.local' });
async function fix() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/study_notes?department=eq.Sociology`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ exam_type: 'exit' })
  });
  console.log('Update status:', res.status);
}
fix();
