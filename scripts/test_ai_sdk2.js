const { generateText, streamText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
require('dotenv').config({ path: '.env.local' });

async function run() {
  try {
    const key = process.env.gemini_api_key1;
    const google = createGoogleGenerativeAI({ apiKey: key });
    
    // The previous error trace said models/gemini-1.5-flash wasn't found for generateContent.
    // Let's try gemini-1.5-flash (ai sdk should map it), or gemini-2.5-flash
    const model = google('gemini-1.5-flash');
    
    console.log("Generating with gemini-1.5-flash...");
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
