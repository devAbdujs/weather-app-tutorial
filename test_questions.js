require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase
    .from('questions')
    .select('id')
    .limit(5);

  if (error) console.error("Error fetching questions:", error);
  else console.log("Fetched questions:", data.length);
}
test();
