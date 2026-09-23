'use client';

import React, { useState } from 'react';
import { updatePaymentStatus } from '@/app/actions/admin';
import { Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  paymentId: string;
  telegramId: string;
}

export function PaymentActions({ paymentId, telegramId }: Props) {
  const [loading, setLoading] = useState<false | 'approved' | 'rejected'>(false);
  const router = useRouter();

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !window.confirm('Are you sure you want to reject this payment?')) return;
    
    setLoading(status);
    try {
      await updatePaymentStatus(paymentId, telegramId, status);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleAction('approved')}
        disabled={loading !== false}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
      >
        {loading === 'approved' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Approve
      </button>
      <button 
        onClick={() => handleAction('rejected')}
        disabled={loading !== false}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
      >
        {loading === 'rejected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Reject
      </button>
    </div>
  );
}
