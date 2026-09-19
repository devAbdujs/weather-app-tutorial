const fs = require('fs');
const content = fs.readFileSync('/home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx', 'utf8');

const returnIndex = content.indexOf('return (\n    <div className="min-h-screen bg-ground text-primary');
if (returnIndex === -1) {
  console.log("Could not find start of return");
  process.exit(1);
}

const before = content.substring(0, returnIndex);

const newJSX = `return (
    <div className="min-h-screen bg-ground text-primary flex flex-col justify-between max-w-md mx-auto pb-24 font-sans select-none relative">
      <header className="sticky top-0 z-30 bg-ground/90 backdrop-blur-md pt-safe border-b border-black/5 pb-3">
        <div className="px-5 pt-3 pb-2 flex justify-between items-center mb-1">
          <button onClick={onExit} className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-card border border-black/5 text-secondary hover:text-primary active:scale-95 transition-transform"><X className="w-5 h-5" /></button>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-widest font-bold text-tertiary">{title}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
               {isSimulator && !isReviewMode ? (
                  <ExamTimer 
                    initialSeconds={timeLimitMinutes! * 60} 
                    isPaused={isFinished || isReviewMode} 
                    onTimeUp={() => {
                      haptic.notification('warning');
                      handleFinish();
                    }} 
                  />
               ) : (
                  <span className="text-sm font-black text-primary tabular-nums">
                    Practice Mode
                  </span>
               )}
            </div>
          </div>
          <button onClick={() => {
            haptic.selection();
            setFlagged((prev) => {
              const next = new Set(prev);
              if (next.has(currentIndex)) next.delete(currentIndex);
              else next.add(currentIndex);
              return next;
            });
          }} className={\`w-10 h-10 flex items-center justify-center rounded-[14px] border-2 transition-all active:scale-95 \${flagged.has(currentIndex) ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-sm' : 'bg-card border-black/5 text-secondary hover:text-primary'}\`}><Flag className="w-4 h-4" fill={flagged.has(currentIndex) ? 'currentColor' : 'none'} /></button>
        </div>
        
        {/* Progress Bar */}
        <div className="px-5">
          <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
             <div 
               className="h-full bg-[#229ED9] transition-all duration-300 ease-out rounded-full" 
               style={{ width: \`\${((currentIndex + 1) / questions.length) * 100}%\` }}
             />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 space-y-6 overflow-y-auto relative">
        <div className="bg-card border border-black/5 rounded-[24px] p-6 shadow-sm relative mb-2">
          <button onClick={toggleBookmark} className={\`absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95 \${isSaved ? 'bg-primary/10 text-primary' : 'bg-black/5 text-tertiary hover:text-primary'}\`}><Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} /></button>
          
          <div className="pr-8 text-lg leading-relaxed font-bold text-primary relative whitespace-pre-wrap">
            <MathText content={currentQ.question} />
          </div>

          {currentQ.image_url && (
            <button onClick={() => { haptic.selection(); setZoomImage(currentQ.image_url || null); }} className="w-full mt-4 rounded-[16px] border border-black/5 overflow-hidden bg-white relative group active:scale-[0.98] transition-transform block focus-ring">
              <img src={currentQ.image_url} alt="Question diagram" className="w-full h-auto max-h-64 object-contain" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <Maximize2 className="w-6 h-6 text-black/50 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
              </div>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map((letter, index) => {
            const optKey = \`option_\${letter.toLowerCase()}\` as keyof Question;
            const opt = currentQ[optKey] as string;
            if (!opt) return null;
            
            const normalizedAns = currentQ.answer?.trim().toUpperCase() || '';
            const isSelected = selectedAnswers[currentIndex] === letter;
            
            const isRevealed = (!isSimulator || isReviewMode) && (isAnswered || isReviewMode);
            const isCorrect = isRevealed && normalizedAns ? letter === normalizedAns : false;
            const isWrongSelected = isRevealed && isSelected && normalizedAns ? letter !== normalizedAns : false;

            let cls = 'bg-card border-black/5 text-secondary hover:border-black/20 hover:bg-black/5';
            
            if (isSelected) cls = 'bg-primary/10 border-primary/50 text-primary font-bold scale-[0.99] shadow-sm';
            
            if (isRevealed) {
              if (isCorrect) {
                cls = 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm font-bold scale-[0.99]';
              } else if (isWrongSelected) {
                cls = 'bg-rose-50 border-rose-500 text-rose-950 shadow-sm font-bold scale-[0.99]';
              } else if (isSelected && !normalizedAns) {
                cls = 'bg-primary/10 border-primary text-primary shadow-sm font-bold scale-[0.99]';
              } else {
                cls = 'bg-card border-black/10 text-primary opacity-50';
              }
            }

            return (
              <button
                key={letter}
                onClick={() => (!isReviewMode && (isSimulator || !isAnswered)) && handleSelectOption(letter as any)}
                disabled={isReviewMode || (!isSimulator && isAnswered)}
                className={\`w-full flex items-center justify-between gap-4 p-4 rounded-[20px] border-2 transition-all duration-200 text-left \${cls} \${(!isReviewMode && (isSimulator || !isAnswered)) ? 'active:scale-95' : ''}\`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-black \${isRevealed && isCorrect ? 'bg-emerald-500 text-white' : isRevealed && isWrongSelected ? 'bg-rose-500 text-white' : isSelected ? 'bg-primary text-white' : 'bg-black/5'}\`}>
                    {letter}
                  </div>
                  <span className="text-sm leading-relaxed flex-1 font-medium whitespace-pre-wrap self-center"><MathText content={opt} /></span>
                </div>

                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 self-center" />
                )}

                {isRevealed && isWrongSelected && (
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>

        {(!isSimulator || isReviewMode) && (isAnswered || isReviewMode) && (
          <div className="pt-2 pb-4 animate-fade-up">
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-[24px] p-5">
              <div className="flex items-start gap-3 mb-3">
                {currentQ?.answer?.trim() ? (
                  <>
                    <div className="bg-emerald-100 text-emerald-600 rounded-full p-1.5 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-900/60 uppercase tracking-widest block mb-0.5">Correct Answer</span>
                      <p className="text-base font-black text-emerald-950">{currentQ.answer.trim().toUpperCase()}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-amber-100 text-amber-700 rounded-full p-1.5 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-amber-900/60 uppercase tracking-widest block mb-0.5">No Key Provided</span>
                      <p className="text-xs font-medium text-amber-900">Tap <strong className="text-amber-950">Ask AI</strong> below for a detailed solution.</p>
                    </div>
                  </>
                )}
              </div>

              {currentQ.explanation ? (
                <div className="pl-10 mt-3 border-t border-amber-200/50 pt-3">
                  <span className="text-[10px] font-bold text-amber-900/60 uppercase tracking-widest block mb-2">Explanation</span>
                  <div className="text-sm text-amber-950 font-medium leading-relaxed whitespace-pre-wrap">
                    <MathText content={currentQ.explanation} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-ground/90 backdrop-blur-md border-t border-black/5 p-4 z-30 flex justify-between items-center pb-safe">
        <button 
          onClick={() => { 
            if (canUseAI) {
              haptic.impact('light'); 
              setShowAI(true); 
            } else {
              haptic.notification('error');
            }
          }} 
          className={\`px-5 h-14 rounded-[20px] text-sm font-bold flex items-center gap-2 transition-all active:scale-95 \${
            canUseAI 
              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
              : 'bg-black/5 text-tertiary opacity-70'
          }\`}
        >
          {canUseAI ? (
            <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500"/>
          ) : (
            <Lock className="w-4 h-4 text-tertiary" />
          )}
          Ask AI
        </button>
        <div className="flex gap-2">
          {currentIndex > 0 && (
            <button onClick={() => { haptic.selection(); setCurrentIndex(prev => prev - 1); }} className="w-14 h-14 rounded-[20px] bg-card border border-black/5 flex items-center justify-center text-primary active:scale-95 hover:border-black/10 transition-all shadow-sm"><ChevronLeft className="w-5 h-5"/></button>
          )}
          <button onClick={() => { haptic.selection(); setShowGrid(true); }} className="w-14 h-14 rounded-[20px] bg-card border border-black/5 flex items-center justify-center text-primary active:scale-95 hover:border-black/10 transition-all shadow-sm"><Grid className="w-5 h-5"/></button>
          {currentIndex < questions.length - 1 ? (
            <button onClick={() => { haptic.selection(); setCurrentIndex(prev => prev + 1); }} className="px-6 h-14 bg-primary text-white rounded-[20px] text-sm font-bold active:scale-95 flex items-center gap-2 shadow-sm shadow-primary/20 transition-all">Next <ChevronRight className="w-5 h-5"/></button>
          ) : (
            <button onClick={isReviewMode ? () => setIsFinished(true) : handleFinish} className="px-6 h-14 bg-primary text-white rounded-[20px] text-sm font-bold active:scale-95 flex items-center gap-2 shadow-sm shadow-primary/20 transition-all">{isReviewMode ? 'Finish' : 'Submit'}</button>
          )}
        </div>
      </footer>

      {showGrid && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in" onClick={() => setShowGrid(false)}>
          <div className="w-full max-w-sm bg-card rounded-[32px] p-6 shadow-2xl animate-scale-bounce" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-black/5">
              <h3 className="font-bold tracking-tight text-xl text-primary">Question Grid</h3>
              <button onClick={() => setShowGrid(false)} className="w-10 h-10 flex justify-center items-center rounded-full bg-black/5 hover:bg-black/10 text-primary active:scale-95 transition-all"><X className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto no-scrollbar pb-2 pt-2">
              {questions.map((_, i) => {
                const qIdLoop = questions[i]?.id || \`\${subject}-\${questions[i]?.question.substring(0, 20)}\`;
                const isBkmrk = savedQuestions.has(qIdLoop);
                const isFlg = flagged.has(i);
                
                return (
                  <button key={i} onClick={() => { setCurrentIndex(i); setShowGrid(false); }} className={\`relative h-12 rounded-[16px] border-2 text-sm font-bold tabular-nums transition-all active:scale-95 \${currentIndex === i ? 'bg-primary border-primary text-card shadow-sm -translate-y-1' : isFlg ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : selectedAnswers[i] ? 'bg-black/5 border-transparent text-primary' : 'bg-card border-black/5 text-secondary hover:border-primary/50'}\`}>
                    {i + 1}
                    {isBkmrk && <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-card" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentQ && (
        <AITutorDrawer 
          question={currentQ} 
          isOpen={showAI} 
          onClose={() => setShowAI(false)}
          studentAnswer={selectedAnswers[currentIndex]}
        />
      )}

      {/* Full-screen Image Lightbox Overlay */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { haptic.selection(); setZoomImage(null); }}
        >
          <button className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-card border border-primary/20 rounded-full text-primary transition-all active:scale-95 shadow-sm">
            <X className="w-6 h-6" />
          </button>
          <img src={zoomImage} className="w-full max-h-[90vh] object-contain rounded-xl" alt="Zoomed diagram" />
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync('/home/abdu/scraping/ethio-exam-app/src/components/exam/ExamWorkspace.tsx', before + newJSX);
