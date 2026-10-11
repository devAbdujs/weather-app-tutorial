import React from 'react';
import { verifyAdmin, getAdminStats, getAdminAIStats, getSuperAdminExecutiveMetrics } from '@/app/actions/admin';
import { redirect } from 'next/navigation';
import { Users, FileText, BrainCircuit, Zap, Bot, Key, Sparkles, Database, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ExecutiveDashboardView } from '@/components/admin/ExecutiveDashboardView';
import { hasPermission } from '@/lib/adminPermissions';

export default async function AdminDashboard() {
  const admin = await verifyAdmin();
  if (admin?.role === 'editor' || admin?.role === 'content_editor') {
    redirect('/admin/upload-notes');
  }
  if (admin?.role === 'ambassador') {
    redirect('/admin/ambassador');
  }

  // Fetch stats on the server
  let stats = { totalUsers: 0, totalNotes: 0, totalQuestions: 0, totalPremium: 0 };
  let aiStats: Awaited<ReturnType<typeof getAdminAIStats>> | null = null;
  let executiveData: Awaited<ReturnType<typeof getSuperAdminExecutiveMetrics>> | null = null;
  let error = null;
  
  try {
    const canReadAnalytics = hasPermission(admin, 'analytics:read');
    const [mainStats, aiData, execMetrics] = await Promise.all([
      getAdminStats(),
      getAdminAIStats().catch(() => null),
      canReadAnalytics ? getSuperAdminExecutiveMetrics().catch(() => null) : Promise.resolve(null),
    ]);
    stats = mainStats;
    aiStats = aiData;
    executiveData = execMetrics;
  } catch (err: any) {
    error = err.message;
  }

  return (
    <div className="space-y-6">
      <header className="pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Comprehensive real-time platform telemetry &amp; business metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-micro font-black uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Engine
          </span>
        </div>
      </header>

      {error && (
        <div className="p-3 bg-error/10 text-error rounded-xl font-semibold text-xs mb-4">
          Error loading stats: {error}
        </div>
      )}

      {executiveData ? (
        <ExecutiveDashboardView data={executiveData} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Students" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users className="w-5 h-5 text-tint-purple-fg" />} 
          cardClass="bg-tint-purple text-tint-purple-fg border-tint-purple-border"
          badge="Active"
        />
        <StatCard 
          title="Notes" 
          value={stats.totalNotes.toLocaleString()} 
          icon={<FileText className="w-5 h-5 text-tint-green-fg" />} 
          cardClass="bg-tint-green text-tint-green-fg border-tint-green-border"
          badge="Library"
        />
        <StatCard 
          title="Questions" 
          value={stats.totalQuestions.toLocaleString()} 
          icon={<BrainCircuit className="w-5 h-5 text-tint-peach-fg" />} 
          cardClass="bg-tint-peach text-tint-peach-fg border-tint-peach-border"
          badge="Bank"
        />
        <StatCard 
          title="PRO Users" 
          value={stats.totalPremium.toLocaleString()} 
          icon={<Zap className="w-5 h-5 text-tint-sky-fg" />} 
          cardClass="bg-tint-sky text-tint-sky-fg border-tint-sky-border"
          badge="VIP"
        />
      </div>
      )}

      {/* Gemini AI Engine Spotlight */}
      <div className="bg-tint-cream text-tint-cream-fg border border-tint-cream-border rounded-2xl p-5 shadow-xs mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-tint-cream-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-tint-cream-fg/10 text-tint-cream-fg border border-tint-cream-border flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold tracking-tight text-tint-cream-fg">
                AI Telemetry
              </h2>
            </div>
            <p className="text-xs font-medium text-tint-cream-fg/80 mt-0.5">
              Gemini key rotation, inquiry quotas, and cache savings.
            </p>
          </div>
          <Link
            href="/admin/ai"
            className="btn-3d-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white font-black text-xs transition-all shadow-tactile-xs shrink-0 active:scale-95"
          >
            <span>View Telemetry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-black/40 border-2 border-b-[4px] border-tint-cream-border shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-tint-cream-fg mb-1.5">
              <Key className="w-4 h-4 text-primary" />
              <span>Key Pool Health</span>
            </div>
            <p className="text-3xl font-black tabular-nums text-foreground">
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
            <p className="text-3xl font-black tabular-nums text-foreground">
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
            <p className="text-3xl font-black tabular-nums text-foreground">
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
