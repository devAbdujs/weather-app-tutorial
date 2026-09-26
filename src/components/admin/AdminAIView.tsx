'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Key, 
  Sparkles, 
  Zap, 
  Database, 
  Camera, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert,
  Clock,
  Search,
  Flame,
  Award
} from 'lucide-react';
import { resetUserAIQuota } from '@/app/actions/admin';

interface AdminAIViewProps {
  stats: {
    keyDetails: {
      totalKeys: number;
      activeKeys: number;
      coolingDownKeys: number;
      keys: Array<{
        index: number;
        maskedKey: string;
        status: 'ready' | 'cooling_down';
        cooldownRemainingSeconds: number;
      }>;
    };
    usage: {
      totalWeeklyInquiries: number;
      freeTierInquiries: number;
      premiumTierInquiries: number;
      activeAiUsersCount: number;
      topAiUsers: Array<{
        telegram_id: string;
        full_name: string | null;
        username: string | null;
        subscription_status: string;
        ai_weekly_usage: number;
        ai_quota_reset_at: string | null;
        created_at: string;
      }>;
    };
    cache: {
      totalCached: number;
      recentEntries: Array<{
        question_id: string;
        prompt_type: string;
        created_at: string;
      }>;
      estimatedTokensSaved: number;
    };
    vision: {
      totalScanned: number;
      flaggedCount: number;
      recentScans: Array<{
        id: string;
        gemini_amount: string | null;
        gemini_sender: string | null;
        gemini_flagged: boolean | null;
        status: string;
        created_at: string;
      }>;
    };
  };
}

