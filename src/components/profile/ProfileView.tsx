/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Flame, 
  Bookmark, 
  Database, 
  Trash2, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { useTelegram } from '@/hooks/useTelegram';
import { offlineDb, SavedQuestion } from '@/lib/offlineDb';
import { MathText } from '@/components/MathText';

export const ProfileView: React.FC = () => {
  const { user, isTelegram, haptic } = useTelegram();
  const [streak, setStreak] = useState(1);
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([]);
  const [cacheCount, setCacheCount] = useState(0);
  const [selectedReviewQ, setSelectedReviewQ] = useState<SavedQuestion | null>(null);

  useEffect(() => {
    // Load streak & saved questions
    if (offlineDb) {
      offlineDb.userStreak.get('current_streak').then((rec) => {
        if (rec) setStreak(rec.count);
      });

      offlineDb.savedQuestions.toArray().then((list) => {
        setSavedQuestions(list);
      });

      offlineDb.questionCache.count().then((count) => {
        setCacheCount(count);
      });
    }
  }, []);

  const handleRemoveSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact('light');
    if (offlineDb) {
      await offlineDb.savedQuestions.delete(id);
      setSavedQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const handleClearCache = async () => {
    haptic.impact('medium');
    if (confirm('Clear offline questions cache? This will free space and reload fresh sets.')) {
      if (offlineDb) {
        await offlineDb.questionCache.clear();
        setCacheCount(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 max-w-md mx-auto p-4 pt-6 space-y-5">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-blue-600/30 shrink-0">
          {user?.first_name ? user.first_name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-white truncate">
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Ethio Scholar'}
          </h2>
          <p className="text-xs text-slate-400 truncate">
            {user?.username ? `@${user.username}` : 'Offline / Web Student'}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
              {isTelegram ? 'Telegram Mini App' : 'Web PWA'}
            </span>
          </div>
        </div>
      </div>

      {/* Streak Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-300">
              {streak} Days Active Streak
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Consistent daily practice builds national top scores!
            </p>
          </div>
        </div>
      </div>

      {/* Mistake Notebook / Saved Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200">Mistake Review Notebook</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {savedQuestions.length} Saved
          </span>
        </div>

        {savedQuestions.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 space-y-2">
            <Bookmark className="w-8 h-8 mx-auto text-slate-700 stroke-1" />
            <p className="text-xs">No questions bookmarked yet.</p>
            <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
              Tap the &quot;Save&quot; icon during practice sessions to bookmark challenging questions for quick review.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {savedQuestions.map((sq) => (
              <div
                key={sq.id}
                onClick={() => {
                  haptic.selection();
                  setSelectedReviewQ(sq);
                }}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-semibold">
                      {sq.question.subject}
                    </span>
                    {sq.question.year_ec && (
                      <span className="text-[9px] text-slate-500">
                        {sq.question.year_ec} E.C.
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 truncate">
                    {sq.question.question}
                  </p>
                </div>

                <button
                  onClick={(e) => handleRemoveSaved(sq.id, e)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage & Vault Statistics */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-200">Knowledge Vault & Offline Storage</h3>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
            Zero-VPS Local
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Total Questions</span>
            <span className="text-sm font-bold text-white">33,987</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Curriculum Flashcards</span>
            <span className="text-sm font-bold text-white">10,593</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Offline Cached Sets</span>
            <span className="text-sm font-bold text-blue-400">{cacheCount} cached</span>
          </div>
          <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Diagram Assets</span>
            <span className="text-sm font-bold text-emerald-400">174 Diagrams</span>
          </div>
        </div>

        {cacheCount > 0 && (
          <button
            onClick={handleClearCache}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Clear Offline Cache
          </button>
        )}
      </div>

      {/* Review Modal for Saved Question */}
      {selectedReviewQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-blue-400">{selectedReviewQ.question.subject}</span>
                <p className="text-[10px] text-slate-400">{selectedReviewQ.question.exam_type.toUpperCase()} • {selectedReviewQ.question.year_ec ? `${selectedReviewQ.question.year_ec} E.C.` : ''}</p>
              </div>
              <button
                onClick={() => setSelectedReviewQ(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Body */}
            <div className="text-xs font-medium text-slate-200 leading-relaxed">
              <MathText content={selectedReviewQ.question.question} />
            </div>

            {/* Diagram */}
            {selectedReviewQ.question.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black/40 flex justify-center p-2">
                <img
                  src={selectedReviewQ.question.image_url}
                  alt="Diagram"
                  className="max-h-48 object-contain rounded-lg"
                />
              </div>
            )}

            {/* Correct Answer */}
            <div className="bg-emerald-950/40 border border-emerald-500/60 rounded-xl p-3">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Correct Answer: Option {selectedReviewQ.question.answer}
              </div>
              {selectedReviewQ.question.explanation && (
                <div className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  <MathText content={selectedReviewQ.question.explanation} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
