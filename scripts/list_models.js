require('dotenv').config({ path: '.env.local' });
async function test() {
  const keys = process.env.NEXT_PUBLIC_GEMINI_API_KEYS.split(',');
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keys[0]}`);
  const data = await res.json();
  if (data.models) {
    console.log(data.models.map(m => m.name));
  } else {
    console.log("Error:", data);
  }
}
test();
