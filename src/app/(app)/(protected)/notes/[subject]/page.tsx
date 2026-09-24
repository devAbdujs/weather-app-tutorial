import React from 'react';
import { getServerSession } from '@/lib/session';
import { createAdminClient as createClient } from '@/utils/supabase/admin';
import { StudyNotesView } from '@/components/dashboard/StudyNotesView';
import { redirect } from 'next/navigation';

export default async function NotesPage({ 
  params,
  searchParams 
}: { 
  params: { subject: string };
  searchParams: { examType?: string };
}) {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  const subject = decodeURIComponent(params.subject);

  // 1. Get the user's exam type — URL param is trusted (set by ExamSetupModal),
  //    but we ALSO verify against the profile as a secure server-side fallback.
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('target_exam')
    .eq('telegram_id', session.telegram_id)
    .single();
    
  // Use URL param if valid, otherwise fall back to profile (prevents manual URL tampering)
  const validExamTypes = ['entrance', 'freshman', 'exit'];
  const urlExamType = searchParams.examType;
  const examType = (urlExamType && validExamTypes.includes(urlExamType))
    ? urlExamType
    : (profile?.target_exam || 'entrance');

  // 2. Fetch notes: match department name AND restrict by exam_type
  //    This ensures a freshman NEVER sees exit exam notes and vice versa.
  const { data: notes } = await supabase
    .from('study_notes')
    .select('*')
    .eq('exam_type', examType)
    .ilike('department', `%${subject}%`)
    .limit(200);

  return (
    <StudyNotesView 
      subject={subject} 
      examType={examType} 
      initialNotes={notes || []} 
    />
  );
}
