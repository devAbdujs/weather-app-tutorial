require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log("Testing Supabase upsert...");
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ 
      telegram_id: "999999999",
      full_name: "Test User"
    }, { onConflict: 'telegram_id' })
    .select('telegram_id, target_exam, stream')
    .single();

  if (error) {
    console.error("UPSERT ERROR:", error);
  } else {
    console.log("UPSERT SUCCESS:", data);
  }
}

test();
