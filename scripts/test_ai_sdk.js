const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
require('dotenv').config({ path: '.env.local' });

async function run() {
  try {
    const keys = process.env.NEXT_PUBLIC_GEMINI_API_KEYS.split(',');
    const google = createGoogleGenerativeAI({ apiKey: keys[0] });
    const model = google('gemini-2.5-flash');
    
    console.log("Generating...");
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
