const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
require('dotenv').config({ path: '.env.local' });
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

async function run() {
  try {
    const key = process.env.gemini_api_key1;
    const google = createGoogleGenerativeAI({ apiKey: key });
    
    const model = google('gemini-3.6-flash');
    
    console.log("Generating with gemini-3.6-flash...");
    const { text } = await generateText({
      model,
      prompt: 'Hello, are you there?',
    });
    console.log("Success:", text);
  } catch (err) {
    console.error("Error generating text:", err);
  }
}
run();
