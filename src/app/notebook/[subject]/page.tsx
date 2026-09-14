import React from 'react';
import { getServerSession } from '@/lib/session';
import { createClient } from '@/utils/supabase/server';
import { NotebookView } from '@/components/dashboard/NotebookView';
import { redirect } from 'next/navigation';

export default async function NotebookPage({ params }: { params: { subject: string } }) {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  const subject = decodeURIComponent(params.subject);

  // Fetch notebook pins instantly on the server securely using the session ID
  const supabase = await createClient();
  let query = supabase
    .from('user_pins')
    .select('*')
    .eq('telegram_id', session.telegram_id)
    .order('created_at', { ascending: false });
    
  if (subject && subject !== 'All') {
    query = query.eq('subject', subject);
  }

  const { data: pins } = await query;

  return (
    <NotebookView subject={subject} initialPins={pins || []} />
  );
}
