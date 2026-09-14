import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.from('questions').select('subject, exam_type').eq('exam_type', 'freshman');
  if (error) {
    console.error(error);
  } else {
    const subjects = new Set(data.map(d => d.subject));
    console.log("Freshman subjects in DB:", Array.from(subjects));
  }
}
run();
