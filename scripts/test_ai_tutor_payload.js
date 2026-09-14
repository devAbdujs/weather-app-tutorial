async function test() {
  const payload = {
    mode: 'notes',
    noteText: 'Sample textbook text',
    promptType: 'test',
    chatHistory: [
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Test my knowledge' }
    ]
  };

  const res = await fetch('http://localhost:3000/api/ai/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, errorText);
    return;
  }
  
  console.log("Success, status:", res.status);
}
test();
