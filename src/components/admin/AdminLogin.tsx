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
      <div className="w-full max-w-md bg-card border-2 border-primary rounded-3xl p-8 shadow-[8px_8px_0px_#1B3A6B]">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-primary text-center mb-2">Admin Portal</h1>
        <p className="text-tertiary text-center font-medium mb-8">Sign in to manage Temari.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username..."
              className="w-full p-4 border-2 border-primary/20 rounded-xl bg-ground font-bold text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div>
            <input 
              type="password" 
              value={secret} 
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Passcode..."
              className="w-full p-4 border-2 border-primary/20 rounded-xl bg-ground font-bold text-primary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          {error && <p className="text-error text-sm font-bold">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-white font-black rounded-xl border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'VERIFYING...' : 'SIGN IN'}
          </button>
        </form>
      </div>
    </div>
  );
};
