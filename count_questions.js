require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function count() {
  const res = await fetch(`${supabaseUrl}/rest/v1/questions?select=exam_type,year`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  const data = await res.json();
  
  if (data.error) {
    console.error(data.error);
    return;
  }
  
  const counts = data.reduce((acc, curr) => {
    acc[curr.exam_type] = (acc[curr.exam_type] || 0) + 1;
    return acc;
  }, {});
  
  console.log("Counts by Exam Type:", counts);
  
  const yearCounts = data.reduce((acc, curr) => {
    const year = curr.year || 'Unknown';
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});
  
  console.log("Counts by Year:", yearCounts);
}

count();
