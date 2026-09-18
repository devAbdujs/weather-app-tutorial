import React from 'react';
import { getUsers } from '@/app/actions/admin';
import { Users, Flame } from 'lucide-react';

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">User Management</h1>
          <p className="text-tertiary font-medium mt-1">View and manage all registered students.</p>
        </div>
        <div className="bg-accent-blue/10 text-accent-blue px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>{users.length} Total</span>
        </div>
      </header>

      <div className="bg-card border-2 border-primary/10 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ground/50 border-b-2 border-primary/10">
                <th className="p-4 font-bold text-tertiary uppercase tracking-wider text-xs">Student</th>
                <th className="p-4 font-bold text-tertiary uppercase tracking-wider text-xs">Target Exam</th>
                <th className="p-4 font-bold text-tertiary uppercase tracking-wider text-xs">Streak</th>
                <th className="p-4 font-bold text-tertiary uppercase tracking-wider text-xs">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-primary/5 hover:bg-ground/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-primary">{user.full_name || 'Unknown'}</p>
                        <p className="text-xs text-tertiary">@{user.username || user.telegram_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.target_exam ? (
                      <span className="px-2 py-1 bg-primary/5 text-primary rounded-lg text-xs font-bold border border-primary/10">
                        {user.target_exam}
                      </span>
                    ) : (
                      <span className="text-tertiary text-sm">Not set</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-bold text-accent-gold">
                      <Flame className="w-4 h-4 fill-accent-gold" />
                      {user.daily_streak || 0}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-tertiary font-bold">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
