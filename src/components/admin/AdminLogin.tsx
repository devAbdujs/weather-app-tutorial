'use client';

import React, { useState } from 'react';
import { loginAdmin } from '@/app/actions/admin';
import { Lock } from 'lucide-react';

export const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await loginAdmin(username, secret);
      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card border border-border/80 rounded-2xl p-7 shadow-bespoke-lg">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-5 mx-auto text-primary">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-foreground text-center mb-1 tracking-tight">Admin Portal</h1>
        <p className="text-xs text-muted text-center font-medium mb-6">Sign in to manage Temari platform</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username..."
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Passcode</label>
            <input 
              type="password" 
              value={secret} 
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Passcode..."
              className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-ground font-medium text-foreground text-sm focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all outline-none"
            />
          </div>
          {error && (
            <p className="text-error text-xs font-semibold px-3 py-2 bg-error/10 border border-error/20 rounded-lg text-center">
              {error}
            </p>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/95 shadow-bespoke-sm active:scale-[0.99] transition-all duration-200 ease-bespoke disabled:opacity-50 mt-2"
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
