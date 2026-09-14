import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/questions?exam_type=eq.freshman&select=subject`, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
    }
  });
  const data = await res.json();
  const subjects = new Set(data.map((d: any) => d.subject));
  console.log("Freshman subjects in DB:", Array.from(subjects));
}
run();
