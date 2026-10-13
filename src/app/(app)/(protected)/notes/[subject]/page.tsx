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
    .select('target_exam, stream, subscription_status, username, full_name')
    .eq('telegram_id', session.telegram_id)
    .maybeSingle();

  const adminCookie = cookies().get('temari_admin_session')?.value;
  let isStaff = Boolean(
    (process.env.ADMIN_TELEGRAM_ID && String(session.telegram_id) === String(process.env.ADMIN_TELEGRAM_ID)) ||
    adminCookie
  );

  if (!isStaff && (profile?.username || profile?.full_name)) {
    try {
      const identifier = (profile.username || profile.full_name || '').trim();
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .ilike('username', identifier)
        .maybeSingle();
      if (adminUser) isStaff = true;
    } catch {}
  }

  const isPremium = profile?.subscription_status === 'premium' || isStaff;
    
  // Use URL param if valid, otherwise fall back to profile (prevents manual URL tampering)
  const validExamTypes = ['entrance', 'freshman', 'exit'];
  const urlExamType = searchParams.examType;
  const examType = (urlExamType && validExamTypes.includes(urlExamType))
    ? urlExamType
    : (profile?.target_exam || 'entrance');

  // 2. Fetch notes: select only metadata fields — the full markdown content body
  //    is fetched on-demand when a student taps a chapter card.
  //    Avoids serializing 1–2 MB of markdown into the initial SSR HTML payload.
  let query = supabase
    .from('study_notes')
    .select('id, title, department, exam_type, content_url')
    .eq('exam_type', examType)
    .order('title', { ascending: true })
    .limit(200);

  if (subject !== 'All') {
    const s = subject.toLowerCase().trim();
    if (s.includes('applied math')) {
      // Matches 'Applied Math I', 'Applied Mathematics I', 'Applied Mathematics', etc.
      query = query.or('department.ilike.%Applied Math%,department.ilike.%Applied Mathematics%');
    } else if (s === 'mathematics for natural sciences' || s === 'mathematics' || s === 'math') {
      // Matches 'Mathematics' and 'Mathematics for Natural Sciences'
      query = query.or('department.eq.Mathematics,department.ilike.%Mathematics for Natural Sciences%');
    } else if (s.includes('sat') || s.includes('aptitude')) {
      // Matches 'Aptitude' and 'Scholastic Aptitude (SAT)'
      query = query.or('department.ilike.%Aptitude%,department.ilike.%SAT%');
    } else if (s.includes('civic') || s.includes('moral')) {
      query = query.or('department.ilike.%Civic%,department.ilike.%Moral%');
    } else if (s.includes('logic')) {
      query = query.or('department.ilike.%Logic%,department.ilike.%Critical Thinking%');
    } else if (s.includes('english')) {
      query = query.ilike('department', '%English%');
    } else if (s.includes('physics')) {
      query = query.ilike('department', '%Physics%');
    } else if (s.includes('chem')) {
      query = query.ilike('department', '%Chem%');
    } else if (s.includes('psychology')) {
      query = query.ilike('department', '%Psychology%');
    } else if (s.includes('geography')) {
      query = query.ilike('department', '%Geography%');
    } else if (s.includes('history')) {
      query = query.ilike('department', '%History%');
    } else if (s.includes('economics')) {
      query = query.ilike('department', '%Economic%');
    } else {
      query = query.ilike('department', `%${subject}%`);
    }
  } else {
    // If 'All', filter by the user's specific stream to avoid cross-stream notes
    const stream = profile?.stream || 'Natural Science';
    
    if (examType === 'entrance') {
      const nat = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English', 'Aptitude', 'Scholastic Aptitude (SAT)', 'Civics & Citizenship', 'Civics', 'Civics & Ethical Education', 'Agriculture'];
      const soc = ['Geography', 'History', 'Economics', 'Mathematics', 'English', 'Aptitude', 'Scholastic Aptitude (SAT)', 'Civics & Citizenship', 'Civics', 'Civics & Ethical Education', 'Agriculture'];
      query = query.in('department', stream === 'Social Science' ? soc : nat);
    } else if (examType === 'freshman') {
      // Freshman courses in Ethiopian universities:
      const dbNat = [
        'Logic', 'Logic and Critical Thinking',
        'English', 'Communicative English', 'Communicative English Language Skills (I & II)',
        'Psychology', 'General Psychology', 'General Psychology and Life Skills',
        'Mathematics', 'Mathematics for Natural Sciences',
        'Applied Math I', 'Applied Mathematics I',
        'Civics', 'Moral & Civics', 'Moral and Civic Education',
        'Physics', 'General Physics',
        'Chemistry', 'General Chemistry',
        'Economics',
        'Emerging Technology', 'Introduction to Emerging Technologies',
        'Global Trends', 'Inclusiveness', 'Entrepreneurship'
      ];
      const dbSoc = [
        'Logic', 'Logic and Critical Thinking',
        'English', 'Communicative English', 'Communicative English Language Skills (I & II)',
        'Psychology', 'General Psychology', 'General Psychology and Life Skills',
        'Geography', 'Geography of Ethiopia', 'Geography of Ethiopia and the Horn',
        'Economics',
        'Civics', 'Moral & Civics', 'Moral and Civic Education',
        'History', 'History of Ethiopia', 'History of Ethiopia and the Horn',
        'Emerging Technology', 'Introduction to Emerging Technologies',
        'Global Trends', 'Inclusiveness', 'Entrepreneurship',
        'Anthropology', 'Social Anthropology',
        'Mathematics', 'Mathematics for Social Sciences'
      ];
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
      isPremium={isPremium}
    />
  );
}
