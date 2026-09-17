import React from 'react';
import { getServerSession } from '@/lib/session';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { MasteryTree } from '@/components/dashboard/MasteryTree';
import { redirect } from 'next/navigation';

export default async function MasteryPage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  // Fetch subject stats securely via SSR
  const supabase = await createClient();
  const { data: stats } = await supabase
    .from('user_subject_stats')
    .select('*')
    .eq('telegram_id', session.telegram_id)
    .order('questions_correct', { ascending: false });

  return (
    <MasteryTree stats={stats || []} />
  );
}
