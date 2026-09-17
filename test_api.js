require('dotenv').config({ path: '.env.local' });
async function test() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.gemini_api_key1);
  const json = await res.json();
  console.log(json.models.map(m => m.name));
}
test();
