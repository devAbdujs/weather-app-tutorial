import React from 'react';
import { getAdminStats } from '@/app/actions/admin';
import { Users, FileText, BrainCircuit, Zap } from 'lucide-react';

export default async function AdminDashboard() {
  // Fetch stats on the server
  let stats = { totalUsers: 0, totalNotes: 0, totalQuestions: 0, totalPremium: 0 };
  let error = null;
  
  try {
    stats = await getAdminStats();
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
          icon={<Users className="w-8 h-8 text-accent-blue" />} 
          color="bg-accent-blue/10"
        />
        <StatCard 
          title="Study Notes" 
          value={stats.totalNotes.toLocaleString()} 
          icon={<FileText className="w-8 h-8 text-accent-emerald" />} 
          color="bg-accent-emerald/10"
        />
        <StatCard 
          title="Exam Questions" 
          value={stats.totalQuestions.toLocaleString()} 
          icon={<BrainCircuit className="w-8 h-8 text-accent-gold" />} 
          color="bg-accent-gold/10"
        />
        <StatCard 
          title="Premium Users" 
          value={stats.totalPremium.toLocaleString()} 
          icon={<Zap className="w-8 h-8 text-violet-500" />} 
          color="bg-violet-500/10"
        />
      </div>

      <div className="bg-card border-2 border-primary/10 rounded-3xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BrainCircuit className="w-8 h-8 text-gray-500 dark:text-gray-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">More Features Coming Soon</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          User management, question editing, and detailed analytics will be added to this panel in the next update.
        </p>
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