export function AdminAIView({ stats }: AdminAIViewProps) {
  const [userList, setUserList] = useState(stats.usage.topAiUsers);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleReset = async (telegramId: string, name: string) => {
    if (!confirm(`Are you sure you want to reset AI weekly quota for ${name}?`)) return;

    setResettingId(telegramId);
    try {
      await resetUserAIQuota(telegramId);
      setUserList(prev => prev.map(u => u.telegram_id === telegramId ? { ...u, ai_weekly_usage: 0 } : u));
      setToastMessage(`Successfully reset quota for ${name}!`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      alert(`Failed to reset: ${err.message}`);
    } finally {
      setResettingId(null);
    }
  };

  const filteredUsers = userList.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.telegram_id.includes(q)
    );
  });

  const dailyCapacity = stats.keyDetails.totalKeys * 1500;
  const rpmCapacity = stats.keyDetails.totalKeys * 15;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Bot className="w-4 h-4 text-accent-gold" />
            <span>AI Operations & Engine</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Gemini & AI Usage Telemetry
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
            Real-time tracking of Gemini model calls, key rotation pool, student quotas, and cache savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-accent-gold/15 text-accent-gold border border-accent-gold/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini 3.6 Flash
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            {stats.keyDetails.activeKeys}/{stats.keyDetails.totalKeys} Keys Active
          </span>
        </div>
      </header>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Weekly AI Inquiries
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">
              {stats.usage.totalWeeklyInquiries.toLocaleString()}
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-1">
              Across {stats.usage.activeAiUsersCount} active students
            </p>
          </div>
        </div>

        <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center shrink-0">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Cached Answers
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">
              {stats.cache.totalCached.toLocaleString()}
            </p>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              ~{(stats.cache.estimatedTokensSaved / 1000).toFixed(1)}k tokens saved (0 Cost)
            </p>
          </div>
        </div>

        <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Receipts Scanned
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">
              {stats.vision.totalScanned.toLocaleString()}
            </p>
            <p className="text-[11px] font-semibold text-rose-500 mt-1">
              {stats.vision.flaggedCount} flagged suspicious
            </p>
          </div>
        </div>

        <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 text-accent-gold flex items-center justify-center shrink-0">
            <Key className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Pool Throughput
            </p>
            <p className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-none">
              {rpmCapacity} <span className="text-lg font-bold text-gray-400">RPM</span>
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-1">
              ~{dailyCapacity.toLocaleString()} requests/day capacity
            </p>
          </div>
        </div>
      </div>

      {/* Gemini Key Pool Telemetry */}
      <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-primary/10">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-accent-gold" />
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Gemini Key Rotation Pool ({stats.keyDetails.totalKeys} Keys Configured)
              </h2>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
              Round-robin load balancer dynamically distributes AI Tutor requests with automatic 60s 429 backoff.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {stats.keyDetails.activeKeys} Ready
            </div>
            {stats.keyDetails.coolingDownKeys > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                {stats.keyDetails.coolingDownKeys} Cooling Down
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {stats.keyDetails.keys.map(k => (
            <div 
              key={k.index} 
              className={`p-4 rounded-2xl border transition-all ${
                k.status === 'ready' 
                  ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40' 
                  : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Key #{k.index}
                </span>
                {k.status === 'ready' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3" /> Cooldown ({k.cooldownRemainingSeconds}s)
                  </span>
                )}
              </div>
              <p className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate">
                {k.maskedKey}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Student Quota & Weekly Usage Table */}
      <div className="bg-card border-2 border-primary/10 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent-rose" />
              Student AI Inquiries & Weekly Quota ({filteredUsers.length})
            </h2>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
              Free students are capped at 5/week; Premium students get 150/week.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search student name or @user..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-ground border border-primary/15 rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ground/50 border-b border-primary/10">
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Student</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Plan</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Weekly Inquiries</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Quota Burn</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm font-semibold text-gray-400">
                    No active student AI usage found for this cycle.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isPrem = user.subscription_status === 'premium';
                  const maxQuota = isPrem ? 150 : 5;
                  const percent = Math.min(100, Math.round((user.ai_weekly_usage / maxQuota) * 100));

                  return (
                    <tr key={user.telegram_id} className="border-b border-primary/5 hover:bg-ground/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isPrem ? 'bg-violet-500/10 text-violet-600' : 'bg-accent-blue/10 text-accent-blue'
                          }`}>
                            {user.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                              {user.full_name || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-gray-400">
                              @{user.username || user.telegram_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                          isPrem 
                            ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20' 
                            : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-black/5'
                        }`}>
                          {isPrem && <Award className="w-3 h-3 text-violet-500" />}
                          {user.subscription_status}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                          {user.ai_weekly_usage} <span className="text-gray-400 text-xs font-normal">/ {maxQuota}</span>
                        </p>
                      </td>

                      <td className="p-4 w-44">
                        <div className="w-full bg-black/5 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 rounded-full ${
                              percent > 85 ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-primary'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 text-right">{percent}% used</p>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleReset(user.telegram_id, user.full_name || 'Student')}
                          disabled={resettingId === user.telegram_id || user.ai_weekly_usage === 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/15 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${resettingId === user.telegram_id ? 'animate-spin' : ''}`} />
                          <span>Reset</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Recent Vision Scans & Cache Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gemini Vision Scans */}
        <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/10">
            <h3 className="font-black text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-purple-500" />
              Recent Gemini Vision Verifications
            </h3>
            <span className="text-xs font-bold text-gray-400">Latest {stats.vision.recentScans.length}</span>
          </div>

          <div className="space-y-3">
            {stats.vision.recentScans.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No receipts processed with Gemini Vision yet.</p>
            ) : (
              stats.vision.recentScans.slice(0, 5).map(s => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-ground/60 border border-primary/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                        {s.gemini_amount || 'Unrecognized amount'}
                      </span>
                      {s.gemini_flagged && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          Suspicious
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Sender: {s.gemini_sender || 'Unknown'} · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Cache Entries */}
        <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/10">
            <h3 className="font-black text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Cached Question Explanations
            </h3>
            <span className="text-xs font-bold text-gray-400">Total: {stats.cache.totalCached}</span>
          </div>

          <div className="space-y-3">
            {stats.cache.recentEntries.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No AI explanations cached yet.</p>
            ) : (
              stats.cache.recentEntries.slice(0, 5).map((c, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-ground/60 border border-primary/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                      Q: {c.question_id}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Type: <span className="font-mono text-primary font-bold">{c.prompt_type}</span> · Cached: {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                    0 Tokens
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
