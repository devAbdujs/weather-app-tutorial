import { getNextGeminiKey, markKeyRateLimited, getKeyCount } from '@/lib/geminiKeyRotation';

describe('Gemini Key Rotation Logic', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      gemini_api_key1: 'key1',
      gemini_api_key2: 'key2',
      gemini_api_key3: 'key3',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should rotate keys in a round-robin fashion', async () => {
    // Dynamic import to allow process.env modification to take effect
    const { getNextGeminiKey, getKeyCount } = await import('@/lib/geminiKeyRotation');
    
    expect(getKeyCount()).toBe(3);

    const first = getNextGeminiKey();
    const second = getNextGeminiKey();
    const third = getNextGeminiKey();
    const fourth = getNextGeminiKey();

    // Since it's round-robin, all 3 keys should be unique, and 4th should wrap around
    const returnedKeys = new Set([first, second, third]);
    expect(returnedKeys.size).toBe(3);
    
    // The 4th key should be the same as the first due to wrap around
    expect(fourth).toBe(first);
  });

  it('should skip rate-limited keys and respect 60s cooldown', async () => {
    const { getNextGeminiKey, markKeyRateLimited } = await import('@/lib/geminiKeyRotation');
    
    // Fix current time
    const now = 1000000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const first = getNextGeminiKey();
    expect(first).not.toBeNull();
    
    // Mark the first key as rate limited
    markKeyRateLimited(first as string);

    // The next 2 requests should get the remaining 2 keys
    const second = getNextGeminiKey();
    const third = getNextGeminiKey();
    
    expect(second).not.toBe(first);
    expect(third).not.toBe(first);

    // If we request a 4th time, normally it would wrap to 'first', 
    // but 'first' is in cooldown, so it should skip to 'second'
    const fourth = getNextGeminiKey();
    expect(fourth).not.toBe(first);

    // Advance time by 61 seconds (past the 60s cooldown)
    jest.spyOn(Date, 'now').mockReturnValue(now + 61000);

    // Now 'first' should be available again eventually
    let foundRecovered = false;
    for (let i = 0; i < 3; i++) {
      if (getNextGeminiKey() === first) foundRecovered = true;
    }
    expect(foundRecovered).toBe(true);
  });
});
