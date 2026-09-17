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
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', session.telegram_id)
    .single();

  if (!profile) {
    redirect('/');
  }

  return <ProfileView profile={profile} />;
}
