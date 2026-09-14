const fs = require('fs');

const path = 'src/components/ai/AITutorDrawer.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the return block with a clean version
const returnIndex = code.indexOf('return (');
if (returnIndex !== -1) {
  const newReturnBlock = `return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-primary/40 backdrop-blur-sm animate-fade-in font-sans max-w-md mx-auto">
      <div className="w-full bg-ground border-t-2 border-x-2 border-primary rounded-t-[32px] flex flex-col max-h-[90vh] h-[90vh] animate-sheet-up shadow-[0px_-8px_0px_#1a1a1a] overflow-hidden">
        
        {/* Header (Persona) */}
        <div className="flex items-center justify-between p-5 border-b-2 border-black/5 bg-card z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[16px] bg-accent-blue border-2 border-primary flex items-center justify-center shadow-brutal-sm">
              <Bot className="w-6 h-6 text-card" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-primary leading-none mb-1">Mr. Helper</h3>
              <p className="text-xs font-bold text-secondary">AI Tutor Assistant</p>
            </div>
          </div>
          <button onClick={() => { haptic.selection(); onClose(); }} className="w-10 h-10 flex justify-center items-center rounded-[12px] bg-ground border-2 border-transparent hover:border-black/5 text-secondary hover:text-primary transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-full space-y-4 opacity-50">
              <Sparkles className="w-12 h-12 text-primary" />
              <p className="text-sm font-bold text-primary max-w-[200px] leading-relaxed">
                Stuck on this question? Ask me for an explanation!
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                <div className={\`max-w-[85%] rounded-[20px] p-4 text-sm font-medium leading-relaxed shadow-sm border-2 \${
                  msg.role === 'user' 
                    ? 'bg-primary text-card border-primary rounded-br-[4px]' 
                    : 'bg-card text-primary border-black/5 rounded-bl-[4px]'
                }\`}>
                  {msg.role === 'user' ? msg.content : <AIResponse content={msg.content} />}
                </div>
              </div>
            ))
          )}
          
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-card border-2 border-black/5 rounded-[20px] rounded-bl-[4px] p-4 w-[80%] flex flex-col gap-2">
                <div className="w-full h-3 bg-black/5 rounded animate-pulse" />
                <div className="w-5/6 h-3 bg-black/5 rounded animate-pulse" />
                <div className="w-4/6 h-3 bg-black/5 rounded animate-pulse" />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="text-sm text-error font-bold leading-relaxed bg-red-50 border-2 border-error p-4 rounded-[20px] shadow-sm text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Quick Actions (only show if no custom text is being typed) */}
        {!chatInput && (
          <div className="flex gap-2 px-5 py-2 overflow-x-auto no-scrollbar shrink-0 bg-ground">
            <button onClick={() => handleSend('eli5')} disabled={isLoading} className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 active:scale-95 bg-card border-black/5 text-primary hover:border-accent-blue hover:text-accent-blue">Explain simply</button>
            <button onClick={() => handleSend('amharic')} disabled={isLoading} className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2 active:scale-95 bg-card border-black/5 text-primary hover:border-accent-emerald hover:text-accent-emerald">Translate to Amharic</button>
          </div>
        )}

        {/* Custom Chat Input Area */}
        <div className="p-4 bg-card border-t-2 border-black/5 shrink-0 pb-safe">
          <form onSubmit={handleInputSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="flex-1 h-12 bg-ground border-2 border-black/5 rounded-full px-5 text-sm font-medium text-primary placeholder:text-secondary focus-ring focus:border-primary outline-none transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isLoading}
              className={\`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all active:scale-95 \${
                chatInput.trim() && !isLoading
                  ? 'bg-accent-blue border-primary text-white shadow-[2px_2px_0px_#1a1a1a]'
                  : 'bg-ground border-black/5 text-secondary opacity-50'
              }\`}
            >
              <SendHorizonal className="w-5 h-5 -ml-0.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
`;
  
  const beforeReturn = code.substring(0, returnIndex);
  fs.writeFileSync(path, beforeReturn + newReturnBlock);
}
