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
    .select('target_exam, stream')
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

  let query = supabase
    .from('study_notes')
    .select('*')
    .eq('exam_type', examType)
    .limit(200);

  if (subject !== 'All') {
    query = query.ilike('department', `%${subject}%`);
  } else {
    // If 'All', filter by the user's specific stream to avoid cross-stream notes
    const stream = profile?.stream || 'Natural Science';
    
    if (examType === 'entrance') {
      const nat = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Scholastic Aptitude (SAT)', 'Civics & Citizenship', 'Agriculture'];
      const soc = ['Geography', 'History', 'Economics', 'Mathematics', 'English', 'Scholastic Aptitude (SAT)', 'Civics & Citizenship', 'Agriculture'];
      query = query.in('department', stream === 'Social Science' ? soc : nat);
    } else if (examType === 'freshman') {
      const nat = ['Logic', 'Communicative English', 'General Psychology', 'Mathematics for Natural Sciences', 'Applied Math I', 'Moral & Civics', 'General Physics', 'Emerging Technology', 'Global Trends', 'Inclusiveness', 'Entrepreneurship'];
      const soc = ['Logic', 'Communicative English', 'General Psychology', 'Geography of Ethiopia', 'Economics', 'Moral & Civics', 'History of Ethiopia', 'Emerging Technology', 'Global Trends', 'Inclusiveness', 'Entrepreneurship', 'Social Anthropology'];
      // Try to match DB subject names precisely:
      const dbNat = ['Logic', 'English', 'Psychology', 'Mathematics for Natural Sciences', 'Applied Math I', 'Civics', 'Physics', 'Emerging Technology', 'Global Trends', 'Inclusiveness', 'Entrepreneurship'];
      const dbSoc = ['Logic', 'English', 'Psychology', 'Geography', 'Economics', 'Civics', 'History', 'Emerging Technology', 'Global Trends', 'Inclusiveness', 'Entrepreneurship', 'Anthropology'];
      query = query.in('department', stream === 'Social Science' ? dbSoc : dbNat);
    } else if (examType === 'exit') {
      query = query.eq('department', stream); // For exit, stream is the department
    }
  }

  const { data: notes } = await query;


  return (
    <StudyNotesView 
      subject={subject} 
      examType={examType} 
      initialNotes={notes || []} 
    />
  );
}
