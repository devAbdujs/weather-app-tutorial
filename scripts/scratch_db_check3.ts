import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/questions?exam_type=eq.freshman&subject=eq.Logic&select=id,answer,option_a`, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
    }
  });
  const data = await res.json();
  console.log("Logic questions count:", data.length);
  if (data.length > 0) {
    console.log("Sample Logic answers:", data.slice(0, 5).map((d: any) => d.answer));
  }
}
run();
