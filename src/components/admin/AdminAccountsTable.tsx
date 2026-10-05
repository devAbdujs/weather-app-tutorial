'use client';

import React, { useState } from 'react';
import { deleteAdminAccount, toggleAdminActive } from '@/app/actions/admin';
import { Power, PowerOff, Trash2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  is_active?: boolean;
  created_at: string;
}

interface AdminAccountsTableProps {
  admins: AdminUser[];
  currentAdminId: string;
}

export function AdminAccountsTable({ admins: initialAdmins, currentAdminId }: AdminAccountsTableProps) {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync with prop updates
  React.useEffect(() => {
    setAdmins(initialAdmins);
  }, [initialAdmins]);

  const handleToggleActive = async (admin: AdminUser) => {
    const isCurrentlyActive = admin.is_active !== false;
    const nextActive = !isCurrentlyActive;
    const actionLabel = nextActive ? 'activate' : 'deactivate';

    if (!nextActive) {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate @${admin.username}?\nTheir dashboard session will be terminated immediately.`
      );
      if (!confirmed) return;
    }

    setLoadingId(admin.id);
    setFeedback(null);

    try {
      const res = await toggleAdminActive(admin.id, nextActive);
      if (res.success) {
        setAdmins(prev =>
          prev.map(a => (a.id === admin.id ? { ...a, is_active: nextActive } : a))
        );
        setFeedback({
          type: 'success',
          message: `@${admin.username} has been successfully ${actionLabel}d.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || `Failed to ${actionLabel} account.`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || `An error occurred while trying to ${actionLabel} account.`,
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (admin: AdminUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete @${admin.username}?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setLoadingId(admin.id);
    setFeedback(null);

    try {
      const res = await deleteAdminAccount(admin.id);
      if (res.success) {
        setAdmins(prev => prev.filter(a => a.id !== admin.id));
        setFeedback({
          type: 'success',
          message: `@${admin.username} was permanently deleted.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to delete account.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while deleting account.',
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="bg-card border border-border/80 rounded-3xl shadow-tactile-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-ground/50 border-b border-border/80">
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Username</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Role</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Status</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs">Created</th>
                <th className="p-4 font-bold text-muted uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a: AdminUser) => {
                const isCurrentUser = a.id === currentAdminId;
                const isActive = a.is_active !== false;
                const isLoading = loadingId === a.id;

                return (
                  <tr
                    key={a.id}
                    className="border-b border-border/40 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <span>@{a.username}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${
                          a.role === 'superadmin'
                            ? 'bg-accent-gold/15 text-accent-gold border-accent-gold/30'
                            : a.role === 'financial_admin'
                            ? 'bg-accent-indigo/15 text-accent-indigo border-accent-indigo/30'
                            : a.role === 'editor'
                            ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20'
                            : 'bg-muted/10 text-muted-foreground border-border'
                        }`}
                      >
                        {a.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-medium text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {isCurrentUser ? (
                        <span className="text-xs font-medium text-muted italic">Current Session</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(a)}
                            disabled={isLoading}
                            aria-label={isActive ? `Deactivate @${a.username}` : `Activate @${a.username}`}
                            className={`p-2 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            } disabled:opacity-50`}
                            title={isActive ? 'Deactivate account' : 'Reactivate account'}
                          >
                            {isActive ? (
                              <>
                                <PowerOff className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Power className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Activate</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(a)}
                            disabled={isLoading}
                            aria-label={`Delete @${a.username}`}
                            className="p-2 rounded-xl text-xs font-semibold border bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20 transition-all duration-150 flex items-center gap-1.5 disabled:opacity-50"
                            title="Delete account permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
