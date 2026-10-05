import { SupabaseClient } from '@supabase/supabase-js';
import { calculateNewStreak, getAddisAbabaDate } from '@/lib/streak';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://temari.top';

// ── HTML Escaping & Formatting for Telegram ──────────────────────────────────
export function escapeTelegramHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function cleanForTelegram(text: string | null | undefined): string {
  if (!text) return '';
  // Convert break tags and paragraph ends into newlines
  let cleaned = String(text)
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Normalize LaTeX dollar delimiters for readability if needed
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\$(.+?)\$/g, '$1')
    // Collapse excess spaces and newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return escapeTelegramHtml(cleaned);
}

// ── Telegram Low-Level API Methods ───────────────────────────────────────────
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!BOT_TOKEN) return false;

  const payload: Record<string, any> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[TelegramBot] sendMessage HTML failed, attempting plain text fallback:', errText);
      // Fallback: strip HTML tags and send plain text
      payload.text = text.replace(/<[^>]+>/g, '');
      delete payload.parse_mode;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    return true;
  } catch (err) {
    console.error('[TelegramBot] sendMessage network error:', err);
    return false;
  }
}

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!BOT_TOKEN) return false;

  const payload: Record<string, any> = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[TelegramBot] editMessageText HTML failed, attempting plain text fallback:', errText);
      payload.text = text.replace(/<[^>]+>/g, '');
      delete payload.parse_mode;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    return true;
  } catch (err) {
    console.error('[TelegramBot] editMessageText network error:', err);
    return false;
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<void> {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text ? text.slice(0, 190) : undefined,
        show_alert: showAlert,
      }),
    });
  } catch (err) {
    console.warn('[TelegramBot] answerCallbackQuery failed:', err);
  }
}

// ── Profile Auto-Registration ────────────────────────────────────────────────
export async function ensureUserProfile(
  supabaseAdmin: SupabaseClient,
  telegramUser: { id: number | string; first_name?: string; last_name?: string; username?: string }
) {
  const telegramId = String(telegramUser.id);
  const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ').trim() || 'Student';

  try {
    await supabaseAdmin
      .from('profiles')
      .upsert({
        telegram_id: telegramId,
        full_name: fullName,
        target_exam: 'entrance',
        subscription_status: 'free',
      }, { onConflict: 'telegram_id', ignoreDuplicates: true });
  } catch (err) {
    console.warn('[TelegramBot] Profile upsert non-critical warning:', err);
  }
}

// ── Level Calculation ────────────────────────────────────────────────────────
export function calculateLevel(correctCount: number): number {
  if (correctCount > 500) return 7;
  if (correctCount > 250) return 6;
  if (correctCount > 100) return 5;
  if (correctCount > 50) return 4;
  if (correctCount > 25) return 3;
  if (correctCount > 10) return 2;
  return 1;
}

// ── Track Label Helpers ──────────────────────────────────────────────────────
export function getExamLabel(targetExam: string | null | undefined): string {
  switch (targetExam) {
    case 'freshman':
      return '🏛️ University Freshman';
    case 'exit':
      return '🏆 University Exit Exam';
    case 'entrance':
    default:
      return '🎓 Matric / Grade 12 EUEE';
  }
}

// ── UI Payloads ──────────────────────────────────────────────────────────────

/**
 * 1. Main Interactive Menu
 */
