require('dotenv').config({ path: '.env.local' });
const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

async function test() {
  try {
    const keys = Object.keys(process.env).filter(k => k.toLowerCase().startsWith('gemini_api_key'));
    if(keys.length === 0) return console.log('No GEMINI key');
    
    const google = createGoogleGenerativeAI({ apiKey: process.env[keys[0]] });
    const model = google('gemini-3.6-flash');
    console.log("Testing...");
    await generateText({
      model,
      prompt: "Hi"
    });
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
