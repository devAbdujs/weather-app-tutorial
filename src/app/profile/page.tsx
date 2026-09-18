import React from 'react';
import { getServerSession } from '@/lib/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import { ProfileView } from '@/components/dashboard/ProfileView';

export default async function ProfilePage() {
  const session = await getServerSession();
  if (!session) {
    redirect('/');
  }

  const supabase = await createAdminClient();
  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabase.from('profiles').select('*').eq('telegram_id', session.telegram_id).single(),
    supabase.from('user_subject_stats').select('*').eq('telegram_id', session.telegram_id)
  ]);

  if (!profile) {
    redirect('/');
  }

  return <ProfileView profile={profile} stats={stats || []} />;
}
