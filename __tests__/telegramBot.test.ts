/**
 * @jest-environment node
 */
import {
  escapeTelegramHtml,
  cleanForTelegram,
  calculateLevel,
  getExamLabel,
  getMainMenuPayload,
  getTracksPayload,
  getUpgradePayload,
  getHelpPayload,
  getStatsPayload,
  getQuizPayload,
  handleQuizAnswer,
  setTargetExamTrack,
  checkChannelMembership,
  getChannelJoinPayload,
  getSingleQuestionPayload,
  getPersistentReplyKeyboard,
  recordReferral,
  checkMilestoneCelebration,
  formatMilestoneCard,
  sendQuotaExhaustionNudge,
} from '@/lib/telegramBot';

describe('Telegram Bot Utilities & Formatting', () => {
  describe('escapeTelegramHtml', () => {
    it('escapes &, <, > safely', () => {
      expect(escapeTelegramHtml('Hello <b>World</b> & Students')).toBe('Hello &lt;b&gt;World&lt;/b&gt; &amp; Students');
    });

    it('handles empty or null inputs', () => {
      expect(escapeTelegramHtml('')).toBe('');
      expect(escapeTelegramHtml(null)).toBe('');
      expect(escapeTelegramHtml(undefined)).toBe('');
    });
  });

  describe('cleanForTelegram', () => {
    it('converts <br> and </p> tags to newlines and strips other tags', () => {
      const input = '<p>What is the derivative of:</p><br/><p>f(x) = 2x + 1</p>';
      const cleaned = cleanForTelegram(input);
      expect(cleaned).toContain('What is the derivative of:');
      expect(cleaned).toContain('f(x) = 2x + 1');
      expect(cleaned).not.toContain('<p>');
      expect(cleaned).not.toContain('</p>');
      expect(cleaned).not.toContain('<br/>');
    });

    it('strips LaTeX dollar delimiters for clean mobile readability', () => {
      const input = 'Solve for $x$: $$\\int 2x dx$$';
      const cleaned = cleanForTelegram(input);
      expect(cleaned).toBe('Solve for x: \\int 2x dx');
    });
  });

  describe('calculateLevel', () => {
    it('correctly calculates student level from correct count', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(10)).toBe(1);
      expect(calculateLevel(11)).toBe(2);
      expect(calculateLevel(25)).toBe(2);
      expect(calculateLevel(26)).toBe(3);
      expect(calculateLevel(50)).toBe(3);
      expect(calculateLevel(51)).toBe(4);
      expect(calculateLevel(100)).toBe(4);
      expect(calculateLevel(101)).toBe(5);
      expect(calculateLevel(250)).toBe(5);
      expect(calculateLevel(251)).toBe(6);
      expect(calculateLevel(501)).toBe(7);
    });
  });

  describe('getExamLabel', () => {
    it('returns proper labels for each track', () => {
      expect(getExamLabel('entrance')).toBe('🎓 Matric / Grade 12 EUEE');
      expect(getExamLabel('freshman')).toBe('🏛️ University Freshman');
      expect(getExamLabel('exit')).toBe('🏆 University Exit Exam');
      expect(getExamLabel(null)).toBe('🎓 Matric / Grade 12 EUEE');
    });
  });

  describe('getMainMenuPayload', () => {
    it('generates rich navigation payload with deep links', () => {
      const { text, reply_markup } = getMainMenuPayload('Abebe', 'https://temari.top');
      expect(text).toContain('Welcome to Temari AI, Abebe!');
      expect(text).toContain('31,000+');
      expect(reply_markup.inline_keyboard.length).toBe(7);
      
      // Check entrance button
      const entranceBtn = reply_markup.inline_keyboard[0][0];
      expect(entranceBtn.text).toContain('Grade 12');
      expect(entranceBtn.web_app.url).toContain('portal=entrance');

      // Check stats & quiz drill buttons
      const statsBtn = reply_markup.inline_keyboard[3][0];
      const quizBtn = reply_markup.inline_keyboard[3][1];
      expect(statsBtn.callback_data).toBe('nav:stats');
      expect(quizBtn.callback_data).toBe('nav:quiz');
    });
  });

  describe('getTracksPayload', () => {
    it('returns 3 track options plus back button', () => {
      const { reply_markup } = getTracksPayload();
      expect(reply_markup.inline_keyboard.length).toBe(4);
      expect(reply_markup.inline_keyboard[0][0].callback_data).toBe('track:entrance');
      expect(reply_markup.inline_keyboard[1][0].callback_data).toBe('track:freshman');
      expect(reply_markup.inline_keyboard[2][0].callback_data).toBe('track:exit');
      expect(reply_markup.inline_keyboard[3][0].callback_data).toBe('nav:menu');
    });
  });

  describe('getUpgradePayload', () => {
    it('includes pricing, Telebirr, and CBE info', () => {
      const { text, reply_markup } = getUpgradePayload('https://temari.top');
      expect(text).toContain('150 ETB');
      expect(text).toContain('250 ETB');
      expect(text).toContain('Telebirr');
      expect(text).toContain('CBE Account');
      expect(reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://temari.top/upgrade');
    });
  });

  describe('getHelpPayload', () => {
    it('lists slash commands', () => {
      const { text } = getHelpPayload('https://temari.top');
      expect(text).toContain('/start');
      expect(text).toContain('/quiz');
      expect(text).toContain('/stats');
      expect(text).toContain('/upgrade');
    });
  });
});

