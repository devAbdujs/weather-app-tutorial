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
    <div className="bg-card border-2 border-primary/10 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ShieldPlus className="w-5 h-5 text-gray-900 dark:text-gray-100" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">New Admin</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Username</label>
          <input 
            type="text" 
            value={username} onChange={e => setUsername(e.target.value)}
            className="w-full p-3 border-2 border-primary/10 rounded-xl bg-ground font-bold text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none"
            placeholder="e.g. teacher_alex"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Role</label>
          <select 
            value={role} onChange={e => setRole(e.target.value)}
            className="w-full p-3 border-2 border-primary/10 rounded-xl bg-ground font-bold text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none"
          >
            <option value="readonly">Read-Only Viewer</option>
            <option value="editor">Content Editor</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Passcode</label>
          <input 
            type="password" 
            value={passcode} onChange={e => setPasscode(e.target.value)}
            className="w-full p-3 border-2 border-primary/10 rounded-xl bg-ground font-bold text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none"
            placeholder="Temporary password"
          />
        </div>

        {status.msg && (
          <p className={`text-sm font-bold mt-2 ${status.type === 'error' ? 'text-error' : 'text-accent-emerald'}`}>
            {status.msg}
          </p>
        )}

        <button 
          type="submit" 
          disabled={loading || !username || !passcode}
          className="w-full py-3 mt-4 bg-primary text-white font-black rounded-xl border-b-4 border-black/20 dark:border-white/30 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50"
        >
          {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
        </button>
      </form>
    </div>
  );
}
