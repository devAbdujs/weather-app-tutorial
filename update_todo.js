const fs = require('fs');
let todo = fs.readFileSync('todo.md', 'utf8');

// Update checkboxes
todo = todo.replace('- [ ] Render Blocking & Client Waterfalls', '- [x] Render Blocking & Client Waterfalls');
todo = todo.replace('- [ ] Image Optimization', '- [x] Image Optimization');
todo = todo.replace('- [ ] Rate Limiting & RLS Security', '- [x] Rate Limiting & RLS Security');
todo = todo.replace('- [ ] Telegram Native Immersion (Bot API 8.0)', '- [x] Telegram Native Immersion (Bot API 8.0)');
todo = todo.replace('- [ ] Exam UX Context Loss', '- [x] Exam UX Context Loss');
todo = todo.replace('- [ ] Robust PWA & Background Sync', '- [x] Robust PWA & Background Sync');

fs.writeFileSync('todo.md', todo);
