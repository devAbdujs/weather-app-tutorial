import React from 'react';
import { getServerSession } from '@/lib/session';
import { createClient } from '@/utils/supabase/server';
import { UpgradeFlow } from '@/components/upgrade/UpgradeFlow';

export const dynamic = 'force-dynamic';

export default async function UpgradePage() {
  const session = await getServerSession();
  let isInitiallyPro = false;
  let initialStudentName = 'Scholar';

  if (session?.telegram_id) {
    try {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, first_name')
        .eq('telegram_id', session.telegram_id)
        .single();

      if (profile?.subscription_status === 'premium') {
        isInitiallyPro = true;
      }
      if (profile?.first_name) {
        initialStudentName = profile.first_name;
      }
    } catch (e) {
      // In case DB lookup fails, UpgradeFlow client hook will check /api/payments/status
    }
  }

  return (
    <UpgradeFlow
      isInitiallyPro={isInitiallyPro}
      initialStudentName={initialStudentName}
    />
  );
}
