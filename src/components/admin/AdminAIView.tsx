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
        <div className="fixed top-6 right-6 z-50 bg-accent-emerald text-white px-5 py-3 rounded-2xl shadow-tactile-md flex items-center gap-2 font-bold animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Bot className="w-4 h-4 text-accent" />
            <span>AI Operations &amp; Engine</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Gemini &amp; AI Usage Telemetry
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
            Real-time tracking of Gemini model calls, key rotation pool, student quotas, and cache savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-accent/15 text-accent border border-accent/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-tactile-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Gemini 3.6 Flash
          </span>
          <span className="px-3.5 py-1.5 rounded-xl bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-tactile-sm">
            <Zap className="w-3.5 h-3.5" />
            {stats.keyDetails.activeKeys}/{stats.keyDetails.totalKeys} Keys Active
          </span>
        </div>
      </header>

      {/* Top Metric Cards with Centralized Pastel Tokens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-tint-peach text-tint-peach-fg border-2 border-b-[4px] border-tint-peach-border rounded-3xl p-6 shadow-tactile-xs flex items-center gap-5 hover:-translate-y-0.5 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black/30 border border-white/60 dark:border-white/10 text-tint-peach-fg flex items-center justify-center shrink-0 shadow-2xs">
            <Bot className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1">
              Weekly Inquiries
            </p>
            <p className="text-3xl font-black leading-none tabular-nums">
              {stats.usage.totalWeeklyInquiries.toLocaleString()}
            </p>
            <p className="text-caption font-bold text-tint-peach-fg mt-1">
              Across {stats.usage.activeAiUsersCount} active students
            </p>
          </div>
        </div>

        <div className="bg-tint-green text-tint-green-fg border-2 border-b-[4px] border-tint-green-border rounded-3xl p-6 shadow-tactile-xs flex items-center gap-5 hover:-translate-y-0.5 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black/30 border border-white/60 dark:border-white/10 text-tint-green-fg flex items-center justify-center shrink-0 shadow-2xs">
            <Database className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1">
              Cached Answers
            </p>
            <p className="text-3xl font-black leading-none tabular-nums">
              {stats.cache.totalCached.toLocaleString()}
            </p>
            <p className="text-caption font-black text-emerald-800 dark:text-emerald-200 mt-1">
              ~{(stats.cache.estimatedTokensSaved / 1000).toFixed(1)}k tokens (0 Cost)
            </p>
          </div>
        </div>

        <div className="bg-tint-rose text-tint-rose-fg border-2 border-b-[4px] border-tint-rose-border rounded-3xl p-6 shadow-tactile-xs flex items-center gap-5 hover:-translate-y-0.5 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black/30 border border-white/60 dark:border-white/10 text-tint-rose-fg flex items-center justify-center shrink-0 shadow-2xs">
            <Camera className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1">
              Receipts Scanned
            </p>
            <p className="text-3xl font-black leading-none tabular-nums">
              {stats.vision.totalScanned.toLocaleString()}
            </p>
            <p className="text-caption font-black text-rose-800 dark:text-rose-200 mt-1">
              {stats.vision.flaggedCount} flagged suspicious
            </p>
          </div>
        </div>

        <div className="bg-tint-sky text-tint-sky-fg border-2 border-b-[4px] border-tint-sky-border rounded-3xl p-6 shadow-tactile-xs flex items-center gap-5 hover:-translate-y-0.5 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black/30 border border-white/60 dark:border-white/10 text-tint-sky-fg flex items-center justify-center shrink-0 shadow-2xs">
            <Key className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider mb-1">
              Pool Throughput
            </p>
            <p className="text-3xl font-black leading-none tabular-nums">
              {rpmCapacity} <span className="text-lg font-black text-tint-sky-fg">RPM</span>
            </p>
            <p className="text-caption font-bold text-tint-sky-fg mt-1">
              ~{dailyCapacity.toLocaleString()} requests/day
            </p>
          </div>
        </div>
      </div>

      {/* Gemini Key Pool Telemetry */}
      <div className="bg-tint-cream text-tint-cream-fg border-2 border-b-[4px] border-tint-cream-border rounded-3xl p-6 md:p-8 shadow-tactile-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-tint-cream-border/50">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black tracking-tight">
                Gemini Key Rotation Pool ({stats.keyDetails.totalKeys} Keys Configured)
              </h2>
            </div>
            <p className="text-sm font-bold text-tint-cream-fg mt-1">
              Round-robin load balancer dynamically distributes AI Tutor requests with automatic 60s 429 backoff.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-200 bg-white dark:bg-black/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {stats.keyDetails.activeKeys} Ready
            </div>
            {stats.keyDetails.coolingDownKeys > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-200 bg-white dark:bg-black/40 px-3 py-1.5 rounded-full border border-amber-500/30">
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
              className={`p-4 rounded-2xl border-2 border-b-[3px] transition-all shadow-2xs ${
                k.status === 'ready' 
                  ? 'border-emerald-500/40 bg-white dark:bg-black/40 text-gray-900 dark:text-gray-100 hover:border-emerald-500' 
                  : 'border-amber-500/40 bg-tint-peach text-tint-peach-fg'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  Key #{k.index}
                </span>
                {k.status === 'ready' ? (
                  <span className="inline-flex items-center gap-1 text-micro font-black text-emerald-800 dark:text-emerald-200 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-micro font-black text-amber-800 dark:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> Cooldown ({k.cooldownRemainingSeconds}s)
                  </span>
                )}
              </div>
              <p className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                {k.maskedKey}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Student Quota & Weekly Usage Table */}
      <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-3xl shadow-tactile-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-black/[0.08] dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-accent" />
              Student AI Inquiries &amp; Weekly Quota ({filteredUsers.length})
            </h2>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">
              Free students are capped at 5/week; Premium students get 150/week.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search student name or @user..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-ground border-2 border-black/[0.08] dark:border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-all shadow-2xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ground/50 border-b border-black/[0.06] dark:border-white/[0.08]">
                <th className="p-4 font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">Student</th>
                <th className="p-4 font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">Plan</th>
                <th className="p-4 font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">Weekly Inquiries</th>
                <th className="p-4 font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs">Quota Burn</th>
                <th className="p-4 font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm font-bold text-gray-600 dark:text-gray-400">
                    No active student AI usage found for this cycle.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isPrem = user.subscription_status === 'premium';
                  const maxQuota = isPrem ? 150 : 5;
                  const percent = Math.min(100, Math.round((user.ai_weekly_usage / maxQuota) * 100));

                  return (
                    <tr key={user.telegram_id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isPrem ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'
                          }`}>
                            {user.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                              {user.full_name || 'Unknown Student'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono font-medium">
                              @{user.username || user.telegram_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                          isPrem 
                            ? 'bg-accent/15 text-accent border border-accent/20' 
                            : 'bg-black/5 dark:bg-white/10 text-gray-800 dark:text-gray-200'
                        }`}>
                          {isPrem && <Award className="w-3 h-3 text-accent" />}
                          {user.subscription_status}
                        </span>
                      </td>

                      <td className="p-4 font-mono font-black text-sm text-gray-900 dark:text-gray-100 tabular-nums">
                        {user.ai_weekly_usage} <span className="text-gray-600 dark:text-gray-400 text-xs font-bold">/ {maxQuota}</span>
                      </td>

                      <td className="p-4 w-44">
                        <div className="w-full bg-black/10 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ease-bespoke rounded-full ${
                              percent > 85 ? 'bg-error' : percent > 50 ? 'bg-accent-gold' : 'bg-primary'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-micro font-black text-gray-700 dark:text-gray-300 mt-1 text-right font-mono tabular-nums">{percent}% used</p>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleReset(user.telegram_id, user.full_name || 'Student')}
                          disabled={resettingId === user.telegram_id || user.ai_weekly_usage === 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-b-[3px] border-black/[0.08] dark:border-white/[0.08] text-xs font-black text-gray-900 dark:text-gray-100 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all duration-150 shadow-2xs"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 stroke-[2.5] ${resettingId === user.telegram_id ? 'animate-spin' : ''}`} />
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
        <div className="bg-tint-purple text-tint-purple-fg border-2 border-b-[4px] border-tint-purple-border rounded-3xl p-6 shadow-tactile-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-tint-purple-border">
            <h3 className="font-black text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-tint-purple-fg stroke-[2.2]" />
              Recent Vision Verifications
            </h3>
            <span className="text-xs font-black uppercase tracking-wider text-tint-purple-fg">Latest {stats.vision.recentScans.length}</span>
          </div>

          <div className="space-y-3">
            {stats.vision.recentScans.length === 0 ? (
              <p className="text-xs font-bold py-6 text-center text-tint-purple-fg">No receipts processed with Gemini Vision yet.</p>
            ) : (
              stats.vision.recentScans.slice(0, 5).map(s => (
                <div key={s.id} className="p-3.5 rounded-2xl bg-white dark:bg-black/40 border-2 border-b-[3px] border-tint-purple-border flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                        {s.gemini_amount || 'Unrecognized amount'}
                      </span>
                      {s.gemini_flagged && (
                        <span className="text-micro font-black px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                          Suspicious
                        </span>
                      )}
                    </div>
                    <p className="text-caption font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                      Sender: {s.gemini_sender || 'Unknown'} · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-micro font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    s.status === 'approved' ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Cache Entries */}
        <div className="bg-tint-sky text-tint-sky-fg border-2 border-b-[4px] border-tint-sky-border rounded-3xl p-6 shadow-tactile-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-tint-sky-border">
            <h3 className="font-black text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-tint-sky-fg stroke-[2.2]" />
              Cached Question Explanations
            </h3>
            <span className="text-xs font-black uppercase tracking-wider text-tint-sky-fg">Total: {stats.cache.totalCached}</span>
          </div>

          <div className="space-y-3">
            {stats.cache.recentEntries.length === 0 ? (
              <p className="text-xs font-bold py-6 text-center text-tint-sky-fg">No AI explanations cached yet.</p>
            ) : (
              stats.cache.recentEntries.slice(0, 5).map((c, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-black/40 border-2 border-b-[3px] border-tint-sky-border flex items-center justify-between gap-3 shadow-2xs">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 dark:text-gray-100 truncate">
                      Q: {c.question_id}
                    </p>
                    <p className="text-caption font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                      Type: <span className="font-mono font-black text-primary">{c.prompt_type}</span> · Cached: {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-micro font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
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
