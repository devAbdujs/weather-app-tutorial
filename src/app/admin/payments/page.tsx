import React from 'react';
import { getPendingPayments } from '@/app/actions/admin';
import { CreditCard, ExternalLink, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { PaymentActions } from '@/components/admin/PaymentActions';

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const { payments, total, totalPages } = await getPendingPayments(currentPage, 20);

  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Payments Queue</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Review and approve manual payment receipts.</p>
        </div>
        <div className="bg-[hsl(268,40%,48%)]/10 text-[hsl(268,40%,48%)] dark:text-[hsl(268,36%,70%)] px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-[hsl(268,40%,48%)]/20">
          <CreditCard className="w-5 h-5" />
          <span className="tabular-nums">{total} Pending</span>
        </div>
      </header>

      <div className="bg-card border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-bespoke-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ground/50 border-b border-black/[0.06] dark:border-white/[0.08]">
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">User</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Transaction ID</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Submitted At</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Receipt</th>
                <th className="p-4 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: any) => (
                <tr key={payment.id} className="border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {payment.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{payment.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{payment.profiles?.username || payment.telegram_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm font-bold text-gray-700 dark:text-gray-300">
                    {payment.transaction_id || <span className="text-gray-400 font-sans italic">Not provided</span>}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {new Date(payment.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <a 
                      href={payment.receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors shadow-bespoke-sm"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> View Receipt <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="p-4 flex justify-end">
                    <PaymentActions paymentId={payment.id} telegramId={payment.telegram_id} />
                  </td>
                </tr>
              ))}
              
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500 dark:text-gray-400 font-bold">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-ground rounded-full flex items-center justify-center mb-4 border border-black/[0.06] dark:border-white/[0.08]">
                        <CheckCircle2 className="w-8 h-8 text-[hsl(145,42%,38%)] opacity-70" />
                      </div>
                      <p className="text-lg text-gray-900 dark:text-gray-100">All caught up!</p>
                      <p className="text-sm font-medium mt-1">There are no pending payments to review.</p>
                    </div>
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
                <Link href={`/admin/payments?page=${currentPage - 1}`} className="p-2 bg-card rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-900 dark:text-gray-100" />
                </Link>
              ) : (
                <div className="p-2 bg-card/50 rounded-lg border border-primary/5 opacity-50 cursor-not-allowed">
                  <ChevronLeft className="w-5 h-5 text-gray-500" />
                </div>
              )}
              
              {currentPage < totalPages ? (
                <Link href={`/admin/payments?page=${currentPage + 1}`} className="p-2 bg-card rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors">
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
