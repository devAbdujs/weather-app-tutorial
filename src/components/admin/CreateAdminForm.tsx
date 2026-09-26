'use client';

import React, { useState } from 'react';
import { createAdminAccount } from '@/app/actions/admin';
import { ShieldPlus } from 'lucide-react';

export function CreateAdminForm() {
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [role, setRole] = useState('readonly');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !passcode) return;
    
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      const res = await createAdminAccount(username, passcode, role);
      if (res.success) {
        setStatus({ type: 'success', msg: 'Admin account created!' });
        setUsername('');
        setPasscode('');
        window.location.reload(); // Quick refresh to update the table
      } else {
        setStatus({ type: 'error', msg: res.error || 'Failed to create.' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-bespoke-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <ShieldPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">New Admin</h2>
          <p className="text-xs text-muted font-medium">Grant staff administrative credentials</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Username</label>
          <input 
            type="text" 
            value={username} onChange={e => setUsername(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            placeholder="e.g. teacher_alex"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Role</label>
          <select 
            value={role} onChange={e => setRole(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none cursor-pointer"
          >
            <option value="readonly">Read-Only Viewer</option>
            <option value="editor">Content Editor</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Passcode</label>
          <input 
            type="password" 
            value={passcode} onChange={e => setPasscode(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            placeholder="Temporary password"
          />
        </div>

        {status.msg && (
          <p className={`text-xs font-semibold mt-2 px-3 py-2 rounded-lg ${status.type === 'error' ? 'bg-error/10 text-error border border-error/20' : 'bg-success/10 text-success border border-success/20'}`}>
            {status.msg}
          </p>
        )}

        <button 
          type="submit" 
          disabled={loading || !username || !passcode}
          className="w-full py-2.5 mt-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/95 shadow-bespoke-sm active:scale-[0.99] transition-all duration-200 ease-bespoke disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