export function getMainMenuPayload(firstName: string, siteUrl: string = SITE_URL) {
  const entranceUrl = `${siteUrl}/practice?portal=entrance&target_exam=entrance`;
  const freshmanUrl = `${siteUrl}/practice?portal=freshman&target_exam=freshman`;
  const exitUrl = `${siteUrl}/practice?portal=exit&target_exam=exit`;

  const text = [
    `👋 <b>Welcome to Temari AI, ${escapeTelegramHtml(firstName)}!</b> 🇪🇹`,
    ``,
    `Your all-in-one AI study companion for Ethiopian national & university exams:`,
    `🎯 <b>31,000+</b> past exam questions with step-by-step solutions`,
    `🧠 <b>AI Tutor</b> for instant step-by-step reasoning`,
    `📊 <b>Scholar Tree</b> & daily streak tracking`,
    `📝 <b>Chapter Summaries</b> & formula cheat-sheets`,
    ``,
    `👇 <b>Choose your exam track or test your skills right now:</b>`,
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [
      [{ text: '🎓 Matric / Grade 12 EUEE', web_app: { url: entranceUrl } }],
      [{ text: '🏛️ University Freshman', web_app: { url: freshmanUrl } }],
      [{ text: '🏆 University Exit Exam', web_app: { url: exitUrl } }],
      [
        { text: '⚡ My Stats & Streak', callback_data: 'nav:stats' },
        { text: '🎯 Daily Quiz Drill', callback_data: 'nav:quiz' },
      ],
      [
        { text: '🔄 Change Track', callback_data: 'nav:tracks' },
        { text: '👑 PRO Upgrade', callback_data: 'nav:upgrade' },
      ],
      [{ text: '📢 Join Community (@temari_App)', callback_data: 'nav:channel' }],
      [{ text: '🚀 Open Full Temari App', web_app: { url: siteUrl } }],
    ],
  };

  return { text, reply_markup };
}

/**
 * 2. Exam Track Switcher Menu
 */
export function getTracksPayload() {
  const text = [
    `🎯 <b>Select Your Preferred Exam Track</b>`,
    ``,
    `Switching your track personalizes your quiz drills, subjects, and study materials:`,
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [
      [{ text: '🎓 Grade 12 Matric (EUEE)', callback_data: 'track:entrance' }],
      [{ text: '🏛️ University Freshman Remedial', callback_data: 'track:freshman' }],
      [{ text: '🏆 University Exit Exam', callback_data: 'track:exit' }],
      [{ text: '🔙 Back to Menu', callback_data: 'nav:menu' }],
    ],
  };

  return { text, reply_markup };
}

/**
 * 3. Update Target Exam Track
 */
export async function setTargetExamTrack(
  supabaseAdmin: SupabaseClient,
  telegramId: string,
  track: string
): Promise<string> {
  const validTracks = ['entrance', 'freshman', 'exit'];
  const safeTrack = validTracks.includes(track) ? track : 'entrance';

  await supabaseAdmin
    .from('profiles')
    .update({ target_exam: safeTrack })
    .eq('telegram_id', telegramId);

  return getExamLabel(safeTrack);
}

/**
 * 4. Scholar Stats Card
 */
