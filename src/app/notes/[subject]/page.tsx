import React from 'react';
import { getServerSession } from '@/lib/session';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { StudyNotesView } from '@/components/dashboard/StudyNotesView';
import { redirect } from 'next/navigation';

export default async function NotesPage({ params }: { params: { subject: string } }) {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  const subject = decodeURIComponent(params.subject);

  // 1. Get user profile to securely determine examType on the backend
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('target_exam')
    .eq('telegram_id', session.telegram_id)
    .single();
    
  const examType = profile?.target_exam || 'entrance';

  // 2. Fetch all chapters for this subject instantly on the server
  const { data: notes } = await supabase
    .from('study_notes')
    .select('*')
    .eq('exam_type', examType)
    .eq('subject', subject)
    .order('order_index', { ascending: true })
    .limit(200);

  return (
    <StudyNotesView 
      subject={subject} 
      examType={examType} 
      initialNotes={notes || []} 
    />
  );
}
