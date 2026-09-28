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
        <p className="text-gray-700 dark:text-gray-300 font-bold mt-1">Welcome back. Here is what is happening across the platform.</p>
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
          icon={<Users className="w-7 h-7 text-tint-purple-fg" />} 
          cardClass="bg-tint-purple text-tint-purple-fg border-tint-purple-border"
          badge="Active Students"
        />
        <StatCard 
          title="Study Notes" 
          value={stats.totalNotes.toLocaleString()} 
          icon={<FileText className="w-7 h-7 text-tint-green-fg" />} 
          cardClass="bg-tint-green text-tint-green-fg border-tint-green-border"
          badge="Curated Library"
        />
        <StatCard 
          title="Exam Questions" 
          value={stats.totalQuestions.toLocaleString()} 
          icon={<BrainCircuit className="w-7 h-7 text-tint-peach-fg" />} 
          cardClass="bg-tint-peach text-tint-peach-fg border-tint-peach-border"
          badge="EUEE & Freshman"
        />
        <StatCard 
          title="Premium Users" 
          value={stats.totalPremium.toLocaleString()} 
          icon={<Zap className="w-7 h-7 text-tint-sky-fg" />} 
          cardClass="bg-tint-sky text-tint-sky-fg border-tint-sky-border"
          badge="VIP Subscribers"
        />
      </div>

      {/* Gemini AI Engine Spotlight */}
      <div className="bg-tint-cream text-tint-cream-fg border-2 border-b-[4px] border-tint-cream-border rounded-3xl p-6 md:p-8 shadow-tactile-sm mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-tint-cream-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-tint-cream-fg">
                Gemini &amp; AI Operations Engine
              </h2>
            </div>
            <p className="text-sm font-bold text-tint-cream-fg mt-1">
              Live telemetry for Gemini 3.6 Flash key rotation, student inquiry quotas, and cache savings.
            </p>
          </div>
          <Link
            href="/admin/ai"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary hover:bg-orange-600 active:translate-y-0.5 active:border-b-2 text-white font-black text-xs uppercase tracking-wider transition-all border-2 border-b-[4px] border-orange-700 shadow-md shadow-orange-500/20 shrink-0"
          >
            <span>Open AI Telemetry</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-black/40 border-2 border-b-[4px] border-tint-cream-border shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-tint-cream-fg mb-1.5">
              <Key className="w-4 h-4 text-primary" />
              <span>Key Pool Health</span>
            </div>
            <p className="text-3xl font-black tabular-nums text-gray-950 dark:text-white">
              {aiStats?.keyDetails.activeKeys ?? 0} / {aiStats?.keyDetails.totalKeys ?? 0}
            </p>
            <p className="text-caption font-black text-emerald-700 dark:text-emerald-300 mt-1.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              All configured keys active
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-black/40 border-2 border-b-[4px] border-tint-cream-border shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-tint-cream-fg mb-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Weekly Inquiries</span>
            </div>
            <p className="text-3xl font-black tabular-nums text-gray-950 dark:text-white">
              {aiStats?.usage.totalWeeklyInquiries.toLocaleString() ?? '0'}
            </p>
            <p className="text-caption font-bold text-gray-700 dark:text-gray-300 mt-1.5">
              {aiStats?.usage.activeAiUsersCount ?? 0} students queried Teme
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-black/40 border-2 border-b-[4px] border-tint-cream-border shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-tint-cream-fg mb-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Cache Savings</span>
            </div>
            <p className="text-3xl font-black tabular-nums text-gray-950 dark:text-white">
              {aiStats?.cache.totalCached.toLocaleString() ?? '0'}
            </p>
            <p className="text-caption font-black text-emerald-700 dark:text-emerald-300 mt-1.5">
              ~{((aiStats?.cache.estimatedTokensSaved ?? 0) / 1000).toFixed(1)}k tokens served free
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  cardClass, 
  badge 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  cardClass: string; 
  badge: string;
}) {
  return (
    <div className={`border-2 border-b-[4px] rounded-3xl p-6 flex flex-col justify-between shadow-tactile-xs hover:-translate-y-0.5 active:translate-y-0 transition-all ${cardClass}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="w-13 h-13 rounded-2xl bg-white dark:bg-black/30 border border-white/60 dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs">
          {icon}
        </div>
        <span className="text-micro font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/40 border border-current/20 shadow-2xs">
          {badge}
        </span>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl md:text-4xl font-black tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
}