export async function getStatsPayload(
  supabaseAdmin: SupabaseClient,
  telegramId: string,
  firstName: string,
  siteUrl: string = SITE_URL
) {
  // Query profile and stats in parallel
  const [profileRes, statsRes] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('full_name, target_exam, stream, daily_streak, subscription_status')
      .eq('telegram_id', telegramId)
      .maybeSingle(),
    supabaseAdmin
      .from('user_subject_stats')
      .select('subject, questions_attempted, questions_correct')
      .eq('telegram_id', telegramId),
  ]);

  const profile = profileRes.data;
  const stats = statsRes.data || [];

  const displayName = profile?.full_name?.split(' ')[0] || firstName || 'Scholar';
  const targetExam = profile?.target_exam || 'entrance';
  const examLabel = getExamLabel(targetExam);
  const stream = profile?.stream ? ` (${profile.stream.charAt(0).toUpperCase() + profile.stream.slice(1)})` : '';
  const streak = profile?.daily_streak || 0;
  const isPro = profile?.subscription_status === 'premium';

  let totalAttempted = 0;
  let totalCorrect = 0;

  stats.forEach((s) => {
    totalAttempted += s.questions_attempted || 0;
    totalCorrect += s.questions_correct || 0;
  });

  const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const xp = totalCorrect * 10;
  const level = calculateLevel(totalCorrect);

  // Subject breakdown (top 4 subjects)
  const sortedSubjects = [...stats]
    .sort((a, b) => (b.questions_attempted || 0) - (a.questions_attempted || 0))
    .slice(0, 4);

  let subjectsText = '';
  if (sortedSubjects.length > 0) {
    subjectsText = sortedSubjects
      .map((s) => {
        const pct = s.questions_attempted ? Math.round((s.questions_correct / s.questions_attempted) * 100) : 0;
        return `• <b>${escapeTelegramHtml(s.subject)}:</b> ${s.questions_correct}/${s.questions_attempted} (${pct}%)`;
      })
      .join('\n');
  } else {
    subjectsText = '<i>No questions solved yet. Tap "Daily Quiz Drill" to earn your first XP!</i>';
  }

  const text = [
    `📊 <b>Scholar Profile: ${escapeTelegramHtml(displayName)}</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🎯 <b>Track:</b> ${examLabel}${stream}`,
    `🔥 <b>Streak:</b> ${streak} ${streak === 1 ? 'day' : 'days'} in a row`,
    `⚡ <b>Total XP:</b> ${xp} XP (Level ${level})`,
    `📝 <b>Solved:</b> ${totalCorrect} / ${totalAttempted} (${accuracy}% accuracy)`,
    `👑 <b>Tier:</b> ${isPro ? '⭐️ PRO Member' : 'Free Scholar'}`,
    ``,
    `📚 <b>Top Subjects:</b>`,
    subjectsText,
    `━━━━━━━━━━━━━━━━━━━━`,
    `<i>Keep solving questions daily to level up your Scholar Tree!</i>`,
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [
      [
        { text: '🎯 Practice in App', web_app: { url: `${siteUrl}/practice` } },
        { text: '🔄 Refresh', callback_data: 'nav:stats' },
      ],
      [
        { text: '🎲 Quick Quiz', callback_data: 'nav:quiz' },
        { text: '🔙 Menu', callback_data: 'nav:menu' },
      ],
    ],
  };

  return { text, reply_markup };
}

/**
 * 5. Instant Quiz Drill Question
 */
export async function getQuizPayload(
  supabaseAdmin: SupabaseClient,
  telegramId: string,
  siteUrl: string = SITE_URL
) {
  // 1. Get user's preferred exam type
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('target_exam')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  const targetExam = profile?.target_exam || 'entrance';

  // 2. Count total questions available for target_exam
  const { count } = await supabaseAdmin
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_type', targetExam);

  const total = count && count > 0 ? count : 100;
  const randomOffset = Math.floor(Math.random() * Math.max(1, Math.min(total, 500)));

  // 3. Fetch a question with choices
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('id, exam_type, subject, year_ec, question, option_a, option_b, option_c, option_d, answer, explanation')
    .eq('exam_type', targetExam)
    .range(randomOffset, randomOffset)
    .limit(1);

  const q = questions && questions[0];

  if (!q) {
    return {
      text: `⚠️ No practice questions currently available for <b>${escapeTelegramHtml(targetExam)}</b>. Please check back shortly or choose another exam track!`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Change Track', callback_data: 'nav:tracks' }],
          [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
        ],
      },
    };
  }

  const subjectHeader = `🏷️ <b>Subject:</b> ${escapeTelegramHtml(q.subject)}${q.year_ec ? ` (${q.year_ec} E.C.)` : ''}`;
  const questionText = cleanForTelegram(q.question);
  const optA = cleanForTelegram(q.option_a || 'Option A');
  const optB = cleanForTelegram(q.option_b || 'Option B');
  const optC = cleanForTelegram(q.option_c || 'Option C');
  const optD = cleanForTelegram(q.option_d || 'Option D');

  const text = [
    `🧠 <b>Temari Daily Drill</b>`,
    subjectHeader,
    ``,
    questionText,
    ``,
    `<b>A)</b> ${optA}`,
    `<b>B)</b> ${optB}`,
    `<b>C)</b> ${optC}`,
    `<b>D)</b> ${optD}`,
  ].join('\n');

  const aiTutorUrl = `${siteUrl}/practice?subject=${encodeURIComponent(q.subject)}`;

  const reply_markup = {
    inline_keyboard: [
      [
        { text: 'A', callback_data: `quiz:${q.id}:A` },
        { text: 'B', callback_data: `quiz:${q.id}:B` },
        { text: 'C', callback_data: `quiz:${q.id}:C` },
        { text: 'D', callback_data: `quiz:${q.id}:D` },
      ],
      [{ text: '🧠 Ask Temari AI in App', web_app: { url: aiTutorUrl } }],
      [
        { text: '🎲 Next Question', callback_data: 'nav:quiz' },
        { text: '🔙 Menu', callback_data: 'nav:menu' },
      ],
    ],
  };

  return { text, reply_markup };
}

