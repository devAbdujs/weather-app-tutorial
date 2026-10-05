import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { sendTelegramMessage, escapeTelegramHtml } from '@/lib/telegramBot';
import { getAddisAbabaDate } from '@/lib/streak';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Authorization check: Vercel Cron header or CRON_SECRET query/header
  const authHeader = req.headers.get('authorization');
  const querySecret = req.nextUrl.searchParams.get('key');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const supabase = await createAdminClient();

    // 2. Compute date boundaries in Africa/Addis_Ababa timezone
    const now = new Date();
    const todayEAT = getAddisAbabaDate(now);
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEAT = getAddisAbabaDate(yesterdayDate);

    // 3. Find profiles whose streak is active from yesterday but who haven't practiced today
    const { data: atRiskUsers, error } = await supabase
      .from('profiles')
      .select('telegram_id, full_name, daily_streak, last_activity_date')
      .gt('daily_streak', 0)
      .eq('last_activity_date', yesterdayEAT)
      .not('telegram_id', 'is', null)
      .limit(100);

    if (error) {
      console.error('[StreakReminder] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!atRiskUsers || atRiskUsers.length === 0) {
      return NextResponse.json({
        success: true,
        notified: 0,
        message: 'No streaks at risk today.',
        todayEAT,
        yesterdayEAT,
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';
    let sentCount = 0;

    // 4. Send personalized alerts with drill action buttons
    for (const user of atRiskUsers) {
      if (!user.telegram_id) continue;

      const firstName = user.full_name?.split(' ')[0] || 'Temari Scholar';
      const streakEmoji = (user.daily_streak || 0) >= 7 ? '⚡' : '🔥';

      const messageText = 
        `${streakEmoji} <b>Don't Lose Your ${user.daily_streak}-Day Streak!</b>\n\n` +
        `Hey ${escapeTelegramHtml(firstName)}! You haven't completed your daily drill today.\n` +
        `Only a few hours remain before your streak resets at midnight (East Africa Time)!\n\n` +
        `Solve 1 quick question now to keep your study streak alive.`;

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '🎯 Quick 1-Minute Quiz',
              callback_data: 'quiz',
            },
            {
              text: '🚀 Open Temari App',
              web_app: { url: siteUrl },
            },
          ],
        ],
      };

      const success = await sendTelegramMessage(user.telegram_id, messageText, replyMarkup);
      if (success) {
        sentCount++;
      }
    }

    return NextResponse.json({
      success: true,
      found: atRiskUsers.length,
      notified: sentCount,
      todayEAT,
      yesterdayEAT,
    });
  } catch (err: any) {
    console.error('[StreakReminder] Fatal error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
