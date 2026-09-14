async function test() {
  const res = await fetch('http://localhost:3000/api/ai/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'exam',
      questionText: 'What is 2+2?',
      promptType: 'hint'
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", res.status, errorText);
    return;
  }
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    console.log("Chunk:", decoder.decode(value, { stream: true }));
  }
  console.log("Final length:", accumulated.length);
}
test();
