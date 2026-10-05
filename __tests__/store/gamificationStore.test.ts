import { useGamificationStore, getLevelForXp } from '@/store/useGamificationStore';

describe('useGamificationStore', () => {
  beforeEach(() => {
    useGamificationStore.setState({
      xp: 0,
      dailyXp: 0,
      dailyXpGoal: 50,
      activeCelebration: null,
    });
  });

  it('correctly maps XP to levels', () => {
    expect(getLevelForXp(0).level).toBe(1);
    expect(getLevelForXp(50).level).toBe(1);
    expect(getLevelForXp(100).level).toBe(2);
    expect(getLevelForXp(300).level).toBe(3);
    expect(getLevelForXp(700).level).toBe(4);
    expect(getLevelForXp(1500).level).toBe(5);
  });

  it('syncFromDb sets canonical XP based on total questions correct (x10)', () => {
    // 25 correct questions = 250 XP
    useGamificationStore.getState().syncFromDb(25);
    expect(useGamificationStore.getState().xp).toBe(250);
  });

  it('syncFromDb resets legacy 45 XP if user has 0 questions correct', () => {
    useGamificationStore.setState({ xp: 45 });
    useGamificationStore.getState().syncFromDb(0);
    expect(useGamificationStore.getState().xp).toBe(0);
  });

  it('preserves higher local XP if session earned extra points above DB snapshot', () => {
    useGamificationStore.setState({ xp: 300 });
    // DB has 20 correct (200 XP), but user currently has 300 XP in local session
    useGamificationStore.getState().syncFromDb(20);
    expect(useGamificationStore.getState().xp).toBe(300);
  });
});
