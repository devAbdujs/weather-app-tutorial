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
      expect(reply_markup.inline_keyboard.length).toBe(6);
      
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
});
