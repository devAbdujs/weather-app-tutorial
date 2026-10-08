'use client';

import React, { useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Coins, 
  Share2, 
  Copy, 
  Check, 
  Search, 
  Sparkles, 
  ArrowUpRight,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';
import type { AmbassadorDashboardData } from '@/app/actions/admin';

interface AmbassadorViewProps {
  data: AmbassadorDashboardData;
}

export function AmbassadorView({ data }: AmbassadorViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [search, setSearch] = useState('');
  const [filterExam, setFilterExam] = useState<string>('all');

  const { ambassador, referralCode, referralLink, totalRecruited, proConverted, totalEarnedETB, conversionRate, students } = data;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const promoMessage = `🎓 Join Temari AI with my campus invite! Get access to 31,000+ Ethiopian past exam questions, step-by-step AI tutoring, and curriculum notes:\n👉 ${referralLink}`;

  const handleCopyPromo = async () => {
    try {
      await navigator.clipboard.writeText(promoMessage);
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = promoMessage;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2000);
    }
  };

  const handleShareTelegram = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(
      '🎓 Study Ethiopian national & university exams with AI tutoring on Temari!'
    )}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.username || '').toLowerCase().includes(search.toLowerCase());
    const matchesExam = filterExam === 'all' || s.target_exam === filterExam;
    return matchesSearch && matchesExam;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Campus Ambassador
            </span>
            <span className="text-xs font-bold text-muted-foreground">@{ambassador.username}</span>
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Ambassador &amp; Referral Dashboard
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Track student signups, PRO conversions, and commission earnings across your campus in real time.
          </p>
        </div>

        {/* Telegram Direct Share CTA */}
        <button
          onClick={handleShareTelegram}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-xs flex items-center gap-2 shadow-tactile-sm transition-all active:scale-95"
        >
          <Share2 className="w-4 h-4" />
          <span>Share to Campus Chats</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* ── 1. REAL-TIME METRIC CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recruited */}
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Recruited Scholars</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums text-foreground">
            {totalRecruited.toLocaleString()}
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            Students registered via your code
          </p>
        </div>

        {/* PRO Members */}
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">PRO Subscriptions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg">
              👑
            </div>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums text-foreground">
            {proConverted.toLocaleString()}
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            Paid premium upgrades
          </p>
        </div>

        {/* Commission Earned */}
        <div className="bg-tint-green text-tint-green-fg border-2 border-b-[4px] border-tint-green-border rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider opacity-80">Total Earned</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 flex items-center justify-center">
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums leading-tight">
            {totalEarnedETB.toLocaleString()} <span className="text-base font-bold">ETB</span>
          </div>
          <p className="text-xs font-bold opacity-80 mt-1">
            50 ETB commission per PRO subscriber
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Conversion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums text-foreground">
            {conversionRate}%
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            Free to PRO upgrade ratio
          </p>
        </div>
      </div>

      {/* ── 2. CAMPUS INVITE LINK & PROMOTION TOOLKIT ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Link Card (2 cols) */}
        <div className="lg:col-span-2 bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-6 shadow-tactile-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">Your Campus Referral Link</h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                Share this unique link with students in your department, college dorms, and study channels.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-ground border border-border text-foreground">
              Code: <strong className="text-blue-600 dark:text-blue-400">ref_{referralCode}</strong>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 bg-ground border border-border rounded-2xl p-2 pl-4">
            <span className="text-xs font-mono text-muted-foreground truncate flex-1 select-all font-semibold w-full sm:w-auto">
              {referralLink}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-tactile-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="px-4 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1f8ec4] text-white text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-tactile-xs"
                title="Forward to Telegram"
              >
                <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs font-medium text-foreground flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200">How You Earn as an Ambassador:</p>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                When students register through your link, they connect to your campus network. For every student who subscribes to <strong>Temari PRO (199 ETB)</strong>, you earn a <strong>50 ETB direct commission</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Promo Message Card (1 col) */}
        <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-3xl p-6 shadow-tactile-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-blue-600" />
              <h2 className="text-base font-black text-foreground tracking-tight">Quick Campus Post</h2>
            </div>
            <p className="text-xs text-muted-foreground font-medium mb-3">
              Ready-to-send promotional message for Telegram groups:
            </p>
            <div className="p-3.5 rounded-xl bg-ground border border-border text-xs text-muted-foreground font-sans leading-relaxed select-all">
              {promoMessage}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPromo}
            className={`w-full py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-tactile-xs ${
              copiedPromo
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            {copiedPromo ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Copied Message!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Copy Promo Blurb</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 3. RECRUITED STUDENTS TABLE ───────────────────────────────── */}
      <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-3xl shadow-tactile-sm overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="p-5 border-b border-border/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black text-foreground">
              Recruited Students ({filteredStudents.length})
            </h2>
            <span className="text-xs font-mono text-muted-foreground bg-ground px-2 py-0.5 rounded-full border border-border">
              Real-time
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-ground border border-border font-medium text-foreground focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 outline-none transition-all"
              />
            </div>

            {/* Filter Exam */}
            <select
              value={filterExam}
              onChange={e => setFilterExam(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-ground border border-border font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Tracks</option>
              <option value="entrance">Grade 12 Matric</option>
              <option value="freshman">University Freshman</option>
              <option value="exit">Exit Exam</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-ground/50 border-b border-border/80">
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Student</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Exam Track</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Membership Status</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-muted-foreground text-sm font-medium">
                    {search || filterExam !== 'all' ? (
                      'No students match your filter.'
                    ) : (
                      <div className="max-w-sm mx-auto space-y-2">
                        <Users className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                        <p className="font-bold text-foreground">No students recruited yet</p>
                        <p className="text-xs">Share your referral link on Telegram to start recruiting students from your campus!</p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isPro = student.subscription_status === 'premium';
                  const examLabel = 
                    student.target_exam === 'entrance' ? 'Grade 12 EUEE' :
                    student.target_exam === 'freshman' ? 'Univ Freshman' :
                    student.target_exam === 'exit' ? 'Exit Exam' : 'National Exam';

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-border/40 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 font-black text-sm flex items-center justify-center">
                            {(student.full_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm leading-tight">
                              {student.full_name || 'Scholar'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              @{student.username || 'student'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-xs font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-muted" />
                          <span>{examLabel}</span>
                          {student.stream && (
                            <span className="text-muted-foreground">• {student.stream}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            <span>👑</span>
                            <span>PRO Member (+50 ETB)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-ground border border-border text-muted-foreground">
                            <span>Free Tier</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs font-mono text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
