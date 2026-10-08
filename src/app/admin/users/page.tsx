import React from 'react';
import { getUsers, verifyAdmin } from '@/app/actions/admin';
import { hasPermission } from '@/lib/adminPermissions';
import { redirect } from 'next/navigation';
import { Users, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUsersPage({ searchParams }: { searchParams: { page?: string } }) {
  const admin = await verifyAdmin();
  if (!hasPermission(admin, 'users:view')) {
    redirect(admin?.role === 'editor' || admin?.role === 'content_editor' ? '/admin/questions' : '/admin');
  }

  const currentPage = parseInt(searchParams.page || '1', 10);
  const { users, total, totalPages } = await getUsers(currentPage, 50);

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">User Management</h1>
          <p className="text-muted-foreground font-medium mt-1">View and manage all registered students.</p>
        </div>
        <div className="bg-tint-sky text-tint-sky-fg border-2 border-b-[3px] border-tint-sky-border px-4 py-2 rounded-2xl font-black flex items-center gap-2 shadow-2xs">
          <Users className="w-5 h-5" />
          <span className="tabular-nums">{total} Total</span>
        </div>
      </header>

      <div className="bg-card border-2 border-b-[4px] border-black/[0.08] dark:border-white/[0.08] rounded-3xl shadow-tactile-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ground/50 border-b border-black/[0.06] dark:border-white/[0.08]">
                <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Student</th>
                <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Target Exam</th>
                <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Streak</th>
                <th className="p-4 font-bold text-muted-foreground uppercase tracking-wider text-xs">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-tint-peach text-tint-peach-fg font-black text-sm flex items-center justify-center shadow-2xs">
                        {user.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{user.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 flex-wrap">
                          <span>@{user.username || user.telegram_id}</span>
                          {user.phone_number && (
                            <span className="font-sans font-semibold text-primary/90 bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                              {user.phone_number}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.target_exam ? (
                      <span className="px-2.5 py-1 bg-tint-green text-tint-green-fg rounded-xl text-xs font-black border border-tint-green-border">
                        {user.target_exam}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Not set</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-bold text-accent tabular-nums">
                      <Flame className="w-4 h-4 fill-accent" />
                      {user.daily_streak || 0}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground font-bold">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-ground/50 border-t border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-sm font-bold text-muted-foreground tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link href={`/admin/users?page=${currentPage - 1}`} className="p-2 bg-card rounded-lg border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-tactile-sm">
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </Link>
              ) : (
                <div className="p-2 bg-card/50 rounded-lg border border-black/[0.06] dark:border-white/[0.08] opacity-50 cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              
              {currentPage < totalPages ? (
                <Link href={`/admin/users?page=${currentPage + 1}`} className="p-2 bg-card rounded-lg border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/5 dark:hover:bg-white/5 transition-colors shadow-tactile-sm">
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </Link>
              ) : (
                <div className="p-2 bg-card/50 rounded-lg border border-primary/5 opacity-50 cursor-not-allowed">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
