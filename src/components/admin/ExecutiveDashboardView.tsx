'use client';

import React from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Award, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Zap, 
  Clock, 
  BarChart3,
  Layers
} from 'lucide-react';
import type { ExecutiveMetricsData } from '@/app/actions/admin';

interface ExecutiveDashboardViewProps {
  data: ExecutiveMetricsData;
}

export function ExecutiveDashboardView({ data }: ExecutiveDashboardViewProps) {
  const { financials, users, ambassadors, tracks, content } = data;

  const profitMargin = financials.grossRevenueETB > 0
    ? Math.round((financials.netPlatformRevenueETB / financials.grossRevenueETB) * 100)
    : 100;

  const totalTrackUsers = tracks.entrance + tracks.freshman + tracks.exit + tracks.other;

  const entrancePct = totalTrackUsers > 0 ? Math.round((tracks.entrance / totalTrackUsers) * 100) : 0;
  const freshmanPct = totalTrackUsers > 0 ? Math.round((tracks.freshman / totalTrackUsers) * 100) : 0;
  const exitPct = totalTrackUsers > 0 ? Math.round((tracks.exit / totalTrackUsers) * 100) : 0;
  const otherPct = Math.max(0, 100 - (entrancePct + freshmanPct + exitPct));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. FINANCIAL SUMMARY HERO ────────────────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-black">
                💰
              </span>
              <h2 className="text-lg font-black text-foreground tracking-tight">
                Platform Financial Telemetry
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live revenue, ambassador commission payouts, and net profitability.
            </p>
          </div>

          {financials.pendingReceiptsCount > 0 && (
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all self-start sm:self-auto"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{financials.pendingReceiptsCount} Pending Verification</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Gross Revenue */}
          <div className="p-4 rounded-2xl bg-ground border border-border/70">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Gross Revenue
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground mt-1">
              {financials.grossRevenueETB.toLocaleString()}{' '}
              <span className="text-xs font-normal text-muted-foreground">ETB</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {financials.totalApprovedReceipts} PRO passes @ {financials.proPriceETB} ETB
            </p>
          </div>

          {/* Ambassador Commissions */}
          <div className="p-4 rounded-2xl bg-ground border border-border/70">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Commissions Paid
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400 mt-1">
              {financials.commissionsPaidETB.toLocaleString()}{' '}
              <span className="text-xs font-normal text-muted-foreground">ETB</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              50 ETB / eligible 24h recruit
            </p>
          </div>

          {/* Net Revenue */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Net Platform Profit
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
              {financials.netPlatformRevenueETB.toLocaleString()}{' '}
              <span className="text-xs font-normal text-emerald-700 dark:text-emerald-300">ETB</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-semibold">
              {profitMargin}% net margin
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="p-4 rounded-2xl bg-ground border border-border/70">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              PRO Conversion Rate
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400 mt-1">
              {users.proConversionRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {users.totalProStudents} of {users.totalStudents} students
            </p>
          </div>
        </div>

        {/* Visual Revenue Stack Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-1.5">
            <span>Financial Distribution</span>
            <span>{profitMargin}% Net Retained</span>
          </div>
          <div className="w-full h-3 rounded-full bg-ground border border-border/80 overflow-hidden flex">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${profitMargin}%` }}
              title={`Net Platform: ${financials.netPlatformRevenueETB} ETB`}
            />
            <div 
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${100 - profitMargin}%` }}
              title={`Commissions: ${financials.commissionsPaidETB} ETB`}
            />
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-2 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Net Platform Revenue ({financials.netPlatformRevenueETB.toLocaleString()} ETB)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Ambassador Payouts ({financials.commissionsPaidETB.toLocaleString()} ETB)
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. USER COHORTS & GROWTH VELOCITY ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div>
              <h3 className="text-sm font-black text-foreground">User Growth &amp; Cohorts</h3>
              <p className="text-xs text-muted-foreground">Signups and upgrade velocity.</p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View All Users</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-ground border border-border/70">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Students</span>
              <p className="text-xl font-black font-mono text-foreground mt-0.5">{users.totalStudents.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-ground border border-border/70">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">PRO Members</span>
              <p className="text-xl font-black font-mono text-amber-500 mt-0.5">{users.totalProStudents.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-xl bg-ground border border-border/70">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">7-Day Signups</span>
              <p className="text-xl font-black font-mono text-blue-600 mt-0.5">+{users.signupsLast7Days}</p>
            </div>
            <div className="p-3 rounded-xl bg-ground border border-border/70">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">7-Day PRO Upgrades</span>
              <p className="text-xl font-black font-mono text-emerald-600 mt-0.5">+{users.proUpgradesLast7Days}</p>
            </div>
          </div>

          {/* 30-Day Growth Badge */}
          <div className="p-3 rounded-xl bg-ground/50 border border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">30-Day Registration Velocity:</span>
            <span className="font-mono font-bold text-foreground">
              +{users.signupsLast30Days} students ({users.proUpgradesLast30Days} upgraded to PRO)
            </span>
          </div>
        </div>

        {/* Track Distribution (1 col) */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="pb-2 border-b border-border/60">
            <h3 className="text-sm font-black text-foreground">Curriculum Tracks</h3>
            <p className="text-xs text-muted-foreground">Student enrollment by exam target.</p>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Grade 12 Entrance</span>
                <span className="font-mono">{tracks.entrance} ({entrancePct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-ground border border-border/60 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${entrancePct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>University Freshman</span>
                <span className="font-mono">{tracks.freshman} ({freshmanPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-ground border border-border/60 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${freshmanPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>University Exit Exam</span>
                <span className="font-mono">{tracks.exit} ({exitPct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-ground border border-border/60 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${exitPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. AMBASSADOR LEADERBOARD ────────────────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-foreground">
                Campus Ambassador Network
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ambassadors.totalAmbassadors} Ambassadors registered • {ambassadors.activeAmbassadors} Active with recruits
            </p>
          </div>

          <Link
            href="/admin/managers"
            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Manage Ambassadors</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {ambassadors.topAmbassadors.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            No ambassadors with referral attributions yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/70 text-muted-foreground">
                  <th className="pb-2.5 font-bold">Ambassador</th>
                  <th className="pb-2.5 font-bold text-center">Recruits</th>
                  <th className="pb-2.5 font-bold text-center">24h PRO Upgrades</th>
                  <th className="pb-2.5 font-bold text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {ambassadors.topAmbassadors.map((amb, idx) => (
                  <tr key={amb.username} className="hover:bg-ground/50 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-ground border border-border/70 flex items-center justify-center text-[10px] font-mono text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span>@{amb.username}</span>
                    </td>
                    <td className="py-2.5 text-center font-mono font-semibold text-foreground">
                      {amb.recruits}
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      {amb.proConversions}
                    </td>
                    <td className="py-2.5 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {amb.commissionsETB.toLocaleString()} ETB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