describe('Telegram Bot Database Operations', () => {
  it('computes stats correctly in getStatsPayload', async () => {
    const mockSupabase: any = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                full_name: 'Sara Tesfaye',
                target_exam: 'entrance',
                stream: 'natural',
                daily_streak: 5,
                subscription_status: 'premium',
              },
            }),
          };
        }
        if (table === 'user_subject_stats') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                { subject: 'Mathematics', questions_attempted: 20, questions_correct: 18 },
                { subject: 'Physics', questions_attempted: 10, questions_correct: 8 },
              ],
            }),
          };
        }
        return {};
      }),
    };

    const { text, reply_markup } = await getStatsPayload(mockSupabase, '123456', 'Sara', 'https://temari.top');
    expect(text).toContain('Sara');
    expect(text).toContain('5 days in a row');
    expect(text).toContain('260 XP (Level 3)');
    expect(text).toContain('26 / 30 (87% accuracy)');
    expect(text).toContain('⭐️ PRO Member');
    expect(text).toContain('Mathematics:</b> 18/20 (90%)');
    expect(reply_markup.inline_keyboard[0][1].callback_data).toBe('nav:stats');
  });

  it('renders question and choice buttons in getQuizPayload', async () => {
    const mockSupabase: any = {
      from: jest.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { target_exam: 'entrance' },
            }),
          };
        }
        if (table === 'questions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'q-test-1',
                  exam_type: 'entrance',
                  subject: 'Biology',
                  year_ec: 2015,
                  question: 'Which organelle is known as the powerhouse of the cell?',
                  option_a: 'Nucleus',
                  option_b: 'Mitochondria',
                  option_c: 'Ribosome',
                  option_d: 'Golgi apparatus',
                  answer: 'B',
                  explanation: 'Mitochondria produce cellular ATP through respiration.',
                },
              ],
            }),
          };
        }
        return {};
      }),
    };

    const { text, reply_markup } = await getQuizPayload(mockSupabase, '123456', 'https://temari.top');
    expect(text).toContain('Biology (2015 E.C.)');
    expect(text).toContain('powerhouse of the cell');
    expect(text).toContain('Mitochondria');

    // 4 choice buttons
    const choices = reply_markup.inline_keyboard[0];
    expect(choices.length).toBe(4);
    expect(choices[0].callback_data).toBe('quiz:q-test-1:A');
    expect(choices[1].callback_data).toBe('quiz:q-test-1:B');
    expect(choices[2].callback_data).toBe('quiz:q-test-1:C');
    expect(choices[3].callback_data).toBe('quiz:q-test-1:D');
  });

  it('evaluates correct answer and updates streak in handleQuizAnswer', async () => {
    const upsertStatsMock = jest.fn().mockResolvedValue({ error: null });
    const updateProfileMock = jest.fn().mockResolvedValue({ error: null });

    const mockSupabase: any = {
      from: jest.fn((table: string) => {
        if (table === 'questions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'q-test-1',
                subject: 'Biology',
                answer: 'B',
                explanation: 'Mitochondria produce ATP.',
              },
            }),
          };
        }
        if (table === 'user_subject_stats') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { questions_attempted: 5, questions_correct: 4 },
            }),
            upsert: upsertStatsMock,
          };
        }
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { daily_streak: 2, last_activity_date: '2026-10-01' },
            }),
            update: jest.fn().mockReturnValue({
              eq: updateProfileMock,
            }),
          };
        }
        return {};
      }),
    };

    const res = await handleQuizAnswer(mockSupabase, '123456', 'q-test-1', 'B', 'https://temari.top');
    expect(res.isCorrect).toBe(true);
    expect(res.text).toContain('CORRECT! +10 XP');
    expect(res.text).toContain('Mitochondria produce ATP.');
    expect(upsertStatsMock).toHaveBeenCalled();
  });

  it('evaluates incorrect answer in handleQuizAnswer', async () => {
    const upsertStatsMock = jest.fn().mockResolvedValue({ error: null });

    const mockSupabase: any = {
      from: jest.fn((table: string) => {
        if (table === 'questions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: {
                id: 'q-test-1',
                subject: 'Biology',
                answer: 'B',
                explanation: 'Mitochondria produce ATP.',
              },
            }),
          };
        }
        if (table === 'user_subject_stats') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { questions_attempted: 5, questions_correct: 4 },
            }),
            upsert: upsertStatsMock,
          };
        }
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({
              data: { daily_streak: 2, last_activity_date: '2026-10-01' },
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    };

    const res = await handleQuizAnswer(mockSupabase, '123456', 'q-test-1', 'A', 'https://temari.top');
    expect(res.isCorrect).toBe(false);
    expect(res.text).toContain('INCORRECT');
    expect(res.text).toContain('Correct Answer:</b> [B]');
  });

  it('switches exam track in setTargetExamTrack', async () => {
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase: any = {
      from: jest.fn(() => ({
        update: updateMock,
      })),
    };

    const label = await setTargetExamTrack(mockSupabase, '123456', 'freshman');
    expect(label).toBe('🏛️ University Freshman');
    expect(updateMock).toHaveBeenCalledWith({ target_exam: 'freshman' });
  });

  describe('Bot Extended Feature Helpers', () => {
    it('returns a persistent reply keyboard for zero-friction navigation', () => {
      const keyboard = getPersistentReplyKeyboard();
      expect(keyboard.is_persistent).toBe(true);
      expect(keyboard.resize_keyboard).toBe(true);
      expect(keyboard.keyboard.length).toBe(3);
      expect(keyboard.keyboard[0][0].text).toBe('🎯 Daily Quiz Drill');
    });

    it('generates channel join verification payload', () => {
      const { text, reply_markup } = getChannelJoinPayload();
      expect(text).toContain('@temari_App');
      expect(reply_markup.inline_keyboard[0][0].url).toBe('https://t.me/temari_App');
      expect(reply_markup.inline_keyboard[1][0].callback_data).toBe('channel:verify');
    });

    it('returns targeted single question payload for /start q_<uuid>', async () => {
      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 'q-target-1',
              question: 'Target question text?',
              option_a: 'A1',
              option_b: 'B1',
              option_c: 'C1',
              option_d: 'D1',
              subject: 'History',
              year_ec: 2015,
            },
          }),
        })),
      };

      const res = await getSingleQuestionPayload(mockSupabase, 'q-target-1');
      expect(res.text).toContain('Targeted Question Drill');
      expect(res.text).toContain('History (2015 E.C.)');
      expect(res.text).toContain('Target question text?');
      expect(res.reply_markup.inline_keyboard[0][0].callback_data).toBe('quiz:q-target-1:A');
    });

    it('records referral attribution when new user has no existing referrer', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { referred_by: null } }),
          update: updateMock,
        })),
      };

      const success = await recordReferral(mockSupabase, 'user-2', 'user-1');
      expect(success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith({ referred_by: 'user-1' });
    });

    it('does not record referral if user refers themselves or already has referrer', async () => {
      const mockSupabase: any = {
        from: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { referred_by: 'original-referrer' } }),
        })),
      };

      expect(await recordReferral(mockSupabase, 'user-1', 'user-1')).toBe(false);
      expect(await recordReferral(mockSupabase, 'user-2', 'user-3')).toBe(false);
    });
  });

  describe('Milestone Celebrations', () => {
    it('detects streak milestones correctly', () => {
      expect(checkMilestoneCelebration(3, 5)?.title).toBe('Bronze Scholar');
      expect(checkMilestoneCelebration(7, 5)?.title).toBe('Silver Scholar');
      expect(checkMilestoneCelebration(14, 5)?.title).toBe('Gold Scholar');
      expect(checkMilestoneCelebration(30, 5)?.title).toBe('Diamond Scholar');
      expect(checkMilestoneCelebration(50, 5)?.title).toBe('Grandmaster Scholar');
    });

    it('detects question count milestones correctly', () => {
      expect(checkMilestoneCelebration(1, 10)?.title).toBe('Drill Apprentice');
      expect(checkMilestoneCelebration(1, 25)?.title).toBe('Knowledge Seeker');
      expect(checkMilestoneCelebration(1, 50)?.title).toBe('Exam Warrior');
      expect(checkMilestoneCelebration(1, 100)?.title).toBe('Centurion Scholar');
      expect(checkMilestoneCelebration(1, 250)?.title).toBe('Academic Titan');
    });

    it('returns null when no milestone is reached', () => {
      expect(checkMilestoneCelebration(2, 4)).toBeNull();
      expect(checkMilestoneCelebration(5, 12)).toBeNull();
    });

    it('formats a milestone card with ASCII trophy border and details', () => {
      const milestone = checkMilestoneCelebration(7, 0)!;
      const card = formatMilestoneCard(milestone);

      expect(card).toContain('🏆 MILESTONE UNLOCKED');
      expect(card).toContain('Silver Scholar');
      expect(card).toContain('7-DAY STREAK');
      expect(card).toContain('<code>╔');
    });

    it('includes milestone card in handleQuizAnswer text when milestone is unlocked', async () => {
      const mockSupabase: any = {
        from: jest.fn((table: string) => {
          if (table === 'questions') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  id: 'q-mile-1',
                  subject: 'Biology',
                  answer: 'B',
                  explanation: 'Explanation text',
                },
              }),
            };
          }
          if (table === 'user_subject_stats') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockImplementation(() => ({
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({
                  data: { questions_attempted: 9, questions_correct: 9 },
                }),
                // for allStats aggregate
                then: (resolve: any) => resolve({ data: [{ questions_correct: 10 }] }),
              })),
              upsert: jest.fn().mockResolvedValue({ error: null }),
            };
          }
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              maybeSingle: jest.fn().mockResolvedValue({
                data: { daily_streak: 2, last_activity_date: null },
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          return {};
        }),
      };

      const res = await handleQuizAnswer(mockSupabase, 'user-1', 'q-mile-1', 'B');
      expect(res.isCorrect).toBe(true);
      expect(res.milestone).toBeTruthy();
      expect(res.text).toContain('🏆 MILESTONE UNLOCKED');
    });
  });

  describe('sendQuotaExhaustionNudge', () => {
    it('dispatches friendly PRO upgrade guidance when quota is exhausted', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      } as any);

      const success = await sendQuotaExhaustionNudge('user-999', 'Sara Tesfaye');
      expect(success).toBe(true);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/sendMessage'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Weekly AI Quota Exhausted'),
        })
      );

      mockFetch.mockRestore();
    });

    it('returns false gracefully when telegramId is empty', async () => {
      const res = await sendQuotaExhaustionNudge('');
      expect(res).toBe(false);
    });
  });
});
