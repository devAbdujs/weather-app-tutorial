import React from 'react';
import { getAdminStats, getAdminAIStats } from '@/app/actions/admin';
import { Users, FileText, BrainCircuit, Zap, Bot, Key, Sparkles, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  // Fetch stats on the server
  let stats = { totalUsers: 0, totalNotes: 0, totalQuestions: 0, totalPremium: 0 };
  let aiStats: Awaited<ReturnType<typeof getAdminAIStats>> | null = null;
  let error = null;
  
  try {
    const [mainStats, aiData] = await Promise.all([
      getAdminStats(),
      getAdminAIStats().catch(() => null)
    ]);
    stats = mainStats;
    aiStats = aiData;
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Overview Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Welcome back. Here is what is happening across the platform.</p>
      </header>

      {error && (
        <div className="p-4 bg-error/10 text-error rounded-xl font-bold mb-8">
          Error loading stats: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users className="w-7 h-7 text-primary" />} 
          color="bg-primary/10"
        />
        <StatCard 
          title="Study Notes" 
          value={stats.totalNotes.toLocaleString()} 
          icon={<FileText className="w-7 h-7 text-[hsl(145,42%,38%)]" />} 
          color="bg-[hsl(145,42%,38%)]/10"
        />
        <StatCard 
          title="Exam Questions" 
          value={stats.totalQuestions.toLocaleString()} 
          icon={<BrainCircuit className="w-7 h-7 text-[hsl(36,58%,42%)]" />} 
          color="bg-[hsl(36,58%,42%)]/10"
        />
        <StatCard 
          title="Premium Users" 
          value={stats.totalPremium.toLocaleString()} 
          icon={<Zap className="w-7 h-7 text-[hsl(268,40%,48%)]" />} 
          color="bg-[hsl(268,40%,48%)]/10"
        />
      </div>

      {/* Gemini AI Engine Spotlight */}
      <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 md:p-8 shadow-bespoke-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                Gemini &amp; AI Operations Engine
              </h2>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
              Live telemetry for Gemini 3.6 Flash key rotation, student inquiry quotas, and cache savings.
            </p>
          </div>
          <Link
            href="/admin/ai"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-bespoke-sm shrink-0"
          >
            <span>Open AI Telemetry</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-ground/50 border border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <Key className="w-4 h-4 text-accent" />
              <span>Key Pool Health</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 tabular-nums">
              {aiStats?.keyDetails.activeKeys ?? 0} / {aiStats?.keyDetails.totalKeys ?? 0}
            </p>
            <p className="text-[11px] font-semibold text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[hsl(145,42%,38%)] animate-pulse" />
              All configured keys active
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-ground/50 border border-primary/10">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Weekly Inquiries</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {aiStats?.usage.totalWeeklyInquiries.toLocaleString() ?? '0'}
            </p>
            <p className="text-[11px] font-semibold text-gray-400 mt-1">
              {aiStats?.usage.activeAiUsersCount ?? 0} students used AI this cycle
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-ground/50 border border-primary/10">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              <Database className="w-4 h-4 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)]" />
              <span>Cache Savings</span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {aiStats?.cache.totalCached.toLocaleString() ?? '0'}
            </p>
            <p className="text-[11px] font-semibold text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] mt-1">
              ~{((aiStats?.cache.estimatedTokensSaved ?? 0) / 1000).toFixed(1)}k tokens served free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-4xl font-black text-gray-900 dark:text-gray-100 leading-none">{value}</p>
      </div>
    </div>
  );
}
