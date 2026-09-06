'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Clock, 
  Loader2
} from 'lucide-react';
import { Question } from '@/types';
import { useTelegram } from '@/hooks/useTelegram';

interface QuickPracticeViewProps {
  onStartExam: (config: {
    examType: string;
    subject: string;
    year?: number;
    isSimulator: boolean;
    questions: Question[];
    title: string;
  }) => void;
}

export const QuickPracticeView: React.FC<QuickPracticeViewProps> = ({ onStartExam }) => {
  const { haptic } = useTelegram();
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null);

  const handleLaunchQuickDrill = async (
    examType: string, 
    title: string, 
    limit: number,
    isSimulator = false
  ) => {
    haptic.impact('medium');
    setLoadingTrack(examType);

    try {
      const res = await fetch(`/api/questions?examType=${examType}&limit=${limit}&random=true`);
      const data = await res.json();

      if (data.success && data.questions && data.questions.length > 0) {
        onStartExam({
          examType,
          subject: 'Mixed Drill',
          isSimulator,
          questions: data.questions,
          title,
        });
      } else {
        alert('Could not generate drill. Please try another track.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to question vault.');
    } finally {
      setLoadingTrack(null);
    }
  };

  const drills = [
    {
      id: 'entrance',
      title: 'Grade 12 National Blitz',
      subtitle: '25 random past questions across Grade 12 national exams',
      badge: 'Most Popular',
      icon: <GraduationCap className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-950/20',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20',
      questionsCount: 25,
      examType: 'entrance',
    },
    {
      id: 'freshman',
      title: 'University Freshman Rapid Fire',
      subtitle: '20 Common Course questions: Physics, Logic, Calculus, Tech',
      badge: 'University Tier',
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
      questionsCount: 20,
      examType: 'freshman',
    },
    {
      id: 'exit',
      title: 'Exit Exam Licensing Mock',
      subtitle: '25 cross-discipline university exit exam questions',
      badge: 'Graduation Prep',
      icon: <Award className="w-5 h-5 text-purple-400" />,
      color: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-950/20',
      btnColor: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20',
      questionsCount: 25,
      examType: 'exit',
    },
    {
      id: 'grade8',
      title: 'Grade 8 Ministry Sprint',
      subtitle: '20 regional assessment questions for primary graduation',
      badge: 'Regional Level',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-950/20',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20',
      questionsCount: 20,
      examType: 'grade8',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 max-w-md mx-auto p-4 pt-6 space-y-5">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/20">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Quick Practice Drills</h1>
            <p className="text-xs text-slate-400">One-tap curated mock sets for high-speed practice</p>
          </div>
        </div>
      </div>

      {/* Drill Cards */}
      <div className="space-y-3">
        {drills.map((d) => {
          const isLoading = loadingTrack === d.id;
          return (
            <div
              key={d.id}
              className={`rounded-2xl border p-4.5 transition-all duration-150 shadow-md ${d.color}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    {d.icon}
                  </div>
                  <div>
                    <span className="text-[9px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-slate-700/60">
                      {d.badge}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{d.title}</h3>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                {d.subtitle}
              </p>

              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={() => handleLaunchQuickDrill(d.examType, d.title, d.questionsCount, false)}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg ${d.btnColor} disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Instant Practice
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleLaunchQuickDrill(d.examType, `${d.title} (Timed)`, d.questionsCount, true)}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  Timed (45m)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