/**
 * 6. Handle Quiz Answer Selection & Award XP
 */
export async function handleQuizAnswer(
  supabaseAdmin: SupabaseClient,
  telegramId: string,
  questionId: string,
  selectedOption: string,
  siteUrl: string = SITE_URL
) {
  const normSelected = (selectedOption || '').trim().toUpperCase();

  // Fetch question
  const { data: q } = await supabaseAdmin
    .from('questions')
    .select('id, subject, answer, explanation')
    .eq('id', questionId)
    .maybeSingle();

  if (!q) {
    return {
      text: '⚠️ This question is no longer available.',
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Try Another Question', callback_data: 'nav:quiz' }]],
      },
    };
  }

  const correctAnswer = (q.answer || '').trim().toUpperCase();
  const isCorrect = normSelected === correctAnswer;

  // 1. Update user_subject_stats
  try {
    const { data: existing } = await supabaseAdmin
      .from('user_subject_stats')
      .select('questions_attempted, questions_correct, total_time_spent_seconds')
      .eq('telegram_id', telegramId)
      .eq('subject', q.subject)
      .maybeSingle();

    const attempted = (existing?.questions_attempted || 0) + 1;
    const correct = (existing?.questions_correct || 0) + (isCorrect ? 1 : 0);

    await supabaseAdmin
      .from('user_subject_stats')
      .upsert({
        telegram_id: telegramId,
        subject: q.subject,
        questions_attempted: attempted,
        questions_correct: correct,
        total_time_spent_seconds: (existing?.total_time_spent_seconds || 0) + 15,
        last_practiced: new Date().toISOString(),
      }, { onConflict: 'telegram_id,subject' });
  } catch (statErr) {
    console.warn('[TelegramBot] Failed updating subject stats:', statErr);
  }

  // 2. Update Streak in profiles
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('daily_streak, last_activity_date')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    const today = getAddisAbabaDate();
    const { newStreak, isUpdated } = calculateNewStreak(
      profile?.daily_streak || 0,
      profile?.last_activity_date,
      today
    );

    if (isUpdated) {
      await supabaseAdmin
        .from('profiles')
        .update({
          daily_streak: newStreak,
          last_activity_date: today,
        })
        .eq('telegram_id', telegramId);
    }
  } catch (streakErr) {
    console.warn('[TelegramBot] Failed updating streak:', streakErr);
  }

  const explanation = cleanForTelegram(q.explanation || 'Review the related chapter notes in Temari for in-depth mastery.');
  const aiTutorUrl = `${siteUrl}/practice?subject=${encodeURIComponent(q.subject)}`;

  if (isCorrect) {
    const text = [
      `🎉 <b>CORRECT! +10 XP</b> ⭐️`,
      ``,
      `<b>Your Answer:</b> [${normSelected}] ✅`,
      ``,
      `💡 <b>Explanation:</b>`,
      explanation,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<i>🔥 Great job! Keep your streak alive with another question!</i>`,
    ].join('\n');

    const reply_markup = {
      inline_keyboard: [
        [
          { text: '🎲 Next Question', callback_data: 'nav:quiz' },
          { text: '⚡ My Stats', callback_data: 'nav:stats' },
        ],
        [{ text: '🧠 Open AI Tutor in App', web_app: { url: aiTutorUrl } }],
        [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
      ],
    };

    return { text, reply_markup, isCorrect: true };
  } else {
    const text = [
      `❌ <b>INCORRECT</b>`,
      ``,
      `<b>Your Answer:</b> [${normSelected}] ❌`,
      `<b>Correct Answer:</b> [${correctAnswer}] ✅`,
      ``,
      `💡 <b>Explanation:</b>`,
      explanation,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `<i>Mistakes are how scholars learn. Dive into another question!</i>`,
    ].join('\n');

    const reply_markup = {
      inline_keyboard: [
        [
          { text: '🎲 Try Another', callback_data: 'nav:quiz' },
          { text: '⚡ My Stats', callback_data: 'nav:stats' },
        ],
        [{ text: '🧠 Ask Temari AI in App', web_app: { url: aiTutorUrl } }],
        [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
      ],
    };

    return { text, reply_markup, isCorrect: false };
  }
}

/**
 * 7. PRO Upgrade Info
 */
export function getUpgradePayload(siteUrl: string = SITE_URL) {
  const text = [
    `👑 <b>Upgrade to Temari PRO</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Unlock complete access to Ethiopia's leading exam prep platform:`,
    `✅ <b>31,000+ Past Questions</b> with verified answer keys`,
    `✅ <b>Unlimited AI Tutor</b> step-by-step reasoning`,
    `✅ <b>Complete Chapter Notes</b> & high-yield formula summaries`,
    `✅ <b>Full Mock Exams</b> with national percentile ranking`,
    `✅ <b>Cross-Device Sync</b> on Telegram, Web & Mobile`,
    ``,
    `💰 <b>Affordable Student Pricing:</b>`,
    `• <b>Semester Pass:</b> 150 ETB`,
    `• <b>Full Year / Exit Pass:</b> 250 ETB`,
    ``,
    `💳 <b>Payment Methods:</b>`,
    `• <b>Telebirr:</b> <code>0911000000</code> (Temari Prep)`,
    `• <b>CBE Account:</b> <code>1000123456789</code>`,
    ``,
    `📸 <b>Instant Activation:</b>`,
    `Transfer and upload your payment receipt directly in the app. Accounts are verified within minutes!`,
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [
      [{ text: '🚀 Open PRO Upgrade in App', web_app: { url: `${siteUrl}/upgrade` } }],
      [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
    ],
  };

  return { text, reply_markup };
}

/**
 * 8. Help & Command Guide
 */
export function getHelpPayload(siteUrl: string = SITE_URL) {
  const text = [
    `📖 <b>Temari Bot Commands & Navigation:</b>`,
    ``,
    `• /start or /menu — Open the interactive exam portal`,
    `• /quiz — Launch an instant exam practice question (+10 XP)`,
    `• /stats — View your streak, total XP, accuracy & level`,
    `• /upgrade — Learn about PRO features & Telebirr payments`,
    `• /help — View this command guide`,
    ``,
    `💡 <i>Tip: You can practice full exams and read chapter notes anytime in the web app below!</i>`,
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [
      [{ text: '🚀 Launch Temari App', web_app: { url: siteUrl } }],
      [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
    ],
  };

  return { text, reply_markup };
}

/**
 * 9. Channel Join Verification & Community Welcome Flow
 */
export async function checkChannelMembership(
  userId: number | string,
  channelUsername = '@temari_App'
): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(
        channelUsername
      )}&user_id=${userId}`
    );
    if (!res.ok) return false;
    const data = await res.json();
    if (!data.ok || !data.result) return false;
    const status = data.result.status;
    return ['creator', 'administrator', 'member', 'restricted'].includes(status);
  } catch (err) {
    console.warn('[TelegramBot] checkChannelMembership error:', err);
    return false;
  }
}

export function getChannelJoinPayload(siteUrl: string = SITE_URL) {
  const text = [
    `📢 <b>Join the Official Temari Community!</b>`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `Stay ahead with daily exam question drops, national matric schedule updates, and university scholarship announcements.`,
    ``,
    `✨ <b>Join @temari_App to unlock your bonus AI Tutor questions!</b>`,
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [
      [{ text: '📢 Join @temari_App Channel', url: 'https://t.me/temari_App' }],
      [{ text: '✅ Verify Channel Membership', callback_data: 'channel:verify' }],
      [{ text: '🔙 Main Menu', callback_data: 'nav:menu' }],
    ],
  };

  return { text, reply_markup };
}

/**
 * 10. Targeted Single Question Drill (/start q_<uuid>)
 */
export async function getSingleQuestionPayload(
  supabaseAdmin: SupabaseClient,
  questionId: string,
  siteUrl: string = SITE_URL
) {
  const { data: q } = await supabaseAdmin
    .from('questions')
    .select('id, question, option_a, option_b, option_c, option_d, subject, year_ec')
    .eq('id', questionId)
    .maybeSingle();

  if (!q) {
    return {
      text: '⚠️ <b>Question Not Found</b>\n\nThis specific question is no longer available in the question bank.',
      reply_markup: {
        inline_keyboard: [[{ text: '🎲 Practice Random Question', callback_data: 'nav:quiz' }]],
      },
    };
  }

  const subjectHeader = `🏷️ <b>Subject:</b> ${escapeTelegramHtml(q.subject)}${q.year_ec ? ` (${q.year_ec} E.C.)` : ''}`;
  const questionText = cleanForTelegram(q.question);
  const optA = cleanForTelegram(q.option_a || 'Option A');
  const optB = cleanForTelegram(q.option_b || 'Option B');
  const optC = cleanForTelegram(q.option_c || 'Option C');
  const optD = cleanForTelegram(q.option_d || 'Option D');

  const text = [
    `🎯 <b>Targeted Question Drill</b>`,
    subjectHeader,
    ``,
    questionText,
    ``,
    `<b>A)</b> ${optA}`,
    `<b>B)</b> ${optB}`,
    `<b>C)</b> ${optC}`,
    `<b>D)</b> ${optD}`,
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [
      [
        { text: 'A', callback_data: `quiz:${q.id}:A` },
        { text: 'B', callback_data: `quiz:${q.id}:B` },
        { text: 'C', callback_data: `quiz:${q.id}:C` },
        { text: 'D', callback_data: `quiz:${q.id}:D` },
      ],
      [{ text: '🧠 Ask Temari AI in App', web_app: { url: `${siteUrl}/practice?subject=${encodeURIComponent(q.subject)}` } }],
      [{ text: '🎲 More Questions', callback_data: 'nav:quiz' }, { text: '🔙 Menu', callback_data: 'nav:menu' }],
    ],
  };

  return { text, reply_markup };
}

/**
 * 11. Persistent Reply Keyboard for Bottom Thumb Navigation
 */
export function getPersistentReplyKeyboard() {
  return {
    keyboard: [
      [{ text: '🎯 Daily Quiz Drill' }, { text: '📊 My Scholar Stats' }],
      [{ text: '🚀 Open Web App' }, { text: '⭐ Upgrade to PRO' }],
      [{ text: '📢 Official Channel' }, { text: '📖 Help Guide' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

/**
 * 12. Record Referral Deep-Link
 */
export async function recordReferral(
  supabaseAdmin: SupabaseClient,
  newUserId: string | number,
  referrerId: string | number
): Promise<boolean> {
  try {
    const sNewUser = String(newUserId);
    const sReferrer = String(referrerId);
    if (sNewUser === sReferrer) return false;

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('referred_by')
      .eq('telegram_id', sNewUser)
      .maybeSingle();

    if (existing?.referred_by) return false;

    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: sReferrer })
      .eq('telegram_id', sNewUser);

    return true;
  } catch (err) {
    console.warn('[TelegramBot] recordReferral error:', err);
    return false;
  }
}
