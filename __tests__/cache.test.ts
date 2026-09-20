/**
 * @jest-environment node
 */
import { getCachedQuestions, setCachedQuestions } from '@/lib/cache';
import localforage from 'localforage';

jest.mock('localforage', () => ({
  config: jest.fn(),
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
}));

describe('Offline Exam Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null if cache is empty', async () => {
    (localforage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const result = await getCachedQuestions('test_key');
    expect(result).toBeNull();
  });

  it('should return null and remove item if cache is expired', async () => {
    const expiredTime = Date.now() - (8 * 24 * 60 * 60 * 1000); // 8 days ago
    (localforage.getItem as jest.Mock).mockResolvedValueOnce({
      timestamp: expiredTime,
      data: [{ id: '1' }]
    });

    const result = await getCachedQuestions('test_key');
    expect(result).toBeNull();
    expect(localforage.removeItem).toHaveBeenCalledWith('test_key');
  });

  it('should return data if cache is valid', async () => {
    const validTime = Date.now() - (1 * 24 * 60 * 60 * 1000); // 1 day ago
    const mockData = [{ id: '1', question_text: 'Test?' }];
    (localforage.getItem as jest.Mock).mockResolvedValueOnce({
      timestamp: validTime,
      data: mockData
    });

    const result = await getCachedQuestions('test_key');
    expect(result).toEqual(mockData);
  });

  it('should set cache with current timestamp', async () => {
    const mockData = [{ id: '1', question_text: 'Test?' }] as any;
    await setCachedQuestions('test_key', mockData);
    
    expect(localforage.setItem).toHaveBeenCalledWith(
      'test_key',
      expect.objectContaining({
        data: mockData,
        timestamp: expect.any(Number)
      })
    );
  });
});
