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
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(145,42%,38%)]/10 text-[hsl(145,42%,38%)] dark:text-[hsl(145,35%,62%)] border border-[hsl(145,42%,38%)]/20 hover:bg-[hsl(145,42%,38%)]/20 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-50 shadow-bespoke-sm"
      >
        {loading === 'approved' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Approve
      </button>
      <button 
        onClick={() => handleAction('rejected')}
        disabled={loading !== false}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-error/10 text-error border border-error/20 hover:bg-error/20 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-50 shadow-bespoke-sm"
      >
        {loading === 'rejected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Reject
      </button>
    </div>
  );
}
