'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Coins, 
  Share2, 
  Copy, 
  Check, 
  Search, 
  TrendingUp, 
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

  const promoMessage = `📚 Practice 31,000+ Ethiopian past exams with AI tutoring on Temari:\n👉 ${referralLink}`;

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
      '📚 Study Ethiopian national & university exams with AI tutoring on Temari!'
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
    <div className="space-y-6 animate-fade-in">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Campus Ambassador
            </h1>
            <span className="text-xs font-mono font-medium text-muted-foreground px-2 py-0.5 rounded-md bg-ground border border-border">
              @{ambassador.username}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Campus student referrals and commission.
          </p>
        </div>

        <button
          onClick={handleShareTelegram}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs transition-all shadow-xs shrink-0 self-start sm:self-auto active:scale-[0.98]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share to Telegram</span>
        </button>
      </header>

      {/* ── 1. METRICS ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Recruits */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Recruits</span>
            <Users className="w-4 h-4 text-muted-foreground/70" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
            {totalRecruited.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Total signups
          </p>
        </div>

        {/* PRO Conversions */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">PRO Members</span>
            <span className="text-xs">👑</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
            {proConverted.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Paid upgrades
          </p>
        </div>

        {/* Total Earned */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Commission</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
            {totalEarnedETB.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ETB</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            50 ETB per PRO
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Conversion</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
            {conversionRate}%
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            PRO rate
          </p>
        </div>
      </div>

      {/* ── 2. INVITE & PROMO ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Referral Link (2 cols) */}
        <div className="lg:col-span-2 bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Your Link</h2>
              <p className="text-[11px] text-muted-foreground">Earn 50 ETB for each PRO upgrade.</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground bg-ground px-2 py-0.5 rounded border border-border">
              ref_{referralCode}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 bg-ground border border-border/80 rounded-xl p-1 pl-3">
            <span className="text-xs font-mono text-foreground/80 truncate flex-1 select-all w-full sm:w-auto font-medium">
              {referralLink}
            </span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-xs active:scale-95 ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-black/5 dark:hover:bg-white/5 text-foreground text-xs font-medium transition-all flex items-center gap-1 active:scale-95"
                title="Share on Telegram"
              >
                <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Promo Copy (1 col) */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-2.5">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-0.5">Promo Copy</h2>
            <div className="p-2 rounded-lg bg-ground border border-border/80 text-[11px] text-muted-foreground leading-relaxed line-clamp-2 select-all">
              {promoMessage}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPromo}
            className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-xs active:scale-[0.99] ${
              copiedPromo
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
            }`}
          >
            {copiedPromo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPromo ? 'Copied' : 'Copy Promo'}</span>
          </button>
        </div>
      </div>

      {/* ── 3. RECRUITS TABLE ───────────────────────────────────────────── */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3.5 border-b border-border/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-ground/30">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Students
            </h2>
            <span className="text-xs font-mono text-muted-foreground bg-ground px-1.5 py-0.2 rounded border border-border">
              {filteredStudents.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg bg-ground border border-border text-foreground focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <select
              value={filterExam}
              onChange={e => setFilterExam(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg bg-ground border border-border text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Tracks</option>
              <option value="entrance">Grade 12</option>
              <option value="freshman">Freshman</option>
              <option value="exit">Exit Exam</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-ground/40 border-b border-border/70">
                <th className="p-3 font-semibold text-muted-foreground text-xs">Student</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs">Track</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs">Status</th>
                <th className="p-3 font-semibold text-muted-foreground text-xs text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs">
                    {search || filterExam !== 'all' ? 'No matching students.' : 'No recruits yet.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isPro = student.subscription_status === 'premium';
                  const examLabel = 
                    student.target_exam === 'entrance' ? 'Grade 12' :
                    student.target_exam === 'freshman' ? 'Freshman' :
                    student.target_exam === 'exit' ? 'Exit Exam' : 'General';

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-border/40 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {(student.full_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs leading-tight">
                              {student.full_name || 'Scholar'}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              @{student.username || 'student'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-xs text-foreground">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <BookOpen className="w-3 h-3" />
                          <span className="font-medium text-foreground">{examLabel}</span>
                          {student.stream && (
                            <span className="text-[11px] text-muted-foreground">• {student.stream}</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        {isPro ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                            <span>👑</span>
                            <span>PRO (+50 ETB)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-ground border border-border text-muted-foreground">
                            Free
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-xs font-mono text-muted-foreground text-right">
                        {new Date(student.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
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
