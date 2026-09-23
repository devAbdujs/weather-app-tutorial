import React from 'react';
import { getUsers } from '@/app/actions/admin';
import { Users, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUsersPage({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const { users, total, totalPages } = await getUsers(currentPage, 50);

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">View and manage all registered students.</p>
        </div>
        <div className="bg-accent-blue/10 text-accent-blue px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>{total} Total</span>
        </div>
      </header>

      <div className="bg-card border-2 border-primary/10 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ground/50 border-b-2 border-primary/10">
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Student</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Target Exam</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Streak</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id} className="border-b border-primary/5 hover:bg-ground/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-gray-900 dark:text-gray-100 font-bold">
                        {user.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{user.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{user.username || user.telegram_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {user.target_exam ? (
                      <span className="px-2 py-1 bg-primary/5 text-gray-900 dark:text-gray-100 rounded-lg text-xs font-bold border border-primary/10">
                        {user.target_exam}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">Not set</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-bold text-accent-gold">
                      <Flame className="w-4 h-4 fill-accent-gold" />
                      {user.daily_streak || 0}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400 font-bold">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 bg-ground/50 border-t-2 border-primary/10">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link href={`/admin/users?page=${currentPage - 1}`} className="p-2 bg-card rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </Link>
              ) : (
                <div className="p-2 bg-card/50 rounded-lg border border-primary/5 opacity-50 cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                </div>
              )}
              
              {currentPage < totalPages ? (
                <Link href={`/admin/users?page=${currentPage + 1}`} className="p-2 bg-card rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </Link>
              ) : (
                <div className="p-2 bg-card/50 rounded-lg border border-primary/5 opacity-50 cursor-not-allowed">
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
